// frontend/javascript/admin-users.js

// --- Helper Functions (for displaying messages in the user list area) ---
function displayUserListError(message) {
    const userListDiv = document.getElementById('userList');
    console.error(`Error displaying users: ${message}`);
    if (userListDiv) {
        userListDiv.innerHTML = `<p style="color: red;" class="error-message">خطأ: ${message}</p>`;
    } else {
        // Fallback if the main div isn't found (should not happen if HTML is correct)
        alert(`خطأ: ${message}`);
    }
}

function setUserListLoading(isLoading) {
    const userListDiv = document.getElementById('userList');
    if (userListDiv) {
        if (isLoading) {
            userListDiv.innerHTML = '<p class="loading-message">جاري تحميل المستخدمين...</p>';
        }
        // When loading is false, the content will be replaced by renderUsers() or displayUserListError()
    }
}
// --- End Helper Functions ---

// --- Global DOM Element References ---
const userListDiv = document.getElementById('userList');

// Delete Modal Elements
const deleteUserModal = document.getElementById('deleteUserModal');
const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
const deleteUserModalText = document.getElementById('deleteUserModalText');
let userIdToDelete = null; // Stores the ID of the user targeted for deletion

// Update Modal Elements (for future implementation)
const updateUserModal = document.getElementById('updateUserModal');
const updateUserForm = document.getElementById('updateUserForm');
const updateUserIdInput = document.getElementById('updateUserId');
const updateFullNameInput = document.getElementById('updateFullName');
const updateEmailInput = document.getElementById('updateEmail'); // Usually readonly or handled with care
const updateRoleInput = document.getElementById('updateRole');
const updateCompanyNameInput = document.getElementById('updateCompanyName');
// --- End Global DOM Element References ---


// --- Translation map for roles (to display Arabic names) ---
const roleTranslations = {
    CONTRACTOR: 'مقاول',
    ENGINEERING: 'مكتب الدراسات',
    OWNER: 'صاحب المشروع',
    LAB: 'مخبر',
    ADMIN: 'مدير النظام' // Note: Admins should be filtered out by the backend
};

// --- Function to Render User Cards into the HTML ---
function renderUsers(users) {
    if (!userListDiv) {
        console.error("User list container ('userList') not found in HTML.");
        return;
    }
    userListDiv.innerHTML = ''; // Clear previous list or loading/error message

    if (!users || users.length === 0) {
        userListDiv.innerHTML = '<p>لا يوجد مستخدمين لعرضهم.</p>';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card'; // Apply CSS class for styling
        card.setAttribute('data-user-id', user.id); // Store user ID for easy access

        // Get the Arabic translation for the role, or use the original role if not found
        const translatedRole = roleTranslations[user.role] || user.role;

        card.innerHTML = `
            <div class="user-details">
                <p><strong>الاسم الكامل:</strong> ${user.fullName || 'N/A'}</p>
                <p><strong>البريد الإلكتروني:</strong> ${user.email || 'N/A'}</p>
                <p><strong>الدور:</strong> ${translatedRole}</p>
                <p><strong>اسم الشركة:</strong> ${user.companyName || 'N/A'}</p>
                <p><strong>تاريخ التسجيل:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
            <div class="user-actions">
                <button class="update-btn" onclick="openUpdateUserModal(${user.id})">تحديث</button>
                <button class="delete-btn" onclick="openDeleteModal(${user.id}, '${user.fullName.replace(/'/g, "\\'")}')">حذف</button>
            </div>
        `;
        // Note: Escaped single quotes in userName for onclick handler: '${user.fullName.replace(/'/g, "\\'")}'
        userListDiv.appendChild(card);
    });
}

