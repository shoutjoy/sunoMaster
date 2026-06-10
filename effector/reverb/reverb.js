export class ReverbEffector {
    constructor(audioState) {
        this.audioState = audioState;
        this.presets = {
            default_reverb: { name: "Default Reverb", preDelay: 105, decay: 1.8, diffusion: 58, lowGain: -1, highGain: 1.5, mix: 22 },
            small_room: { name: "Small Room", preDelay: 20, decay: 1.2, diffusion: 70, lowGain: -2, highGain: 1, mix: 15 },
            vocal_hall: { name: "Vocal Hall", preDelay: 40, decay: 2.8, diffusion: 90, lowGain: -1, highGain: 2, mix: 30 },
            vocal_plate: { name: "Vocal Plate", preDelay: 10, decay: 2.2, diffusion: 95, lowGain: -3, highGain: 3, mix: 25 },
            cathedral: { name: "Cathedral", preDelay: 90, decay: 8.0, diffusion: 100, lowGain: 1, highGain: 0, mix: 50 },
            arena: { name: "Arena", preDelay: 70, decay: 5.0, diffusion: 90, lowGain: 0, highGain: 1, mix: 45 },
            drum_room: { name: "Drum Room", preDelay: 5, decay: 0.8, diffusion: 60, lowGain: 0, highGain: -1, mix: 10 },
            snare_plate: { name: "Snare Plate", preDelay: 15, decay: 1.5, diffusion: 90, lowGain: -2, highGain: 4, mix: 20 },
            guitar_room: { name: "Guitar Room", preDelay: 15, decay: 1.0, diffusion: 80, lowGain: -1, highGain: 2, mix: 15 },
            piano_hall: { name: "Piano Hall", preDelay: 30, decay: 3.5, diffusion: 95, lowGain: 0, highGain: 1, mix: 30 },
            ambient_space: { name: "Ambient Space", preDelay: 120, decay: 12.0, diffusion: 100, lowGain: 0, highGain: 4, mix: 70 }
        };
        this.customPresetKey = 'jd-reverb-presets';
        this.nodes = {
            input: null,
            output: null,
            dry: null,
            wet: null,
            preDelay: null,
            convolver: null,
            lowShelf: null,
            highShelf: null
        };
    }

    getCustomPresets() {
        try {
            return JSON.parse(localStorage.getItem(this.customPresetKey) || '[]');
        } catch (error) {
            return [];
        }
    }

    setCustomPresets(presets) {
        try {
            localStorage.setItem(this.customPresetKey, JSON.stringify(presets));
        } catch (error) {}
    }

    cloneSettings(settings = this.audioState.reverb) {
        const fallback = { enabled: true, preDelay: 105, decay: 1.8, diffusion: 58, lowGain: -1, highGain: 1.5, mix: 22 };
        return {
            enabled: settings.enabled === undefined ? fallback.enabled : Boolean(settings.enabled),
            preDelay: Number.isFinite(Number(settings.preDelay)) ? Number(settings.preDelay) : fallback.preDelay,
            decay: Number.isFinite(Number(settings.decay)) ? Number(settings.decay) : fallback.decay,
            diffusion: Number.isFinite(Number(settings.diffusion)) ? Number(settings.diffusion) : fallback.diffusion,
            lowGain: Number.isFinite(Number(settings.lowGain)) ? Number(settings.lowGain) : fallback.lowGain,
            highGain: Number.isFinite(Number(settings.highGain)) ? Number(settings.highGain) : fallback.highGain,
            mix: Number.isFinite(Number(settings.mix)) ? Number(settings.mix) : fallback.mix
        };
    }

    createReverbImpulse(context, duration = 1.2, diffusion = 70) {
        const sampleRate = context.sampleRate;
        const length = Math.max(1, Math.floor(sampleRate * duration));
        const impulse = context.createBuffer(2, length, sampleRate);
        const diffusionAmount = Math.max(0, Math.min(1, diffusion / 100));
        const decayPower = 1.4 + (diffusionAmount * 2.4);

        for (let ch = 0; ch < 2; ch++) {
            const channel = impulse.getChannelData(ch);
            let smoothed = 0;
            for (let i = 0; i < length; i++) {
                const t = i / length;
                const noise = (Math.random() * 2) - 1;
                smoothed = (smoothed * diffusionAmount) + (noise * (1 - diffusionAmount));
                channel[i] = smoothed * Math.pow(1 - t, decayPower);
            }
        }
        return impulse;
    }

    populatePresets(selectId) {
        const reverbPreset = document.getElementById(selectId);
        if (!reverbPreset) return;
        const customPresets = this.getCustomPresets();
        reverbPreset.innerHTML = '<option value="">Reverb Preset</option>';
        Object.entries(this.presets).forEach(([key, preset]) => {
            const option = document.createElement('option');
            option.value = `default:${key}`;
            option.textContent = preset.name;
            reverbPreset.appendChild(option);
        });
        customPresets.forEach((preset, idx) => {
            const option = document.createElement('option');
            option.value = `custom:${idx}`;
            option.textContent = `Saved: ${preset.name}`;
            reverbPreset.appendChild(option);
        });
    }

    connect(context, inputNode, getBypassStateCallback) {
        this.nodes.input = context.createGain();
        this.nodes.output = context.createGain();
        this.nodes.dry = context.createGain();
        this.nodes.wet = context.createGain();
        this.nodes.preDelay = context.createDelay(1);
        this.nodes.convolver = context.createConvolver();
        this.nodes.lowShelf = context.createBiquadFilter();
        this.nodes.highShelf = context.createBiquadFilter();

        this.nodes.lowShelf.type = 'lowshelf';
        this.nodes.lowShelf.frequency.value = 250;
        this.nodes.highShelf.type = 'highshelf';
        this.nodes.highShelf.frequency.value = 4000;
        this.nodes.convolver.buffer = this.createReverbImpulse(context, this.audioState.reverb.decay, this.audioState.reverb.diffusion);

        inputNode.connect(this.nodes.input);
        this.nodes.input.connect(this.nodes.dry);
        this.nodes.input.connect(this.nodes.preDelay);
        this.nodes.preDelay.connect(this.nodes.convolver);
        this.nodes.convolver.connect(this.nodes.lowShelf);
        this.nodes.lowShelf.connect(this.nodes.highShelf);
        this.nodes.highShelf.connect(this.nodes.wet);
        this.nodes.dry.connect(this.nodes.output);
        this.nodes.wet.connect(this.nodes.output);

        this.applySettings(context, getBypassStateCallback, false);
        return this.nodes.output;
    }

    applySettings(context, getBypassStateCallback, rebuildImpulse = false) {
        if (!this.nodes.input) return;
        const rvb = this.audioState.reverb;
        const disabled = getBypassStateCallback() || !rvb.enabled;
        const now = context.currentTime;
        const mix = disabled ? 0 : Math.max(0, Math.min(1, rvb.mix / 100));

        this.nodes.dry.gain.setValueAtTime(1 - mix, now);
        this.nodes.wet.gain.setValueAtTime(mix, now);
        this.nodes.preDelay.delayTime.setValueAtTime((disabled ? 0 : rvb.preDelay) / 1000, now);
        this.nodes.lowShelf.gain.setValueAtTime(disabled ? 0 : rvb.lowGain, now);
        this.nodes.highShelf.gain.setValueAtTime(disabled ? 0 : rvb.highGain, now);

        if (rebuildImpulse && this.nodes.convolver) {
            this.nodes.convolver.buffer = this.createReverbImpulse(context, rvb.decay, rvb.diffusion);
        }
    }

    syncInputs() {
        const rvb = this.audioState.reverb;
        const preDelay = document.getElementById('reverb-predelay');
        const decay = document.getElementById('reverb-decay');
        const diffusion = document.getElementById('reverb-diffusion');
        const mix = document.getElementById('reverb-mix');
        const low = document.getElementById('reverb-low');
        const high = document.getElementById('reverb-high');

        if (preDelay) preDelay.value = rvb.preDelay;
        if (decay) decay.value = rvb.decay;
        if (diffusion) diffusion.value = rvb.diffusion;
        if (mix) mix.value = rvb.mix;
        if (low) low.value = rvb.lowGain;
        if (high) high.value = rvb.highGain;
    }

    formatCompactNumber(value) {
        return Number.isInteger(value) ? String(value) : value.toFixed(1);
    }

    updateUI(updateRangeFillCallback) {
        const rvb = this.audioState.reverb;
        const reverbToggle = document.getElementById('reverb-toggle');
        if (reverbToggle) {
            reverbToggle.setAttribute('aria-pressed', String(rvb.enabled));
            reverbToggle.innerText = rvb.enabled ? 'IN' : 'OUT';
            reverbToggle.className = rvb.enabled
                ? "bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-violet-500 shadow-md shadow-violet-500/30 transition"
                : "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
        }
        const predelayVal = document.getElementById('reverb-predelay-val');
        const decayVal = document.getElementById('reverb-decay-val');
        const diffusionVal = document.getElementById('reverb-diffusion-val');
        const mixVal = document.getElementById('reverb-mix-val');
        const lowVal = document.getElementById('reverb-low-val');
        const highVal = document.getElementById('reverb-high-val');

        if (predelayVal) predelayVal.innerText = `${Math.round(rvb.preDelay)} ms`;
        if (decayVal) decayVal.innerText = `${this.formatCompactNumber(rvb.decay)} s`;
        if (diffusionVal) diffusionVal.innerText = `${Math.round(rvb.diffusion)} %`;
        if (mixVal) mixVal.innerText = `${Math.round(rvb.mix)} %`;
        if (lowVal) lowVal.innerText = `${this.formatCompactNumber(rvb.lowGain)} dB`;
        if (highVal) highVal.innerText = `${this.formatCompactNumber(rvb.highGain)} dB`;

        if (updateRangeFillCallback) {
            updateRangeFillCallback();
        }
    }

    bindLiveControls(context, getPlayStateCallback, getBypassStateCallback, updateRangeFillCallback) {
        const reverbToggle = document.getElementById('reverb-toggle');
        if (reverbToggle) {
            reverbToggle.onclick = () => {
                this.audioState.reverb.enabled = !this.audioState.reverb.enabled;
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
            };
        }

        const reverbPreset = document.getElementById('reverb-preset');
        const reverbTemplateName = document.getElementById('reverb-template-name');
        const reverbTemplateSave = document.getElementById('reverb-template-save');

        if (reverbPreset) {
            reverbPreset.onchange = (e) => {
                const value = e.target.value;
                if (!value) return;
                const [type, rawKey] = value.split(':');
                const customPresets = this.getCustomPresets();
                const preset = type === 'default'
                    ? this.presets[rawKey]
                    : customPresets[Number(rawKey)];
                if (!preset) return;

                const settings = type === 'default' ? preset : preset.settings;

                this.audioState.reverb = this.cloneSettings(settings);
                this.syncInputs();
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback, true);
                if (reverbTemplateName) reverbTemplateName.value = preset.name;
            };
        }

        if (reverbTemplateSave) {
            reverbTemplateSave.onclick = () => {
                const name = (reverbTemplateName && reverbTemplateName.value.trim()) || `Custom ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                const customPresets = this.getCustomPresets();
                const existingIdx = customPresets.findIndex(p => p.name === name);
                const nextPreset = { name, settings: this.cloneSettings() };
                if (existingIdx >= 0) customPresets[existingIdx] = nextPreset;
                else customPresets.push(nextPreset);
                this.setCustomPresets(customPresets);
                this.populatePresets('reverb-preset');
                if (reverbPreset) reverbPreset.value = `custom:${existingIdx >= 0 ? existingIdx : customPresets.length - 1}`;
                if (reverbTemplateName) reverbTemplateName.value = name;
            };
        }

        const reverbControls = [
            { id: 'reverb-predelay', key: 'preDelay', rebuild: false },
            { id: 'reverb-decay', key: 'decay', rebuild: true },
            { id: 'reverb-diffusion', key: 'diffusion', rebuild: true },
            { id: 'reverb-mix', key: 'mix', rebuild: false },
            { id: 'reverb-low', key: 'lowGain', rebuild: false },
            { id: 'reverb-high', key: 'highGain', rebuild: false }
        ];

        reverbControls.forEach(({ id, key, rebuild }) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.oninput = (e) => {
                this.audioState.reverb[key] = parseFloat(e.target.value);
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback, rebuild);
            };
        });
    }

    getSettings() {
        return { ...this.audioState.reverb };
    }

    setSettings(settings) {
        if (settings) {
            this.audioState.reverb = { ...settings };
        }
    }
}
