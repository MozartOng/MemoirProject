// frontend/javascript/admin-projects.js

// --- Translation Maps ---
const roleTranslations = {
    CONTRACTOR: 'مقاول',
    ENGINEERING: 'مكتب الدراسات',
    OWNER: 'صاحب المشروع',
    LAB: 'مخبر',
    ADMIN: 'مدير النظام'
};

const projectStatusTranslations = {
    PLANNED: 'مخطط له',
    ONGOING: 'جاري التنفيذ',
    COMPLETED: 'مكتمل',
    ON_HOLD: 'قيد الانتظار',
    CANCELLED: 'ملغى'
};

const visitReasonTranslations = {
    OTHER: 'آخر',
    FILE: 'ملف',
    WORKSHOP: 'ورشة'
};

const workshopDetailTranslations = {
    REEXECUTION: 'معاينة الحفر',
    CONCRETE_TESTING: 'معاينة الأشغال',
    CONCRETE_WORKS: 'معاينة أشغال المساكة',
    SOIL: 'الاستلام المؤقت',
    NOT_SPECIFIED: 'الاستلام النهائي'
};
// --- End Translation Maps ---


// --- DOM Elements ---
// **FIXED: Changed 'projectList' to 'projectListContainer' to match HTML ID**
const projectListDiv = document.getElementById('projectListContainer');
const addProjectModal = document.getElementById('addProjectModal'); // Assuming your add modal is 'projectModal' based on HTML
const addProjectForm = document.getElementById('projectForm'); // Assuming your add form is 'projectForm'
const updateProjectModal = document.getElementById('projectModal'); // Assuming 'projectModal' is used for both add/update
const updateProjectForm = document.getElementById('projectForm');  // Assuming 'projectForm' is used for both add/update
const deleteProjectModal = document.getElementById('deleteProjectModal'); // You'll need a separate delete modal structure in HTML
const confirmDeleteProjectBtn = document.getElementById('confirmDeleteProjectBtn'); // And a confirm button for it
let projectIdToDelete = null;
let allUsersForAssignment = []; // To store users for assignment checkboxes

// --- DOM Elements for the provided HTML structure ---
// If using a single modal 'projectModal' for add/edit:
const projectModal = document.getElementById('projectModal');
const projectForm = document.getElementById('projectForm');
const projectModalTitle = document.getElementById('projectModalTitle');
const projectIdInput = document.getElementById('projectId'); // Hidden input for project ID in the modal

// --- End DOM Elements ---

// --- Helper Functions ---
function displayProjectListError(message) {
    if (projectListDiv) {
        projectListDiv.innerHTML = `<p style="color: red;" class="error-message">خطأ: ${message}</p>`;
    }
    console.error("Project list error:", message);
}

function setProjectListLoading(isLoading) {
    if (projectListDiv) {
        projectListDiv.innerHTML = isLoading ? '<p class="loading-message">جاري تحميل المشاريع...</p>' : '';
    }
}
// --- End Helper Functions ---

