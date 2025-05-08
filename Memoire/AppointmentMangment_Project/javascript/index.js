// frontend/javascript/index.js

// --- Helper function to display errors ---
function displayError(formId, message) {
    console.error(`Error in form ${formId}: ${message}`); // Log error for debugging
    // You can enhance this to show the message near the form instead of an alert
    alert(`خطأ: ${message}`);
}

// --- Helper function to manage loading state ---
function setLoading(formId, isLoading) {
    // Attempt to find the submit button within the specified form
    const button = document.querySelector(`#${formId} button[type="submit"]`);
    if (button) {
        console.log(`Setting loading state for ${formId}: ${isLoading}`);
        button.disabled = isLoading;
        // Change button text based on loading state
        button.textContent = isLoading ? 'جاري المعالجة...' : 'تأكيد الحجز';
    } else {
        // Log a warning if the button isn't found, helps in debugging HTML/JS mismatch
        console.warn(`Could not find submit button for form ${formId}`);
    }
}

// --- Helper function to get user data from localStorage ---
function getUserData() {
    const userDataString = localStorage.getItem('userData');
    try {
        // Parse the JSON string, return null if it's empty or invalid
        const data = userDataString ? JSON.parse(userDataString) : null;
        return data;
    } catch (e) {
        // Log error if JSON parsing fails
        console.error("Error parsing user data from localStorage:", e);
        return null; // Return null on error
    }
}

// --- Function to update form fields based on selections and user role ---
function updateFields() {
    console.log("updateFields called"); // Log when the function starts

    // Get user data and role
    const userData = getUserData();
    // Roles are expected to be uppercase (e.g., 'CONTRACTOR') as stored from backend
    const userRole = userData ? userData.role : null;
    console.log("User role for updateFields:", userRole); // Log the determined user role

    // Get current values from relevant form elements
    const visitReason = document.getElementById('visitReason')?.value;
    const fileUpload = document.getElementById('fileUpload');
    const workshopReason = document.getElementById('workshopReason');
    const workshopDetail = document.getElementById('workshopDetail')?.value;
    const workshopFiles = document.getElementById('workshopFiles');

    // Get references to specific file upload sections for contractors
    const reexecutionFiles = document.getElementById('reexecutionFiles');
    const concreteTestingFiles = document.getElementById('concreteTestingFiles');
    const concreteWorksFiles = document.getElementById('concreteWorksFiles');
    const soilFiles = document.getElementById('soilFiles');
    const notSpecifiedFiles = document.getElementById('notSpecifiedFiles');

    // --- Reset visibility of all conditional sections ---
    if (fileUpload) fileUpload.style.display = 'none';
    if (workshopReason) workshopReason.style.display = 'none';
    if (workshopFiles) workshopFiles.style.display = 'none';
    if (reexecutionFiles) reexecutionFiles.style.display = 'none';
    if (concreteTestingFiles) concreteTestingFiles.style.display = 'none';
    if (concreteWorksFiles) concreteWorksFiles.style.display = 'none';
    if (soilFiles) soilFiles.style.display = 'none';
    if (notSpecifiedFiles) notSpecifiedFiles.style.display = 'none';

    // --- Apply visibility logic based on user role and selections ---

    // Scenario 1: User is a Contractor AND Visit Reason is Workshop
    if (userRole === 'CONTRACTOR' && visitReason === 'workshop') {
        console.log("Condition: Contractor and Workshop visit");
        if (workshopReason) workshopReason.style.display = 'block'; // Show specific reason dropdown
        if (workshopDetail && workshopDetail !== 'none' && workshopFiles) {
            console.log("Workshop detail selected:", workshopDetail);
            workshopFiles.style.display = 'block'; // Show file container
            // Show the relevant specific file input group
            if (workshopDetail === 'reexecution' && reexecutionFiles) reexecutionFiles.style.display = 'block';
            else if (workshopDetail === 'concreteTesting' && concreteTestingFiles) concreteTestingFiles.style.display = 'block';
            else if (workshopDetail === 'concreteWorks' && concreteWorksFiles) concreteWorksFiles.style.display = 'block';
            else if (workshopDetail === 'soil' && soilFiles) soilFiles.style.display = 'block';
            else if (workshopDetail === 'notSpecified' && notSpecifiedFiles) notSpecifiedFiles.style.display = 'block';
        }
    }
    // Scenario 2: Visit Reason requires general file upload
    else if (visitReason === 'other' || visitReason === 'file' || (visitReason === 'workshop' && userRole !== 'CONTRACTOR')) {
         console.log("Condition: General file upload needed");
        if (fileUpload) fileUpload.style.display = 'block'; // Show general file input
    } else {
        console.log("Condition: No specific file section needs to be shown yet.");
    }

    console.log("updateFields finished"); // Log when the function completes
}