// --- Function to Fetch Users from the Backend ---
async function fetchAndRenderUsers() {
    console.log("Fetching users for admin view...");
    setUserListLoading(true); // Show loading message
    try {
        // Ensure the 'api' object (Axios instance from api.js) is available
        if (typeof api === 'undefined') {
            throw new Error("API configuration is missing. Ensure api.js is loaded before admin-users.js.");
        }
        // Make the API call. The admin auth token is added by the interceptor in api.js
        const response = await api.get('/users'); // Backend should filter out admins
        console.log("Users received:", response.data);
        renderUsers(response.data); // Display the fetched users

    } catch (error) {
        // Handle errors (network, server, unauthorized access from interceptor)
        const message = error.response?.data?.message || error.message || 'فشل تحميل قائمة المستخدمين.';
        displayUserListError(message); // Show error message in the user list area
        console.error("Fetch users error:", error);
    }
    // setUserListLoading(false); // Loading state is cleared by renderUsers or displayUserListError
}

// --- Delete Modal Functions ---
function openDeleteModal(id, name) {
    if (!deleteUserModal || !deleteUserModalText || !confirmDeleteUserBtn) {
        console.error("Delete modal elements are not found in the HTML.");
        alert("خطأ: لا يمكن فتح نافذة تأكيد الحذف.");
        return;
    }
    userIdToDelete = id; // Store the ID of the user to be deleted
    // Set personalized confirmation message
    deleteUserModalText.textContent = `هل أنت متأكد أنك تريد حذف المستخدم ${name} (ID: ${id})؟ لا يمكن التراجع عن هذا الإجراء.`;
    deleteUserModal.style.display = 'block'; // Show the modal
}

function closeDeleteModal() {
    if (deleteUserModal) {
        deleteUserModal.style.display = 'none'; // Hide the modal
    }
    userIdToDelete = null; // Reset the stored ID
}

// --- Handle Actual User Deletion After Confirmation ---
async function confirmUserDeletion() {
    if (!userIdToDelete) {
        console.warn("No user ID set for deletion.");
        return;
    }

    console.log(`Attempting to delete user ${userIdToDelete}...`);
    // Disable button and show loading text during API call
    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.disabled = true;
        confirmDeleteUserBtn.textContent = 'جاري الحذف...';
    }

    try {
        if (typeof api === 'undefined') throw new Error("API configuration is missing.");
        // Make the DELETE request to the backend
        const response = await api.delete(`/users/${userIdToDelete}`);
        console.log("Delete response:", response.data);
        alert(response.data.message || `تم حذف المستخدم بنجاح.`);
        closeDeleteModal(); // Close the modal
        fetchAndRenderUsers(); // Refresh the user list to reflect the deletion

    } catch (error) {
        const message = error.response?.data?.message || error.message || `فشل حذف المستخدم.`;
        alert(`خطأ: ${message}`);
        console.error(`Delete user ${userIdToDelete} error:`, error);
    } finally {
        // Re-enable button and reset text
        if (confirmDeleteUserBtn) {
            confirmDeleteUserBtn.disabled = false;
            confirmDeleteUserBtn.textContent = 'نعم، قم بالحذف';
        }
    }
}

// --- Update Modal Functions (Placeholders and Basic Setup) ---
function openUpdateUserModal(userId) {
    console.log(`Opening update modal for user ID: ${userId}`);
    if (!updateUserModal || !updateUserForm || !updateUserIdInput || !updateFullNameInput || !updateEmailInput || !updateRoleInput || !updateCompanyNameInput) {
        console.error("Update user modal or its form elements are not found in the HTML.");
        alert("خطأ: لا يمكن فتح نافذة تحديث بيانات المستخدم.");
        return;
    }

    // Show loading or fetch user details to populate the form
    alert(`خاصية تحديث المستخدم (ID: ${userId}) سيتم تنفيذها. الآن سنقوم بجلب بيانات المستخدم.`);

    setUserListLoading(true); // Or a specific loader for the modal

    api.get(`/users/${userId}`) // Assumes backend route GET /api/users/:id exists
        .then(response => {
            const user = response.data;
            if (user) {
                updateUserIdInput.value = user.id;
                updateFullNameInput.value = user.fullName || '';
                updateEmailInput.value = user.email || ''; // Email is often readonly
                updateRoleInput.value = user.role || '';   // Ensure options match Prisma Role enum
                updateCompanyNameInput.value = user.companyName || '';
                updateUserModal.style.display = 'block';
            } else {
                alert("لم يتم العثور على تفاصيل المستخدم.");
            }
        })
        .catch(error => {
            const message = error.response?.data?.message || error.message || "فشل جلب بيانات المستخدم للتحديث.";
            alert(`خطأ: ${message}`);
            console.error("Error fetching user for update:", error);
        })
        .finally(() => {
            setUserListLoading(false); // Or specific modal loader
        });
}

