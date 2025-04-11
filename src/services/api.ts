import axios from 'axios';

// Base API service configuration
const api = axios.create({
    baseURL: 'http://10.0.0.151:3001',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include authorization token on all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('@ColetPortal:token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common error responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Unauthorized) errors - automatically logout user
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('@ColetPortal:token');
            localStorage.removeItem('@ColetPortal:user');

            // Redirect to login page if needed
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default api;