// --- Function to handle the appointment form submission ---
async function handleAppointmentSubmit(event) {
    console.log("handleAppointmentSubmit triggered");
    event.preventDefault(); // Prevent default page reload

    const form = event.target;
    const formId = form.id; // 'appointmentForm'
    setLoading(formId, true); // Show loading indicator

    // Create FormData object from the form - includes files and input values
    const formData = new FormData(form);

    // Log FormData content for debugging
    console.log("--- FormData Content ---");
    let fileCount = 0;
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`${key}: File - ${value.name} (Size: ${value.size}, Type: ${value.type})`);
            if (key === 'files') { fileCount++; }
        } else {
            console.log(`${key}: ${value}`); // Log regular field values
        }
    }
    console.log(`Total files found under 'files' key in FormData: ${fileCount}`);
    console.log("------------------------");


    // --- Basic Frontend Validation (Check essential fields first) ---
    const projectName = formData.get('projectName');
    const projectLocation = formData.get('projectLocation');
    const visitReasonValue = formData.get('visitReason'); // Get visit reason value
    const visitDesc = formData.get('visitDesc');
    const dateValue = formData.get('date'); // Get date value (should be dd/mm/yyyy from flatpickr)
    const timeValue = formData.get('time'); // Get time value

    if (!projectName || !projectLocation || !visitReasonValue || visitReasonValue === 'none' || !visitDesc || !dateValue || !timeValue) {
        displayError(formId, 'يرجى ملء جميع حقول تفاصيل المشروع والحجز الأساسية وسبب الزيارة.');
        setLoading(formId, false);
        console.log("Basic frontend validation failed.");
        return; // Stop if basic fields are missing
    }
    // --- End Basic Validation ---


    // --- Specific Validation for Contractor/Workshop (Perform this second) ---
    const userData = getUserData(); // Get logged-in user info
    const userRole = userData ? userData.role : null; // Extract role (e.g., 'CONTRACTOR')
    const workshopDetailValue = formData.get('workshopDetail'); // Get specific workshop detail value

    // --- DEBUGGING LOGS for Workshop Validation ---
    console.log("--- Workshop Validation Check ---");
    console.log("User Role from localStorage:", userRole, `(Is it 'CONTRACTOR'? ${userRole === 'CONTRACTOR'})`);
    console.log("Visit Reason from Form:", visitReasonValue, `(Is it 'workshop'? ${visitReasonValue === 'workshop'})`);
    console.log("Workshop Detail from Form:", workshopDetailValue);
    console.log("Combined Condition Check:", userRole === 'CONTRACTOR' && visitReasonValue === 'workshop');
    console.log("-------------------------------");
    // --- END DEBUGGING LOGS ---

    // Check only if the user is a contractor AND chose workshop visit reason
    if (userRole === 'CONTRACTOR' && visitReasonValue === 'workshop') {
        console.log("Contractor/Workshop condition MET. Checking detail..."); // Log if outer condition is true
        // Check if workshop detail is missing or set to the default "none" value
        if (!workshopDetailValue || workshopDetailValue === 'none') {
            displayError(formId, 'يرجى اختيار سبب زيارة الورشة المحدد من القائمة الثانية.'); // Show specific error
            setLoading(formId, false); // Turn off loading indicator
            console.log("Frontend validation failed: Missing workshop detail for contractor.");
            return; // Stop form submission
        } else {
             console.log("Workshop detail seems OK:", workshopDetailValue); // Log if detail is present
        }
    }
    // --- End Specific Validation ---


    // If all frontend validations passed:
    console.log("Frontend validation passed. Attempting API call...");

    try {
        // Ensure api object from api.js is available
        if (typeof api === 'undefined') {
             console.error("API object is not defined! Check if api.js is included correctly BEFORE index.js.");
             throw new Error("API configuration is missing.");
        }

        // --- Make the API call ---
        // Send the FormData; Axios handles the multipart/form-data header
        // Backend receives 'date' as 'dd/mm/yyyy' string because of flatpickr dateFormat
        const response = await api.post('/appointments', formData);

        console.log('Appointment Creation Success:', response.data);
        alert('تم تسجيل الحجز بنجاح!');
        form.reset(); // Reset form fields

        // Manually clear the flatpickr instance after form reset
        const fpInstance = document.querySelector("#date")?._flatpickr;
        if (fpInstance) {
            fpInstance.clear(); // Clears the selected date in flatpickr
        }

        updateFields(); // Update visibility of conditional fields

    } catch (error) {
        // Handle errors from the API call
        console.error("Full submit error object:", error);
        const message = error.response?.data?.message // Try to get message from backend response
                     || error.message                 // Otherwise use generic JS error message
                     || 'فشل تسجيل الحجز.';        // Default fallback message
        displayError(formId, message); // Show error to the user
    } finally {
        // This block executes whether the try block succeeded or failed
        console.log("Submit handler finished.");
        setLoading(formId, false); // Ensure loading indicator is turned off
    }
}


