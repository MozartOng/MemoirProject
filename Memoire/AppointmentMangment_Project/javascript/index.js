// javascript/index.js

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
    // console.log('Raw userData from localStorage:', userDataString); // Uncomment for deep debugging if needed
    try {
        // Parse the JSON string, return null if it's empty or invalid
        const data = userDataString ? JSON.parse(userDataString) : null;
        // console.log('Parsed userData:', data); // Uncomment for deep debugging if needed
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
    // Hide general file upload
    if (fileUpload) fileUpload.style.display = 'none';
    // Hide contractor-specific workshop reason dropdown
    if (workshopReason) workshopReason.style.display = 'none';
    // Hide the container for contractor-specific file uploads
    if (workshopFiles) workshopFiles.style.display = 'none';
    // Hide individual contractor file upload sections
    if (reexecutionFiles) reexecutionFiles.style.display = 'none';
    if (concreteTestingFiles) concreteTestingFiles.style.display = 'none';
    if (concreteWorksFiles) concreteWorksFiles.style.display = 'none';
    if (soilFiles) soilFiles.style.display = 'none';
    if (notSpecifiedFiles) notSpecifiedFiles.style.display = 'none';

    // --- Apply visibility logic based on user role and selections ---

    // Scenario 1: User is a Contractor AND Visit Reason is Workshop
    if (userRole === 'CONTRACTOR' && visitReason === 'workshop') {
        console.log("Condition: Contractor and Workshop visit");
        // Show the dropdown for specific workshop reasons
        if (workshopReason) workshopReason.style.display = 'block';

        // If a specific workshop reason (other than 'none') is selected...
        if (workshopDetail && workshopDetail !== 'none' && workshopFiles) {
            console.log("Workshop detail selected:", workshopDetail);
            // Show the container for workshop-specific files
            workshopFiles.style.display = 'block';
            // Show the relevant file input group based on the selected workshop detail
            if (workshopDetail === 'reexecution' && reexecutionFiles) reexecutionFiles.style.display = 'block';
            else if (workshopDetail === 'concreteTesting' && concreteTestingFiles) concreteTestingFiles.style.display = 'block';
            else if (workshopDetail === 'concreteWorks' && concreteWorksFiles) concreteWorksFiles.style.display = 'block';
            else if (workshopDetail === 'soil' && soilFiles) soilFiles.style.display = 'block';
            else if (workshopDetail === 'notSpecified' && notSpecifiedFiles) notSpecifiedFiles.style.display = 'block';
        }
    }
    // Scenario 2: Visit Reason requires general file upload
    // This applies if the reason is 'other' or 'file' (any role),
    // OR if the reason is 'workshop' but the user is NOT a Contractor.
    else if (visitReason === 'other' || visitReason === 'file' || (visitReason === 'workshop' && userRole !== 'CONTRACTOR')) {
         console.log("Condition: General file upload needed");
        // Show the general file upload input
        if (fileUpload) fileUpload.style.display = 'block';
    } else {
        console.log("Condition: No specific file section needs to be shown yet.");
    }

    console.log("updateFields finished"); // Log when the function completes
}


