// javascript/logout.js
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    alert('تم تسجيل الخروج بنجاح!');
    window.location.href = 'login.html';
  }