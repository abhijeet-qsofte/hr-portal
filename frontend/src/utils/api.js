import axios from 'axios';

// For local development with Vite, we use the /api prefix which gets proxied to the backend
// In production with Nginx, the /api prefix is also used but handled by Nginx configuration
const API_URL = '/api';

console.log('API URL configured as:', API_URL);

// Configure axios to follow redirects automatically
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Follow redirects automatically (handles FastAPI's trailing slash redirects)
  maxRedirects: 5,
});

// Add request interceptor for authentication and debugging
api.interceptors.request.use((request) => {
  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('API Request:', request.method.toUpperCase(), request.url);
  return request;
});

// Add response interceptor for authentication errors and debugging
api.interceptors.response.use(
  (response) => {
    console.log(
      'API Response:',
      response.status,
      response.config.url,
      response.data
    );
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    console.error(
      'API Error:',
      error.response?.status || error.message,
      error.config?.url,
      error.response?.data || error
    );
    return Promise.reject(error);
  }
);

// Helper function to ensure NO trailing slashes for FastAPI compatibility
const removeTrailingSlash = (path) =>
  path.endsWith('/') ? path.slice(0, -1) : path;

// Employee endpoints
export const employeeApi = {
  getAll: (params) => api.get(removeTrailingSlash('/employees'), { params }),
  getDetailed: (params) =>
    api.get(removeTrailingSlash('/employees/detailed'), { params }),
  getById: (id) => api.get(removeTrailingSlash(`/employees/${id}`)),
  create: (data) => api.post('/employees/', data), // Keep trailing slash for POST to match backend
  update: (id, data) => api.put(removeTrailingSlash(`/employees/${id}`), data),
  delete: (id) => api.delete(removeTrailingSlash(`/employees/${id}`)),
};

// Attendance endpoints
export const attendanceApi = {
  getAll: (params) => api.get(removeTrailingSlash('/attendance'), { params }),
  getDetailed: (params) =>
    api.get(removeTrailingSlash('/attendance/detailed'), { params }),
  getByEmployee: (employeeId, params) =>
    api.get(removeTrailingSlash(`/attendance/employee/${employeeId}`), {
      params,
    }),
  create: (data) => api.post(removeTrailingSlash('/attendance/'), data),
  update: (id, data) => api.put(removeTrailingSlash(`/attendance/${id}/`), data),
};

// Payroll endpoints
export const payrollApi = {
  getAll: (params) => api.get(removeTrailingSlash('/payroll'), { params }),
  getByEmployee: (employeeId, params) =>
    api.get(removeTrailingSlash(`/payroll/employee/${employeeId}`), { params }),
  create: (data) => api.post(removeTrailingSlash('/payroll'), data),
};

// Salary structure endpoints
export const salaryStructureApi = {
  getAll: () => api.get(removeTrailingSlash('/salary/structures')),
  getById: (id) => api.get(removeTrailingSlash(`/salary/structures/${id}`)),
  getByEmployee: (employeeId) =>
    api.get(removeTrailingSlash('/salary/structures'), {
      params: { employee_id: employeeId },
    }),
  create: (data) => api.post(removeTrailingSlash('/salary/structures'), data),
  update: (id, data) =>
    api.put(removeTrailingSlash(`/salary/structures/${id}`), data),
  delete: (id) => api.delete(removeTrailingSlash(`/salary/structures/${id}`)),
  forceDelete: (id) => api.delete(removeTrailingSlash(`/salary/structures/${id}/force-delete`)),
};

// Payslip endpoints
export const payslipApi = {
  getAll: () => api.get(removeTrailingSlash('/salary/payslips')),
  getById: (id) => api.get(removeTrailingSlash(`/salary/payslips/${id}`)),
  getByEmployee: (employeeId) =>
    api.get(removeTrailingSlash('/salary/payslips'), {
      params: { employee_id: employeeId },
    }),
  create: (data) => api.post(removeTrailingSlash('/salary/payslips'), data),
  update: (id, data) =>
    api.put(removeTrailingSlash(`/salary/payslips/${id}`), data),
  delete: (id) => api.delete(removeTrailingSlash(`/salary/payslips/${id}`)),
  approve: (id, approverId) =>
    api.post(removeTrailingSlash(`/salary/payslips/${id}/approve`), {
      approver_id: approverId,
    }),
  markAsPaid: (id, paymentReference) =>
    api.post(removeTrailingSlash(`/salary/payslips/${id}/pay`), {
      payment_reference: paymentReference,
    }),
  generate: (employeeId, month, processorId) =>
    api.post(
      removeTrailingSlash(`/salary/payslips/generate/${employeeId}/${month}`) +
        (processorId ? `?processor_id=${processorId}` : ''),
      {}
    ),
  downloadPdf: (id) =>
    api.get(removeTrailingSlash(`/salary/payslips/${id}/pdf`), {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    }),
};

// Authentication endpoints
export const authApi = {
  login(email, password) {
    // For login, we need to use x-www-form-urlencoded format as required by OAuth2
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    return api.post(removeTrailingSlash('/auth/login'), formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  },
  
  refreshToken(refreshToken) {
    return api.post(removeTrailingSlash('/auth/refresh'), { refresh_token: refreshToken });
  },
  
  forgotPassword(email) {
    return api.post(removeTrailingSlash('/auth/forgot-password'), { email });
  },
  
  resetPassword(token, new_password) {
    return api.post(removeTrailingSlash('/auth/reset-password'), { token, new_password });
  },
  
  register(userData) {
    return api.post(removeTrailingSlash('/auth/register'), userData);
  },
  
  getCurrentUser() {
    return api.get(removeTrailingSlash('/auth/me'));
  },
  
  updateCurrentUser(userData) {
    return api.put(removeTrailingSlash('/auth/me'), userData);
  },
  
  getAllUsers() {
    return api.get(removeTrailingSlash('/auth/users'));
  },
  
  assignRole(userId, roleName) {
    return api.post(removeTrailingSlash(`/auth/users/${userId}/roles/${roleName}`));
  },
  
  removeRole(userId, roleName) {
    return api.delete(removeTrailingSlash(`/auth/users/${userId}/roles/${roleName}`));
  }
};

export default api;
