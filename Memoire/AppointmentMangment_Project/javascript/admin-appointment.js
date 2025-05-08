// frontend/javascript/admin-appointment.js

// --- Helper Functions ---
function displayError(elementId, message) {
    console.error(`Error related to ${elementId}: ${message}`);
    const targetElement = document.getElementById(elementId);
    // Try to display error within the list container or modal, fallback to alert
    if (elementId === 'adminAppointmentList' && targetElement) {
        targetElement.innerHTML = `<p style="color: red;" class="error-message">خطأ: ${message}</p>`;
    } else if (elementId === 'postponeForm' && targetElement) {
        // Maybe add an error message area inside the modal?
        alert(`خطأ في نموذج التأجيل: ${message}`);
    } else {
        alert(`خطأ: ${message}`);
    }
}

function setLoading(elementId, isLoading) {
    const targetElement = document.getElementById(elementId);
    // Handle loading for list container
    if (elementId === 'adminAppointmentList' && targetElement) {
        if (isLoading) {
            targetElement.innerHTML = '<p class="loading-message">جاري التحميل...</p>';
        }
        // Content is replaced by render/error when done
    }
    // Handle loading for postpone form button
    else if (elementId === 'postponeForm') {
         const button = postponeForm?.querySelector('button[type="submit"]');
         if(button) {
            button.disabled = isLoading;
            button.textContent = isLoading ? 'جاري الحفظ...' : 'تأكيد التأجيل';
         }
    }
    // Add more specific loading indicators if needed
}
// --- End Helper Functions ---


// --- Translation Maps (for displaying readable text) ---
const visitReasonTranslations = { OTHER: 'آخر', FILE: 'ملف', WORKSHOP: 'ورشة' };
const workshopDetailTranslations = { REEXECUTION: 'معاينة الحفر', CONCRETE_TESTING: 'معاينة الأشغال', CONCRETE_WORKS: 'معاينة أشغال المساكة', SOIL: 'الاستلام المؤقت', NOT_SPECIFIED: 'الاستلام النهائي' };
const statusTranslations = { PENDING: 'قيد الانتظار', CONFIRMED: 'مؤكد', REJECTED: 'مرفوض', COMPLETED: 'مكتمل', POSTPONED: 'مؤجل' };
// --- End Translation Maps ---


// --- Global Variables ---
const adminAppointmentListDiv = document.getElementById('adminAppointmentList');
const adminStatusFilterSelect = document.getElementById('adminStatusFilter'); // Get reference to filter
const postponeModal = document.getElementById('postponeModal');
const postponeForm = document.getElementById('postponeForm');
const newDateInput = document.getElementById('newDate'); // Input for new date in modal
const newTimeInput = document.getElementById('newTime'); // Input for new time in modal
let currentAppointmentId = null; // To store the ID of the appointment being postponed
// --- End Global Variables ---


