// frontend/javascript/index.js

// --- Helper function to display errors ---
function displayError(formId, message) {
    console.error(`Error in form ${formId}: ${message}`);
    alert(`خطأ: ${message}`);
}

// --- Helper function to manage loading state ---
function setLoading(formId, isLoading) {
    const button = document.querySelector(`#${formId} button[type="submit"]`);
    if (button) {
        console.log(`Setting loading state for ${formId}: ${isLoading}`);
        button.disabled = isLoading;
        button.textContent = isLoading ? 'جاري المعالجة...' : 'تأكيد الحجز';
    } else {
        console.warn(`Could not find submit button for form ${formId}`);
    }
}

// --- Helper function to get user data from localStorage ---
function getUserData() {
    const userDataString = localStorage.getItem('userData');
    try {
        const data = userDataString ? JSON.parse(userDataString) : null;
        return data;
    } catch (e) {
        console.error("Error parsing user data from localStorage:", e);
        return null;
    }
}

// --- Global DOM Element References ---
const projectSelectElement = document.getElementById('projectSelect');
const selectedProjectLocationElement = document.getElementById('selectedProjectLocation');
const visitReasonSelectElement = document.getElementById('visitReason');
const workshopDetailSelectElement = document.getElementById('workshopDetail');
// References for file upload sections
const fileUploadElement = document.getElementById('fileUpload');
const workshopReasonElement = document.getElementById('workshopReason');
const workshopFilesElement = document.getElementById('workshopFiles');
const reexecutionFilesElement = document.getElementById('reexecutionFiles');
const concreteTestingFilesElement = document.getElementById('concreteTestingFiles');
const concreteWorksFilesElement = document.getElementById('concreteWorksFiles');
const soilFilesElement = document.getElementById('soilFiles');
const notSpecifiedFilesElement = document.getElementById('notSpecifiedFiles');

let userAssignedProjects = []; // To store fetched projects for easy lookup

// --- Function to update form fields based on selections and user role ---
function updateFields() {
    console.log("updateFields called");
    const userData = getUserData();
    const userRole = userData ? userData.role : null;
    console.log("User role for updateFields:", userRole);

    const visitReason = visitReasonSelectElement?.value;
    const workshopDetail = workshopDetailSelectElement?.value;

    // Reset visibility
    if (fileUploadElement) fileUploadElement.style.display = 'none';
    if (workshopReasonElement) workshopReasonElement.style.display = 'none';
    if (workshopFilesElement) workshopFilesElement.style.display = 'none';
    if (reexecutionFilesElement) reexecutionFilesElement.style.display = 'none';
    if (concreteTestingFilesElement) concreteTestingFilesElement.style.display = 'none';
    if (concreteWorksFilesElement) concreteWorksFilesElement.style.display = 'none';
    if (soilFilesElement) soilFilesElement.style.display = 'none';
    if (notSpecifiedFilesElement) notSpecifiedFilesElement.style.display = 'none';

    // Apply visibility logic
    if (userRole === 'CONTRACTOR' && visitReason === 'WORKSHOP') { // Note: Backend sends uppercase enum values
        console.log("Condition: Contractor and Workshop visit");
        if (workshopReasonElement) workshopReasonElement.style.display = 'block';
        if (workshopDetail && workshopDetail !== '' && workshopFilesElement) { // Check against empty string for default
            console.log("Workshop detail selected:", workshopDetail);
            workshopFilesElement.style.display = 'block';
            if (workshopDetail === 'REEXECUTION' && reexecutionFilesElement) reexecutionFilesElement.style.display = 'block';
            else if (workshopDetail === 'CONCRETE_TESTING' && concreteTestingFilesElement) concreteTestingFilesElement.style.display = 'block';
            else if (workshopDetail === 'CONCRETE_WORKS' && concreteWorksFilesElement) concreteWorksFilesElement.style.display = 'block';
            else if (workshopDetail === 'SOIL' && soilFilesElement) soilFilesElement.style.display = 'block';
            else if (workshopDetail === 'NOT_SPECIFIED' && notSpecifiedFilesElement) notSpecifiedFilesElement.style.display = 'block';
        }
    } else if (visitReason === 'OTHER' || visitReason === 'FILE' || (visitReason === 'WORKSHOP' && userRole !== 'CONTRACTOR')) {
        console.log("Condition: General file upload needed");
        if (fileUploadElement) fileUploadElement.style.display = 'block';
    } else {
        console.log("Condition: No specific file section needs to be shown based on visit reason.");
    }
    console.log("updateFields finished");
}

// --- Function to fetch and populate assigned projects ---
async function fetchAndPopulateAssignedProjects() {
    if (!projectSelectElement) {
        console.error("Project select element not found.");
        return;
    }
    projectSelectElement.innerHTML = '<option value="">جاري تحميل المشاريع...</option>';
    projectSelectElement.disabled = true;
    if(selectedProjectLocationElement) selectedProjectLocationElement.textContent = '';


    try {
        if (typeof api === 'undefined') throw new Error("API config missing.");
        // API call to get projects assigned to the current user
        const response = await api.get('/users/me/projects');
        userAssignedProjects = response.data || []; // Store for later use

        projectSelectElement.innerHTML = ''; // Clear loading message
        if (userAssignedProjects.length > 0) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "اختر المشروع...";
            defaultOption.disabled = true; // Make it non-selectable after first choice
            defaultOption.selected = true;
            projectSelectElement.appendChild(defaultOption);

            userAssignedProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                // Store location and status in data attributes for easy access
                option.dataset.location = project.location || 'غير محدد';
                option.dataset.status = project.status || 'غير محدد';
                projectSelectElement.appendChild(option);
            });
            projectSelectElement.disabled = false;
        } else {
            projectSelectElement.innerHTML = '<option value="">لا توجد مشاريع معينة لك</option>';
            projectSelectElement.disabled = true; // Disable if no projects
        }
    } catch (error) {
        console.error("Failed to fetch assigned projects:", error);
        projectSelectElement.innerHTML = '<option value="">فشل تحميل المشاريع</option>';
        displayError('appointmentForm', error.response?.data?.message || error.message || 'فشل تحميل قائمة المشاريع.');
    }
}

