// frontend/javascript/admin-users.js

// --- Helper Functions (for displaying messages in the user list area) ---
function displayUserListError(message) {
    const userListDiv = document.getElementById('userList');
    console.error(`Error displaying users: ${message}`);
    if (userListDiv) {
        userListDiv.innerHTML = `<p style="color: red;" class="error-message">خطأ: ${message}</p>`;
    } else {
        alert(`خطأ: ${message}`);
    }
}

function setUserListLoading(isLoading) {
    const userListDiv = document.getElementById('userList');
    if (userListDiv) {
        if (isLoading) {
            userListDiv.innerHTML = '<p class="loading-message">جاري تحميل المستخدمين...</p>';
        }
        // Content will be replaced by renderUsers() or displayUserListError()
    }
}
// --- End Helper Functions ---

// --- Global DOM Element References ---
const userListDiv = document.getElementById('userList');
const addNewUserBtn = document.getElementById('addNewUserBtn');

// Delete Modal Elements
const deleteUserModal = document.getElementById('deleteUserModal');
const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
const deleteUserModalText = document.getElementById('deleteUserModalText');
let userIdToDelete = null;

// Update Modal Elements
const updateUserModal = document.getElementById('updateUserModal');
const updateUserForm = document.getElementById('updateUserForm');
const updateUserIdInput = document.getElementById('updateUserId');
const updateFullNameInput = document.getElementById('updateFullName');
const updateEmailInput = document.getElementById('updateEmail');
const updateRoleInput = document.getElementById('updateRole');
const updateCompanyNameInput = document.getElementById('updateCompanyName');
const updateProjectsCheckboxGroup = document.getElementById('updateProjectsCheckboxGroup'); // For project checkboxes in Update Modal

// Add User Modal Elements
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const addFullNameInput = document.getElementById('addFullName');
const addEmailInput = document.getElementById('addEmail');
const addPasswordInput = document.getElementById('addPassword');
const addRoleInput = document.getElementById('addRole');
const addCompanyNameInput = document.getElementById('addCompanyName');
const assignProjectsCheckboxGroup = document.getElementById('assignProjectsCheckboxGroup'); // For project checkboxes in Add Modal
// --- End Global DOM Element References ---


// --- Translation map for roles (to display Arabic names) ---
const roleTranslations = {
    CONTRACTOR: 'مقاول',
    ENGINEERING: 'مكتب الدراسات',
    OWNER: 'صاحب المشروع',
    LAB: 'مخبر',
    ADMIN: 'مدير النظام' // Note: Admins should be filtered out by the backend from the list
};

// --- Function to Render User Cards into the HTML ---
function renderUsers(users) {
    if (!userListDiv) {
        console.error("User list container ('userList') not found in HTML.");
        return;
    }
    userListDiv.innerHTML = ''; // Clear previous list or loading/error message

    if (!users || users.length === 0) {
        userListDiv.innerHTML = '<p>لا يوجد مستخدمين لعرضهم. قم بإضافة مستخدم جديد إذا كنت مسؤولاً.</p>';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.setAttribute('data-user-id', user.id);

        const translatedRole = roleTranslations[user.role] || user.role;
        let assignedProjectsHtml = 'لا توجد مشاريع معينة';
        if (user.projects && user.projects.length > 0) {
            assignedProjectsHtml = user.projects.map(p => p.name).join('، ');
        }

        card.innerHTML = `
            <div class="user-details">
                <p><strong>الاسم الكامل:</strong> ${user.fullName || 'N/A'}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email || 'N/A'}</p>
                <p><strong>الدور:</strong> ${translatedRole}</p>
                <p><strong>اسم الشركة:</strong> ${user.companyName || 'N/A'}</p>
                <p><strong>المشاريع المعينة:</strong> ${assignedProjectsHtml}</p>
                <p><strong>تاريخ التسجيل:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
            <div class="user-actions">
                <button class="update-btn" onclick="openUpdateUserModal(${user.id})">تحديث</button>
                <button class="delete-btn" onclick="openDeleteModal(${user.id}, '${user.fullName.replace(/'/g, "\\'")}')">حذف</button>
            </div>
        `;
        userListDiv.appendChild(card);
    });
}

