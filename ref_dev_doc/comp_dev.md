## 1. 컴프레서의 핵심 기능

컴프레서는 입력 신호의 **큰 소리만 자동으로 줄여서 전체 다이내믹 레인지를 좁히는 오디오 처리기**이다.

기본 원리는 다음과 같다.

```hwp
입력레벨 > 임계값 일 때, 초과분을 비율에 따라 줄인다
```

예를 들어 Threshold가 `-20 dB`, Ratio가 `4:1`이면, 입력이 Threshold보다 `4 dB` 초과할 때 출력은 `1 dB`만 초과하도록 줄어든다.

---

## 2. 주요 요소

| 요소             | 의미               | 믹싱에서의 역할                 | JS 구현                        |
| -------------- | ---------------- | ------------------------ | ---------------------------- |
| Threshold      | 압축이 시작되는 기준 레벨   | 어느 크기부터 누를지 결정           | `compressor.threshold.value` |
| Ratio          | 압축 비율            | 얼마나 강하게 누를지 결정           | `compressor.ratio.value`     |
| Attack         | 압축이 작동하기 시작하는 시간 | 빠르면 타격음 감소, 느리면 펀치 유지    | `compressor.attack.value`    |
| Release        | 압축이 풀리는 시간       | 자연스러움, 펌핑감 결정            | `compressor.release.value`   |
| Knee           | 압축 시작의 부드러움      | Hard/Soft compression 결정 | `compressor.knee.value`      |
| Makeup Gain    | 압축 후 전체 볼륨 보상    | 작아진 음량을 다시 키움            | `GainNode` 사용                |
| Gain Reduction | 실제 줄어든 양         | 컴프레서 작동량 확인              | `compressor.reduction`       |
| Input Gain     | 컴프레서에 들어가는 신호 크기 | 압축량 조절                   | `GainNode`                   |
| Output Gain    | 최종 출력 크기         | 클리핑 방지                   | `GainNode`                   |

---

## 3. Web Audio API 기본 구조

```text
Audio Source
 → Input Gain
 → DynamicsCompressorNode
 → Makeup Gain
 → Output Gain
 → Destination
```

---

## 4. HTML 기본 UI

```html
<input type="file" id="audioFile" accept="audio/*">

<button id="playBtn">Play</button>
<button id="stopBtn">Stop</button>

<label>Threshold</label>
<input type="range" id="threshold" min="-60" max="0" value="-24" step="1">

<label>Ratio</label>
<input type="range" id="ratio" min="1" max="20" value="4" step="0.1">

<label>Attack</label>
<input type="range" id="attack" min="0" max="1" value="0.003" step="0.001">

<label>Release</label>
<input type="range" id="release" min="0.01" max="1" value="0.25" step="0.01">

<label>Knee</label>
<input type="range" id="knee" min="0" max="40" value="30" step="1">

<label>Makeup Gain</label>
<input type="range" id="makeup" min="0" max="24" value="6" step="0.5">
```

---

## 5. JavaScript 구현 예시

```javascript
let audioContext;
let source;
let buffer;

let inputGain;
let compressor;
let makeupGain;
let outputGain;

const fileInput = document.getElementById("audioFile");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");

fileInput.addEventListener("change", async function () {
  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();

  audioContext = new AudioContext();
  buffer = await audioContext.decodeAudioData(arrayBuffer);
});

playBtn.addEventListener("click", function () {
  if (!buffer) return;

  source = audioContext.createBufferSource();
  source.buffer = buffer;

  inputGain = audioContext.createGain();
  compressor = audioContext.createDynamicsCompressor();
  makeupGain = audioContext.createGain();
  outputGain = audioContext.createGain();

  compressor.threshold.value = Number(document.getElementById("threshold").value);
  compressor.ratio.value = Number(document.getElementById("ratio").value);
  compressor.attack.value = Number(document.getElementById("attack").value);
  compressor.release.value = Number(document.getElementById("release").value);
  compressor.knee.value = Number(document.getElementById("knee").value);

  const makeupDb = Number(document.getElementById("makeup").value);
  makeupGain.gain.value = dbToGain(makeupDb);

  source
    .connect(inputGain)
    .connect(compressor)
    .connect(makeupGain)
    .connect(outputGain)
    .connect(audioContext.destination);

  source.start();
});

stopBtn.addEventListener("click", function () {
  if (source) source.stop();
});

function dbToGain(db) {
  return Math.pow(10, db / 20);
}
```

---

## 6. 실시간 파라미터 연결

```javascript
document.getElementById("threshold").addEventListener("input", e => {
  compressor.threshold.value = Number(e.target.value);
});

document.getElementById("ratio").addEventListener("input", e => {
  compressor.ratio.value = Number(e.target.value);
});

document.getElementById("attack").addEventListener("input", e => {
  compressor.attack.value = Number(e.target.value);
});

document.getElementById("release").addEventListener("input", e => {
  compressor.release.value = Number(e.target.value);
});

document.getElementById("knee").addEventListener("input", e => {
  compressor.knee.value = Number(e.target.value);
});

document.getElementById("makeup").addEventListener("input", e => {
  makeupGain.gain.value = dbToGain(Number(e.target.value));
});
```

---

## 7. 믹싱용 권장 초기값

| 목적         |    Threshold |         Ratio |       Attack |     Release |    Knee |
| ---------- | -----------: | ------------: | -----------: | ----------: | ------: |
| 보컬 자연 압축   | -18 ~ -24 dB |     2:1 ~ 4:1 | 0.005 ~ 0.03 |   0.1 ~ 0.3 | 20 ~ 30 |
| 드럼 강한 압축   | -10 ~ -20 dB |     4:1 ~ 8:1 | 0.001 ~ 0.01 |  0.05 ~ 0.2 |  5 ~ 15 |
| 마스터 버스     |  -6 ~ -12 dB | 1.5:1 ~ 2.5:1 |  0.01 ~ 0.05 |   0.1 ~ 0.5 | 20 ~ 40 |
| 라디오식 강한 압축 | -24 ~ -36 dB |        8:1 이상 | 0.001 ~ 0.01 | 0.05 ~ 0.15 |  0 ~ 10 |

---

## 8. 구현 시 필요한 추가 요소

실제 앱으로 만들려면 다음이 필요하다.

```text
1. 파일 업로드
2. 오디오 디코딩
3. Play / Pause / Stop
4. 컴프레서 노드 연결
5. 파라미터 슬라이더
6. Gain Reduction 표시
7. Before / After 비교 버튼
8. Waveform 또는 Level Meter
9. Export 기능
```

핵심은 다음이다.

```text
간단 구현: DynamicsCompressorNode
정밀 구현: AudioWorkletProcessor
렌더링/다운로드: OfflineAudioContext
시각화: AnalyserNode
```

`DynamicsCompressorNode`는 빠르게 구현하기 좋지만, 세밀한 RMS 감지, Peak/RMS 선택, Sidechain, Lookahead, Parallel Compression은 직접 구현해야 한다.