// --- Render Projects ---
function renderProjects(projects) {
    setProjectListLoading(false);
    if (!projectListDiv) {
        console.error("Project list container ('projectListContainer') not found.");
        return;
    }
    projectListDiv.innerHTML = '';

    if (!projects || projects.length === 0) {
        projectListDiv.innerHTML = '<p>لا توجد مشاريع لعرضها. قم بإضافة مشروع جديد.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card'; // Ensure this class exists in your admin-projects.css
        card.setAttribute('data-project-id', project.id);

        let assignedUsersHtml = 'لا يوجد مستخدمين معينين';
        if (project.users && project.users.length > 0) {
            assignedUsersHtml = project.users.map(u => `${u.fullName} (${roleTranslations[u.role] || u.role})`).join('، ');
        }

        let latestVisitHtml = '<p><strong>آخر زيارة مكتملة:</strong> لا توجد زيارات مكتملة بعد.</p>';
        if (project.latestCompletedVisit) {
            const visit = project.latestCompletedVisit;
            let visitReasonText = visitReasonTranslations[visit.visitReason] || visit.visitReason || 'غير معروف';
            if (visit.visitReason === 'WORKSHOP' && visit.workshopDetail) {
                const detailText = workshopDetailTranslations[visit.workshopDetail] || visit.workshopDetail;
                visitReasonText += ` (${detailText})`;
            }
            const visitDate = visit.proposedDateTime ? new Date(visit.proposedDateTime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A';
            latestVisitHtml = `
                <div class="latest-visit-details">
                    <p><strong>آخر زيارة مكتملة (${visitDate}):</strong></p>
                    <ul>
                        <li><strong>سبب الزيارة:</strong> ${visitReasonText}</li>
                        ${visit.workshopDetail && visit.visitReason === 'WORKSHOP' ? `<li><strong>تفاصيل الورشة:</strong> ${workshopDetailTranslations[visit.workshopDetail] || visit.workshopDetail}</li>` : ''}
                    </ul>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="project-details">
                <h3>${project.name}</h3>
                <p><strong>الموقع:</strong> ${project.location || 'N/A'}</p>
                <p><strong>الحالة:</strong> ${projectStatusTranslations[project.status] || project.status || 'N/A'}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${new Date(project.createdAt).toLocaleDateString('ar-EG')}</p>
                <p><strong>المستخدمون المعينون:</strong> ${assignedUsersHtml}</p>
                ${latestVisitHtml}
            </div>
            <div class="project-actions">
                <button class="action-btn update-btn" onclick="openProjectModalForUpdate(${project.id})">تحديث</button>
                <button class="action-btn delete-btn" onclick="openDeleteProjectModal(${project.id}, '${project.name.replace(/'/g, "\\'")}')">حذف</button>
            </div>
        `;
        projectListDiv.appendChild(card);
    });
}
// --- End Render Projects ---

// --- Fetch Projects ---
async function fetchAndRenderProjects() {
    setProjectListLoading(true);
    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // **FIXED: Changed API endpoint to /projects/admin-list**
        const response = await api.get('/projects/admin-list');
        renderProjects(response.data);
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل تحميل قائمة المشاريع.';
        displayProjectListError(message);
        console.error("Fetch projects error:", error);
    }
}
// --- End Fetch Projects ---

// --- Fetch All Users for Assignment (Placeholder - implement if needed for modals) ---
async function fetchAllUsersForAssignment() {
    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // **IMPORTANT**: You need a backend endpoint that returns users suitable for assignment.
        // E.g., /api/users/assignable (as used in user.controller.js - exports.getAssignableUsers)
        const response = await api.get('/users/assignable');
        allUsersForAssignment = response.data;
        console.log("Users for assignment fetched:", allUsersForAssignment);
    } catch (error) {
        console.error("Failed to fetch users for assignment:", error);
        allUsersForAssignment = [];
        // Consider alerting the admin if user fetching fails, as assignment won't work.
        // alert("خطأ في تحميل قائمة المستخدمين للتعيين.");
    }
}
// --- End Fetch All Users ---

// --- Populate User Checkboxes for Modals (Placeholder - implement if needed) ---
function populateUserCheckboxesInModal(selectedUserIds = []) {
    const userAssignContainer = document.getElementById('projectAssignUsers'); // Assuming this ID is in your modal
    if (!userAssignContainer) {
        console.warn("User assignment container 'projectAssignUsers' not found in modal.");
        return;
    }
    userAssignContainer.innerHTML = '';

    if (allUsersForAssignment.length === 0) {
        userAssignContainer.innerHTML = '<p>لا يوجد مستخدمين لتعيينهم أو فشل تحميلهم.</p>';
        return;
    }
    allUsersForAssignment.forEach(user => {
        const isChecked = selectedUserIds.includes(user.id);
        const checkboxItem = document.createElement('div');
        // checkboxItem.className = 'user-checkbox-item'; // Add class for styling
        checkboxItem.innerHTML = `
            <input type="checkbox" id="modal_user_${user.id}" name="userIds" value="${user.id}" ${isChecked ? 'checked' : ''}>
            <label for="modal_user_${user.id}">${user.fullName} (${roleTranslations[user.role] || user.role})</label>
        `;
        userAssignContainer.appendChild(checkboxItem);
    });
}
// --- End Populate User Checkboxes ---


