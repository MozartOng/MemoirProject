// javascript/api.js (Create this file or add to a common script)

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Your backend API base URL
    timeout: 10000, // Request timeout in milliseconds (optional)
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Add Authorization header for all requests except auth paths
            if (!config.url.includes('/auth/')) {
                 config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        // Crucially, ensure correct Content-Type for file uploads
        // Axios usually handles this automatically when data is FormData,
        // but we explicitly remove the default if data is FormData.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Optional: Add a response interceptor for global error handling (e.g., redirect on 401/403)
api.interceptors.response.use(
    response => response, // Pass through successful responses
    error => {
        console.error('API Error:', error.response || error.message);
        if (error.response) {
            // Handle specific status codes globally if desired
            if (error.response.status === 401 || error.response.status === 403) {
                // Token is invalid or expired, or user lacks permission
                // Clear stored token/user data and redirect to login
                console.warn(`Unauthorized ( ${error.response.status} ). Redirecting to login.`);
                localStorage.removeItem('authToken');
                localStorage.removeItem('userData');
                // Redirect based on where the error occurred (e.g., admin pages go to admin login)
                if (window.location.pathname.includes('admin')) {
                   // window.location.href = 'admin-login.html'; // Uncomment and adjust if needed
                } else {
                  //  window.location.href = 'login.html'; // Uncomment and adjust if needed
                }
                 // Return a specific error message to prevent further processing in the calling function
                 return Promise.reject(new Error(error.response.data?.message || 'Unauthorized Access'));
            }
        }
        // Return the error so that specific catch blocks can handle it
        return Promise.reject(error);
    }
);

// Make sure to include this script in your HTML files *before* the page-specific scripts
// <script src="javascript/api.js"></script>