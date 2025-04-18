// javascript/index.js
let userRole = null; // Store the user's role globally

// Fetch the user's role when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً!');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      alert('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى!');
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAdmin');
      window.location.href = 'login.html';
      return;
    }

    const userData = await response.json();
    if (response.ok) {
      userRole = userData.role; // Store the user's role
      updateFields(); // Update the form fields based on the role
    } else {
      alert(userData.error || 'حدث خطأ أثناء جلب بيانات المستخدم!');
      window.location.href = 'login.html';
    }
  } catch (error) {
    alert('حدث خطأ أثناء جلب بيانات المستخدم!');
    window.location.href = 'login.html';
    console.error(error);
  }
});

function updateFields() {
  const visitReason = document.getElementById('visitReason').value;
  const workshopReason = document.getElementById('workshopReason');
  const workshopDetail = document.getElementById('workshopDetail')?.value || 'none';
  const fileUpload = document.getElementById('fileUpload');
  const workshopFiles = document.getElementById('workshopFiles');

  // Reset visibility
  fileUpload.style.display = 'none';
  workshopReason.style.display = 'none';
  workshopFiles.style.display = 'none';
  document.getElementById('reexecutionFiles').style.display = 'none';
  document.getElementById('concreteTestingFiles').style.display = 'none';
  document.getElementById('concreteWorksFiles').style.display = 'none';
  document.getElementById('soilFiles').style.display = 'none';
  document.getElementById('notSpecifiedFiles').style.display = 'none';

  // Show general file upload for "file" or "other" visit reasons
  if (visitReason === 'file' || visitReason === 'other') {
    fileUpload.style.display = 'block';
  }

  // Show workshop details for contractors with "workshop" visit reason
  if (userRole === 'contractor' && visitReason === 'workshop') {
    workshopReason.style.display = 'block';
    if (workshopDetail !== 'none') {
      workshopFiles.style.display = 'block';
      document.getElementById(`${workshopDetail}Files`).style.display = 'block';
    }
  }
}

document.getElementById('appointmentForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً!');
    window.location.href = 'login.html';
    return;
  }

  const visitReason = document.getElementById('visitReason').value;
  const workshopDetail = document.getElementById('workshopDetail')?.value || null;

  // Validate visit reason
  if (visitReason === 'none') {
    alert('يرجى اختيار سبب الزيارة!');
    return;
  }

  // Validate workshop detail for contractors
  if (userRole === 'contractor' && visitReason === 'workshop' && workshopDetail === 'none') {
    alert('يرجى اختيار تفاصيل الورشة!');
    return;
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('appointment_date', document.getElementById('date').value);
  formData.append('appointment_time', document.getElementById('time').value);
  formData.append('project_name', document.getElementById('projectName').value);
  formData.append('project_location', document.getElementById('projectLocation').value);
  formData.append('visit_reason', visitReason);
  formData.append('visit_description', document.getElementById('visitDesc').value);
  if (visitReason === 'workshop' && workshopDetail) {
    formData.append('workshop_detail', workshopDetail);
  }

  // Handle general file uploads
  const generalFiles = document.getElementById('files')?.files;
  if (generalFiles && generalFiles.length > 0) {
    if (generalFiles.length > 3) {
      alert('يمكنك رفع 3 ملفات فقط!');
      return;
    }
    for (const file of generalFiles) {
      formData.append('files', file);
    }
  }

  // Handle workshop-specific file uploads
  if (userRole === 'contractor' && visitReason === 'workshop' && workshopDetail !== 'none') {
    const workshopFileSections = {
      reexecution: ['excavationPhotos', 'engineerReport', 'concreteStudy'],
      concreteTesting: ['currentWorkPhotos', 'workAcceptanceReport', 'concreteResults'],
      concreteWorks: ['sitePhotos', 'formworkAcceptanceReport'],
      soil: ['sitePhotoTemporary', 'ownerInvitationTemporary'],
      notSpecified: ['temporaryAcceptanceCopy', 'ownerInvitationFinal'],
    };

    const requiredFields = workshopFileSections[workshopDetail] || [];
    for (const field of requiredFields) {
      const fileInput = document.querySelector(`input[name="${field}"]`);
      if (fileInput.files.length === 0) {
        alert(`يرجى رفع ملف لـ ${field}!`);
        return;
      }
      formData.append(field, fileInput.files[0]);
    }
  }

  try {
    const response = await fetch('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      alert('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى!');
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAdmin');
      window.location.href = 'login.html';
      return;
    }

    const data = await response.json();
    if (response.ok) {
      alert('تم تسجيل الحجز بنجاح!');
      window.location.href = 'appointmentStatus.html';
    } else {
      alert(data.error || 'حدث خطأ أثناء الحجز!');
    }
  } catch (error) {
    alert('حدث خطأ أثناء الحجز!');
    console.error(error);
  }
});