function closeUpdateModal() {
    if (updateUserModal) {
        updateUserModal.style.display = 'none'; // Hide the modal
    }
    if (updateUserForm) {
        updateUserForm.reset(); // Reset form fields when closing
    }
}

// Handle the submission of the update user form
async function handleUpdateUserFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    if (!updateUserForm || !updateUserIdInput.value) {
        console.error("Update form or user ID input is missing for submission.");
        return;
    }

    const userId = updateUserIdInput.value;
    const updatedData = {
        fullName: updateFullNameInput.value,
        email: updateEmailInput.value, // If email is editable, backend must handle uniqueness checks
        role: updateRoleInput.value,     // Ensure this value is one of your Prisma Role enum strings
        companyName: updateCompanyNameInput.value,
    };

    // Basic validation for required fields
    if (!updatedData.fullName || !updatedData.email || !updatedData.role || !updatedData.companyName) {
        alert("يرجى ملء جميع الحقول المطلوبة في نموذج التحديث.");
        return;
    }

    console.log(`Attempting to update user ${userId} with data:`, updatedData);
    const submitButton = updateUserForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'جاري الحفظ...';
    }

    try {
        if (typeof api === 'undefined') throw new Error("API configuration is missing.");
        // Make PATCH request to the backend
        const response = await api.patch(`/users/${userId}`, updatedData);
        console.log("Update response:", response.data);
        alert(response.data.message || "تم تحديث بيانات المستخدم بنجاح.");
        closeUpdateModal(); // Close the modal
        fetchAndRenderUsers(); // Refresh the user list

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


// --- Event Listener Setup (Runs when the page is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for admin-users.js");

    // --- Admin Authentication Check ---
    const userDataString = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    let isAdminUser = false;
    try {
        const userData = userDataString ? JSON.parse(userDataString) : null;
        // Ensure role is exactly 'ADMIN' (case-sensitive)
        if (token && userData && userData.role === 'ADMIN') {
            isAdminUser = true;
        }
    } catch (e) { console.error("Error parsing user data for auth check:", e); }

    if (!isAdminUser) {
        alert('Access Denied. Please log in as an administrator.');
        window.location.href = 'admin-login.html'; // Adjust path if needed
        return; // Stop further execution
    }
    console.log("Admin authenticated. Initializing user management page.");
    // --- End Admin Auth Check ---

    // --- Attach Event Listeners for Modals ---
    // Delete Modal
    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.addEventListener('click', confirmUserDeletion);
    } else {
        console.warn("#confirmDeleteUserBtn not found.");
    }

    // Update Modal
    if (updateUserForm) {
        updateUserForm.addEventListener('submit', handleUpdateUserFormSubmit);
    } else {
        console.warn("#updateUserForm not found.");
    }

    // Close modals if clicking outside their content area
    window.addEventListener('click', (event) => {
        if (event.target === deleteUserModal) {
            closeDeleteModal();
        }
        if (event.target === updateUserModal) {
            closeUpdateModal();
        }
    });
    // --- End Attach Event Listeners ---


    // --- Make action handlers globally accessible for inline onclick in renderUsers ---
    window.openUpdateUserModal = openUpdateUserModal;
    window.openDeleteModal = openDeleteModal;
    // closeModal functions are already global if needed for 'X' button, but better to use event listeners
    window.closeDeleteModal = closeDeleteModal; // For direct onclick on 'X'
    window.closeUpdateModal = closeUpdateModal; // For direct onclick on 'X'


    // --- Initial Fetch of Users ---
    fetchAndRenderUsers();
});
