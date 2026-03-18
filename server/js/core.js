/**
 * IoT Farm Core System Utilities
 */

export const API_BASE = '';

/**
 * Fetch generic JSON from API
 */
export async function fetchJson(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(error.error || `HTTP ${res.status}`);
    }
    return await res.json();
}

/**
 * Sanitize strings for HTML output
 */
export function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

/**
 * Format timestamp to HH:mm:ss
 */
export function fmtTime(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '—';
    return String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0') + ':' +
           String(d.getSeconds()).padStart(2, '0');
}

/**
 * Load a device type module dynamically
 */
export async function loadDeviceModule(type) {
    try {
        const modulePath = `/js/types/${type}.js`;
        return await import(modulePath);
    } catch (e) {
        console.error(`Failed to load module for type: ${type}`, e);
        return null;
    }
}

/**
 * Global Constants
 */
export const WIFI_SSID = 'accounthack_fbnpa_2';
export const WIFI_PASS = 'CLED02502F';
export const SERVER_URL = 'http://iot.aitalim.com';
