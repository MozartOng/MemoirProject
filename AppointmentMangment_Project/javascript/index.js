function updateFields() {
    const role = document.getElementById('role')?.value;
    const visitReason = document.getElementById('visitReason')?.value;
    const fileUpload = document.getElementById('fileUpload');
    const workshopReason = document.getElementById('workshopReason');
    const workshopDetail = document.getElementById('workshopDetail');
    const workshopFiles = document.getElementById('workshopFiles');

    const reexecutionFiles = document.getElementById('reexecutionFiles');
    const concreteTestingFiles = document.getElementById('concreteTestingFiles');
    const concreteWorksFiles = document.getElementById('concreteWorksFiles');
    const soilFiles = document.getElementById('soilFiles');
    const notSpecifiedFiles = document.getElementById('notSpecifiedFiles');

    if (fileUpload) fileUpload.style.display = 'none';
    if (workshopReason) workshopReason.style.display = 'none';
    if (workshopFiles) workshopFiles.style.display = 'none';
    if (reexecutionFiles) reexecutionFiles.style.display = 'none';
    if (concreteTestingFiles) concreteTestingFiles.style.display = 'none';
    if (concreteWorksFiles) concreteWorksFiles.style.display = 'none';
    if (soilFiles) soilFiles.style.display = 'none';
    if (notSpecifiedFiles) notSpecifiedFiles.style.display = 'none';

    if (role === 'contractor' && visitReason === 'workshop') {
        if (workshopReason) workshopReason.style.display = 'block';
        if (workshopDetail.value !== 'none' && workshopFiles) {
            workshopFiles.style.display = 'block';
            if (workshopDetail.value === 'reexecution' && reexecutionFiles) reexecutionFiles.style.display = 'block';
            else if (workshopDetail.value === 'concreteTesting' && concreteTestingFiles) concreteTestingFiles.style.display = 'block';
            else if (workshopDetail.value === 'concreteWorks' && concreteWorksFiles) concreteWorksFiles.style.display = 'block';
            else if (workshopDetail.value === 'soil' && soilFiles) soilFiles.style.display = 'block';
            else if (workshopDetail.value === 'notSpecified' && notSpecifiedFiles) notSpecifiedFiles.style.display = 'block';
        }
    } 
    else if (visitReason === 'other' || visitReason === 'file' || visitReason === 'workshop') {
        if (fileUpload) fileUpload.style.display = 'block';
    }
}

function filterAppointments() {
    const statusFilter = document.getElementById('statusFilter')?.value;
    const appointmentCards = document.querySelectorAll('.appointment-card');

    if (!statusFilter) return; // Skip if not on status page

    appointmentCards.forEach(card => {
        const cardStatus = card.getAttribute('data-status');
        if (statusFilter === 'all' || cardStatus === statusFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Tab Switching for Login/Registration
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

// Handle Registration (Frontend Simulation)
function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('registerEmail').value;
    const role = document.getElementById('role').value;
    const companyName = document.getElementById('companyName').value;
    const password = document.getElementById('registerPassword').value;

    // Basic validation (already handled by HTML 'required' and 'minlength')
    if (!fullName || !email || !role || !companyName || !password) {
        alert('يرجى ملء جميع الحقول المطلوبة!');
        return;
    }

    // Simulate storing user data (in a real app, this would go to a backend)
    console.log('Registered User:', { fullName, email, role, companyName, password });

    alert('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.');
    openTab('login'); // Switch to login tab
}

// Handle Login (Frontend Simulation)
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Basic validation
    if (!email || !password) {
        alert('يرجى إدخال البريد الإلكتروني وكلمة المرور!');
        return;
    }

    // Simulate login (in a real app, this would validate against a backend)
    console.log('Login Attempt:', { email, password });

    alert('تم تسجيل الدخول بنجاح!'); // Simulate successful login
    window.location.href = 'index.html'; // Redirect to booking page
}

// Initialize filter on status page
window.onload = function() {
    if (document.getElementById('statusFilter')) {
        filterAppointments();
    }
};