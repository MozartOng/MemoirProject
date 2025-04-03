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

function handleRegister(event) {
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

    console.log('Registered User:', { fullName, email, role, companyName, password });

    alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
    openTab('login');
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور!');
        return;
    }

    console.log('Login Attempt:', { email, password });

    alert('تم تسجيل الدخول بنجاح!');
    window.location.href = 'index.html';
}