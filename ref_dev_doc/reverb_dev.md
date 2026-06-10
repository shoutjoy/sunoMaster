실제 DAW 수준의 Reverb를 구현하려면 단순히 `ConvolverNode` 하나만 사용하는 것이 아니라 아래 구조로 만드는 것이 좋다.

```text
Input
 ↓
PreDelay
 ↓
Early Reflection
 ↓
Diffusion
 ↓
Reverb Tail
 ↓
Low EQ
 ↓
High EQ
 ↓
Stereo Width
 ↓
Wet Gain
 ↓
Mix
 ↓
Output
```

---

# 1. 파일 구조

```text
audio/
 ├─ ReverbEngine.js
 ├─ PreDelay.js
 ├─ EarlyReflection.js
 ├─ Diffusion.js
 ├─ ReverbTail.js
 ├─ ReverbEQ.js
 ├─ StereoWidth.js
 ├─ Presets.js
 ├─ IRGenerator.js
 └─ ReverbUI.js
```

---

# 2. PreDelay.js

```javascript
export class PreDelay {

  constructor(ctx) {

    this.ctx = ctx;

    this.delay = ctx.createDelay(1);

    this.delay.delayTime.value = 0.05;
  }

  connect(node){
    this.delay.connect(node);
  }

  get input(){
    return this.delay;
  }

  setTime(ms){
    this.delay.delayTime.value = ms / 1000;
  }
}
```

---

# 3. ReverbEQ.js

```javascript
export class ReverbEQ {

  constructor(ctx){

    this.lowShelf = ctx.createBiquadFilter();
    this.highShelf = ctx.createBiquadFilter();

    this.lowShelf.type = "lowshelf";
    this.highShelf.type = "highshelf";

    this.lowShelf.frequency.value = 250;
    this.highShelf.frequency.value = 4000;

    this.lowShelf.connect(this.highShelf);
  }

  setLowGain(db){
    this.lowShelf.gain.value = db;
  }

  setHighGain(db){
    this.highShelf.gain.value = db;
  }

}
```

---

# 4. EarlyReflection.js

실제 공간의 첫 반사음

```javascript
export class EarlyReflection {

  constructor(ctx){

    this.input = ctx.createGain();

    this.output = ctx.createGain();

    const taps = [0.01,0.03,0.05,0.08];

    taps.forEach(time=>{

      const delay = ctx.createDelay();

      delay.delayTime.value = time;

      const gain = ctx.createGain();

      gain.gain.value = 0.5;

      this.input.connect(delay);
      delay.connect(gain);
      gain.connect(this.output);

    });

  }

}
```

---

# 5. Diffusion.js

Schroeder Reverb 구조

```javascript
export class Diffusion {

  constructor(ctx){

    this.input = ctx.createGain();
    this.output = ctx.createGain();

    const delays = [0.029,0.037,0.041];

    delays.forEach(time=>{

      const delay = ctx.createDelay();

      delay.delayTime.value = time;

      const feedback = ctx.createGain();

      feedback.gain.value = 0.7;

      delay.connect(feedback);
      feedback.connect(delay);

      this.input.connect(delay);
      delay.connect(this.output);

    });

  }

}
```

---

# 6. IRGenerator.js

Impulse Response 생성

```javascript
export function createImpulseResponse(
  ctx,
  duration = 3,
  decay = 2
){

  const sampleRate = ctx.sampleRate;

  const length =
    sampleRate * duration;

  const impulse =
    ctx.createBuffer(
      2,
      length,
      sampleRate
    );

  for(let ch=0; ch<2; ch++){

    const channel =
      impulse.getChannelData(ch);

    for(let i=0; i<length; i++){

      channel[i] =
        (Math.random()*2-1)
        *
        Math.pow(
          1 - i/length,
          decay
        );
    }
  }

  return impulse;
}
```

---

# 7. ReverbTail.js

```javascript
import { createImpulseResponse }
from "./IRGenerator.js";

export class ReverbTail {

  constructor(ctx){

    this.convolver =
      ctx.createConvolver();

    this.convolver.buffer =
      createImpulseResponse(
        ctx,
        3,
        2
      );
  }

}
```

