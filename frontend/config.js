/**
 * YAN Platform — Frontend Configuration
 * Single source of truth for API URLs and environment detection.
 */
const YAN_CONFIG = (() => {
    const isLocalhost = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    const API_BASE_URL = isLocalhost
        ? 'http://localhost:5000/api/v1'
        : window.location.origin + '/api/v1';

    return Object.freeze({
        API_BASE_URL
    });
})();