// --- Function to Fetch Users from the Backend ---
async function fetchAndRenderUsers() {
    console.log("Fetching users for admin view...");
    setUserListLoading(true);
    try {
        if (typeof api === 'undefined') {
            throw new Error("API configuration is missing. Ensure api.js is loaded before admin-users.js.");
        }
        const response = await api.get('/users'); // Backend should filter out admins if this is for a general list
        console.log("Users received:", response.data);
        renderUsers(response.data);
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل تحميل قائمة المستخدمين.';
        displayUserListError(message);
        console.error("Fetch users error:", error);
    }
}

// --- Delete Modal Functions ---
function openDeleteModal(id, name) {
    if (!deleteUserModal || !deleteUserModalText || !confirmDeleteUserBtn) {
        console.error("Delete modal elements are not found.");
        alert("خطأ: لا يمكن فتح نافذة تأكيد الحذف.");
        return;
    }
    userIdToDelete = id;
    deleteUserModalText.textContent = `هل أنت متأكد أنك تريد حذف المستخدم ${name} (ID: ${id})؟ لا يمكن التراجع عن هذا الإجراء.`;
    deleteUserModal.style.display = 'block';
}

function closeDeleteModal() {
    if (deleteUserModal) deleteUserModal.style.display = 'none';
    userIdToDelete = null;
}

async function confirmUserDeletion() {
    if (!userIdToDelete) return;
    console.log(`Attempting to delete user ${userIdToDelete}...`);
    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.disabled = true;
        confirmDeleteUserBtn.textContent = 'جاري الحذف...';
    }
    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        const response = await api.delete(`/users/${userIdToDelete}`);
        alert(response.data.message || `تم حذف المستخدم بنجاح.`);
        closeDeleteModal();
        fetchAndRenderUsers();
    } catch (error) {
        const message = error.response?.data?.message || error.message || `فشل حذف المستخدم.`;
        alert(`خطأ: ${message}`);
        console.error(`Delete user ${userIdToDelete} error:`, error);
    } finally {
        if (confirmDeleteUserBtn) {
            confirmDeleteUserBtn.disabled = false;
            confirmDeleteUserBtn.textContent = 'نعم، قم بالحذف';
        }
    }
}
// --- End Delete Modal Functions ---

// --- Update Modal Functions ---
async function openUpdateUserModal(userId) {
    console.log(`Opening update modal for user ID: ${userId}`);
    if (!updateUserModal || !updateUserForm || !updateProjectsCheckboxGroup) {
        console.error("Update user modal or its project checkbox group not found.");
        alert("خطأ: لا يمكن فتح نافذة تحديث بيانات المستخدم.");
        return;
    }

    updateUserForm.reset();
    updateUserIdInput.value = userId;
    updateProjectsCheckboxGroup.innerHTML = '<p>جاري تحميل المشاريع...</p>';
    updateUserModal.style.display = 'block';

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // **FIXED: Changed /projects to /projects/admin-list or a more suitable endpoint**
        // Using /projects/admin-list as it's an existing endpoint that lists all projects for admin.
        // Alternatively, /projects/for-selection could be used if its logic is adjusted
        // for an admin fetching all projects for assignment purposes.
        const [userResponse, allProjectsResponse] = await Promise.all([
            api.get(`/users/${userId}`),
            api.get('/projects/admin-list') // Or '/projects/for-selection' if more appropriate
        ]);

        const userToUpdate = userResponse.data;
        const allProjects = allProjectsResponse.data; // This will be an array of project objects

        if (userToUpdate) {
            updateFullNameInput.value = userToUpdate.fullName || '';
            updateEmailInput.value = userToUpdate.email || '';
            updateRoleInput.value = userToUpdate.role || ''; // Assumes role is sent as the enum string
            updateCompanyNameInput.value = userToUpdate.companyName || '';

            updateProjectsCheckboxGroup.innerHTML = ''; // Clear loading message
            const assignedProjectIds = new Set(userToUpdate.projects?.map(p => p.id) || []);

            if (allProjects && allProjects.length > 0) {
                allProjects.forEach(project => {
                    const isChecked = assignedProjectIds.has(project.id);
                    const checkboxItem = document.createElement('div');
                    checkboxItem.className = 'project-checkbox-item'; // Add class for styling if needed
                    checkboxItem.innerHTML = `
                        <input type="checkbox" id="update_project_${project.id}" name="projectIds" value="${project.id}" ${isChecked ? 'checked' : ''}>
                        <label for="update_project_${project.id}">${project.name} (${project.location || 'N/A'})</label>
                    `;
                    updateProjectsCheckboxGroup.appendChild(checkboxItem);
                });
            } else {
                updateProjectsCheckboxGroup.innerHTML = '<p>لا توجد مشاريع متاحة لتعيينها.</p>';
            }
        } else {
            alert("لم يتم العثور على تفاصيل المستخدم.");
            closeUpdateModal();
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || "فشل جلب بيانات المستخدم أو المشاريع للتحديث.";
        alert(`خطأ: ${message}`);
        console.error("Error fetching data for update modal:", error);
        // Optionally, provide more specific feedback in the modal itself
        updateProjectsCheckboxGroup.innerHTML = `<p style="color:red;">${message}</p>`;
        // Do not close modal on error here, let user see the error.
        // closeUpdateModal();
    }
}