---

# 8. StereoWidth.js

```javascript
export class StereoWidth {

  constructor(ctx){

    this.splitter =
      ctx.createChannelSplitter(2);

    this.merger =
      ctx.createChannelMerger(2);

    this.width = 1.0;
  }

}
```

---

# 9. Presets.js

실제 리버브 프리셋

```javascript
export const REVERB_PRESETS = {

  vocal_small_room : {

    preDelay : 20,
    decay : 1.2,
    diffusion : 0.7,
    lowGain : -2,
    highGain : 1,
    mix : 0.15

  },

  vocal_hall : {

    preDelay : 40,
    decay : 2.8,
    diffusion : 0.9,
    lowGain : -1,
    highGain : 2,
    mix : 0.30

  },

  vocal_plate : {

    preDelay : 10,
    decay : 2.2,
    diffusion : 0.95,
    lowGain : -3,
    highGain : 3,
    mix : 0.25

  },

  cathedral : {

    preDelay : 90,
    decay : 8.0,
    diffusion : 1.0,
    lowGain : 1,
    highGain : 0,
    mix : 0.50

  },

  arena : {

    preDelay : 70,
    decay : 5.0,
    diffusion : 0.9,
    lowGain : 0,
    highGain : 1,
    mix : 0.45

  },

  drum_room : {

    preDelay : 5,
    decay : 0.8,
    diffusion : 0.6,
    lowGain : 0,
    highGain : -1,
    mix : 0.10

  },

  snare_plate : {

    preDelay : 15,
    decay : 1.5,
    diffusion : 0.9,
    lowGain : -2,
    highGain : 4,
    mix : 0.20

  },

  guitar_room : {

    preDelay : 15,
    decay : 1.0,
    diffusion : 0.8,
    lowGain : -1,
    highGain : 2,
    mix : 0.15

  },

  piano_hall : {

    preDelay : 30,
    decay : 3.5,
    diffusion : 0.95,
    lowGain : 0,
    highGain : 1,
    mix : 0.30

  },

  ambient_space : {

    preDelay : 120,
    decay : 12.0,
    diffusion : 1.0,
    lowGain : 0,
    highGain : 4,
    mix : 0.70

  }

};
```

---

# 10. ReverbEngine.js

```javascript
export class ReverbEngine {

  constructor(ctx){

    this.ctx = ctx;

    this.input =
      ctx.createGain();

    this.output =
      ctx.createGain();

    this.dry =
      ctx.createGain();

    this.wet =
      ctx.createGain();

    this.preDelay =
      ctx.createDelay();

    this.convolver =
      ctx.createConvolver();

    this.input.connect(this.dry);

    this.input.connect(this.preDelay);

    this.preDelay.connect(
      this.convolver
    );

    this.convolver.connect(
      this.wet
    );

    this.dry.connect(
      this.output
    );

    this.wet.connect(
      this.output
    );
  }

  setMix(value){

    this.dry.gain.value =
      1 - value;

    this.wet.gain.value =
      value;
  }

}
```

# 실제 상용 플러그인 수준 추가 기능

다음 기능을 추가하면 Valhalla, FabFilter Pro-R 수준에 가까워진다.

```text
✓ Pre Delay
✓ Early Reflection
✓ Diffusion
✓ Reverb Tail
✓ Damping
✓ Low Cut
✓ High Cut
✓ Stereo Width
✓ Ducking
✓ Freeze
✓ Modulation
✓ Shimmer
✓ Reverse Reverb
✓ Gate Reverb
✓ IR Import
✓ Preset Manager
✓ GPU Waveform Visualization
```

특히 사용 중인 오디오/영상 편집 웹앱이라면 다음 프리셋 10종은 기본 탑재를 추천한다.

```text
Small Room
Large Room
Studio
Plate
Hall
Cathedral
Arena
Drum Room
Piano Hall
Ambient Space
```

이 정도 구성부터는 단순 Web Audio API 효과기가 아니라 실제 DAW용 리버브 엔진 구조에 해당한다.
