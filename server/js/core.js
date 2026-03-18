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
 * Global Constants (fetched dynamically from config)
 */
let configData = { WIFI_SSID: '', WIFI_PASS: '', SERVER_URL: '' };
try {
    const res = await fetch('/iot_config.json');
    if (res.ok) configData = await res.json();
} catch (e) {
    console.error("Failed to load iot_config.json", e);
}

export const WIFI_SSID = configData.WIFI_SSID;
export const WIFI_PASS = configData.WIFI_PASS;
export const SERVER_URL = configData.SERVER_URL;
