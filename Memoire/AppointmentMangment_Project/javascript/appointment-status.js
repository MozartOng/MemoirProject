// frontend/javascript/appointment-status.js

// --- Optional: Helper function to display errors ---
function displayError(elementId, message) {
    console.error(`Error displaying appointments: ${message}`);
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
        // Display the error message inside the appointment list container
        targetElement.innerHTML = `<p style="color: red;" class="error-message">خطأ: ${message}</p>`;
    } else {
        // Fallback to alert if the container isn't found
        alert(`خطأ: ${message}`);
    }
}

// --- Optional: Helper function for loading state ---
function setLoading(elementId, isLoading) {
    const targetElement = document.getElementById(elementId);
    if (targetElement) {
        // Show a simple loading message
        if (isLoading) {
            targetElement.innerHTML = '<p class="loading-message">جاري التحميل...</p>';
        }
        // When loading is false, the content will be replaced by renderAppointments or displayError
    }
}

// --- Translation Maps ---
// Map backend VisitReason enum values to Arabic display text
const visitReasonTranslations = {
    OTHER: 'آخر',
    FILE: 'ملف',
    WORKSHOP: 'ورشة'
};

// Map backend WorkshopDetail enum values to Arabic display text
const workshopDetailTranslations = {
    REEXECUTION: 'معاينة الحفر',
    CONCRETE_TESTING: 'معاينة الأشغال',
    CONCRETE_WORKS: 'معاينة أشغال المساكة',
    SOIL: 'الاستلام المؤقت',
    NOT_SPECIFIED: 'الاستلام النهائي'
    // Add any other WorkshopDetail values used by your backend
};

// Map backend AppointmentStatus enum values to Arabic display text
const statusTranslations = {
    PENDING: 'قيد الانتظار',
    CONFIRMED: 'مؤكد',
    REJECTED: 'مرفوض',
    COMPLETED: 'مكتمل',
    POSTPONED: 'مؤجل'
};
// --- End Translation Maps ---


// Get references to HTML elements used in this script
const appointmentListDiv = document.getElementById('appointmentList');
const statusFilterSelect = document.getElementById('statusFilter');

