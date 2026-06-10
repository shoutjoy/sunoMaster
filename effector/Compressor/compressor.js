export class CompressorEffector {
    constructor(audioState) {
        this.audioState = audioState;
        this.defaultTemplates = [
            { name: "Voice Clean", settings: { enabled: true, inputGain: 0, threshold: -24, ratio: 3.2, attack: 0.004, release: 0.18, knee: 24, makeup: 5 } },
            { name: "Voice Broadcast", settings: { enabled: true, inputGain: 0, threshold: -28, ratio: 4.5, attack: 0.002, release: 0.22, knee: 30, makeup: 7 } },
            { name: "Vocal Smooth", settings: { enabled: true, inputGain: 0, threshold: -22, ratio: 3.8, attack: 0.008, release: 0.32, knee: 36, makeup: 4.5 } },
            { name: "Podcast Tight", settings: { enabled: true, inputGain: 0, threshold: -30, ratio: 5.5, attack: 0.003, release: 0.2, knee: 18, makeup: 8 } },
            { name: "Acoustic Music", settings: { enabled: true, inputGain: 0, threshold: -18, ratio: 2.2, attack: 0.02, release: 0.45, knee: 26, makeup: 3 } },
            { name: "Pop Music", settings: { enabled: true, inputGain: 0, threshold: -16, ratio: 3.5, attack: 0.006, release: 0.18, knee: 20, makeup: 4 } },
            { name: "Hip-Hop Low Punch", settings: { enabled: true, inputGain: 0, threshold: -14, ratio: 4.2, attack: 0.012, release: 0.12, knee: 12, makeup: 3.5 } },
            { name: "Rock Glue", settings: { enabled: true, inputGain: 0, threshold: -18, ratio: 4, attack: 0.01, release: 0.28, knee: 18, makeup: 4 } },
            { name: "EDM Loud", settings: { enabled: true, inputGain: 0, threshold: -12, ratio: 6, attack: 0.002, release: 0.08, knee: 8, makeup: 5 } },
            { name: "Jazz Natural", settings: { enabled: true, inputGain: 0, threshold: -20, ratio: 1.8, attack: 0.035, release: 0.55, knee: 35, makeup: 2.5 } }
        ];
        this.customTemplateKey = 'jd-compressor-templates';
        this.dynamicCompressorNode = null;
        this.compressorMakeupNode = null;
    }

    getCustomTemplates() {
        try {
            const data = JSON.parse(localStorage.getItem(this.customTemplateKey) || '[]');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    setCustomTemplates(templates) {
        try {
            localStorage.setItem(this.customTemplateKey, JSON.stringify(templates));
        } catch (error) {}
    }

    cloneSettings(settings = this.audioState.compressor) {
        const fallback = { enabled: true, inputGain: 0, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, knee: 30, makeup: 6 };
        return {
            enabled: settings.enabled === undefined ? fallback.enabled : Boolean(settings.enabled),
            inputGain: Number.isFinite(Number(settings.inputGain)) ? Number(settings.inputGain) : fallback.inputGain,
            threshold: Number.isFinite(Number(settings.threshold)) ? Number(settings.threshold) : fallback.threshold,
            ratio: Number.isFinite(Number(settings.ratio)) ? Number(settings.ratio) : fallback.ratio,
            attack: Number.isFinite(Number(settings.attack)) ? Number(settings.attack) : fallback.attack,
            release: Number.isFinite(Number(settings.release)) ? Number(settings.release) : fallback.release,
            knee: Number.isFinite(Number(settings.knee)) ? Number(settings.knee) : fallback.knee,
            makeup: Number.isFinite(Number(settings.makeup)) ? Number(settings.makeup) : fallback.makeup
        };
    }

    populateTemplates(selectId) {
        const compTemplateSelect = document.getElementById(selectId);
        if (!compTemplateSelect) return;
        const customTemplates = this.getCustomTemplates();
        compTemplateSelect.innerHTML = '<option value="">Template</option>';

        this.defaultTemplates.forEach((template, idx) => {
            const option = document.createElement('option');
            option.value = `default:${idx}`;
            option.textContent = template.name;
            compTemplateSelect.appendChild(option);
        });

        customTemplates.forEach((template, idx) => {
            const option = document.createElement('option');
            option.value = `custom:${idx}`;
            option.textContent = `Saved: ${template.name}`;
            compTemplateSelect.appendChild(option);
        });
    }

    syncInputs() {
        const comp = this.audioState.compressor;
        const values = {
            'comp-inputgain': comp.inputGain,
            'comp-threshold': comp.threshold,
            'comp-ratio': comp.ratio,
            'comp-attack': comp.attack,
            'comp-release': comp.release,
            'comp-knee': comp.knee,
            'comp-makeup': comp.makeup
        };

        Object.entries(values).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) input.value = value;
        });
    }

    applyTemplate(settings, selectId, nameInputId) {
        this.audioState.compressor = this.cloneSettings(settings);
        this.syncInputs();
        this.updateUI();
    }

    getCompressedDb(inputDb) {
        const comp = this.audioState.compressor;
        if (!comp.enabled || inputDb <= comp.threshold) return inputDb;
        return comp.threshold + ((inputDb - comp.threshold) / comp.ratio);
    }

    dbToGain(db) {
        return Math.pow(10, db / 20);
    }

    connect(context, inputNode, getBypassStateCallback) {
        this.compressorInputGainNode = context.createGain();
        this.dynamicCompressorNode = context.createDynamicsCompressor();
        this.compressorMakeupNode = context.createGain();
        
        inputNode.connect(this.compressorInputGainNode);
        this.compressorInputGainNode.connect(this.dynamicCompressorNode);
        this.dynamicCompressorNode.connect(this.compressorMakeupNode);
        
        this.applySettings(context, getBypassStateCallback);
        return this.compressorMakeupNode;
    }

    applySettings(context, getBypassStateCallback) {
        if (!this.compressorInputGainNode || !this.dynamicCompressorNode || !this.compressorMakeupNode) return;
        const comp = this.audioState.compressor;
        const disabled = getBypassStateCallback() || !comp.enabled;
        const now = context.currentTime;

        const inputGainVal = disabled ? 0 : comp.inputGain;
        this.compressorInputGainNode.gain.setValueAtTime(this.dbToGain(inputGainVal), now);
        this.dynamicCompressorNode.threshold.setValueAtTime(disabled ? 0 : comp.threshold, now);
        this.dynamicCompressorNode.knee.setValueAtTime(disabled ? 0 : comp.knee, now);
        this.dynamicCompressorNode.ratio.setValueAtTime(disabled ? 1 : comp.ratio, now);
        this.dynamicCompressorNode.attack.setValueAtTime(disabled ? 0.003 : comp.attack, now);
        this.dynamicCompressorNode.release.setValueAtTime(disabled ? 0.25 : comp.release, now);
        this.compressorMakeupNode.gain.setValueAtTime(disabled ? 1 : this.dbToGain(comp.makeup), now);
    }

    formatCompactNumber(value) {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }

    updateUI(updateRangeFillCallback) {
        const comp = this.audioState.compressor;
        const toggle = document.getElementById('compressor-toggle');
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(comp.enabled));
            toggle.innerText = comp.enabled ? 'IN' : 'OUT';
            toggle.className = comp.enabled
                ? "bg-cyan-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-cyan-500 shadow-md transition"
                : "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
        }
        
        const inputgainVal = document.getElementById('comp-inputgain-val');
        const threshVal = document.getElementById('comp-threshold-val');
        const ratioVal = document.getElementById('comp-ratio-val');
        const attackVal = document.getElementById('comp-attack-val');
        const releaseVal = document.getElementById('comp-release-val');
        const kneeVal = document.getElementById('comp-knee-val');
        const makeupVal = document.getElementById('comp-makeup-val');

        if (inputgainVal) inputgainVal.innerText = `${this.formatCompactNumber(comp.inputGain)} dB`;
        if (threshVal) threshVal.innerText = `${comp.threshold} dB`;
        if (ratioVal) ratioVal.innerText = `${comp.ratio.toFixed(1)}:1`;
        if (attackVal) attackVal.innerText = `${this.formatCompactNumber(comp.attack * 1000)} ms`;
        if (releaseVal) releaseVal.innerText = `${this.formatCompactNumber(comp.release * 1000)} ms`;
        if (kneeVal) kneeVal.innerText = `${comp.knee} dB`;
        if (makeupVal) makeupVal.innerText = `${this.formatCompactNumber(comp.makeup)} dB`;

        if (updateRangeFillCallback) {
            updateRangeFillCallback();
        }
        this.drawCurve();
    }

    drawCurve() {
        const compCurve = document.getElementById('comp-curve');
        if (!compCurve) return;
        const compCurveCtx = compCurve.getContext('2d');
        if (!compCurveCtx) return;

        const rect = compCurve.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.round(rect.width * dpr));
        const height = Math.max(1, Math.round(rect.height * dpr));
        if (compCurve.width !== width || compCurve.height !== height) {
            compCurve.width = width;
            compCurve.height = height;
        }

        const ctx2 = compCurveCtx;
        const pad = 18 * dpr;
        const minDb = -60;
        const maxDb = 0;
        const plotW = width - (pad * 2);
        const plotH = height - (pad * 2);
        const isLight = document.body.classList.contains('light-mode');
        const gridColor = isLight ? 'rgba(71, 85, 105, 0.22)' : 'rgba(148, 163, 184, 0.18)';
        const textColor = isLight ? '#1e293b' : '#94a3b8';
        const curveColor = this.audioState.compressor.enabled 
            ? (isLight ? '#0284c7' : '#22d3ee') 
            : (isLight ? '#475569' : '#64748b');
        const fillColor = this.audioState.compressor.enabled 
            ? (isLight ? 'rgba(2, 132, 199, 0.16)' : 'rgba(34, 211, 238, 0.14)') 
            : (isLight ? 'rgba(71, 85, 105, 0.12)' : 'rgba(100, 116, 139, 0.12)');

        const xOf = (db) => pad + ((db - minDb) / (maxDb - minDb)) * plotW;
        const yOf = (db) => pad + (1 - ((db - minDb) / (maxDb - minDb))) * plotH;

        ctx2.clearRect(0, 0, width, height);
        ctx2.lineWidth = 1 * dpr;
        ctx2.strokeStyle = gridColor;
        for (let db = minDb; db <= maxDb; db += 15) {
            ctx2.beginPath();
            ctx2.moveTo(xOf(db), pad);
            ctx2.lineTo(xOf(db), height - pad);
            ctx2.stroke();
            ctx2.beginPath();
            ctx2.moveTo(pad, yOf(db));
            ctx2.lineTo(width - pad, yOf(db));
            ctx2.stroke();
        }

        ctx2.strokeStyle = isLight ? '#cbd5e1' : '#334155';
        ctx2.strokeRect(pad, pad, plotW, plotH);

        const thresholdX = xOf(this.audioState.compressor.threshold);
        ctx2.strokeStyle = this.audioState.compressor.enabled ? 'rgba(34, 211, 238, 0.65)' : 'rgba(100, 116, 139, 0.65)';
        ctx2.setLineDash([4 * dpr, 4 * dpr]);
        ctx2.beginPath();
        ctx2.moveTo(thresholdX, pad);
        ctx2.lineTo(thresholdX, height - pad);
        ctx2.stroke();
        ctx2.setLineDash([]);

        ctx2.beginPath();
        for (let i = 0; i <= 160; i++) {
            const inputDb = minDb + ((maxDb - minDb) * i / 160);
            const outputDb = this.getCompressedDb(inputDb);
            const x = xOf(inputDb);
            const y = yOf(outputDb);
            if (i === 0) ctx2.moveTo(x, y);
            else ctx2.lineTo(x, y);
        }
        ctx2.lineTo(width - pad, height - pad);
        ctx2.lineTo(pad, height - pad);
        ctx2.closePath();
        ctx2.fillStyle = fillColor;
        ctx2.fill();

        ctx2.beginPath();
        for (let i = 0; i <= 160; i++) {
            const inputDb = minDb + ((maxDb - minDb) * i / 160);
            const outputDb = this.getCompressedDb(inputDb);
            const x = xOf(inputDb);
            const y = yOf(outputDb);
            if (i === 0) ctx2.moveTo(x, y);
            else ctx2.lineTo(x, y);
        }
        ctx2.strokeStyle = curveColor;
        ctx2.lineWidth = 2 * dpr;
        ctx2.stroke();

        ctx2.fillStyle = textColor;
        ctx2.font = `${10 * dpr}px monospace`;
        ctx2.fillText(`${this.audioState.compressor.threshold} dB`, Math.min(thresholdX + (5 * dpr), width - (62 * dpr)), pad + (12 * dpr));
        ctx2.fillText(`${this.audioState.compressor.ratio.toFixed(1)}:1`, width - (58 * dpr), height - (6 * dpr));
    }

    bindLiveControls(context, getPlayStateCallback, getBypassStateCallback, updateRangeFillCallback) {
        const compToggle = document.getElementById('compressor-toggle');
        if (compToggle) {
            compToggle.onclick = () => {
                this.audioState.compressor.enabled = !this.audioState.compressor.enabled;
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
            };
        }

        const compControls = [
            { id: 'comp-inputgain', key: 'inputGain' },
            { id: 'comp-threshold', key: 'threshold' },
            { id: 'comp-ratio', key: 'ratio' },
            { id: 'comp-attack', key: 'attack' },
            { id: 'comp-release', key: 'release' },
            { id: 'comp-knee', key: 'knee' },
            { id: 'comp-makeup', key: 'makeup' }
        ];

        compControls.forEach(({ id, key }) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.oninput = (e) => {
                this.audioState.compressor[key] = parseFloat(e.target.value);
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
            };
        });

        document.querySelectorAll('.comp-step-btn').forEach((button) => {
            button.onclick = () => {
                const input = document.getElementById(button.dataset.target);
                if (!input) return;

                const min = Number(input.min);
                const max = Number(input.max);
                const step = Number(input.step || 1);
                const dir = Number(button.dataset.dir || 1);
                const precision = Math.max(0, (String(input.step).split('.')[1] || '').length);
                const nextValue = Math.max(min, Math.min(max, Number(input.value) + (step * dir)));

                input.value = nextValue.toFixed(precision);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };
        });

        const compTemplateSelect = document.getElementById('comp-template-select');
        const compTemplateName = document.getElementById('comp-template-name');
        const compTemplateSave = document.getElementById('comp-template-save');

        if (compTemplateSelect) {
            compTemplateSelect.onchange = (e) => {
                const value = e.target.value;
                if (!value) return;
                const [type, rawIndex] = value.split(':');
                const idx = Number(rawIndex);
                const customTemplates = this.getCustomTemplates();
                const template = type === 'default'
                    ? this.defaultTemplates[idx]
                    : customTemplates[idx];
                if (!template) return;
                this.applyTemplate(template.settings);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
                if (compTemplateName) compTemplateName.value = template.name;
            };
        }

        if (compTemplateSave) {
            compTemplateSave.onclick = () => {
                const name = (compTemplateName && compTemplateName.value.trim()) || `Custom ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                const customTemplates = this.getCustomTemplates();
                const existingIdx = customTemplates.findIndex(template => template.name === name);
                const nextTemplate = { name, settings: this.cloneSettings() };
                if (existingIdx >= 0) customTemplates[existingIdx] = nextTemplate;
                else customTemplates.push(nextTemplate);
                this.setCustomTemplates(customTemplates);
                this.populateTemplates('comp-template-select');
                if (compTemplateSelect) compTemplateSelect.value = `custom:${existingIdx >= 0 ? existingIdx : customTemplates.length - 1}`;
                if (compTemplateName) compTemplateName.value = name;
            };
        }
    }

    getSettings() {
        return { ...this.audioState.compressor };
    }

    setSettings(settings) {
        if (settings) {
            this.audioState.compressor = { ...settings };
        }
    }
}

