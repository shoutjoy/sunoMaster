아래는 **HTML + JS + AudioWorklet** 기반 오디오 리미터 구현이다. 핵심은 `lookahead`, `threshold`, `release`, `outputGain`이다.

## 1. index.html

```html
<input type="file" id="file" accept="audio/*" />
<button id="play">Play</button>
<button id="stop">Stop</button>

<label>Threshold dB</label>
<input id="threshold" type="range" min="-20" max="0" value="-1" step="0.1">

<label>Release ms</label>
<input id="release" type="range" min="10" max="1000" value="100" step="1">

<label>Output Gain dB</label>
<input id="outputGain" type="range" min="-12" max="6" value="0" step="0.1">

<script src="main.js"></script>
```

## 2. main.js

```javascript
let audioContext;
let audioBuffer;
let source;
let limiterNode;

const fileInput = document.getElementById("file");
const playBtn = document.getElementById("play");
const stopBtn = document.getElementById("stop");

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  audioContext = new AudioContext();

  await audioContext.audioWorklet.addModule("limiter-worklet.js");

  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  limiterNode = new AudioWorkletNode(audioContext, "lookahead-limiter", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    parameterData: {
      threshold: -1,
      release: 100,
      outputGain: 0
    }
  });

  connectControls();
});

playBtn.addEventListener("click", async () => {
  if (!audioBuffer || !audioContext || !limiterNode) return;

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  source
    .connect(limiterNode)
    .connect(audioContext.destination);

  source.start();
});

stopBtn.addEventListener("click", () => {
  if (source) {
    source.stop();
    source.disconnect();
    source = null;
  }
});

function connectControls() {
  const threshold = document.getElementById("threshold");
  const release = document.getElementById("release");
  const outputGain = document.getElementById("outputGain");

  threshold.addEventListener("input", e => {
    limiterNode.parameters
      .get("threshold")
      .setValueAtTime(Number(e.target.value), audioContext.currentTime);
  });

  release.addEventListener("input", e => {
    limiterNode.parameters
      .get("release")
      .setValueAtTime(Number(e.target.value), audioContext.currentTime);
  });

  outputGain.addEventListener("input", e => {
    limiterNode.parameters
      .get("outputGain")
      .setValueAtTime(Number(e.target.value), audioContext.currentTime);
  });
}
```

## 3. limiter-worklet.js

```javascript
class LookaheadLimiterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "threshold",
        defaultValue: -1,
        minValue: -60,
        maxValue: 0,
        automationRate: "k-rate"
      },
      {
        name: "release",
        defaultValue: 100,
        minValue: 10,
        maxValue: 1000,
        automationRate: "k-rate"
      },
      {
        name: "outputGain",
        defaultValue: 0,
        minValue: -24,
        maxValue: 24,
        automationRate: "k-rate"
      }
    ];
  }

  constructor() {
    super();

    this.lookaheadMs = 5;
    this.lookaheadSamples = Math.floor(sampleRate * this.lookaheadMs / 1000);

    this.bufferL = new Float32Array(this.lookaheadSamples);
    this.bufferR = new Float32Array(this.lookaheadSamples);

    this.writeIndex = 0;
    this.currentGain = 1;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length === 0) return true;

    const inputL = input[0];
    const inputR = input[1] || input[0];

    const outputL = output[0];
    const outputR = output[1] || output[0];

    const thresholdDb = parameters.threshold[0];
    const releaseMs = parameters.release[0];
    const outputGainDb = parameters.outputGain[0];

    const thresholdLinear = this.dbToLinear(thresholdDb);
    const outputGainLinear = this.dbToLinear(outputGainDb);

    const releaseCoeff = Math.exp(-1 / (sampleRate * releaseMs / 1000));

    for (let i = 0; i < inputL.length; i++) {
      const inL = inputL[i];
      const inR = inputR[i];

      const readIndex = this.writeIndex;

      const delayedL = this.bufferL[readIndex];
      const delayedR = this.bufferR[readIndex];

      this.bufferL[readIndex] = inL;
      this.bufferR[readIndex] = inR;

      this.writeIndex++;
      if (this.writeIndex >= this.lookaheadSamples) {
        this.writeIndex = 0;
      }

      const peak = Math.max(Math.abs(inL), Math.abs(inR));

      let targetGain = 1;

      if (peak > thresholdLinear) {
        targetGain = thresholdLinear / peak;
      }

      if (targetGain < this.currentGain) {
        this.currentGain = targetGain;
      } else {
        this.currentGain =
          releaseCoeff * this.currentGain +
          (1 - releaseCoeff) * targetGain;
      }

      outputL[i] = delayedL * this.currentGain * outputGainLinear;
      outputR[i] = delayedR * this.currentGain * outputGainLinear;
    }

    return true;
  }

  dbToLinear(db) {
    return Math.pow(10, db / 20);
  }
}

registerProcessor("lookahead-limiter", LookaheadLimiterProcessor);
```

## 4. 권장 세팅

```text
Threshold: -1 dB
Release: 50 ~ 150 ms
Output Gain: 0 dB
Lookahead: 3 ~ 5 ms
```

## 5. 구조

```text
Audio Source
 → Lookahead Limiter
 → Destination
```

앱에 넣을 때는 보통 다음 구조가 좋다.

```text
Audio Source
 → EQ
 → Compressor
 → Limiter
 → Output
```

이 코드는 `DynamicsCompressorNode`보다 리미터에 더 가깝다. 피크를 미리 보고 줄이는 `lookahead limiter`이기 때문이다.
