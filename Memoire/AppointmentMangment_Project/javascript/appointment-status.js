// javascript/appointment-status.js

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

// Get references to HTML elements
const appointmentListDiv = document.getElementById('appointmentList');
const statusFilterSelect = document.getElementById('statusFilter');

// --- Function to render appointment cards ---
function renderAppointments(appointments) {
    // Ensure the container element exists
    if (!appointmentListDiv) {
        console.error("Appointment list container ('appointmentList') not found in HTML.");
        return;
    }
    // Clear previous list content (or loading/error message)
    appointmentListDiv.innerHTML = '';

    // Handle cases where there are no appointments
    if (!appointments || appointments.length === 0) {
        appointmentListDiv.innerHTML = '<p>لا توجد حجوزات لعرضها.</p>';
        return;
    }

    // Loop through each appointment and create an HTML card for it
    appointments.forEach(app => {
        // --- Date Formatting (YYYY-MM-DD HH:MM) ---
        let formattedDateTime = 'N/A'; // Default value
        if (app.proposedDateTime) {
            try {
                const d = new Date(app.proposedDateTime);
                 // Helper function to pad single digits with a leading zero (e.g., 9 becomes 09)
                const pad = (num) => num.toString().padStart(2, '0');
                // Construct the YYYY-MM-DD HH:MM format string
                formattedDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch (e) {
                console.error("Error formatting date:", app.proposedDateTime, e);
            }
        }
        // --- End Date Formatting ---

        const card = document.createElement('div');
        card.className = 'appointment-card';
        // Use lowercase status from backend for class/data attribute consistency
        const statusClass = app.status ? app.status.toLowerCase() : 'unknown';
        card.setAttribute('data-status', statusClass);

        // --- File Rendering Logic ---
        let filesHtml = '';
        if (app.files && app.files.length > 0) {
            filesHtml += '<div class="appointment-files"><p><strong>الملفات المرفقة:</strong></p><ul>';
            app.files.forEach(file => {
                // Construct the full file URL
                // Assumes 'api.defaults.baseURL' is like 'http://localhost:3001/api'
                // Requires removing '/api' to get the server root for '/uploads'
                let fileUrl = '#'; // Default if base URL isn't set right
                 try {
                    const baseUrl = new URL(api.defaults.baseURL); // Use URL constructor
                    // Construct URL: http://localhost:3001/uploads/relative/path/to/file.pdf
                    fileUrl = `${baseUrl.origin}/uploads/${file.filePath}`;
                 } catch (e) {
                    console.error("Could not construct file base URL from api.defaults.baseURL:", api.defaults.baseURL);
                 }
                filesHtml += `<li><a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${file.originalName || 'ملف'} (${file.fileType || 'غير معروف'})</a></li>`;
            });
            filesHtml += '</ul></div>';
        }
        // --- End File Rendering ---

        // --- Card Content ---
        // Use optional chaining (?.) and default values (||) for safety
        card.innerHTML = `
            <div class="appointment-details">
                <p><strong>تاريخ ووقت الموعد:</strong> ${formattedDateTime}</p>
                <p><strong>اسم المشروع:</strong> ${app.projectName || 'غير متوفر'}</p>
                <p><strong>موقع المشروع:</strong> ${app.projectLocation || 'غير متوفر'}</p>
                <p><strong>سبب الزيارة:</strong> ${app.visitReason || 'غير معروف'}${app.workshopDetail ? ` (${app.workshopDetail})` : ''}</p>
                <p><strong>الوصف:</strong> ${app.visitDesc || '-'}</p>
                <p><strong>الحالة:</strong> <span class="status ${statusClass}">${app.status || 'غير معروف'}</span></p>
                ${filesHtml} {/* Add the rendered files HTML */}
            </div>
        `;
        appointmentListDiv.appendChild(card);
    });
}

// --- Function to fetch appointments based on filter ---
async function fetchAndRenderAppointments() {
    // Ensure the select element exists before reading its value
    const selectedStatus = statusFilterSelect ? statusFilterSelect.value : 'all';
    console.log(`Workspaceing appointments with status: ${selectedStatus}`);
    setLoading('appointmentList', true); // Show loading indicator

    try {
        // Check if the 'api' object from api.js is available
        if (typeof api === 'undefined') {
             console.error("API object is not defined! Check if api.js is included correctly BEFORE this script.");
             throw new Error("API configuration is missing.");
        }

        // Use the 'api' instance - the interceptor adds the auth token automatically
        const response = await api.get('/appointments', {
            params: { status: selectedStatus } // Send selected status as a query parameter
        });
        console.log("Appointments received:", response.data);
        renderAppointments(response.data); // Render the fetched appointments

    } catch (error) {
        // Handle errors, potentially including the 'Unauthorized Access' message from the interceptor
        const message = error.response?.data?.message || error.message || 'فشل تحميل قائمة الحجوزات.';
        displayError('appointmentList', message); // Display error message in the list area
        // Ensure loading indicator is removed on error
        // (already handled by displayError replacing the content)
    } finally {
         // Optional: Could explicitly remove loading indicator here if displayError/render didn't replace content
         // setLoading('appointmentList', false);
    }
}

// --- Event Listener Setup ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded for appointment-status.js");

    // --- Authentication Check ---
    // Ensure the user is logged in before trying to fetch data
     if (!localStorage.getItem('authToken')) {
         console.log("No auth token found. Redirecting to login.");
         alert('Please log in to view appointments.');
         window.location.href = 'login.html'; // Redirect to login page
         return; // Stop further execution
     }
     console.log("User authenticated. Initializing appointment status page.");

    // --- Attach event listener to the filter dropdown ---
    if (statusFilterSelect) {
         console.log("Adding change listener to status filter.");
         // When the filter value changes, re-fetch and render the appointments
        statusFilterSelect.addEventListener('change', fetchAndRenderAppointments);
    } else {
        // Log a warning if the filter element isn't found
        console.warn("Status filter select element with ID 'statusFilter' not found.");
    }

    // --- Initial data load ---
    // Fetch and render appointments when the page first loads
    console.log("Performing initial fetch of appointments.");
    fetchAndRenderAppointments();
});