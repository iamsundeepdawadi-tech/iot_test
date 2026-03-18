/**
 * Dashboard Page Logic
 */
import { fetchJson, esc, fmtTime, loadDeviceModule, API_BASE } from './core.js';

let currentDevice = null;
let devices = [];
let typeModule = null;

async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('device_id');

    try {
        devices = await fetchJson(`${API_BASE}/api/devices.php`);
        renderSelect(idFromUrl);
        if (idFromUrl) {
            currentDevice = devices.find(d => d.device_id === idFromUrl);
            if (currentDevice) await selectDevice(idFromUrl);
        }
    } catch (e) {
        console.error('Dashboard init failed', e);
    }
}

function renderSelect(selectedId) {
    const sel = document.getElementById('device-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select —</option>';
    devices.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.device_id;
        opt.textContent = `${d.name} [${d.device_type}]`;
        if (d.device_id === selectedId) opt.selected = true;
        sel.appendChild(opt);
    });
}

window.switchDevice = async function() {
    const id = document.getElementById('device-select').value;
    if (id) {
        // Update URL without reload
        window.history.pushState({}, '', `/dashboard/${id}`);
        await selectDevice(id);
    } else {
        window.history.pushState({}, '', `/dashboard`);
        currentDevice = null;
        updateVisibility();
    }
};

async function selectDevice(id) {
    currentDevice = devices.find(d => d.device_id === id);
    if (!currentDevice) return;

    typeModule = await loadDeviceModule(currentDevice.device_type);
    if (!typeModule) {
        alert('Unknown device type!');
        return;
    }

    renderUIStructure();
    updateVisibility();
    poll();
}

function updateVisibility() {
    document.getElementById('dash-content').style.display = currentDevice ? 'block' : 'none';
    document.getElementById('dash-empty').style.display = currentDevice ? 'none' : 'block';
    const codeBtn = document.getElementById('btn-view-code');
    if (codeBtn) codeBtn.style.display = currentDevice ? 'block' : 'none';
}

function renderUIStructure() {
    // Readings
    const grid = document.getElementById('readings-grid');
    grid.innerHTML = '';
    for (const [key, meta] of Object.entries(typeModule.sensors)) {
        grid.innerHTML += `<div class="reading-box">
            <div class="reading-value" id="rv-${key}">—</div>
            <div class="reading-label">${meta.label} ${meta.unit ? `<span class="reading-unit">${meta.unit}</span>` : ''}</div>
        </div>`;
    }

    // Controls
    const ctrlSection = document.getElementById('controls-section');
    const ctrlContainer = document.getElementById('controls-container');
    if (!typeModule.controls || typeModule.controls.length === 0) {
        ctrlSection.style.display = 'none';
    } else {
        ctrlSection.style.display = 'block';
        let html = '<div class="control-grid">';
        typeModule.controls.forEach(c => {
            if (c.type === 'toggle') {
                html += `<div class="control-box">
                    <div class="control-name">${c.label}</div>
                    <div class="control-status">Status: <strong id="cs-${c.key}">—</strong></div>
                    <div class="btn-group">
                        <button id="cb-${c.key}-on" onclick="window.setConfig('${c.key}','on')">On</button>
                        <button id="cb-${c.key}-off" onclick="window.setConfig('${c.key}','off')">Off</button>
                    </div>
                </div>`;
            } else if (c.type === 'range') {
                html += `<div class="control-box">
                    <div class="control-name">${c.label}</div>
                    <div class="control-status">Value: <strong id="cs-${c.key}">${c.min || 0}</strong></div>
                    <input type="range" min="${c.min||0}" max="${c.max||100}" step="${c.step||1}" 
                        id="cr-${c.key}" oninput="document.getElementById('cs-${c.key}').textContent=this.value" 
                        onchange="window.setConfig('${c.key}',parseInt(this.value))" />
                </div>`;
            }
        });
        html += '</div>';
        ctrlContainer.innerHTML = html;
    }

    // History Head
    const head = document.getElementById('history-head');
    head.innerHTML = '<th>Time</th>';
    for (const [key, meta] of Object.entries(typeModule.sensors)) {
        head.innerHTML += `<th>${meta.label}</th>`;
    }
}

async function poll() {
    if (!currentDevice) return;
    await Promise.all([fetchData(), fetchStatus(), fetchConfig()]);
}

async function fetchData() {
    try {
        const rows = await fetchJson(`${API_BASE}/data/${currentDevice.device_id}?limit=15`);
        if (!Array.isArray(rows) || rows.length === 0) return;

        const latest = rows[0].data || {};
        for (const key of Object.keys(typeModule.sensors)) {
            const el = document.getElementById(`rv-${key}`);
            if (el) el.textContent = latest[key] !== undefined ? latest[key] : '—';
        }

        const tbody = document.getElementById('history-body');
        tbody.innerHTML = '';
        rows.forEach(row => {
            const d = row.data || {};
            let tr = `<tr><td>${fmtTime(row.recorded_at)}</td>`;
            for (const key of Object.keys(typeModule.sensors)) {
                tr += `<td>${d[key] !== undefined ? d[key] : '—'}</td>`;
            }
            tr += '</tr>';
            tbody.innerHTML += tr;
        });
    } catch (e) {}
}

async function fetchStatus() {
    try {
        const arr = await fetchJson(`${API_BASE}/api/devices.php?device_id=${currentDevice.device_id}`);
        if (!arr.length) return;
        const d = arr[0];
        document.getElementById('s-device').textContent = d.device_id;
        document.getElementById('s-type').textContent = typeModule.label;
        document.getElementById('s-ip').textContent = d.ip_address || '—';
        document.getElementById('s-lastseen').textContent = fmtTime(d.last_seen);
        const online = d.last_seen && (Date.now() - new Date(d.last_seen).getTime()) < 30000;
        document.getElementById('s-online').innerHTML = `<span class="dot ${online ? 'on' : 'off'}"></span>${online ? 'Online' : 'Offline'}`;
    } catch (e) {}
}

async function fetchConfig() {
    if (!typeModule.controls.length) return;
    try {
        const cfg = await fetchJson(`${API_BASE}/config/${currentDevice.device_id}`);
        typeModule.controls.forEach(c => {
            const val = cfg[c.key];
            if (c.type === 'toggle') {
                const el = document.getElementById(`cs-${c.key}`);
                if (el) el.textContent = val ? String(val).toUpperCase() : '—';
                document.getElementById(`cb-${c.key}-on`)?.classList.toggle('active', val === 'on');
                document.getElementById(`cb-${c.key}-off`)?.classList.toggle('active', val === 'off');
            } else if (c.type === 'range') {
                const el = document.getElementById(`cs-${c.key}`);
                const slider = document.getElementById(`cr-${c.key}`);
                if (el && val !== undefined) el.textContent = val;
                if (slider && val !== undefined) slider.value = val;
            }
        });
    } catch (e) {}
}

window.setConfig = async function(key, value) {
    if (!currentDevice) return;
    try {
        await fetchJson(`${API_BASE}/config/${currentDevice.device_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: value })
        });
        await fetchConfig();
    } catch (e) {}
};

setInterval(() => { if (currentDevice) poll(); }, 5000);

// --- Code Modal Logic ---
window.showCurrentCode = function() {
    if (!currentDevice || !typeModule) return;
    const code = typeModule.generateCode(currentDevice);
    document.getElementById('modal-title').textContent = `Arduino Code — ${currentDevice.name}`;
    document.getElementById('modal-code').textContent = code;
    document.getElementById('code-modal').classList.add('show');
};

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

init();
