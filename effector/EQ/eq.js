class EQEffector {
    constructor(audioState) {
        this.audioState = audioState;
        this.frequencies = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        this.labels = ["31.5", "63", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
        this.filters = [];
    }

    renderUI(containerId) {
        const sliderContainer = document.getElementById(containerId);
        if (!sliderContainer) return;
        sliderContainer.innerHTML = "";
        this.frequencies.forEach((freq, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = "eq-slider-wrap flex flex-col items-center h-full space-y-1";
            wrapper.innerHTML = `
                <div class="eq-slider-shell">
                    <div class="eq-zero-line"></div>
                    <div class="eq-fill" id="eq-fill-${idx}"></div>
                    <input type="range" min="-12" max="12" value="${this.audioState.eq[idx] || 0}" class="vertical-slider" id="eq-${idx}">
                </div>
                <span class="text-[9px] text-gray-500 font-mono mt-1 select-none">${this.labels[idx]}</span>
            `;
            sliderContainer.appendChild(wrapper);
            this.updateSliderFill(wrapper.querySelector(`#eq-${idx}`));
        });
    }

    updateSliderFill(slider) {
        if (!slider) return;

        const min = Number(slider.min);
        const max = Number(slider.max);
        const value = Number(slider.value);
        const zeroPercent = ((max - 0) / (max - min)) * 100;
        const valuePercent = ((max - value) / (max - min)) * 100;
        const start = Math.min(zeroPercent, valuePercent);
        const end = Math.max(zeroPercent, valuePercent);
        const fill = document.getElementById(`eq-fill-${slider.id.replace('eq-', '')}`);

        if (fill) {
            fill.style.top = `${start}%`;
            fill.style.height = `${Math.max(0, end - start)}%`;
            fill.style.opacity = value === 0 ? '0' : '1';
        }
    }

    updateSliderFills() {
        this.frequencies.forEach((_, idx) => {
            this.updateSliderFill(document.getElementById(`eq-${idx}`));
        });
    }

    connect(context, inputNode, isBypassed) {
        this.filters = [];
        let lastOutputNode = inputNode;
        const disabled = isBypassed || !this.audioState.eqEnabled;

        this.frequencies.forEach((freq, idx) => {
            const filter = context.createBiquadFilter();
            filter.type = (idx === 0) ? 'lowshelf' : (idx === this.frequencies.length - 1) ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.0;
            filter.gain.value = disabled ? 0 : this.audioState.eq[idx];

            lastOutputNode.connect(filter);
            lastOutputNode = filter;
            this.filters.push(filter);
        });

        return lastOutputNode;
    }

    applySettings(context, isBypassed) {
        const disabled = isBypassed || !this.audioState.eqEnabled;
        this.filters.forEach((filter, idx) => {
            if (filter) {
                filter.gain.setValueAtTime(disabled ? 0 : this.audioState.eq[idx], context.currentTime);
            }
        });
    }

    updateUI() {
        const toggle = document.getElementById('eq-toggle');
        if (toggle) {
            const enabled = this.audioState.eqEnabled;
            toggle.setAttribute('aria-pressed', String(enabled));
            toggle.innerText = enabled ? 'IN' : 'OUT';
            toggle.className = enabled
                ? "bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500 shadow-md transition"
                : "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
        }
        this.updateSliderFills();
    }

    bindLiveControls(context, getPlayStateCallback, getBypassStateCallback) {
        const toggle = document.getElementById('eq-toggle');
        if (toggle) {
            toggle.onclick = () => {
                this.audioState.eqEnabled = !this.audioState.eqEnabled;
                this.updateUI();
                if (getPlayStateCallback()) {
                    this.applySettings(context, getBypassStateCallback());
                }
            };
        }
        this.updateUI();

        this.frequencies.forEach((_, idx) => {
            const slider = document.getElementById(`eq-${idx}`);
            if (slider) {
                slider.oninput = (e) => {
                    const val = parseFloat(e.target.value);
                    this.audioState.eq[idx] = val;
                    this.updateSliderFill(e.target);
                    const disabled = getBypassStateCallback() || !this.audioState.eqEnabled;
                    if (getPlayStateCallback() && !disabled && this.filters[idx]) {
                        this.filters[idx].gain.setValueAtTime(val, context.currentTime);
                    }
                };
            }
        });
    }

    setEQValue(idx, val, context, getPlayStateCallback, getBypassStateCallback) {
        this.audioState.eq[idx] = val;
        const slider = document.getElementById(`eq-${idx}`);
        if (slider) {
            slider.value = val;
            this.updateSliderFill(slider);
        }
        const disabled = getBypassStateCallback() || !this.audioState.eqEnabled;
        if (getPlayStateCallback() && !disabled && this.filters[idx]) {
            this.filters[idx].gain.setValueAtTime(val, context.currentTime);
        }
    }

    resetUI() {
        this.frequencies.forEach((_, idx) => {
            const slider = document.getElementById(`eq-${idx}`);
            if (slider) {
                slider.value = 0;
                this.updateSliderFill(slider);
            }
        });
        this.updateUI();
    }

    getSettings() {
        return {
            eq: [...this.audioState.eq],
            eqEnabled: this.audioState.eqEnabled
        };
    }

    setSettings(settings) {
        if (settings) {
            if (settings.eq) this.audioState.eq = [...settings.eq];
            if (settings.eqEnabled !== undefined) this.audioState.eqEnabled = settings.eqEnabled;
        }
    }
}
