// In javascript/admin-login.js

// --- START: Added Helper Functions ---
function displayError(formId, message) {
    console.error(`Error in form ${formId}: ${message}`);
    // You can enhance this later to show the message near the form
    alert(`خطأ: ${message}`);
}

function setLoading(formId, isLoading) {
    // Find the submit button within the specified form
    const button = document.querySelector(`#${formId} button[type="submit"]`);
    if (button) {
        button.disabled = isLoading;
        // Update button text to indicate loading state
        button.textContent = isLoading ? 'جاري المعالجة...' : 'تسجيل الدخول';
    } else {
        // Log a warning if the button isn't found (helps debug HTML)
        console.warn(`Could not find submit button for form #${formId}`);
    }
}
// --- END: Added Helper Functions ---


// --- Existing Admin Login Logic ---
async function handleAdminLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formId = form.id; // Should be 'adminLoginForm'
    setLoading(formId, true); // Show loading (Now defined)

    const credentials = {
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value,
    };

    if (!credentials.email || !credentials.password) {
        // Use the defined displayError function
        displayError(formId,'Please enter email and password.');
        setLoading(formId, false); // Stop loading (Now defined)
        return;
    }

    try {
        console.log("Attempting admin login...");
        // Check if api object exists (from api.js)
        if (typeof api === 'undefined') {
            throw new Error("API configuration is missing. Ensure api.js is loaded first.");
        }

        const response = await api.post('/auth/admin/login', credentials);

        console.log('Admin Login Success:', response.data);

        if (response.data.token && response.data.user && response.data.user.role === 'ADMIN') {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
            alert('Admin login successful!');
            window.location.href = 'admin-dashboard.html'; // Redirect
        } else {
             throw new Error('Login failed or user is not an admin.');
        }
    } catch (error) {
        const message = error.response?.data?.message || error.message || 'Login failed.';
        displayError(formId, message); // Use defined displayError
        console.error("Admin login error:", error);
    } finally {
        setLoading(formId, false); // Stop loading (Now defined)
    }
}

// Attach the handler to the form
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    } else {
        console.error("Admin login form (#adminLoginForm) not found!");
    }
});