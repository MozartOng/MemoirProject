// frontend/javascript/login.js

// --- Helper Functions (Keep if used, or define them if not in api.js) ---
function displayError(formId, message) {
    console.error(`Error in form ${formId}: ${message}`);
    alert(`خطأ: ${message}`); // Replace with better UI feedback if desired
}

function setLoading(formId, isLoading) {
    const button = document.querySelector(`#${formId} button[type="submit"]`);
    if (button) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'جاري المعالجة...' : 'تسجيل الدخول';
    }
}
// --- End Helper Functions ---

// REMOVED: openTab function, as registration tab is gone.
// If you completely removed the .tabs div from HTML, this is not needed.
// function openTab(tabName) { ... }

// REMOVED: handleRegister function
// async function handleRegister(event) { ... }

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formId = form.id; // 'loginForm'
    setLoading(formId, true);

    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
    };

    if (!credentials.email || !credentials.password) {
        displayError(formId, 'يرجى إدخال البريد الإلكتروني وكلمة المرور!');
        setLoading(formId, false);
        return;
    }

    try {
        if (typeof api === 'undefined') {
            throw new Error("API configuration is missing. Ensure api.js is loaded.");
        }
        const response = await api.post('/auth/login', credentials);
        console.log('Login Success:', response.data);

        if (response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
        } else {
            throw new Error('Token or user data missing in login response.');
        }

        alert('تم تسجيل الدخول بنجاح!');
        const userRole = response.data.user.role; // Role from backend (e.g., ADMIN, CONTRACTOR)
        if (userRole === 'ADMIN') {
             window.location.href = 'admin-dashboard.html'; // Adjust path if needed
        } else {
             window.location.href = 'index.html'; // Adjust path for non-admin users
        }

    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.';
        displayError(formId, message);
        console.error("Login error:", error);
    } finally {
        setLoading(formId, false);
    }
}

// Attach submit handler to the login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error("Login form (#loginForm) not found!");
    }

    // If you completely removed the .tabs div and the openTab function:
    // Ensure the login form section is visible by default (e.g., style="display: block;")
    // No need to call openTab('login');
});
