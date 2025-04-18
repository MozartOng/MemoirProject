// javascript/login.js
function openTab(tabName) {
  const tabs = document.getElementsByClassName('tab-content');
  const buttons = document.getElementsByClassName('tab-button');

  for (let i = 0; i < tabs.length; i++) {
    tabs[i].style.display = 'none';
    buttons[i].classList.remove('active');
  }

  document.getElementById(tabName).style.display = 'block';
  document.querySelector(`button[onclick="openTab('${tabName}')"]`).classList.add('active');
}

async function handleLogin(event) {
  console.log('handleLogin called');
  event.preventDefault();
  console.log('Default form submission prevented for login');

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    console.log('Sending login request to http://localhost:3000/api/auth/login from http://127.0.0.1:5500');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login response received:', response);
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error response data:', errorData);
      throw new Error(errorData.error || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Login response data:', data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', email);

    console.log('Fetching user profile to get role from http://localhost:3000/api/users/profile');
    const profileResponse = await fetch('http://localhost:3000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    console.log('Profile response received:', profileResponse);
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.log('Profile error response data:', errorData);
      throw new Error(errorData.error || `Failed to fetch profile: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    console.log('Profile data:', profile);
    localStorage.setItem('role', profile.role);

    alert('تم تسجيل الدخول بنجاح!');
    console.log('Delaying navigation for login...');
    setTimeout(() => {
      console.log('Navigating based on role:', profile.role);
      if (profile.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 500); // Delay navigation by 500ms
  } catch (error) {
    console.error('Login error caught:', error.message, error.stack);
    alert('خطأ في تسجيل الدخول: ' + error.message);
  }
}

async function handleRegister(event) {
  console.log('handleRegister called');
  event.preventDefault();
  console.log('Default form submission prevented for register');

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('registerEmail').value;
  const role = document.getElementById('role').value;
  const companyName = document.getElementById('companyName').value;
  const password = document.getElementById('registerPassword').value;

  if (!role) {
    alert('يرجى اختيار الدور!');
    return;
  }

  try {
    console.log('Sending register request to http://localhost:3000/api/auth/register from http://127.0.0.1:5500');
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

    console.log('Fetch response received:', response);
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Error response data:', errorData);
      throw new Error(errorData.error || `Registration failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Register response data:', data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', email);

    console.log('Fetching user profile to get role from http://localhost:3000/api/users/profile');
    const profileResponse = await fetch('http://localhost:3000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${data.token}`,
      },
    });

    console.log('Profile response received:', profileResponse);
    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.log('Profile error response data:', errorData);
      throw new Error(errorData.error || `Failed to fetch profile: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    console.log('Profile data:', profile);
    localStorage.setItem('role', profile.role);

    alert('تم إنشاء الحساب بنجاح!');
    console.log('Delaying navigation for register...');
    setTimeout(() => {
      console.log('Navigating based on role:', profile.role);
      if (profile.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'index.html';
      }
    }, 500); // Delay navigation by 500ms
  } catch (error) {
    console.error('Registration error caught:', error.message, error.stack); // Enhanced logging
    alert('خطأ في إنشاء الحساب: ' + error.message);
  }
}

// Attach event listeners to forms
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});