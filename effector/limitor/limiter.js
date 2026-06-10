export class LimiterEffector {
    constructor(audioState) {
        this.audioState = audioState;
        this.limiterNode = null;
        this.limiterFallbackNode = null;
        this.limiterOutputGainNode = null;
        this.limiterMeterInputNode = null;
        this.limiterMeterOutputNode = null;
        
        this.limiterWorkletUrl = null;
        this.limiterWorkletReady = false;
        this.limiterWorkletContexts = new WeakSet();
        this.limiterReductionDb = 0;

        this.limiterWorkletCode = `
class LookaheadLimiterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "threshold", defaultValue: -1, minValue: -60, maxValue: 0, automationRate: "k-rate" },
      { name: "release", defaultValue: 100, minValue: 10, maxValue: 1000, automationRate: "k-rate" },
      { name: "outputGain", defaultValue: 0, minValue: -24, maxValue: 24, automationRate: "k-rate" }
    ];
  }

  constructor() {
    super();
    this.lookaheadMs = 5;
    this.lookaheadSamples = Math.max(1, Math.floor(sampleRate * this.lookaheadMs / 1000));
    this.buffers = [];
    this.writeIndex = 0;
    this.currentGain = 1;
    this.blockCount = 0;
  }

  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }

  ensureBuffers(channelCount) {
    while (this.buffers.length < channelCount) {
      this.buffers.push(new Float32Array(this.lookaheadSamples));
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0 || !output || output.length === 0) return true;

    const channelCount = Math.min(input.length, output.length);
    this.ensureBuffers(channelCount);

    const thresholdDb = parameters.threshold[0];
    const releaseMs = parameters.release[0];
    const outputGainDb = parameters.outputGain[0];
    const thresholdLinear = this.dbToLinear(thresholdDb);
    const outputGainLinear = this.dbToLinear(outputGainDb);
    const releaseCoeff = Math.exp(-1 / (sampleRate * releaseMs / 1000));
    let minGain = 1;
    let inputPeak = 0;
    let outputPeak = 0;

    for (let i = 0; i < input[0].length; i++) {
      let peak = 0;
      const readIndex = this.writeIndex;

      for (let ch = 0; ch < channelCount; ch++) {
        const sample = input[ch][i] || 0;
        if (Math.abs(sample) > peak) peak = Math.abs(sample);
      }

      inputPeak = Math.max(inputPeak, peak);
      let targetGain = peak > thresholdLinear ? thresholdLinear / peak : 1;
      if (targetGain < this.currentGain) {
        this.currentGain = targetGain;
      } else {
        this.currentGain = releaseCoeff * this.currentGain + (1 - releaseCoeff) * targetGain;
      }
      minGain = Math.min(minGain, this.currentGain);

      for (let ch = 0; ch < channelCount; ch++) {
        const delayed = this.buffers[ch][readIndex];
        this.buffers[ch][readIndex] = input[ch][i] || 0;
        const out = delayed * this.currentGain * outputGainLinear;
        output[ch][i] = out;
        outputPeak = Math.max(outputPeak, Math.abs(out));
      }

      this.writeIndex++;
      if (this.writeIndex >= this.lookaheadSamples) this.writeIndex = 0;
    }

    this.blockCount++;
    if (this.blockCount % 6 === 0) {
      const reductionDb = -20 * Math.log10(Math.max(minGain, 0.000001));
      const inputDb = 20 * Math.log10(Math.max(inputPeak, 0.000001));
      const outputDb = 20 * Math.log10(Math.max(outputPeak, 0.000001));
      this.port.postMessage({ reductionDb, inputDb, outputDb });
    }

    return true;
  }
}

registerProcessor("lookahead-limiter", LookaheadLimiterProcessor);
`;
    }

    async ensureLimiterWorklet(context) {
        if (!context.audioWorklet) return false;
        if (this.limiterWorkletContexts.has(context)) return true;
        if (!this.limiterWorkletUrl) {
            const blob = new Blob([this.limiterWorkletCode], { type: 'application/javascript' });
            this.limiterWorkletUrl = URL.createObjectURL(blob);
        }
        await context.audioWorklet.addModule(this.limiterWorkletUrl);
        this.limiterWorkletReady = true;
        this.limiterWorkletContexts.add(context);
        return true;
    }

    dbToGain(db) {
        return Math.pow(10, db / 20);
    }

    async connect(context, inputNode, getBypassStateCallback) {
        this.limiterNode = null;
        this.limiterFallbackNode = null;
        this.limiterOutputGainNode = null;

        this.limiterMeterInputNode = context.createAnalyser();
        this.limiterMeterInputNode.fftSize = 256;
        this.limiterMeterOutputNode = context.createAnalyser();
        this.limiterMeterOutputNode.fftSize = 256;

        inputNode.connect(this.limiterMeterInputNode);
        let lastOutputNode = this.limiterMeterInputNode;

        try {
            const workletAvailable = await this.ensureLimiterWorklet(context);
            if (!workletAvailable) throw new Error('AudioWorklet unavailable');
            
            this.limiterNode = new AudioWorkletNode(context, 'lookahead-limiter', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                parameterData: {
                    threshold: this.audioState.limiter.threshold,
                    release: this.audioState.limiter.release,
                    outputGain: this.audioState.limiter.outputGain
                }
            });
            this.limiterNode.port.onmessage = (event) => {
                this.limiterReductionDb = event.data.reductionDb || 0;
                const limiterInVal = document.getElementById('limiter-in-val');
                const limiterOutVal = document.getElementById('limiter-out-val');
                if (limiterInVal && Number.isFinite(event.data.inputDb)) limiterInVal.innerText = `${Math.round(event.data.inputDb)} dB`;
                if (limiterOutVal && Number.isFinite(event.data.outputDb)) limiterOutVal.innerText = `${Math.round(event.data.outputDb)} dB`;
            };
            this.applySettings(context, getBypassStateCallback);
            lastOutputNode.connect(this.limiterNode);
            this.limiterNode.connect(this.limiterMeterOutputNode);
            lastOutputNode = this.limiterNode;
        } catch (error) {
            this.limiterFallbackNode = context.createDynamicsCompressor();
            this.limiterOutputGainNode = context.createGain();
            this.applySettings(context, getBypassStateCallback);
            lastOutputNode.connect(this.limiterFallbackNode);
            this.limiterFallbackNode.connect(this.limiterOutputGainNode);
            this.limiterOutputGainNode.connect(this.limiterMeterOutputNode);
            lastOutputNode = this.limiterOutputGainNode;
        }

        return lastOutputNode;
    }

    applySettings(context, getBypassStateCallback) {
        const lim = this.audioState.limiter;
        const disabled = getBypassStateCallback() || !lim.enabled;
        const now = context.currentTime;

        if (this.limiterNode && this.limiterNode.parameters) {
            this.limiterNode.parameters.get('threshold').setValueAtTime(disabled ? 0 : lim.threshold, now);
            this.limiterNode.parameters.get('release').setValueAtTime(disabled ? 100 : lim.release, now);
            this.limiterNode.parameters.get('outputGain').setValueAtTime(disabled ? 0 : lim.outputGain, now);
        }

        if (this.limiterFallbackNode && this.limiterOutputGainNode) {
            this.limiterFallbackNode.threshold.setValueAtTime(disabled ? 0 : lim.threshold, now);
            this.limiterFallbackNode.knee.setValueAtTime(0, now);
            this.limiterFallbackNode.ratio.setValueAtTime(disabled ? 1 : 20, now);
            this.limiterFallbackNode.attack.setValueAtTime(0.001, now);
            this.limiterFallbackNode.release.setValueAtTime(disabled ? 0.1 : lim.release / 1000, now);
            this.limiterOutputGainNode.gain.setValueAtTime(disabled ? 1 : this.dbToGain(lim.outputGain), now);
        }
    }

    updateUI(updateRangeFillCallback) {
        const lim = this.audioState.limiter;
        const limiterToggle = document.getElementById('limiter-toggle');
        if (limiterToggle) {
            limiterToggle.setAttribute('aria-pressed', String(lim.enabled));
            limiterToggle.innerText = lim.enabled ? 'IN' : 'OUT';
            limiterToggle.className = lim.enabled
                ? "bg-lime-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-lime-500 shadow-md transition"
                : "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
        }
        const threshVal = document.getElementById('limiter-threshold-val');
        const releaseVal = document.getElementById('limiter-release-val');
        const outputVal = document.getElementById('limiter-output-val');

        if (threshVal) threshVal.innerText = `${lim.threshold.toFixed(1)} dB`;
        if (releaseVal) releaseVal.innerText = `${Math.round(lim.release)} ms`;
        if (outputVal) outputVal.innerText = `${lim.outputGain.toFixed(1)} dB`;

        if (updateRangeFillCallback) {
            updateRangeFillCallback();
        }
    }

    updateMeters(getBypassStateCallback) {
        const limiterInBar = document.getElementById('limiter-in-bar');
        const limiterOutBar = document.getElementById('limiter-out-bar');
        const limiterGrBar = document.getElementById('limiter-gr-bar');
        const limiterInVal = document.getElementById('limiter-in-val');
        const limiterOutVal = document.getElementById('limiter-out-val');
        const limiterGrVal = document.getElementById('limiter-gr-val');

        const getAnalyserRmsDb = (analyser) => {
            if (!analyser) return -Infinity;
            const data = new Float32Array(analyser.fftSize);
            analyser.getFloatTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
            const rms = Math.sqrt(sum / data.length);
            return 20 * Math.log10(rms + 0.000001);
        };

        const isEnabled = this.audioState.limiter.enabled && !getBypassStateCallback();

        const inputDb = isEnabled ? getAnalyserRmsDb(this.limiterMeterInputNode) : -Infinity;
        const outputDb = isEnabled ? getAnalyserRmsDb(this.limiterMeterOutputNode) : -Infinity;
        const grDb = isEnabled ? Math.max(0, this.limiterFallbackNode ? Math.abs(this.limiterFallbackNode.reduction || 0) : this.limiterReductionDb) : 0;

        const normalize = (db) => Math.max(0, Math.min(100, (db + 60) * (100 / 60)));

        if (limiterInBar) limiterInBar.style.width = normalize(inputDb) + "%";
        if (limiterOutBar) limiterOutBar.style.width = normalize(outputDb) + "%";
        if (limiterGrBar) limiterGrBar.style.width = Math.min(100, (grDb / 24) * 100) + "%";
        
        if (limiterInVal) limiterInVal.innerText = Number.isFinite(inputDb) ? `${Math.round(inputDb)} dB` : "-inf";
        if (limiterOutVal) limiterOutVal.innerText = Number.isFinite(outputDb) ? `${Math.round(outputDb)} dB` : "-inf";
        if (limiterGrVal) limiterGrVal.innerText = grDb.toFixed(1) + " dB";
    }

    bindLiveControls(context, getPlayStateCallback, getBypassStateCallback, updateRangeFillCallback) {
        const limiterToggle = document.getElementById('limiter-toggle');
        if (limiterToggle) {
            limiterToggle.onclick = () => {
                this.audioState.limiter.enabled = !this.audioState.limiter.enabled;
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
            };
        }

        const limiterControls = [
            { id: 'limiter-threshold', key: 'threshold' },
            { id: 'limiter-release', key: 'release' },
            { id: 'limiter-output', key: 'outputGain' }
        ];

        limiterControls.forEach(({ id, key }) => {
            const input = document.getElementById(id);
            if (!input) return;
            input.oninput = (e) => {
                this.audioState.limiter[key] = parseFloat(e.target.value);
                this.updateUI(updateRangeFillCallback);
                if (getPlayStateCallback()) this.applySettings(context, getBypassStateCallback);
            };
        });
    }

    getSettings() {
        return { ...this.audioState.limiter };
    }

    setSettings(settings) {
        if (settings) {
            this.audioState.limiter = { ...settings };
        }
    }

    syncInputs() {
        const lim = this.audioState.limiter;
        const thresh = document.getElementById('limiter-threshold');
        const release = document.getElementById('limiter-release');
        const output = document.getElementById('limiter-output');
        if (thresh) thresh.value = lim.threshold;
        if (release) release.value = lim.release;
        if (output) output.value = lim.outputGain;
    }
}
