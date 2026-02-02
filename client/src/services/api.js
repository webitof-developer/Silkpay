import { mockApiResponses } from '../data/mockApiResponses';

// ==========================================
// CONFIGURATION
// ==========================================
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ==========================================
// MOCK DATA REGISTRY
// ==========================================
const mockData = mockApiResponses;

// ==========================================
// CLIENT IMPLEMENTATION (Fetch Wrapper)
// ==========================================
const getAuthToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('authToken');
    return null;
};

const handleMockRequest = async (method, endpoint, payload) => {
    console.log(`[Mock API] ${method} ${endpoint}`, payload || '');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    // Specific Mock Logic
    if (endpoint === '/payouts' && method === 'POST') {
         return {
            success: true,
            message: 'Payout Initiated',
            data: { mOrderId: `ORD-${Date.now()}`, status: 'INITIAL' }
         };
    }
    
    if (endpoint === '/settings/update' && method === 'POST') {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('settings-updated', { detail: payload }));
        }
    }

    if (endpoint === '/merchant/whitelist-ips' && method === 'PUT') {
        return {
            success: true,
            data: { whitelist_ips: payload.ips || [] }
        };
    }

    const methodMocks = mockData[method] || {};
    const mockResponse = methodMocks[endpoint] || methodMocks.default || {};
    
    // Always wrap in success for consistency with backend
    return {
        success: true,
        ...mockResponse
    };
};

const request = async (endpoint, { method = 'GET', body, ...customConfig } = {}) => {
    if (USE_MOCK_DATA) {
        return handleMockRequest(method, endpoint, body);
    }

    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...customConfig.headers,
    };

    const config = {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
        ...customConfig,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.warn("Session expired - redirecting to login...");
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken'); // Clear invalid token
                document.cookie = "silkpay_session=; path=/; max-age=0"; // Clear cookie if any
                window.location.href = '/login';
            }
            throw new Error("Session expired. Please login again.");
        }

        if (!response.ok) {
            let errorMessage = `Request failed (${response.status})`;
            try {
                const errorData = await response.json();
                // Prioritize 'message' or 'error' fields from backend
                errorMessage = errorData.message || 
                             (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) || 
                             errorMessage;
                
                // attach validation fields if available
                if (errorData.fields || errorData.errors) {
                    const validationError = new Error(errorMessage);
                    validationError.fields = errorData.fields || errorData.errors;
                    throw validationError;
                }
            } catch (jsonError) {
                // Fallback for non-JSON responses (e.g. 502/504 HTML pages)
                errorMessage = response.statusText || "Server communication error";
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error(`API ${method} Error:`, error);
        
        // Smart Network Error Handling
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
             throw new Error("Unable to connect to server. Please check your internet connection.");
        }
        
        throw error;
    }
};

// ==========================================
// EXPORTED API
// ==========================================
export const api = {
    get: (url, params) => request(url, { method: 'GET', ...params }),
    post: (url, data) => request(url, { method: 'POST', body: data }),
    put: (url, data) => request(url, { method: 'PUT', body: data }),
    delete: (url) => request(url, { method: 'DELETE' }),
    
    // Generic Data Export (Blob)
    exportData: async (endpoint, params = {}) => {
        if (USE_MOCK_DATA) return handleMockRequest('GET', endpoint, params);

        try {
             // Construct Query String
             const querytString = new URLSearchParams(params).toString();
             const url = `${API_BASE_URL}${endpoint}?${querytString}`;

             const response = await fetch(url, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${getAuthToken()}`
                  }
             });
             
             if (!response.ok) throw new Error('Export failed');
             
             // Trigger Download
             const blob = await response.blob();
             const downloadUrl = window.URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = downloadUrl;
             // Try to get filename from headers or default
             const disposition = response.headers.get('content-disposition');
             const filename = disposition 
                ? disposition.split('filename=')[1]?.replace(/"/g, '') 
                : `export_${Date.now()}.csv`;
                
             a.download = filename;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             window.URL.revokeObjectURL(downloadUrl);
             
             return { success: true };
        } catch (error) {
             console.error("Export Error", error);
             throw error;
        }
    }
};
