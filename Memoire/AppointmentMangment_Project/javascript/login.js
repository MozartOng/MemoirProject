// javascript/login.js

// Function to handle displaying errors (replace basic alert)
function displayError(formId, message) {
    // Simple alert for now, enhance this to show messages near the form
    console.error(`Error in form ${formId}: ${message}`);
    alert(`Error: ${message}`);
}

// Function to handle showing loading state (optional)
function setLoading(formId, isLoading) {
    const button = document.querySelector(`#${formId} button[type="submit"]`);
    if (button) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Processing...' : 'Submit'; // Adjust button text
    }
}

function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');

    tabs.forEach(tab => {
        tab.style.display = 'none';
    });

    buttons.forEach(button => {
        button.classList.remove('active');
    });

    
    // ... (keep existing code) ...
     document.getElementById(tabName).style.display = 'block';
     // Find the button associated with the tabName and add 'active' class
     document.querySelector(`.tab-button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formId = form.id; // 'registerForm'
    setLoading(formId, true);

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const role = document.getElementById('role').value;
    const companyName = document.getElementById('companyName').value;
    const password = document.getElementById('registerPassword').value;

    // Basic frontend validation
    if (!fullName || !email || !role || !companyName || !password || password.length < 8) {
        displayError(formId, 'يرجى ملء جميع الحقول المطلوبة! يجب أن تكون كلمة المرور 8 أحرف على الأقل.');
        setLoading(formId, false);
        return;
    }

    try {
        const response = await api.post('/auth/register', {
            fullName,
            email,
            role, // Send the selected value directly
            companyName,
            password,
        });

        console.log('Registration Success:', response.data);
        alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
        openTab('login'); // Switch to login tab
        form.reset(); // Clear the registration form

    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل إنشاء الحساب.';
        displayError(formId, message);
    } finally {
        setLoading(formId, false);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formId = form.id; // 'loginForm'
    setLoading(formId, true);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        displayError(formId, 'يرجى إدخال البريد الإلكتروني وكلمة المرور!');
        setLoading(formId, false);
        return;
    }

    try {
        const response = await api.post('/auth/login', { email, password });

        console.log('Login Success:', response.data);

        // Store token and user data
        if (response.data.token && response.data.user) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
        } else {
            throw new Error('Token or user data missing in login response.');
        }

        alert('تم تسجيل الدخول بنجاح!');

        // Redirect based on role
        const userRole = response.data.user.role;
        if (userRole === 'ADMIN') {
             window.location.href = 'admin-dashboard.html';
        } else {
             window.location.href = 'index.html'; // Redirect regular users to booking page
        }

    } catch (error) {
        const message = error.response?.data?.message || error.message || 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.';
        displayError(formId, message);
    } finally {
        setLoading(formId, false);
    }
}

// Attach submit handlers to forms after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Initialize the default tab (Login)
    openTab('login');
});