// --- Function to Render Admin Appointment Cards ---
function renderAdminAppointments(appointments) {
    if (!adminAppointmentListDiv) { console.error("#adminAppointmentList not found."); return; }
    adminAppointmentListDiv.innerHTML = ''; // Clear previous content

    if (!appointments || appointments.length === 0) {
        adminAppointmentListDiv.innerHTML = '<p>لا توجد حجوزات لعرضها.</p>';
        return;
    }

    appointments.forEach(app => {
        // Date Formatting (YYYY-MM-DD HH:MM)
        let formattedDateTime = 'N/A';
        if (app.proposedDateTime) {
             try {
                const d = new Date(app.proposedDateTime);
                const pad = (n) => n.toString().padStart(2,'0');
                formattedDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch(e){ console.error("Error formatting date:", app.proposedDateTime, e); }
        }

        // Translations
        let visitReasonText = visitReasonTranslations[app.visitReason] || app.visitReason || 'N/A';
        if (app.visitReason === 'WORKSHOP' && app.workshopDetail) {
            visitReasonText += ` (${workshopDetailTranslations[app.workshopDetail] || app.workshopDetail})`;
        }
        const statusText = statusTranslations[app.status] || app.status || 'N/A';
        const statusClass = app.status ? app.status.toLowerCase() : 'unknown';

        // File Rendering
        let filesHtml = renderFiles(app.files); // Use helper function

        // Create Card Element
        const card = document.createElement('div');
        card.className = 'appointment-card'; // Use class from your CSS
        card.setAttribute('data-id', app.id); // Store ID for actions
        card.setAttribute('data-status', statusClass);

        // Determine button states based on current appointment status
        const isPending = app.status === 'PENDING';
        const isConfirmed = app.status === 'CONFIRMED';
        const isPostponed = app.status === 'POSTPONED';
        const canComplete = isConfirmed || isPostponed; // Logic: Can complete if confirmed or postponed
        const canPostpone = app.status !== 'COMPLETED' && app.status !== 'REJECTED'; // Can postpone unless done/rejected
        const canConfirmReject = isPending; // Can only confirm/reject if pending

        // Card Inner HTML including Action Buttons
        card.innerHTML = `
            <div class="appointment-details">
                 <p><strong>المستخدم:</strong> ${app.user?.fullName || 'N/A'} (${app.user?.companyName || 'N/A'})</p>
                <p><strong>تاريخ ووقت الموعد:</strong> <span class="date-time">${formattedDateTime}</span></p>
                <p><strong>اسم المشروع:</strong> ${app.projectName || 'N/A'}</p>
                <p><strong>موقع المشروع:</strong> ${app.projectLocation || 'N/A'}</p>
                <p><strong>سبب الزيارة:</strong> ${visitReasonText}</p>
                <p><strong>الوصف:</strong> ${app.visitDesc || '-'}</p>
                <p><strong>الحالة:</strong> <span class="status ${statusClass}">${statusText}</span></p>
                ${filesHtml}
            </div>
            <div class="appointment-actions">
                <button class="action-btn approve" onclick="handleUpdateStatus(${app.id}, 'confirmed')" ${!canConfirmReject ? 'disabled' : ''}>تأكيد</button>
                <button class="action-btn reject" onclick="handleUpdateStatus(${app.id}, 'rejected')" ${!canConfirmReject ? 'disabled' : ''}>رفض</button>
                <button class="action-btn complete" onclick="handleUpdateStatus(${app.id}, 'completed')" ${!canComplete ? 'disabled' : ''}>إكمال</button>
                <button class="action-btn postpone" onclick="openPostponeModal(${app.id})" ${!canPostpone ? 'disabled' : ''}>تأجيل</button>
            </div>
        `;
        adminAppointmentListDiv.appendChild(card); // Add the card to the list
    });
}

// --- Helper function to render file links ---
function renderFiles(files) {
    if (!files || files.length === 0) return ''; // Return empty string if no files
    let filesHtml = '<div class="appointment-files"><p><strong>الملفات المرفقة:</strong></p><ul>';
    files.forEach(file => {
        let fileUrl = '#'; // Default link
        try {
            // Construct URL relative to server root
            const baseUrl = new URL(api.defaults.baseURL);
            fileUrl = `${baseUrl.origin}/uploads/${file.filePath}`;
        } catch (e) { console.error("Could not construct file base URL:", api.defaults.baseURL, e); }
        filesHtml += `<li><a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${file.originalName || 'ملف'} (${file.fileType || 'N/A'})</a></li>`;
    });
    filesHtml += '</ul></div>';
    return filesHtml;
}

// --- Function to fetch all appointments for admin ---
async function fetchAndRenderAdminAppointments() {
    // Read the selected status from the filter dropdown
    const selectedStatus = adminStatusFilterSelect ? adminStatusFilterSelect.value : 'all';
    console.log(`Workspaceing all appointments for admin with status: ${selectedStatus}`);
    setLoading('adminAppointmentList', true); // Show loading state in the list div

    try {
        // Check if api object is available
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // Make GET request to the admin endpoint, including the status filter
        const response = await api.get('/appointments/admin', {
             params: { status: selectedStatus } // Add filter parameter
        });
        console.log("Admin appointments received:", response.data);
        renderAdminAppointments(response.data); // Render the received data

    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to load appointments.';
        displayError('adminAppointmentList', message); // Display error in the list div
        console.error("Fetch admin appointments error:", error);
    }
    // No finally needed for setLoading as render/error replace content
}

// --- Function to Handle Status Updates (Confirm, Reject, Complete) ---
async function handleUpdateStatus(appointmentId, newStatus) {
    console.log(`Updating appointment ${appointmentId} to status ${newStatus}`);
    // Optional: Disable the specific button clicked
    const clickedButton = event?.target; // NOTE: 'event' might not be available if called directly
    if (clickedButton) clickedButton.disabled = true;

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // Make PATCH request to update status
        await api.patch(`/appointments/admin/${appointmentId}/status`, { status: newStatus });

        // Use translated status in success message
        const translatedStatus = statusTranslations[newStatus.toUpperCase()] || newStatus;
        alert(`تم تحديث حالة الحجز بنجاح إلى: ${translatedStatus}`);
        fetchAndRenderAdminAppointments(); // Refresh the list to show changes

    } catch (error) {
         const message = error.response?.data?.message || error.message || `Failed to update status.`;
         alert(`خطأ: ${message}`); // Show error alert
         console.error("Update status error:", error);
         // Re-enable button on error ONLY if we captured it reliably
         if (clickedButton) clickedButton.disabled = false;
    }
}


// --- Modal Handling Functions for Postpone ---
function openPostponeModal(appointmentId) {
    // Ensure modal elements exist
    if (!postponeModal || !postponeForm || !newDateInput || !newTimeInput) {
        console.error("Postpone modal elements not found.");
        alert("Error: Could not open postpone dialog.");
        return;
    }
    console.log(`Opening postpone modal for appointment ID: ${appointmentId}`);
    currentAppointmentId = appointmentId; // Store the ID globally for the submit handler
    postponeForm.reset(); // Clear any previous values in the form
    // Clear previous flatpickr instance value if used
     const fpInstance = newDateInput._flatpickr;
     if (fpInstance) { fpInstance.clear(); }
    postponeModal.style.display = 'block'; // Show the modal
}