// --- Project Modal (Add/Update) ---
function openProjectModalForAdd() {
    if (!projectModal || !projectForm || !projectModalTitle || !projectIdInput) return;
    projectModalTitle.textContent = 'إضافة مشروع جديد';
    projectForm.reset();
    projectIdInput.value = ''; // Clear project ID for add mode
    // populateUserCheckboxesInModal([]); // Uncomment and ensure 'projectAssignUsers' div exists in modal
    projectModal.style.display = 'block';
}

async function openProjectModalForUpdate(id) {
    if (!projectModal || !projectForm || !projectModalTitle || !projectIdInput) return;
    projectModalTitle.textContent = 'تحديث بيانات المشروع';
    projectForm.reset();
    projectIdInput.value = id;

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        const response = await api.get(`/projects/${id}`); // Fetch specific project
        const project = response.data;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectLocation').value = project.location;
        document.getElementById('projectStatus').value = project.status;
        // const assignedUserIds = project.users ? project.users.map(u => u.id) : [];
        // populateUserCheckboxesInModal(assignedUserIds); // Uncomment if user assignment is part of this modal
        projectModal.style.display = 'block';
    } catch (error) {
        alert('فشل تحميل بيانات المشروع للتحديث.');
        console.error("Error fetching project for update:", error);
    }
}

function closeProjectModal() {
    if (projectModal) projectModal.style.display = 'none';
}

async function handleProjectFormSubmit(event) {
    event.preventDefault();
    if (!projectForm || !projectIdInput) return;

    const currentProjectId = projectIdInput.value;
    const isUpdate = !!currentProjectId;

    const name = document.getElementById('projectName').value;
    const location = document.getElementById('projectLocation').value;
    const status = document.getElementById('projectStatus').value;
    // const assignedUserIds = Array.from(projectForm.querySelectorAll('input[name="userIds"]:checked')).map(cb => parseInt(cb.value));


    if (!name || !location) {
        alert('اسم المشروع والموقع مطلوبان.');
        return;
    }

    const payload = { name, location, status /*, userIds: assignedUserIds */ }; // Add userIds if implementing assignment

    const submitButton = projectForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = isUpdate ? 'جاري الحفظ...' : 'جاري الإضافة...';

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        if (isUpdate) {
            await api.patch(`/projects/${currentProjectId}`, payload);
            alert('تم تحديث المشروع بنجاح!');
        } else {
            await api.post('/projects', payload);
            alert('تم إضافة المشروع بنجاح!');
        }
        closeProjectModal();
        fetchAndRenderProjects();
    } catch (error) {
        const message = error.response?.data?.message || error.message || (isUpdate ? 'فشل تحديث المشروع.' : 'فشل إضافة المشروع.');
        alert(`خطأ: ${message}`);
        console.error("Project form submit error:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'حفظ المشروع';
    }
}
// --- End Project Modal ---