// --- Function to handle appointment form submission ---
async function handleAppointmentSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formId = form.id;
    setLoading(formId, true);

    const formData = new FormData(form); // This will now include 'projectId' from the select

    // Log FormData for debugging
    console.log("--- FormData Content (Booking) ---");
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) { console.log(`${key}: File - ${value.name}`); }
        else { console.log(`${key}: ${value}`); }
    }
    console.log("---------------------------------");

    // --- Basic Frontend Validation ---
    const projectId = formData.get('projectId');
    const visitReasonValue = formData.get('visitReason');
    const visitDesc = formData.get('visitDesc');
    const dateValue = formData.get('date'); // dd/mm/yyyy from flatpickr
    const timeValue = formData.get('time');

    if (!projectId || !visitReasonValue || visitReasonValue === '' || !visitDesc || !dateValue || !timeValue) {
        displayError(formId, 'يرجى اختيار مشروع وملء جميع حقول الحجز الأساسية وسبب الزيارة.');
        setLoading(formId, false);
        console.log("Basic frontend validation failed (missing project or other core fields).");
        return;
    }
    // --- End Basic Validation ---

    // --- Specific Validation for Contractor/Workshop ---
    const userData = getUserData();
    const userRole = userData ? userData.role : null;
    const workshopDetailValue = formData.get('workshopDetail');

    if (userRole === 'CONTRACTOR' && visitReasonValue === 'WORKSHOP') {
        if (!workshopDetailValue || workshopDetailValue === '') { // Check against empty string
            displayError(formId, 'يرجى اختيار سبب زيارة الورشة المحدد من القائمة الثانية.');
            setLoading(formId, false);
            console.log("Frontend validation failed: Missing workshop detail for contractor.");
            return;
        }
    }
    // --- End Specific Validation ---

    console.log("Frontend validation passed. Attempting API call...");

    try {
        if (typeof api === 'undefined') throw new Error("API configuration is missing.");
        // Backend expects 'projectId' and 'date' in dd/mm/yyyy
        const response = await api.post('/appointments', formData);

        console.log('Appointment Creation Success:', response.data);
        alert('تم تسجيل الحجز بنجاح!');
        form.reset();
        if (projectSelectElement) { // Reset project dropdown to default
            projectSelectElement.selectedIndex = 0;
        }
        if(selectedProjectLocationElement) selectedProjectLocationElement.textContent = ''; // Clear location display
        const fpInstance = document.querySelector("#date")?._flatpickr;
        if (fpInstance) fpInstance.clear();
        updateFields(); // Update visibility of conditional fields

    } catch (error) {
        console.error("Full submit error object:", error);
        const message = error.response?.data?.message || error.message || 'فشل تسجيل الحجز.';
        displayError(formId, message);
    } finally {
        console.log("Submit handler finished.");
        setLoading(formId, false);
    }
}

// --- Event listener for when the HTML document is fully loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for index.js");

    // --- Authentication Check ---
    const token = localStorage.getItem('authToken');
    const userData = getUserData();
    if (!token || !userData) {
        console.log("Auth token or user data missing. Redirecting to login.");
        alert('Please log in to book an appointment.');
        localStorage.removeItem('authToken'); localStorage.removeItem('userData');
        window.location.href = 'login.html';
        return;
    }
    console.log("User authenticated. Proceeding with page setup.");

    // --- Initialize Flatpickr ---
    const dateInput = document.getElementById('date');
    if (dateInput && typeof flatpickr !== 'undefined' && dateInput.type === 'text') {
        console.log("Initializing flatpickr for date input #date");
        flatpickr(dateInput, {
            altInput: true, altFormat: "d/m/Y", dateFormat: "d/m/Y",
            locale: "ar", allowInput: true, minDate: "today",
        });
    } else { console.error("Date input #date not found or not text, or flatpickr not loaded."); }

    // --- Fetch and Populate Projects ---
    fetchAndPopulateAssignedProjects();

    // --- Attach Event Listeners ---
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    } else { console.error("Appointment form (#appointmentForm) not found."); }

    if (visitReasonSelectElement) {
        visitReasonSelectElement.addEventListener('change', updateFields);
    }
    if (workshopDetailSelectElement) {
        workshopDetailSelectElement.addEventListener('change', updateFields);
    }
    if (projectSelectElement) {
        projectSelectElement.addEventListener('change', () => {
            if (selectedProjectLocationElement) {
                const selectedOption = projectSelectElement.options[projectSelectElement.selectedIndex];
                selectedProjectLocationElement.textContent = selectedOption.dataset.location ? `الموقع: ${selectedOption.dataset.location}` : '';
            }
        });
    }

    // Initial call to set correct field visibility
    updateFields();
});