// --- Function to handle the appointment form submission ---
async function handleAppointmentSubmit(event) {
    console.log("handleAppointmentSubmit triggered"); // Log that the handler started

    // Prevent the default browser form submission behavior
    event.preventDefault();

    const form = event.target; // Get the form element that triggered the event
    const formId = form.id; // Get the ID of the form ('appointmentForm')
    setLoading(formId, true); // Indicate processing has started

    // Create FormData object directly from the form element
    // This automatically includes all form fields and selected files
    const formData = new FormData(form);

    // Log FormData entries for debugging purposes
    console.log("--- FormData Content ---");
    let fileCount = 0; // Counter for files specifically under the 'files' key
    // Iterate through FormData entries
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            // Log details if the value is a File object
            console.log(`${key}: File - ${value.name} (Size: ${value.size}, Type: ${value.type})`);
            // Increment counter if the file's key is 'files' (for the multi-upload input)
            if (key === 'files') {
                fileCount++;
            }
        } else {
            // Log key-value pair for non-file fields
            console.log(`${key}: ${value}`);
        }
    }
    console.log(`Total files found under 'files' key in FormData: ${fileCount}`); // Log the count for multi-upload
    console.log("------------------------");


    // --- Basic Frontend Validation ---
    // Check if essential fields have values before proceeding
    if (!formData.get('projectName') || !formData.get('projectLocation') || !formData.get('visitReason') || formData.get('visitReason') === 'none' || !formData.get('visitDesc') || !formData.get('date') || !formData.get('time')) {
        displayError(formId, 'يرجى ملء جميع حقول تفاصيل المشروع والحجز الأساسية وسبب الزيارة.');
        setLoading(formId, false); // Stop loading indicator
        console.log("Frontend validation failed."); // Log validation failure
        return; // Stop the function execution
    }
    // Add more specific validation here if needed based on role/visit reason

    console.log("Frontend validation passed. Attempting API call..."); // Log before making the call

    try {
        // Check if the 'api' object (from api.js) is available
        if (typeof api === 'undefined') {
             console.error("API object is not defined! Check if api.js is included correctly BEFORE index.js.");
             // Throw an error to be caught by the catch block
             throw new Error("API configuration is missing.");
        }

        // Make the POST request to the backend endpoint using the configured Axios instance ('api')
        // Pass the FormData object directly; Axios will set the correct Content-Type header
        const response = await api.post('/appointments', formData);

        console.log('Appointment Creation Success:', response.data); // Log successful response data
        alert('تم تسجيل الحجز بنجاح!'); // Notify user of success
        form.reset(); // Clear the form fields
        updateFields(); // Update field visibility based on the reset form state

    } catch (error) {
        // Catch any errors during the API call or processing
        console.error("Full submit error object:", error); // Log the entire error object for details
        // Extract a user-friendly error message
        const message = error.response?.data?.message // Prefer backend message
                     || error.message                 // Fallback to generic error message
                     || 'فشل تسجيل الحجز.';        // Default message
        displayError(formId, message); // Show the error message to the user
    } finally {
        // This block runs regardless of success or failure
        console.log("Submit handler finished."); // Log completion
        setLoading(formId, false); // Ensure loading indicator is turned off
    }
}


// --- Event listener for when the HTML document is fully loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for index.js"); // Log that the DOM is ready

    // --- Authentication Check ---
    const token = localStorage.getItem('authToken');
    const userData = getUserData(); // Get parsed user data

    // If no token or no user data, redirect to login
    if (!token || !userData) {
        console.log("Auth token or user data missing. Redirecting to login.");
        alert('Please log in to book an appointment.');
        // Clear any potentially inconsistent stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = 'login.html'; // Redirect
        return; // Stop further script execution for this page
    }
    console.log("User authenticated. Proceeding with page setup."); // Log successful auth check

    //flatpicker
    const dateInput = document.getElementById('date');
    if (dateInput) {
        console.log("Initializing flatpickr for date input");
        flatpickr(dateInput, {
            // Configuration options for flatpickr:
            altInput: true,      // Creates a second input field that is visible to the user
            altFormat: "d/m/Y",  // How the date *LOOKS* to the user (e.g., 22/04/2025)
            dateFormat: "d/m/Y", // The ACTUAL VALUE format sent with the form - KEEP THIS AS Y-m-d to match your backend!
            locale: "ar",        // Use Arabic locale for month names, weekdays (requires the locale file)
            allowInput: true,    // Allow user to type date directly (optional)
            // minDate: "today", // Optional: prevent selecting past dates
        });
    } else {
        console.error("Date input element with ID 'date' not found for flatpickr.");
    }


    // --- Attach Form Submit Listener ---
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        console.log("Appointment form found. Adding submit listener.");
        // Add the event listener to call handleAppointmentSubmit when the form is submitted
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    } else {
        // Log an error if the form element isn't found in the HTML
        console.error("Could not find appointment form with ID 'appointmentForm'");
    }

    // --- Attach Change Listeners for Dynamic Fields ---
    // Get references to dropdowns that affect field visibility
    const visitReasonSelect = document.getElementById('visitReason');
    const workshopDetailSelect = document.getElementById('workshopDetail');

    // Add event listeners to call updateFields whenever their value changes
    if (visitReasonSelect) {
        console.log("Adding change listener to visitReasonSelect");
        visitReasonSelect.addEventListener('change', updateFields);
    }
    if (workshopDetailSelect) {
        console.log("Adding change listener to workshopDetailSelect");
        workshopDetailSelect.addEventListener('change', updateFields);
    }

    // --- Initial Page Setup ---
    // Call updateFields once on page load to set the initial state
    // based on default dropdown values and the logged-in user's role
    console.log("Calling initial updateFields on page load.");
    updateFields();
});