function closeUpdateModal() {
    if (updateUserModal) updateUserModal.style.display = 'none';
    if (updateUserForm) updateUserForm.reset();
}

async function handleUpdateUserFormSubmit(event) {
    event.preventDefault();
    if (!updateUserForm || !updateUserIdInput.value) return;

    const userId = updateUserIdInput.value;
    const selectedProjectIds = [];
    updateUserForm.querySelectorAll('input[name="projectIds"]:checked').forEach(checkbox => {
        selectedProjectIds.push(parseInt(checkbox.value));
    });

    const updatedData = {
        fullName: updateFullNameInput.value,
        email: updateEmailInput.value,
        role: updateRoleInput.value, // This should be the string value like "CONTRACTOR"
        companyName: updateCompanyNameInput.value,
        projectIds: selectedProjectIds // Backend expects an array of integers
    };

    if (!updatedData.fullName || !updatedData.email || !updatedData.role || !updatedData.companyName) {
        alert("يرجى ملء جميع الحقول الأساسية في نموذج التحديث.");
        return;
    }

    console.log(`Attempting to update user ${userId} with data:`, updatedData);
    const submitButton = updateUserForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'جاري الحفظ...';
    }

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        const response = await api.patch(`/users/${userId}`, updatedData); // PATCH to /api/users/:id
        alert(response.data.message || "تم تحديث بيانات المستخدم بنجاح.");
        closeUpdateModal();
        fetchAndRenderUsers();
    } catch (error) {
        const message = error.response?.data?.message || error.message || "فشل تحديث بيانات المستخدم.";
        alert(`خطأ: ${message}`);
        console.error(`Update user ${userId} error:`, error);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ التغييرات';
        }
    }
}
// --- End Update Modal Functions ---