// --- Event listener for when the HTML document is fully loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for index.js"); // Log DOM ready state

    // --- Authentication Check ---
    const token = localStorage.getItem('authToken');
    const userData = getUserData(); // Get parsed user data from storage

    // Redirect to login if token or user data is missing
    if (!token || !userData) {
        console.log("Auth token or user data missing. Redirecting to login.");
        alert('Please log in to book an appointment.');
        localStorage.removeItem('authToken'); // Clear potentially invalid items
        localStorage.removeItem('userData');
        window.location.href = 'login.html'; // Perform redirection
        return; // Stop executing further script on this page
    }
    console.log("User authenticated. Proceeding with page setup."); // Log successful auth


    // --- Initialize Flatpickr ---
    const dateInput = document.getElementById('date');
    if (dateInput && typeof flatpickr !== 'undefined' && dateInput.type === 'text') {
        console.log("Initializing flatpickr for date input #date");
        flatpickr(dateInput, {
            // Configuration options:
            altInput: true,      // Show a user-friendly version
            altFormat: "d/m/Y",  // Visual format shown to user (dd/mm/yyyy)
            dateFormat: "d/m/Y", // ACTUAL VALUE format stored in the input (dd/mm/yyyy) - Sent to backend
            locale: "ar",        // Use Arabic locale (requires including ar.js locale file)
            allowInput: true,    // Allow manual typing (optional, validates on blur)
            minDate: "today",    // Prevent selecting past dates
        });
    } else if (dateInput && dateInput.type !== 'text') {
         console.error("Date input #date should be type='text' for flatpickr.");
    } else if (dateInput) {
         console.warn("Flatpickr library not loaded. Date input might not work as expected.");
    } else {
        console.error("Date input element with ID 'date' not found for flatpickr.");
    }
    // --- End Flatpickr Init ---


    // --- Attach Form Submit Listener ---
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        console.log("Appointment form found. Adding submit listener.");
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    } else {
        console.error("Could not find appointment form with ID 'appointmentForm'");
    }

    // --- Attach Change Listeners for Dynamic Field Visibility ---
    const visitReasonSelect = document.getElementById('visitReason');
    const workshopDetailSelect = document.getElementById('workshopDetail');

    if (visitReasonSelect) {
        console.log("Adding change listener to visitReasonSelect");
        visitReasonSelect.addEventListener('change', updateFields);
    }
    if (workshopDetailSelect) {
        console.log("Adding change listener to workshopDetailSelect");
        workshopDetailSelect.addEventListener('change', updateFields);
    }

    // --- Initial Page Setup ---
    // Call updateFields once on load to set the correct initial visibility
    console.log("Calling initial updateFields on page load.");
    updateFields();
});