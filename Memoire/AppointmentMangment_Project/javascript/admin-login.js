function handleAdminLogin(event) {
    event.preventDefault();

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور!');
        return;
    }

    console.log('Admin Login Attempt:', { email, password });

    alert('تم تسجيل دخول الإدارة بنجاح!');
    window.location.href = 'admin-dashboard.html';
}