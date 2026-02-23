/**
 * YAN Platform — Production-Grade API Client
 * 
 * Security Architecture:
 * - Access token stored ONLY in closure-scoped variable (never localStorage/sessionStorage)
 * - Refresh token lives in httpOnly cookie (never accessible to JS)
 * - All requests use credentials: 'include' for cookie transport
 * - 401 interceptor with request queuing and retry-once logic
 * - Infinite loop prevention via isRefreshing flag + retry guard
 */
const api = (() => {
    // ================================================================
    // PRIVATE STATE — closure-scoped, inaccessible from outside
    // ================================================================
    let _accessToken = null;
    let _isRefreshing = false;
    let _failedQueue = [];

    // Auth endpoints that should NOT trigger refresh on 401
    const AUTH_BYPASS_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

    // ================================================================
    // QUEUE MANAGEMENT
    // ================================================================

    function _processQueue(error, token) {
        _failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        _failedQueue = [];
    }

    // ================================================================
    // CORE REQUEST FUNCTION
    // ================================================================

    async function request(endpoint, options = {}) {
        const url = YAN_CONFIG.API_BASE_URL + endpoint;
        const isRetry = options._isRetry || false;

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Attach access token if available
        if (_accessToken) {
            headers['Authorization'] = 'Bearer ' + _accessToken;
        }

        // Remove internal flags from options before passing to fetch
        const { _isRetry: _, ...cleanOptions } = options;

        const fetchOptions = {
            ...cleanOptions,
            headers,
            credentials: 'include' // Always send cookies
        };

        // If body is an object, stringify it
        if (fetchOptions.body && typeof fetchOptions.body === 'object') {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }

        let response;
        try {
            response = await fetch(url, fetchOptions);
        } catch (networkError) {
            throw new Error('Network error — please check your connection.');
        }

        // ============================================================
        // 401 INTERCEPTOR
        // ============================================================
        if (response.status === 401 && !isRetry) {
            // Do NOT intercept 401 from auth endpoints themselves
            const shouldBypass = AUTH_BYPASS_ENDPOINTS.some(ep => endpoint.startsWith(ep));

            if (!shouldBypass) {
                if (!_isRefreshing) {
                    _isRefreshing = true;

                    try {
                        const refreshResponse = await fetch(
                            YAN_CONFIG.API_BASE_URL + '/auth/refresh',
                            {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );

                        if (!refreshResponse.ok) {
                            throw new Error('Refresh failed');
                        }

                        const refreshData = await refreshResponse.json();
                        _accessToken = refreshData.token;

                        // Resolve all queued requests with new token
                        _processQueue(null, _accessToken);

                        // Retry the original request ONCE
                        return request(endpoint, { ...options, _isRetry: true });

                    } catch (refreshError) {
                        _accessToken = null;
                        _processQueue(refreshError, null);

                        // Notify app of session expiry
                        if (typeof window._onAuthFailure === 'function') {
                            window._onAuthFailure();
                        }

                        throw new Error('Session expired. Please login again.');
                    } finally {
                        _isRefreshing = false;
                    }
                } else {
                    // Another request is already refreshing — queue this one
                    return new Promise((resolve, reject) => {
                        _failedQueue.push({
                            resolve: (newToken) => {
                                // Retry with new token
                                resolve(request(endpoint, { ...options, _isRetry: true }));
                            },
                            reject: (err) => {
                                reject(err);
                            }
                        });
                    });
                }
            }
        }

        // ============================================================
        // RESPONSE PARSING
        // ============================================================
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            if (!response.ok) {
                throw new Error('Request failed');
            }
            return { success: true };
        }

        if (!response.ok) {
            const errorMessage = (data && data.message) ? data.message : 'Request failed';
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // ================================================================
    // AUTH METHODS
    // ================================================================

    async function login(email, password) {
        const data = await request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        // Store access token in memory ONLY
        _accessToken = data.token;

        return data.data; // { id, name, email, role }
    }

    async function register(name, email, password, role, organization) {
        const body = { name, email, password };
        if (role) body.role = role;
        if (organization) body.organization = organization;

        const data = await request('/auth/register', {
            method: 'POST',
            body
        });

        // Store access token in memory ONLY
        _accessToken = data.token;

        return data.data; // { id, name, email, role }
    }

    async function getMe() {
        const data = await request('/auth/me', {
            method: 'GET'
        });

        return data.data; // User object
    }

    async function logout() {
        try {
            await request('/auth/logout', {
                method: 'POST'
            });
        } catch (e) {
            // Logout must clear local state even if server call fails
            console.warn('Logout server call failed:', e.message);
        }

        // ALWAYS clear local state regardless of server response
        _accessToken = null;
    }

    function isAuthenticated() {
        return _accessToken !== null;
    }

    // ================================================================
    // PUBLIC API
    // ================================================================
    return Object.freeze({
        request,
        login,
        register,
        getMe,
        logout,
        isAuthenticated
    });
})();