function closeModal() {
    if (!postponeModal) return;
    console.log("Closing postpone modal.");
    postponeModal.style.display = 'none'; // Hide the modal
    currentAppointmentId = null; // Clear the stored ID
}

// --- Handle Postpone Form Submission ---
async function submitPostpone(event) {
    event.preventDefault(); // Prevent default form submission
    console.log("Submit postpone called for ID:", currentAppointmentId);
    if (!currentAppointmentId || !newDateInput || !newTimeInput) {
        console.error("Missing currentAppointmentId or modal inputs in submitPostpone.");
        return;
    }

    const newDateValue = newDateInput.value; // Get value from input (expects dd/mm/yyyy)
    const newTimeValue = newTimeInput.value; // Get value from time input (hh:mm)

    console.log('Validating Date Value:', JSON.stringify(newDateValue));

    // Basic frontend validation for the expected format (dd/mm/yyyy)
    // Regex allows d/m/yyyy or dd/mm/yyyy
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(newDateValue.trim())) {
         alert('يرجى إدخال التاريخ بالتنسيق الصحيح dd/mm/yyyy!');
         return;
     }
    if (!/^\d{2}:\d{2}$/.test(newTimeValue)) {
         alert('يرجى إدخال الوقت بالتنسيق الصحيح hh:mm!');
         return;
     }

    setLoading('postponeForm', true); // Show loading state on the modal's submit button

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // Make PATCH request to postpone endpoint
        // Send date in dd/mm/yyyy format as expected by backend
        await api.patch(`/appointments/admin/${currentAppointmentId}/postpone`, {
             newDate: newDateValue.trim(), // Send trimmed value
             newTime: newTimeValue
        });

        alert('تم تأجيل الموعد بنجاح.');
        closeModal(); // Close the modal on success
        fetchAndRenderAdminAppointments(); // Refresh the main appointment list

    } catch (error) {
         const message = error.response?.data?.message || error.message || 'فشل تأجيل الموعد.';
         alert(`خطأ: ${message}`); // Show error message
         console.error("Postpone error:", error);
    } finally {
        setLoading('postponeForm', false); // Remove loading state from modal button
    }
}


// --- Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for admin-appointment.js");

    // --- Admin Authentication Check ---
     const userDataString = localStorage.getItem('userData');
     const token = localStorage.getItem('authToken');
     let isAdminUser = false;
     try {
         const userData = userDataString ? JSON.parse(userDataString) : null;
         if (token && userData && userData.role === 'ADMIN') { // Check for ADMIN role
             isAdminUser = true;
         }
    } catch (e) { console.error("Error parsing user data for auth check", e); }

     if (!isAdminUser) {
        // If not logged in as admin, redirect to admin login
         console.log("User is not admin or not logged in. Redirecting...");
         alert('Access Denied. Please log in as an administrator.');
         window.location.href = 'admin-login.html'; // Adjust path if needed
         return; // Stop further execution
     }
    // --- End Admin Auth Check ---

    console.log("Admin authenticated. Initializing page.");

    // --- Initialize Flatpickr for Modal Date Input ---
    if (newDateInput && typeof flatpickr !== 'undefined' && newDateInput.type === 'text') {
        console.log("Initializing flatpickr for modal date input #newDate");
         flatpickr(newDateInput, {
             dateFormat: "d/m/Y", // Set VALUE format to dd/mm/yyyy
             altInput: true,      // Show alternate format to user
             altFormat: "d/m/Y",  // VISUAL format dd/mm/yyyy (can change this visual one if desired)
             allowInput: true,    // Allow typing
             locale: "ar"        // Use Arabic locale (needs ar.js included)
             // minDate: "today", // Optional: Set min date if needed
         });
     } else if (newDateInput && newDateInput.type === 'text') {
        console.warn("Flatpickr library not loaded, but modal date input is text. Manual dd/mm/yyyy input required.");
     } else if (!newDateInput) {
         console.error("Modal date input #newDate not found.");
     }
     // --- End Flatpickr Init ---

    // --- Attach Event Listeners ---
    // Postpone form submission
    if (postponeForm) {
        postponeForm.addEventListener('submit', submitPostpone);
    } else {
        console.warn("#postponeForm not found in the HTML.");
    }
    // Status filter dropdown change
    if (adminStatusFilterSelect) {
        console.log("Adding change listener to admin status filter.");
        adminStatusFilterSelect.addEventListener('change', fetchAndRenderAdminAppointments);
    } else {
        console.warn("#adminStatusFilter dropdown not found.");
    }
    // Modal close button
    const closeButton = postponeModal?.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    // Modal close on outside click
    window.addEventListener('click', (event) => {
        if (event.target === postponeModal) {
            closeModal();
        }
    });
    // --- End Attach Listeners ---


    // --- Make Functions Global for onclick handlers ---
    window.handleUpdateStatus = handleUpdateStatus;
    window.openPostponeModal = openPostponeModal;
    window.closeModal = closeModal; // Needed for the close button's onclick

    // --- Initial Data Fetch ---
    fetchAndRenderAdminAppointments();

}); // End DOMContentLoaded