// --- Add User Modal Functions ---
async function openAddUserModal() {
    if (!addUserModal || !addUserForm || !assignProjectsCheckboxGroup) {
        console.error("Add User Modal or its components not found.");
        alert("خطأ: لا يمكن فتح نافذة إضافة مستخدم.");
        return;
    }
    addUserForm.reset();
    assignProjectsCheckboxGroup.innerHTML = '<p>جاري تحميل المشاريع...</p>';
    addUserModal.style.display = 'block';

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // **FIXED: Changed /projects to /projects/admin-list or a more suitable endpoint**
        const response = await api.get('/projects/admin-list'); // Or '/projects/for-selection'
        const projects = response.data;
        assignProjectsCheckboxGroup.innerHTML = '';
        if (projects && projects.length > 0) {
            projects.forEach(project => {
                const checkboxItem = document.createElement('div');
                checkboxItem.className = 'project-checkbox-item';
                checkboxItem.innerHTML = `
                    <input type="checkbox" id="add_project_${project.id}" name="projectIds" value="${project.id}">
                    <label for="add_project_${project.id}">${project.name} (${project.location || 'N/A'})</label>
                `;
                assignProjectsCheckboxGroup.appendChild(checkboxItem);
            });
        } else {
            assignProjectsCheckboxGroup.innerHTML = '<p>لا توجد مشاريع متاحة لتعيينها.</p>';
        }
    } catch (error) {
        console.error("Failed to fetch projects for Add User modal:", error);
        assignProjectsCheckboxGroup.innerHTML = `<p style="color:red;">فشل تحميل قائمة المشاريع. (${error.message})</p>`;
    }
}

function closeAddUserModal() {
    if (addUserModal) addUserModal.style.display = 'none';
}

async function handleAddUserFormSubmit(event) {
    event.preventDefault();
    if (!addUserForm) return;

    const submitButton = addUserForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'جاري الإضافة...';
    }

    const selectedProjectIds = [];
    addUserForm.querySelectorAll('input[name="projectIds"]:checked').forEach(checkbox => {
        selectedProjectIds.push(parseInt(checkbox.value));
    });

    const newUserData = {
        fullName: addFullNameInput.value,
        email: addEmailInput.value,
        password: addPasswordInput.value,
        role: addRoleInput.value, // This should be the string value like "CONTRACTOR"
        companyName: addCompanyNameInput.value,
        projectIds: selectedProjectIds // Backend expects an array of integers
    };

    if (!newUserData.fullName || !newUserData.email || !newUserData.password || !newUserData.role || !newUserData.companyName) {
        alert("يرجى ملء جميع الحقول الأساسية للمستخدم.");
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'إضافة المستخدم'; }
        return;
    }
    if (newUserData.password.length < 8) {
        alert("يجب أن تكون كلمة المرور 8 أحرف على الأقل.");
        if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'إضافة المستخدم'; }
        return;
    }

    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        const response = await api.post('/auth/register', newUserData); // POST to /api/auth/register
        alert(response.data.message || 'تم إضافة المستخدم بنجاح!');
        closeAddUserModal();
        fetchAndRenderUsers();
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل إضافة المستخدم.';
        alert(`خطأ: ${message}`);
        console.error("Add User error:", error);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'إضافة المستخدم';
        }
    }
}
// --- End Add User Modal Functions ---


// --- Event Listener Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for admin-users.js");
    // Admin Auth Check
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

    // Event Listeners for Modals
    if (addNewUserBtn) addNewUserBtn.addEventListener('click', openAddUserModal);
    else console.warn("#addNewUserBtn not found.");

    if (addUserForm) addUserForm.addEventListener('submit', handleAddUserFormSubmit);
    else console.warn("#addUserForm not found.");

    if (confirmDeleteUserBtn) confirmDeleteUserBtn.addEventListener('click', confirmUserDeletion);
    else console.warn("#confirmDeleteUserBtn not found.");

    if (updateUserForm) updateUserForm.addEventListener('submit', handleUpdateUserFormSubmit);
    else console.warn("#updateUserForm not found.");

    // Close modals on outside click
    window.addEventListener('click', (event) => {
        if (event.target === deleteUserModal) closeDeleteModal();
        if (event.target === updateUserModal) closeUpdateModal();
        if (event.target === addUserModal) closeAddUserModal();
    });

    // Make functions global for inline onclicks in renderUsers
    window.openUpdateUserModal = openUpdateUserModal;
    window.openDeleteModal = openDeleteModal;
    window.closeDeleteModal = closeDeleteModal; // For 'X' buttons
    window.closeUpdateModal = closeUpdateModal; // For 'X' buttons
    window.closeAddUserModal = closeAddUserModal; // For 'X' buttons

    fetchAndRenderUsers(); // Initial fetch
});