// --- Delete Project Modal (Placeholder - you need HTML for this) ---
function openDeleteProjectModal(id, name) {
    // This function assumes you have a separate modal for delete confirmation
    // with id="deleteProjectModal" and a confirm button id="confirmDeleteProjectBtn"
    // and a text element id="deleteProjectModalText"
    const delModal = document.getElementById('deleteProjectModal'); // Example ID
    const delConfirmBtn = document.getElementById('confirmDeleteProjectBtn'); // Example ID
    const delText = document.getElementById('deleteProjectModalText'); // Example ID

    if (!delModal || !delConfirmBtn || !delText) {
        console.warn("Delete modal elements not found. Please create them in HTML.");
        alert(`هل أنت متأكد أنك تريد حذف المشروع "${name}"؟ (تأكيد الحذف يتطلب عناصر HTML للنافذة المنبثقة)`);
        // As a fallback if modal elements aren't there, you could do a simple confirm:
        // if (confirm(`هل أنت متأكد أنك تريد حذف المشروع "${name}"؟`)) {
        //     projectIdToDelete = id;
        //     confirmProjectDeletion();
        // }
        return;
    }
    projectIdToDelete = id;
    delText.textContent = `هل أنت متأكد أنك تريد حذف المشروع "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`;
    delModal.style.display = 'block';
}

function closeDeleteProjectModal() { // Example function
    const delModal = document.getElementById('deleteProjectModal');
    if (delModal) delModal.style.display = 'none';
    projectIdToDelete = null;
}

async function confirmProjectDeletion() {
    if (!projectIdToDelete) return;
    const delConfirmBtn = document.getElementById('confirmDeleteProjectBtn');
    if(delConfirmBtn) {
        delConfirmBtn.disabled = true;
        delConfirmBtn.textContent = 'جاري الحذف...';
    }

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        await api.delete(`/projects/${projectIdToDelete}`);
        alert('تم حذف المشروع بنجاح.');
        closeDeleteProjectModal(); // Close the specific delete modal
        fetchAndRenderProjects();
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل حذف المشروع.';
        alert(`خطأ: ${message}`);
    } finally {
        if(delConfirmBtn) {
            delConfirmBtn.disabled = false;
            delConfirmBtn.textContent = 'نعم، قم بالحذف';
        }
    }
}
// --- End Delete Project Modal ---

// --- Event Listeners & Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Loaded for admin-projects.js");

    const userDataString = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    let isAdminUser = false;
    try {
        const userData = userDataString ? JSON.parse(userDataString) : null;
        if (token && userData && userData.role === 'ADMIN') isAdminUser = true;
    } catch (e) { console.error("Auth check error:", e); }

    if (!isAdminUser) {
        alert('Access Denied. Please log in as an administrator.');
        window.location.href = 'admin-login.html';
        return;
    }
    console.log("Admin authenticated.");

    // await fetchAllUsersForAssignment(); // Call this if you implement user assignment in modals

    const addNewProjectBtn = document.getElementById('addNewProjectBtn');
    if (addNewProjectBtn) {
        addNewProjectBtn.addEventListener('click', openProjectModalForAdd);
    } else {
        console.warn("Button with ID 'addNewProjectBtn' not found.");
    }

    if (projectForm) { // Assuming 'projectForm' is used for both add and update
        projectForm.addEventListener('submit', handleProjectFormSubmit);
    } else {
        console.warn("Form with ID 'projectForm' not found.");
    }

    // If you have a separate delete confirmation button (e.g., in a separate delete modal)
    // const actualConfirmDeleteBtn = document.getElementById('confirmDeleteProjectBtn');
    // if (actualConfirmDeleteBtn) {
    //     actualConfirmDeleteBtn.addEventListener('click', confirmProjectDeletion);
    // }


    // Global click listener for closing modals (adjust if you have multiple modals)
    window.addEventListener('click', (event) => {
        if (event.target === projectModal) closeProjectModal(); // For the main add/edit project modal
        // if (event.target === deleteProjectModal) closeDeleteProjectModal(); // If you add a separate delete modal
    });

    // Make functions global if they are called by inline onclick attributes in HTML
    window.openProjectModalForUpdate = openProjectModalForUpdate; // For update buttons on cards
    window.openDeleteProjectModal = openDeleteProjectModal;   // For delete buttons on cards
    window.closeProjectModal = closeProjectModal; // For the 'X' button on the main project modal

    fetchAndRenderProjects(); // Initial fetch
});