// --- Function to render appointment cards into the HTML ---
function renderAppointments(appointments) {
    // Ensure the container element exists before proceeding
    if (!appointmentListDiv) {
        console.error("Appointment list container ('appointmentList') not found in HTML.");
        return;
    }
    // Clear previous list content (or loading/error message)
    appointmentListDiv.innerHTML = '';

    // Display a message if the fetched list is empty
    if (!appointments || appointments.length === 0) {
        appointmentListDiv.innerHTML = '<p>لا توجد حجوزات لعرضها.</p>';
        return;
    }

    // Loop through each appointment object received from the backend
    appointments.forEach(app => {
        // --- Date Formatting (Display as YYYY-MM-DD HH:MM) ---
        let formattedDateTime = 'N/A'; // Default text if date is missing or invalid
        if (app.proposedDateTime) {
            try {
                const d = new Date(app.proposedDateTime); // Create Date object from ISO string
                // Helper function to ensure two digits (adds leading zero if needed)
                const pad = (num) => num.toString().padStart(2, '0');
                // Construct the final string
                formattedDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch (e) {
                console.error("Error formatting date:", app.proposedDateTime, e);
                // Keep 'N/A' if formatting fails
            }
        }
        // --- End Date Formatting ---

        // --- Get Translated Visit Reason ---
        // Look up the reason, fallback to original value or 'Unknown'
        let visitReasonText = visitReasonTranslations[app.visitReason] || app.visitReason || 'غير معروف';
        // If it's a workshop visit with details, append the translated detail
        if (app.visitReason === 'WORKSHOP' && app.workshopDetail) {
            const detailText = workshopDetailTranslations[app.workshopDetail] || app.workshopDetail;
            visitReasonText += ` (${detailText})`; // e.g., ورشة (معاينة الحفر)
        }
        // --- End Translated Visit Reason ---

        // --- Get Translated Status ---
        // Look up the status, fallback to original value or 'Unknown'
        const statusText = statusTranslations[app.status] || app.status || 'غير معروف';
        // --- End Translated Status ---

        // Create the main div for the appointment card
        const card = document.createElement('div');
        card.className = 'appointment-card'; // Use class from your CSS
        // Use lowercase status from backend for class/data attribute consistency
        const statusClass = app.status ? app.status.toLowerCase() : 'unknown';
        card.setAttribute('data-status', statusClass); // Store status for potential CSS styling

        // --- File Rendering Logic ---
        let filesHtml = ''; // Start with empty string for files section
        if (app.files && app.files.length > 0) {
            filesHtml += '<div class="appointment-files"><p><strong>الملفات المرفقة:</strong></p><ul>';
            app.files.forEach(file => {
                let fileUrl = '#'; // Default link if URL construction fails
                 try {
                    // Construct file URL based on API base URL and relative path from backend
                    const baseUrl = new URL(api.defaults.baseURL);
                    // Assumes uploads are served at server root + /uploads/ + filePath
                    fileUrl = `${baseUrl.origin}/uploads/${file.filePath}`;
                 } catch (e) {
                    console.error("Could not construct file base URL from api.defaults.baseURL:", api.defaults.baseURL, e);
                 }
                // Add list item for each file with a link
                filesHtml += `<li><a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${file.originalName || 'ملف'} (${file.fileType || 'غير معروف'})</a></li>`;
            });
            filesHtml += '</ul></div>';
        }
        // --- End File Rendering ---

        // --- Card Inner HTML ---
        // Populate the card's HTML content using template literals
        // **FIXED project name and location access here**
        card.innerHTML = `
            <div class="appointment-details">
                <p><strong>تاريخ ووقت الموعد:</strong> ${formattedDateTime}</p>
                <p><strong>اسم المشروع:</strong> ${app.project && app.project.name ? app.project.name : 'غير متوفر'}</p>
                <p><strong>موقع المشروع:</strong> ${app.project && app.project.location ? app.project.location : 'غير متوفر'}</p>
                <p><strong>سبب الزيارة:</strong> ${visitReasonText}</p> 
                <p><strong>الوصف:</strong> ${app.visitDesc || '-'}</p>
                <p><strong>الحالة:</strong> <span class="status ${statusClass}">${statusText}</span></p> 
                ${filesHtml} 
            </div>
        `;
        // Append the newly created card to the main list container
        appointmentListDiv.appendChild(card);
    });
}

// --- Function to fetch appointments based on the selected filter ---
async function fetchAndRenderAppointments() {
    // Ensure the filter dropdown element exists before accessing its value
    const selectedStatus = statusFilterSelect ? statusFilterSelect.value : 'all';
    console.log(`Fetching appointments with status: ${selectedStatus}`); // Corrected log message
    setLoading('appointmentList', true); // Show loading indicator

    try {
        // Check if the 'api' object (Axios instance from api.js) is available
        if (typeof api === 'undefined') {
             console.error("API object is not defined! Check if api.js is included correctly BEFORE this script.");
             throw new Error("API configuration is missing.");
        }

        // Make the API call using the 'api' instance
        // The interceptor in api.js will automatically add the Authorization token
        const response = await api.get('/appointments', { // Endpoint for user's appointments
            params: { status: selectedStatus } // Pass the selected filter as a query parameter
        });
        console.log("Appointments received:", response.data);
        renderAppointments(response.data); // Call function to display the results

    } catch (error) {
        // Handle potential errors (network, server, unauthorized access from interceptor)
        const message = error.response?.data?.message // Prefer backend error message
                        || error.message             // Fallback to generic JS error message
                        || 'فشل تحميل قائمة الحجوزات.'; // Default message
        displayError('appointmentList', message); // Show error message to the user
    } finally {
        // Loading indicator is implicitly removed when renderAppointments or displayError updates the innerHTML
        // setLoading('appointmentList', false); // Usually not needed here
    }
}

// --- Event Listener Setup (Runs when the page is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for appointment-status.js");

    // --- Authentication Check ---
    // Verify the user is logged in before proceeding
     if (!localStorage.getItem('authToken')) {
         console.log("No auth token found. Redirecting to login.");
         alert('Please log in to view appointments.');
         window.location.href = 'login.html'; // Redirect to login page
         return; // Stop further script execution
     }
     console.log("User authenticated. Initializing appointment status page.");


    // --- Attach event listener to the status filter dropdown ---
    if (statusFilterSelect) {
         console.log("Adding change listener to status filter.");
         // When the user changes the selected value, call fetchAndRenderAppointments again
        statusFilterSelect.addEventListener('change', fetchAndRenderAppointments);
    } else {
        // Log a warning if the dropdown element isn't found in the HTML
        console.warn("Status filter select element with ID 'statusFilter' not found.");
    }

    // --- Initial data load ---
    // Fetch and display appointments when the page first loads (usually showing 'all')
    console.log("Performing initial fetch of appointments.");
    fetchAndRenderAppointments();
});
