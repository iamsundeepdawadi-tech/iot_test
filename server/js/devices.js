/**
 * Devices Page Logic
 */
import { fetchJson, esc, loadDeviceModule, API_BASE } from './core.js';

let devices = [];

async function init() {
    await loadDevices();
    onTypeChange();
}

async function loadDevices() {
    try {
        devices = await fetchJson(`${API_BASE}/api/devices.php`);
        renderDevices();
    } catch (e) {
        console.error('Failed to load devices', e);
    }
}

function renderDevices() {
    const c = document.getElementById('devices-container');
    if (!c) return;
    if (devices.length === 0) {
        c.innerHTML = '<p style="font-size:12px;color:#888">No devices yet. Click "+ Add New" to register one.</p>';
        return;
    }
    let html = '<div class="device-list">';
    devices.forEach(d => {
        html += `<div class="device-card">
            <div class="d-name">${esc(d.name)}</div>
            <div class="d-meta">${esc(d.device_id)} — ${esc(d.location || 'No location')}</div>
            <div class="d-type">${esc(d.device_type)}</div>
            <div style="margin-top:10px;display:flex;gap:6px">
                <a href="/dashboard/${d.device_id}" class="btn" style="font-size:10px;padding:4px 8px;text-decoration:none;">Dashboard</a>
                <button style="font-size:10px;padding:4px 8px" onclick="window.showCode('${d.device_id}')">View Code</button>
            </div>
        </div>`;
    });
    html += '</div>';
    c.innerHTML = html;
}

window.addDevice = async function() {
    const errEl = document.getElementById('add-error');
    errEl.style.display = 'none';
    
    const body = {
        device_id: document.getElementById('f-id').value.trim(),
        device_type: document.getElementById('f-type').value,
        name: document.getElementById('f-name').value.trim(),
        location: document.getElementById('f-location').value.trim()
    };

    if (!body.device_id || !body.name) {
        errEl.textContent = 'Device ID and Name are required';
        errEl.style.display = 'block';
        return;
    }

    try {
        await fetchJson(`${API_BASE}/api/devices.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        document.getElementById('f-id').value = '';
        document.getElementById('f-name').value = '';
        document.getElementById('f-location').value = '';
        await loadDevices();
        alert('Device registered!');
    } catch (e) {
        errEl.textContent = e.message;
        errEl.style.display = 'block';
    }
};

window.onTypeChange = async function() {
    const type = document.getElementById('f-type').value;
    const mod = await loadDeviceModule(type);
    document.getElementById('type-desc').innerHTML = mod ? `<strong>${mod.label}:</strong> ${mod.desc}` : '';
};

window.showCode = async function(deviceId) {
    const d = devices.find(x => x.device_id === deviceId);
    if (!d) return;
    const mod = await loadDeviceModule(d.device_type);
    if (!mod) return;

    const code = mod.generateCode(d);
    document.getElementById('modal-title').textContent = `Arduino Code — ${d.name}`;
    document.getElementById('modal-code').textContent = code;
    document.getElementById('code-modal').classList.add('show');
};

// Modal helpers
window.closeModal = () => document.getElementById('code-modal').classList.remove('show');
window.copyCode = () => {
    const code = document.getElementById('modal-code').textContent;
    navigator.clipboard.writeText(code).then(() => alert('Copied!'));
};
window.downloadCode = () => {
    const code = document.getElementById('modal-code').textContent;
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `iot_device.ino`;
    a.click();
};

window.switchTab = (btn, tabId) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active');
};

init();
