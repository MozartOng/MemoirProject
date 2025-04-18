// javascript/login.js
function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
  
    tabs.forEach(tab => {
      tab.style.display = 'none';
    });
  
    buttons.forEach(button => {
      button.classList.remove('active');
    });
  
    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
  }
  
  async function handleRegister(event) {
    event.preventDefault();
  
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const role = document.getElementById('role').value;
    const companyName = document.getElementById('companyName').value;
    const password = document.getElementById('registerPassword').value;
  
    if (!fullName || !email || !role || !companyName || !password) {
      alert('يرجى ملء جميع الحقول المطلوبة!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          role,
          company_name: companyName,
          password,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
        openTab('login');
      } else {
        if (data.error === 'Email already exists') {
          alert('البريد الإلكتروني مستخدم بالفعل! يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
        } else {
          alert(data.error || 'حدث خطأ أثناء التسجيل!');
        }
      }
    } catch (error) {
      alert('حدث خطأ أثناء التسجيل!');
      console.error(error);
    }
  }
  
  async function handleLogin(event) {
    event.preventDefault();
  
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
  
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token); // Store the JWT token
        localStorage.setItem('userEmail', email); // Store the email for later use
        alert('تم تسجيل الدخول بنجاح!');
        window.location.href = 'index.html'; // Redirect to the booking page
      } else {
        alert(data.error || 'حدث خطأ أثناء تسجيل الدخول!');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تسجيل الدخول!');
      console.error(error);
    }
  }
  
  // Handle admin login
  async function handleAdminLogin(event) {
    event.preventDefault();
  
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
  
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور!');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token); // Store the JWT token
        localStorage.setItem('userEmail', email); // Store the email for later use
        localStorage.setItem('isAdmin', 'true'); // Flag to indicate admin user
        alert('تم تسجيل الدخول كمسؤول بنجاح!');
        window.location.href = 'admin-appointments.html'; // Redirect to admin page
      } else {
        alert(data.error || 'حدث خطأ أثناء تسجيل الدخول كمسؤول!');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تسجيل الدخول كمسؤول!');
      console.error(error);
    }
  }
  
  // Attach event listeners
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('adminLoginForm')?.addEventListener('submit', handleAdminLogin);