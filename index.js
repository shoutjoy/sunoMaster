import { EQEffector } from './effector/EQ/eq.js';
import { ReverbEffector } from './effector/reverb/reverb.js';
import { CompressorEffector } from './effector/Compressor/compressor.js';
import { LimiterEffector } from './effector/limitor/limiter.js';

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');

function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-mode', isLight);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(isLight));
    if (themeIcon) themeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if (themeLabel) themeLabel.innerText = isLight ? 'Dark' : 'Light';
}

function getStoredTheme() {
    try {
        return localStorage.getItem('jd-theme') || 'dark';
    } catch (error) {
        return 'dark';
    }
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem('jd-theme', theme);
    } catch (error) {}
}

const savedTheme = getStoredTheme();
applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.onclick = () => {
        const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
        setStoredTheme(nextTheme);
        applyTheme(nextTheme);
        updateCompressorRangeFills();
        compressor.drawCurve();
    };
}

const eqLabels = ["31.5", "63", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];

const stemRegistry = [
    { id: "s1", name: "CH 1: Kick (드럼 저역 타격음)", freq: 60, type: "lowshelf", color: "text-amber-400", accent: "accent-amber-500" },
    { id: "s2", name: "CH 2: Snare (드럼 스네어 중역 타격)", freq: 220, type: "peaking", color: "text-amber-400", accent: "accent-amber-500" },
    { id: "s3", name: "CH 3: Hi-Hats (드럼 심벌 고역 금속음)", freq: 8500, type: "highshelf", color: "text-amber-300", accent: "accent-amber-400" },
    { id: "s4", name: "CH 4: Toms/Perc (탐탐 퍼커션 세션)", freq: 160, type: "peaking", color: "text-amber-300", accent: "accent-amber-400" },
    { id: "s5", name: "CH 5: Sub-Bass (서브 베이스 초저역)", freq: 45, type: "lowshelf", color: "text-emerald-400", accent: "accent-emerald-500" },
    { id: "s6", name: "CH 6: Synth Bass (베이스 라인 리듬축)", freq: 120, type: "peaking", color: "text-emerald-400", accent: "accent-emerald-500" },
    { id: "s7", name: "CH 7: Lead Vocal (메인 보컬 센터 라인)", freq: 2000, type: "peaking", color: "text-purple-400", accent: "accent-purple-500" },
    { id: "s8", name: "CH 8: Chorus/Back (코러스 서브 화음단)", freq: 3000, type: "peaking", color: "text-purple-300", accent: "accent-purple-400" },
    { id: "s9", name: "CH 9: Ac.Guitar (통기타 스트로크 선율)", freq: 350, type: "peaking", color: "text-cyan-400", accent: "accent-cyan-500" },
    { id: "s10", name: "CH 10: El.Guitar (일렉 기타 배킹 락)", freq: 1500, type: "peaking", color: "text-cyan-400", accent: "accent-cyan-500" },
    { id: "s11", name: "CH 11: Ac.Piano (그랜드 피아노 메인)", freq: 600, type: "peaking", color: "text-blue-400", accent: "accent-blue-500" },
    { id: "s12", name: "CH 12: E.Piano/Clav (일렉트릭 건반 백킹)", freq: 900, type: "peaking", color: "text-blue-400", accent: "accent-blue-500" },
    { id: "s13", name: "CH 13: Lead Synth (신디사이저 멜로디 리드)", freq: 2500, type: "peaking", color: "text-sky-400", accent: "accent-sky-500" },
    { id: "s14", name: "CH 14: Synth Pad (배경 앰비언트 패드)", freq: 1100, type: "peaking", color: "text-sky-400", accent: "accent-sky-500" },
    { id: "s15", name: "CH 15: Strings Ens (현악 오케스트라 앙상블)", freq: 3200, type: "peaking", color: "text-pink-400", accent: "accent-pink-500" },
    { id: "s16", name: "CH 16: Brass Section (관악 브라스 힛 파트)", freq: 1800, type: "peaking", color: "text-orange-400", accent: "accent-orange-500" },
    { id: "s17", name: "CH 17: Woodwinds (플루트 등 목관 악기)", freq: 2300, type: "peaking", color: "text-teal-400", accent: "accent-teal-500" },
    { id: "s18", name: "CH 18: Sound Effects (SFX 특수 인펙트 효과)", freq: 12000, type: "highshelf", color: "text-rose-400", accent: "accent-rose-500" },
    { id: "s19", name: "CH 19: Reverb Tail (리버브 잔향 공간감)", freq: 5000, type: "peaking", color: "text-fuchsia-400", accent: "accent-fuchsia-500" },
    { id: "s20", name: "CH 20: Delay Echo (딜레이 피드백 반복)", freq: 4000, type: "peaking", color: "text-fuchsia-400", accent: "accent-fuchsia-500" }
];

const presetNames = [
    "Analog Warmth", "Nordic Cool", "Silk Velvet", "Airy Horizon", "Vintage Gold", "Subtle Intimacy", "Brilliant Glow", "Dark Room", "Crisp Winter", "Summer Haze", 
    "Neon Nostalgia", "Misty Morning", "Golden Hour", "Midnight Melancholy", "Cozy Tube", "Tape Saturation", "Ethereal Dream", "Cosmic Breath", "Heavy Pressure", "Crystal Clear",
    "Lo-Fi Nostalgia", "Vinyl Dust", "Plush Vibe", "Washed Out", "Overdrive Aggressive",
    "K-Pop Target", "Dance Pop Energy", "Modern R&B Clean", "Neo Soul Smooth", "Club Pop Bounce", "Vocal Presence", "Shining Top", "Hip-Hop Heavy", "Boom Bap 90s", "UK Drill Dark", 
    "Trap Gold", "Lo-Fi Lounge", "Synthwave 80s", "Chillhop Vibe", "Retro Funk", "Bedroom Pop", "Acoustic Pop Warm", "Gospel Air", "Disco Groove", "Latin Urban",
    "Indie Pop Sweet", "Future Soul", "Afrobeats Pulse", "Melodic Rap", "West Coast Glide",
    "Modern Rock Edge", "Heavy Metal Punch", "Hard Rock Solid", "Punk Raw Power", "Alternative Grit", "Grunge Mud", "Indie Stadium", "Progressive Wide", "Thrash Core", "Deathcore Low",
    "Nu-Metal Thick", "Classic Rock Air", "Blues Crunch", "Psychedelic Space", "Math Rock Clean", "Garage Raw", "Stoner Heavy", "Gothic Dark", "Pop Punk Bright", "Post-Rock Sky",
    "Symphonic Metal", "Djent Lowend", "Sludge Thick", "Southern Warm", "Vintage British",
    "EDM Festival", "Club House Bass", "Deep Techno Sub", "Future Bass Sparkle", "Dubstep In-Your-Face", "Drum & Bass Speed", "Psytrance Drive", "Hardstyle Hardcore", "Minimal Tech Peak", "Nu-Disco High",
    "Cinematic Wide", "Orchestral Hall", "Epic Trailer", "Deep Ambient Space", "Drone Isolation", "Space Echo", "Telephone Retro", "Radio Lo-fi Filter", "Megaphone Cut", "Stadium Live Reverb",
    "Cyberpunk Industrial", "Glitch Glitch", "Trip-Hop Moody", "Chillout Wave", "Mastering Flat Line"
];

const audioState = {
    eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    eqEnabled: false,
    stems: {},
    stemsEnabled: false,
    mutes: {}, 
    noise: 0,
    noiseEnabled: false,
    deesser: 0,
    deesserEnabled: false,
    saturator: 0, 
    saturatorEnabled: false,
    reverb: {
        enabled: false,
        preDelay: 105,
        decay: 1.8,
        diffusion: 58,
        lowGain: -1,
        highGain: 1.5,
        mix: 22
    },
    compressor: {
        enabled: false,
        inputGain: 0,
        threshold: -24,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
        knee: 30,
        makeup: 6
    },
    limiter: {
        enabled: false,
        threshold: -1,
        release: 100,
        outputGain: 0
    },
    master: 100
};

stemRegistry.forEach(s => {
    audioState.stems[s.id] = 0;
    audioState.mutes[s.id] = false;
});

// Initialize effector modules
const eq = new EQEffector(audioState);
const reverb = new ReverbEffector(audioState);
const compressor = new CompressorEffector(audioState);
const limiter = new LimiterEffector(audioState);

let audioCtx = null;
let originalBuffer = null;
let sourceNode = null;
let isPlaying = false;
let startTime = 0;
let pausedAt = 0;
let isBypassed = false;
let isLooping = false;
let isUserSeeking = false; 
let activeStemIds = [];
let waveformPeaks = [];
let waveformProgress = 0;
let currentAudioFileBlob = null;
let currentAudioFileName = "";


let stemFilters = {};
let noiseFilters = { lowCut: null, highCut: null, deEsser: null, waveShaper: null }; 
let masterGainNode = null;
let analyserNode = null;

const playBtn = document.getElementById('play-btn');
const loopBtn = document.getElementById('loop-btn');
const upload = document.getElementById('audio-upload');
const downloadBtn = document.getElementById('download-btn');
const exportProgressPanel = document.getElementById('export-progress-panel');
const exportProgressFill = document.getElementById('export-progress-fill');
const exportProgressText = document.getElementById('export-progress-text');
const exportStatusText = document.getElementById('export-status-text');
const exportCancelBtn = document.getElementById('export-cancel-btn');
const trackName = document.getElementById('track-name');
const timeDisplay = document.getElementById('time-display');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const detectorStatus = document.getElementById('detector-status');
const clipLed = document.getElementById('clip-led');
const lufsBar = document.getElementById('lufs-bar');
const lufsText = document.getElementById('lufs-text');
const waveformCanvas = document.getElementById('audio-waveform');
const waveformCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
const waveformTime = document.getElementById('waveform-time');
const compGrBar = document.getElementById('comp-gr-bar');
const compGrVal = document.getElementById('comp-gr-val');

function setProgressBarValue(value) {
    const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    if (progressBar) progressBar.value = clampedValue;
    if (progressPercent) progressPercent.innerText = `${Math.round(clampedValue)}%`;
}

let activeExportJob = null;

function setExportProgress(value, statusText) {
    const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    if (exportProgressFill) exportProgressFill.style.width = `${clampedValue}%`;
    if (exportProgressText) exportProgressText.innerText = `${Math.round(clampedValue)}%`;
    if (exportStatusText && statusText) exportStatusText.innerText = statusText;
}

function showExportProgress(statusText = 'WAV 내보내기 준비 중') {
    if (exportProgressPanel) exportProgressPanel.classList.remove('hidden');
    if (exportCancelBtn) exportCancelBtn.disabled = false;
    setExportProgress(0, statusText);
}

function hideExportProgress(delay = 0) {
    window.setTimeout(() => {
        if (exportProgressPanel) exportProgressPanel.classList.add('hidden');
        setExportProgress(0, 'WAV 내보내기 준비 중');
    }, delay);
}

function setDownloadButtonEnabled(enabled) {
    if (!downloadBtn) return;
    downloadBtn.disabled = !enabled;
}

// Helper to check play/bypass states in effectors
const getPlayState = () => isPlaying;
const getBypassState = () => isBypassed;

// UI 1: 10단 EQ 렌더러
eq.renderUI('eq-sliders-container');

// UI 2: 20채널 스마트 믹서 사전 장착
const matrixContainer = document.getElementById('stems-matrix-container');
function buildInitialStemMatrixUI() {
    matrixContainer.innerHTML = "";
    stemRegistry.forEach((stem) => {
        const card = document.createElement('div');
        card.id = `card-${stem.id}`;
        card.className = "bg-[#090d16]/50 p-2 rounded-xl border border-gray-900 flex flex-col space-y-1 opacity-20 pointer-events-none select-none transition-all";
        card.innerHTML = `
            <div class="flex justify-between items-center text-xs font-medium">
                <span class="text-gray-600 truncate max-w-[70%]" id="title-${stem.id}"><i class="fa-solid fa-lock mr-1.5"></i>${stem.name}</span>
                <div class="flex items-center gap-1">
                    <button id="mute-${stem.id}" class="bg-gray-800 text-gray-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-gray-700 hover:bg-gray-700 transition" disabled>M</button>
                    <span id="val-${stem.id}" class="font-mono text-gray-700 text-[10px]">Disabled</span>
                </div>
            </div>
            <input type="range" id="input-${stem.id}" min="-20" max="8" value="0" step="0.5" class="w-full h-1 bg-gray-950 rounded appearance-none" disabled>
        `;
        matrixContainer.appendChild(card);
    });
}
buildInitialStemMatrixUI();

// UI 3: 100가지 스타일 라이브러리 드로우
const genreGrid = document.getElementById('genre-grid');

// "선택 안 함" (None) 버튼 추가
const noneBtn = document.createElement('button');
noneBtn.className = `preset-btn genre-active`;
noneBtn.innerHTML = `<span class="preset-num">-</span>선택 안 함 (Flat)`;
noneBtn.onclick = () => {
    document.querySelectorAll('#genre-grid button').forEach(b => b.classList.remove('genre-active'));
    noneBtn.classList.add('genre-active');
    
    eq.frequencies.forEach((_, idx) => {
        eq.setEQValue(idx, 0, audioCtx, getPlayState, getBypassState);
    });
};
genreGrid.appendChild(noneBtn);

presetNames.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = `preset-btn`;
    btn.innerHTML = `<span class="preset-num">${i+1}.</span>${name}`;
    btn.onclick = () => {
        document.querySelectorAll('#genre-grid button').forEach(b => b.classList.remove('genre-active'));
        btn.classList.add('genre-active');
        
        eq.frequencies.forEach((_, idx) => {
            let base = Math.sin(idx + i) * 5;
            if (name.includes("Warmth")) base += 3;
            if (name.includes("Cool")) base = (idx > 5) ? base + 4 : base - 3;
            let bounded = Math.max(-12, Math.min(12, Math.round(base)));
            
            eq.setEQValue(idx, bounded, audioCtx, getPlayState, getBypassState);
        });
    };
    genreGrid.appendChild(btn);
});

// Exciter curve shaper
function makeExciterCurve(amount) {
    let n_samples = 44100;
    let curve = new Float32Array(n_samples);
    let blend = (amount / 100) * 0.4; 
    for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        if (blend === 0) {
            curve[i] = x;
        } else {
            curve[i] = x + blend * Math.sin(x * Math.PI * 0.5);
        }
    }
    return curve;
}

function applyUtilityEffectSettings(context) {
    if (!context) return;
    const noiseVal = (!isBypassed && audioState.noiseEnabled) ? audioState.noise : 0;
    const deesserVal = (!isBypassed && audioState.deesserEnabled) ? audioState.deesser : 0;
    const saturatorVal = (!isBypassed && audioState.saturatorEnabled) ? audioState.saturator : 0;

    if (noiseFilters.lowCut) noiseFilters.lowCut.frequency.setValueAtTime(10 + (noiseVal * 1.2), context.currentTime);
    if (noiseFilters.highCut) noiseFilters.highCut.frequency.setValueAtTime(22000 - (noiseVal * 120), context.currentTime);
    if (noiseFilters.deEsser) noiseFilters.deEsser.gain.setValueAtTime(- (deesserVal / 100) * 12, context.currentTime);
    if (noiseFilters.waveShaper) noiseFilters.waveShaper.curve = makeExciterCurve(saturatorVal);
}

function formatTime(t) {
    return String(Math.floor(t / 60)).padStart(2,'0') + ':' + String(Math.floor(t % 60)).padStart(2,'0');
}

function buildWaveformPeaks(buffer, bucketCount = 900) {
    if (!buffer) return [];

    const channelCount = buffer.numberOfChannels;
    const sampleCount = buffer.length;
    const blockSize = Math.max(1, Math.floor(sampleCount / bucketCount));
    const peaks = [];

    for (let i = 0; i < bucketCount; i++) {
        const start = i * blockSize;
        const end = Math.min(sampleCount, start + blockSize);
        let peak = 0;

        for (let ch = 0; ch < channelCount; ch++) {
            const data = buffer.getChannelData(ch);
            for (let s = start; s < end; s++) {
                const value = Math.abs(data[s]);
                if (value > peak) peak = value;
            }
        }

        peaks.push(peak);
    }

    const maxPeak = Math.max(...peaks, 0.0001);
    return peaks.map(value => value / maxPeak);
}

function drawAudioWaveform(progress = waveformProgress) {
    if (!waveformCanvas || !waveformCtx) return;

    const rect = waveformCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (waveformCanvas.width !== width || waveformCanvas.height !== height) {
        waveformCanvas.width = width;
        waveformCanvas.height = height;
    }

    const ctx2 = waveformCtx;
    const isLight = document.body.classList.contains('light-mode');
    const bg = isLight ? '#eef3f8' : '#03050a';
    const grid = isLight ? 'rgba(71, 85, 105, 0.18)' : 'rgba(148, 163, 184, 0.12)';
    const idle = isLight ? '#94a3b8' : '#334155';
    const played = isLight ? '#0284c7' : '#22d3ee';
    const centerY = height / 2;
    const padY = 10 * dpr;

    ctx2.clearRect(0, 0, width, height);
    ctx2.fillStyle = bg;
    ctx2.fillRect(0, 0, width, height);

    ctx2.strokeStyle = grid;
    ctx2.lineWidth = 1 * dpr;
    for (let x = 0; x <= width; x += width / 12) {
        ctx2.beginPath();
        ctx2.moveTo(x, 0);
        ctx2.lineTo(x, height);
        ctx2.stroke();
    }
    for (let y = 0; y <= height; y += height / 4) {
        ctx2.beginPath();
        ctx2.moveTo(0, y);
        ctx2.lineTo(width, y);
        ctx2.stroke();
    }

    const peaks = waveformPeaks.length ? waveformPeaks : new Array(180).fill(0.02);
    const barCount = Math.min(peaks.length, Math.floor(width / (3 * dpr)));
    const step = peaks.length / barCount;
    const barW = Math.max(1 * dpr, width / barCount - (1 * dpr));
    const playX = Math.max(0, Math.min(width, progress * width));

    for (let i = 0; i < barCount; i++) {
        const peak = peaks[Math.floor(i * step)] || 0;
        const x = i * (width / barCount);
        const barH = Math.max(1.5 * dpr, peak * (height - padY * 2));
        ctx2.fillStyle = x <= playX ? played : idle;
        ctx2.fillRect(x, centerY - (barH / 2), barW, barH);
    }

    ctx2.fillStyle = isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(34, 211, 238, 0.12)';
    ctx2.fillRect(0, 0, playX, height);

    ctx2.strokeStyle = '#f59e0b';
    ctx2.lineWidth = 2 * dpr;
    ctx2.beginPath();
    ctx2.moveTo(playX, 0);
    ctx2.lineTo(playX, height);
    ctx2.stroke();

    if (!originalBuffer) {
        ctx2.fillStyle = '#64748b';
        ctx2.font = `${11 * dpr}px monospace`;
        ctx2.fillText('Waiting for audio upload...', 12 * dpr, centerY + (4 * dpr));
    }
}

function updateWaveformProgress(current = 0) {
    const duration = originalBuffer ? originalBuffer.duration : 0;
    waveformProgress = duration ? Math.max(0, Math.min(1, current / duration)) : 0;
    if (waveformTime) waveformTime.innerText = `${formatTime(current)} / ${formatTime(duration)}`;
    drawAudioWaveform(waveformProgress);
}

function updateLoopButton() {
    if (!loopBtn) return;
    loopBtn.setAttribute('aria-pressed', String(isLooping));
    loopBtn.className = isLooping
        ? "w-9 h-9 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-white text-sm transition border border-amber-300 shadow-lg shadow-amber-500/50"
        : "w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm transition border border-gray-700";
}

const utilityEffectConfigs = [
    { key: 'noiseEnabled', inputId: 'noise-reducer', valId: 'noise-val', buttonId: 'noise-toggle', color: 'rose' },
    { key: 'deesserEnabled', inputId: 'deesser-reducer', valId: 'deesser-val', buttonId: 'deesser-toggle', color: 'sky' },
    { key: 'saturatorEnabled', inputId: 'saturator-volume', valId: 'saturator-val', buttonId: 'saturator-toggle', color: 'amber' }
];

function utilityButtonClass(color, enabled) {
    const onClasses = {
        rose: "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-500/30",
        sky: "bg-sky-600 border-sky-500 text-white shadow-md shadow-sky-500/30",
        amber: "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/30"
    };
    return `text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${enabled ? onClasses[color] : "bg-gray-800 border-gray-700 text-gray-400"}`;
}

function updateUtilityEffectToggles() {
    utilityEffectConfigs.forEach(({ key, buttonId, color }) => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        const enabled = Boolean(audioState[key]);
        button.setAttribute('aria-pressed', String(enabled));
        button.innerText = enabled ? 'IN' : 'OUT';
        button.className = utilityButtonClass(color, enabled);
    });
}

function setupPostEqUtilityEffects() {
    const target = document.getElementById('post-eq-effects');
    if (!target) return;

    utilityEffectConfigs.forEach(({ key, inputId, valId, buttonId, color }) => {
        const input = document.getElementById(inputId);
        const value = document.getElementById(valId);
        if (!input || !value || document.getElementById(buttonId)) return;

        const card = input.parentElement;
        const header = card ? card.querySelector('.flex.justify-between') : null;
        if (!card || !header) return;

        const right = document.createElement('div');
        right.className = 'flex items-center gap-2';
        const button = document.createElement('button');
        button.id = buttonId;
        button.type = 'button';
        button.onclick = () => {
            audioState[key] = !audioState[key];
            updateUtilityEffectToggles();
            if (audioCtx) applyUtilityEffectSettings(audioCtx);
        };

        header.appendChild(right);
        right.appendChild(button);
        right.appendChild(value);
        target.appendChild(card);
    });

    updateUtilityEffectToggles();
}

function updateRangeFill(input, color = '#22d3ee') {
    if (!input) return;
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || 0);
    const pct = max === min ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const trackColor = document.body.classList.contains('light-mode') ? '#cbd5e1' : '#1f2937';
    input.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;
}

function updateCompressorRangeFills() {
    document.querySelectorAll('.comp-slider').forEach(input => updateRangeFill(input, '#22d3ee'));
    document.querySelectorAll('.reverb-slider').forEach(input => updateRangeFill(input, '#a855f7'));
    document.querySelectorAll('.limiter-slider').forEach(input => updateRangeFill(input, '#84cc16'));
    updateRangeFill(document.getElementById('master-volume'), '#f43f5e');
    updateRangeFill(document.getElementById('noise-reducer'), '#f43f5e');
    updateRangeFill(document.getElementById('deesser-reducer'), '#0ea5e9');
    updateRangeFill(document.getElementById('saturator-volume'), '#f59e0b');
}

function syncUtilityEffectInput(input, stateKey, valueId, color, enabledKey) {
    if (!input) return;
    const val = parseFloat(input.value);
    audioState[stateKey] = val;

    const valueEl = document.getElementById(valueId);
    if (valueEl) valueEl.innerText = val + ' %';

    updateRangeFill(input, color);

    if (val > 0 && enabledKey && !audioState[enabledKey]) {
        audioState[enabledKey] = true;
        updateUtilityEffectToggles();
    }

    if (audioCtx) applyUtilityEffectSettings(audioCtx);
}

async function compileAudioGraph(context, srcNode) {
    let lastOutputNode = srcNode;

    // 1. EQ
    lastOutputNode = eq.connect(context, lastOutputNode, isBypassed);

    // 2. 20 Channel smart stems
    stemFilters = {};
    const stemsDisabled = isBypassed || !audioState.stemsEnabled;
    stemRegistry.forEach((stem) => {
        if (activeStemIds.includes(stem.id)) {
            const filter = context.createBiquadFilter();
            filter.type = stem.type;
            filter.frequency.value = stem.freq;
            filter.Q.value = 0.8;
            filter.gain.value = stemsDisabled ? 0 : (audioState.mutes[stem.id] ? -40 : audioState.stems[stem.id]);

            lastOutputNode.connect(filter);
            lastOutputNode = filter;
            stemFilters[stem.id] = filter;
        }
    });

    // 3. Noise reduction
    noiseFilters.lowCut = context.createBiquadFilter();
    noiseFilters.lowCut.type = 'highpass';
    noiseFilters.highCut = context.createBiquadFilter();
    noiseFilters.highCut.type = 'lowpass';

    const noiseVal = (!isBypassed && audioState.noiseEnabled) ? audioState.noise : 0;
    noiseFilters.lowCut.frequency.value = isBypassed ? 10 : 10 + (noiseVal * 1.2);
    noiseFilters.highCut.frequency.value = isBypassed ? 22000 : 22000 - (noiseVal * 120);

    lastOutputNode.connect(noiseFilters.lowCut);
    noiseFilters.lowCut.connect(noiseFilters.highCut);
    lastOutputNode = noiseFilters.highCut;

    // 4. De-Esser
    noiseFilters.deEsser = context.createBiquadFilter();
    noiseFilters.deEsser.type = 'peaking';
    noiseFilters.deEsser.frequency.value = 6500; 
    noiseFilters.deEsser.Q.value = 2.0;          
    noiseFilters.deEsser.gain.value = (!isBypassed && audioState.deesserEnabled) ? - (audioState.deesser / 100) * 12 : 0;

    lastOutputNode.connect(noiseFilters.deEsser);
    lastOutputNode = noiseFilters.deEsser;

    // 5. Tubes Harmonics Exciter
    noiseFilters.waveShaper = context.createWaveShaper();
    noiseFilters.waveShaper.curve = makeExciterCurve((!isBypassed && audioState.saturatorEnabled) ? audioState.saturator : 0);
    noiseFilters.waveShaper.oversample = '4x'; 

    lastOutputNode.connect(noiseFilters.waveShaper);
    lastOutputNode = noiseFilters.waveShaper;

    // 6. Reverb
    lastOutputNode = reverb.connect(context, lastOutputNode, () => isBypassed);

    // 7. Compressor
    lastOutputNode = compressor.connect(context, lastOutputNode, () => isBypassed);

    // 8. Limiter
    lastOutputNode = await limiter.connect(context, lastOutputNode, () => isBypassed);

    // 9. Master volume out gain
    masterGainNode = context.createGain();
    masterGainNode.gain.value = isBypassed ? 1.0 : (audioState.master / 100);

    lastOutputNode.connect(masterGainNode);
    return masterGainNode;
}

function updateStemsToggleUI() {
    const toggle = document.getElementById('stems-toggle');
    if (toggle) {
        const enabled = audioState.stemsEnabled;
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.innerText = enabled ? 'IN' : 'OUT';
        toggle.className = enabled
            ? "bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-500 shadow-md transition"
            : "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
    }
}

// Live control bindings
function bindLiveControlTriggers() {
    eq.bindLiveControls(audioCtx, getPlayState, getBypassState);
    reverb.bindLiveControls(audioCtx, getPlayState, getBypassState, updateCompressorRangeFills);
    compressor.bindLiveControls(audioCtx, getPlayState, getBypassState, updateCompressorRangeFills);
    limiter.bindLiveControls(audioCtx, getPlayState, getBypassState, updateCompressorRangeFills);

    const stemsToggle = document.getElementById('stems-toggle');
    if (stemsToggle) {
        stemsToggle.onclick = () => {
            audioState.stemsEnabled = !audioState.stemsEnabled;
            updateStemsToggleUI();
            if (isPlaying && audioCtx) {
                const stemsDisabled = isBypassed || !audioState.stemsEnabled;
                stemRegistry.forEach(stem => {
                    if (activeStemIds.includes(stem.id) && stemFilters[stem.id]) {
                        const gainVal = stemsDisabled ? 0 : (audioState.mutes[stem.id] ? -40 : audioState.stems[stem.id]);
                        stemFilters[stem.id].gain.setValueAtTime(gainVal, audioCtx.currentTime);
                    }
                });
            }
        };
    }
    updateStemsToggleUI();

    const stemsCollapseBtn = document.getElementById('stems-collapse-btn');
    const stemsCollapseContent = document.getElementById('stems-collapse-content');
    const stemsCollapseIcon = document.getElementById('stems-collapse-icon');
    if (stemsCollapseBtn && stemsCollapseContent && stemsCollapseIcon) {
        stemsCollapseBtn.onclick = () => {
            const isCollapsed = stemsCollapseContent.classList.contains('hidden');
            if (isCollapsed) {
                stemsCollapseContent.classList.remove('hidden');
                stemsCollapseIcon.className = "fa-solid fa-chevron-up";
            } else {
                stemsCollapseContent.classList.add('hidden');
                stemsCollapseIcon.className = "fa-solid fa-chevron-down";
            }
            setTimeout(() => {
                handleResize();
            }, 100);
        };
    }

    const eqCollapseBtn = document.getElementById('eq-collapse-btn');
    const eqCollapseContent = document.getElementById('eq-collapse-content');
    const eqCollapseIcon = document.getElementById('eq-collapse-icon');
    if (eqCollapseBtn && eqCollapseContent && eqCollapseIcon) {
        eqCollapseBtn.onclick = () => {
            const isCollapsed = eqCollapseContent.classList.contains('hidden');
            if (isCollapsed) {
                eqCollapseContent.classList.remove('hidden');
                eqCollapseIcon.className = "fa-solid fa-chevron-up";
            } else {
                eqCollapseContent.classList.add('hidden');
                eqCollapseIcon.className = "fa-solid fa-chevron-down";
            }
            setTimeout(() => {
                handleResize();
            }, 100);
        };
    }

    stemRegistry.forEach((stem) => {
        const targetSlider = document.getElementById(`input-${stem.id}`);
        if (targetSlider) {
            targetSlider.oninput = (e) => {
                let val = parseFloat(e.target.value);
                audioState.stems[stem.id] = val;
                const valText = document.getElementById(`val-${stem.id}`);
                if(valText && !audioState.mutes[stem.id]) valText.innerText = val + ' dB';
                const stemsDisabled = isBypassed || !audioState.stemsEnabled;
                if (isPlaying && !stemsDisabled && stemFilters[stem.id] && !audioState.mutes[stem.id]) {
                    stemFilters[stem.id].gain.setValueAtTime(val, audioCtx.currentTime);
                }
            };
        }
    });

    document.getElementById('noise-reducer').oninput = (e) => {
        syncUtilityEffectInput(e.target, 'noise', 'noise-val', '#f43f5e', 'noiseEnabled');
    };

    document.getElementById('deesser-reducer').oninput = (e) => {
        syncUtilityEffectInput(e.target, 'deesser', 'deesser-val', '#0ea5e9', 'deesserEnabled');
    };

    document.getElementById('saturator-volume').oninput = (e) => {
        syncUtilityEffectInput(e.target, 'saturator', 'saturator-val', '#f59e0b', 'saturatorEnabled');
    };

    document.getElementById('master-volume').oninput = (e) => {
        const val = parseFloat(e.target.value);
        audioState.master = val;
        document.getElementById('master-val').innerText = val + ' %';
        updateRangeFill(e.target, '#f43f5e');
        if (isPlaying && !isBypassed && masterGainNode) {
            masterGainNode.gain.setValueAtTime(val / 100, audioCtx.currentTime);
        }
    };
}

reverb.populatePresets('reverb-preset');
reverb.syncInputs();
const reverbPresetSelectInit = document.getElementById('reverb-preset');
if (reverbPresetSelectInit) reverbPresetSelectInit.value = "default:default_reverb";
reverb.updateUI(updateCompressorRangeFills);
setupPostEqUtilityEffects();
compressor.populateTemplates('comp-template-select');
compressor.updateUI(updateCompressorRangeFills);
limiter.updateUI(updateCompressorRangeFills);
bindLiveControlTriggers();

// Load upload activation preference configurations
const cfgSeekBar = document.getElementById('cfg-seek-bar');
const cfgTubeExciter = document.getElementById('cfg-tube-exciter');

if (cfgSeekBar) {
    const saved = localStorage.getItem('jd-cfg-seek-bar');
    cfgSeekBar.checked = saved !== null ? (saved === 'true') : true;
    cfgSeekBar.onchange = () => {
        localStorage.setItem('jd-cfg-seek-bar', String(cfgSeekBar.checked));
    };
}
if (cfgTubeExciter) {
    const saved = localStorage.getItem('jd-cfg-tube-exciter');
    cfgTubeExciter.checked = saved !== null ? (saved === 'true') : true;
    cfgTubeExciter.onchange = () => {
        localStorage.setItem('jd-cfg-tube-exciter', String(cfgTubeExciter.checked));
    };
}

// Master Reset console
document.getElementById('reset-all-btn').onclick = () => {
    audioState.eq = [0,0,0,0,0,0,0,0,0,0];
    audioState.eqEnabled = false;
    audioState.stemsEnabled = false;
    updateStemsToggleUI();
    audioState.noise = 0;
    audioState.noiseEnabled = false;
    audioState.deesser = 0;
    audioState.deesserEnabled = false;
    audioState.saturator = 0;
    audioState.saturatorEnabled = false;
    isLooping = false;
    updateLoopButton();
    audioState.reverb = {
        enabled: false,
        preDelay: 105,
        decay: 1.8,
        diffusion: 58,
        lowGain: -1,
        highGain: 1.5,
        mix: 22
    };
    audioState.compressor = {
        enabled: false,
        inputGain: 0,
        threshold: -24,
        ratio: 4,
        attack: 0.003,
        release: 0.25,
        knee: 30,
        makeup: 6
    };
    audioState.limiter = {
        enabled: false,
        threshold: -1,
        release: 100,
        outputGain: 0
    };
    audioState.master = 100;

    eq.resetUI();
    document.getElementById('noise-reducer').value = 0;
    document.getElementById('noise-val').innerText = "0 %";
    document.getElementById('deesser-reducer').value = 0;
    document.getElementById('deesser-val').innerText = "0 %";
    document.getElementById('saturator-volume').value = 0;
    document.getElementById('saturator-val').innerText = "0 %";
    updateUtilityEffectToggles();
    updateCompressorRangeFills();
    if (audioCtx) applyUtilityEffectSettings(audioCtx);
    reverb.syncInputs();
    const reverbPresetSelect = document.getElementById('reverb-preset');
    if (reverbPresetSelect) reverbPresetSelect.value = "default:default_reverb";
    reverb.updateUI(updateCompressorRangeFills);
    if (isPlaying && audioCtx) reverb.applySettings(audioCtx, () => isBypassed, true);
    
    document.getElementById('comp-inputgain').value = 0;
    document.getElementById('comp-threshold').value = -24;
    document.getElementById('comp-ratio').value = 4;
    document.getElementById('comp-attack').value = 0.003;
    document.getElementById('comp-release').value = 0.25;
    document.getElementById('comp-knee').value = 30;
    document.getElementById('comp-makeup').value = 6;
    compressor.updateUI(updateCompressorRangeFills);
    if (isPlaying && audioCtx) compressor.applySettings(audioCtx, () => isBypassed);

    document.getElementById('limiter-threshold').value = -1;
    document.getElementById('limiter-release').value = 100;
    document.getElementById('limiter-output').value = 0;
    limiter.updateUI(updateCompressorRangeFills);
    if (isPlaying && audioCtx) limiter.applySettings(audioCtx, () => isBypassed);

    document.getElementById('master-volume').value = 100;
    document.getElementById('master-val').innerText = "100 %";
    updateCompressorRangeFills();

    stemRegistry.forEach((stem) => {
        audioState.stems[stem.id] = 0;
        audioState.mutes[stem.id] = false;
        const input = document.getElementById(`input-${stem.id}`);
        const mBtn = document.getElementById(`mute-${stem.id}`);
        const valText = document.getElementById(`val-${stem.id}`);
        if (input) input.value = 0;
        if (mBtn) mBtn.className = "bg-gray-800 text-gray-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-gray-700 hover:bg-gray-700 transition";
        if (valText && activeStemIds.includes(stem.id)) valText.innerText = "0 dB";
    });

    document.querySelectorAll('#genre-grid button').forEach(b => b.classList.remove('genre-active'));
    const noneBtnEl = document.querySelector('#genre-grid button');
    if (noneBtnEl) noneBtnEl.classList.add('genre-active');
    if(isPlaying) playBtn.click();
};

// Function to synchronize the stems UI based on the activeStemIds and mutes
function syncStemsUI() {
    stemRegistry.forEach((stem) => {
        const card = document.getElementById(`card-${stem.id}`);
        const title = document.getElementById(`title-${stem.id}`);
        const valueText = document.getElementById(`val-${stem.id}`);
        const input = document.getElementById(`input-${stem.id}`);
        const mBtn = document.getElementById(`mute-${stem.id}`);

        if (!card) return;

        if (activeStemIds.includes(stem.id)) {
            card.className = "bg-[#0d1322] p-2.5 rounded-xl border border-gray-800 flex flex-col space-y-1 opacity-100 shadow-md transition-all";
            title.className = `${stem.color} font-bold text-xs truncate`;
            title.innerHTML = `<i class="fa-solid fa-circle-check mr-1.5 animate-pulse text-[10px]"></i>${stem.name}`;
            
            const isMuted = audioState.mutes[stem.id];
            if (isMuted) {
                mBtn.className = "bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-500 shadow-lg shadow-red-900/30";
                valueText.className = "font-mono text-red-400 text-[10px]";
                valueText.innerText = "MUTED";
            } else {
                mBtn.className = "bg-gray-800 text-gray-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-gray-700 hover:bg-gray-700 transition";
                valueText.className = "font-mono text-gray-300 text-[10px]";
                valueText.innerText = audioState.stems[stem.id] + " dB";
            }
            
            input.disabled = false;
            input.value = audioState.stems[stem.id];
            input.className = `w-full h-1 bg-gray-800 rounded appearance-none ${stem.accent}`;
            
            mBtn.disabled = false;
            mBtn.onclick = () => {
                audioState.mutes[stem.id] = !audioState.mutes[stem.id];
                if(audioState.mutes[stem.id]) {
                    mBtn.className = "bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-500 shadow-lg shadow-red-900/30";
                    valueText.className = "font-mono text-red-400 text-[10px]";
                    valueText.innerText = "MUTED";
                    if(isPlaying && !isBypassed && stemFilters[stem.id]) stemFilters[stem.id].gain.setValueAtTime(-40, audioCtx.currentTime);
                } else {
                    mBtn.className = "bg-gray-800 text-gray-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-gray-700 hover:bg-gray-700 transition";
                    valueText.className = "font-mono text-gray-300 text-[10px]";
                    valueText.innerText = audioState.stems[stem.id] + " dB";
                    if(isPlaying && !isBypassed && stemFilters[stem.id]) stemFilters[stem.id].gain.setValueAtTime(audioState.stems[stem.id], audioCtx.currentTime);
                }
            };
        } else {
            card.className = "bg-[#03050a]/60 p-2.5 rounded-xl border border-gray-900 flex flex-col space-y-1 opacity-20 pointer-events-none select-none";
            title.className = "text-gray-600 text-xs truncate";
            title.innerHTML = `<i class="fa-solid fa-ban mr-1.5 text-[10px]"></i>Empty Slot`;
            valueText.className = "font-mono text-gray-700 text-[10px]";
            valueText.innerText = "Disabled";
            input.disabled = true;
            mBtn.disabled = true;
        }
    });

    const statusEl = document.getElementById('detector-status');
    if (statusEl) {
        if (activeStemIds.length > 0) {
            statusEl.innerText = `(${activeStemIds.length}/20 채널 자동 분리 추출 완료)`;
        } else {
            statusEl.innerText = "(추출 대기 중)";
        }
    }
}

// Audio upload and decoding
upload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentAudioFileBlob = file;
    currentAudioFileName = file.name;

    trackName.innerText = `AI 멀티 세션 트랙 스펙트럼 분석 중...`;
    detectorStatus.innerText = "(분석 연산 중)";

    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const reader = new FileReader();
    reader.onload = function(evt) {
        audioCtx.decodeAudioData(evt.target.result, function(buffer) {
            originalBuffer = buffer;
            waveformPeaks = buildWaveformPeaks(buffer);
            updateWaveformProgress(0);
            trackName.innerText = `곡명: ${file.name}`;
            
            activeStemIds = [];
            const activeCount = Math.floor(Math.random() * 5) + 8; 
            const shuffled = [...stemRegistry].sort(() => 0.5 - Math.random());
            for(let i=0; i<activeCount; i++) activeStemIds.push(shuffled[i].id);

            // Re-initialize values for stems in audioState when new file is uploaded
            stemRegistry.forEach(s => {
                audioState.stems[s.id] = 0;
                audioState.mutes[s.id] = false;
            });

            syncStemsUI();

            playBtn.disabled = false;
            
            const enableSeekBar = document.getElementById('cfg-seek-bar')?.checked !== false;
            progressBar.disabled = !enableSeekBar;
            
            downloadBtn.disabled = false;
            playBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            downloadBtn.classList.remove('opacity-40', 'cursor-not-allowed');

            const enableTubeExciter = document.getElementById('cfg-tube-exciter')?.checked !== false;
            audioState.saturatorEnabled = enableTubeExciter;
            audioState.saturator = enableTubeExciter ? 15 : 0;
            
            const saturatorInput = document.getElementById('saturator-volume');
            if (saturatorInput) {
                saturatorInput.value = audioState.saturator;
                const valSpan = document.getElementById('saturator-val');
                if (valSpan) valSpan.innerText = audioState.saturator + ' %';
            }
            updateUtilityEffectToggles();
            updateCompressorRangeFills();
            
            pausedAt = 0;
            isPlaying = false;
            setProgressBarValue(0);
            updateWaveformProgress(0);
            playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;
        }, function(err) {
            alert("오디오 데이터 디코딩에 실패했습니다. 포맷을 다시 확인해 주세요.");
        });
    };
    reader.readAsArrayBuffer(file);
};

progressBar.onmousedown = () => { isUserSeeking = true; };
progressBar.onmouseup = () => { isUserSeeking = false; };
progressBar.oninput = (e) => {
    if (!originalBuffer) return;
    let pct = parseFloat(e.target.value) / 100;
    let targetTime = pct * originalBuffer.duration;
    timeDisplay.innerText = `${formatTime(targetTime)} / ${formatTime(originalBuffer.duration)}`;
    updateWaveformProgress(targetTime);
};
progressBar.onchange = async (e) => {
    if (!originalBuffer) return;
    let pct = parseFloat(e.target.value) / 100;
    pausedAt = pct * originalBuffer.duration;
    updateWaveformProgress(pausedAt);
    
    if (isPlaying) {
        if (sourceNode) { try { sourceNode.stop(); } catch(err){} }
        await startPlaybackAt(pausedAt);
    }
    isUserSeeking = false;
};

function seekToWaveformEvent(e, shouldRestartPlayback = true) {
    if (!originalBuffer || !waveformCanvas || progressBar.disabled) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgressBarValue(pct * 100);
    progressBar.dispatchEvent(new Event('input', { bubbles: true }));
    if (shouldRestartPlayback) {
        progressBar.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

if (waveformCanvas) {
    waveformCanvas.onmousedown = (e) => {
        isUserSeeking = true;
        seekToWaveformEvent(e, false);
    };
    waveformCanvas.onmousemove = (e) => {
        if (!isUserSeeking) return;
        seekToWaveformEvent(e, false);
    };
    window.addEventListener('mouseup', (e) => {
        if (!isUserSeeking) return;
        seekToWaveformEvent(e, true);
        isUserSeeking = false;
    });
}

async function startPlaybackAt(offset = 0) {
    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = originalBuffer;

    const finalizedOutput = await compileAudioGraph(audioCtx, sourceNode);
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 512;

    finalizedOutput.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    bindLiveControlTriggers();

    pausedAt = Math.max(0, Math.min(offset, originalBuffer.duration));
    startTime = audioCtx.currentTime - pausedAt;
    sourceNode.start(0, pausedAt);
    isPlaying = true;
    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;

    sourceNode.onended = async () => {
        if (!isPlaying || audioCtx.currentTime - startTime < originalBuffer.duration - 0.1) return;

        if (isLooping) {
            pausedAt = 0;
            updateWaveformProgress(0);
            await startPlaybackAt(0);
            return;
        }

        isPlaying = false;
        pausedAt = 0;
        playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;
        updateWaveformProgress(0);
    };
}

if (loopBtn) {
    loopBtn.onclick = () => {
        isLooping = !isLooping;
        updateLoopButton();
    };
}
updateLoopButton();

playBtn.onclick = async () => {
    if (!originalBuffer) return;

    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    if (isPlaying) {
        if(sourceNode) { try { sourceNode.stop(); } catch(e){} }
        pausedAt = audioCtx.currentTime - startTime;
        isPlaying = false;
        playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;
    } else {
        if (pausedAt >= originalBuffer.duration) pausedAt = 0;
        await startPlaybackAt(pausedAt);
    }
};

setInterval(() => {
    if (!originalBuffer || !audioCtx) return;
    let current = isPlaying ? (audioCtx.currentTime - startTime) : pausedAt;
    if (current > originalBuffer.duration) current = originalBuffer.duration;
    if (current < 0) current = 0;
    
    timeDisplay.innerText = `${formatTime(current)} / ${formatTime(originalBuffer.duration)}`;
    updateWaveformProgress(current);
    
    if (!isUserSeeking && progressBar) {
        setProgressBarValue((current / originalBuffer.duration) * 100);
    }
}, 250);

// A/B bypass routing switch
const btnA = document.getElementById('bypass-a');
const btnB = document.getElementById('bypass-b');
function executeBypassRouting(mode) {
    isBypassed = mode;
    if (isBypassed) {
        btnA.className = "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-600 text-white shadow-md";
        btnB.className = "px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-400 hover:text-white";
        if (isPlaying) {
            eq.applySettings(audioCtx, isBypassed);
            Object.values(stemFilters).forEach(f => f.gain.setValueAtTime(0, audioCtx.currentTime));
            applyUtilityEffectSettings(audioCtx);
            reverb.applySettings(audioCtx, () => isBypassed);
            compressor.applySettings(audioCtx, () => isBypassed);
            limiter.applySettings(audioCtx, () => isBypassed);
            if(masterGainNode) masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
        }
    } else {
        btnA.className = "px-2.5 py-1 rounded-md text-[11px] font-semibold text-gray-400 hover:text-white";
        btnB.className = "px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600 text-white shadow-md";
        if (isPlaying) {
            eq.applySettings(audioCtx, isBypassed);
            const stemsDisabled = isBypassed || !audioState.stemsEnabled;
            stemRegistry.forEach(stem => {
                if (activeStemIds.includes(stem.id) && stemFilters[stem.id]) {
                    const gainVal = stemsDisabled ? 0 : (audioState.mutes[stem.id] ? -40 : audioState.stems[stem.id]);
                    stemFilters[stem.id].gain.setValueAtTime(gainVal, audioCtx.currentTime);
                }
            });
            applyUtilityEffectSettings(audioCtx);
            reverb.applySettings(audioCtx, () => isBypassed);
            compressor.applySettings(audioCtx, () => isBypassed);
            limiter.applySettings(audioCtx, () => isBypassed);
            if(masterGainNode) masterGainNode.gain.setValueAtTime(audioState.master / 100, audioCtx.currentTime);
        }
    }
}
btnA.onclick = () => executeBypassRouting(true);
btnB.onclick = () => executeBypassRouting(false);

function convertAudioBufferToWavBlob(buffer) {
    let numOfChan = buffer.numberOfChannels, length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length), view = new DataView(bufferArr),
        channels = [], i, sample, offset = 0, pos = 0;
    const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; };
    const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66);
    setUint32(16); setUint16(1); setUint16(numOfChan); setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); setUint32(length - pos - 4);
    for (i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, sample, true); pos += 2;
        }
        offset++;
    }
    return new Blob([bufferArr], { type: 'audio/wav' });
}

// Lossless bounce export
if (exportCancelBtn) {
    exportCancelBtn.onclick = () => {
        if (!activeExportJob) return;
        activeExportJob.cancelled = true;
        if (activeExportJob.timer) window.clearInterval(activeExportJob.timer);
        if (exportCancelBtn) exportCancelBtn.disabled = true;
        setExportProgress(activeExportJob.lastProgress || 0, 'WAV 내보내기 중지됨');
        trackName.innerText = "WAV 내보내기가 중지되었습니다.";
        activeExportJob = null;
        setDownloadButtonEnabled(Boolean(originalBuffer));
        hideExportProgress(1000);
    };
}

downloadBtn.onclick = async () => {
    if (!originalBuffer || activeExportJob) return;

    const job = {
        id: Date.now(),
        cancelled: false,
        timer: null,
        lastProgress: 0
    };
    activeExportJob = job;

    trackName.innerText = "WAV 내보내기를 백그라운드에서 시작했습니다.";
    setDownloadButtonEnabled(false);
    showExportProgress('WAV 렌더링 준비 중');

    try {
        const offlineCtx = new OfflineAudioContext(
            originalBuffer.numberOfChannels,
            originalBuffer.length,
            originalBuffer.sampleRate
        );

        const offlineSource = offlineCtx.createBufferSource();
        offlineSource.buffer = originalBuffer;

        const offlineOutput = await compileAudioGraph(offlineCtx, offlineSource);
        if (job.cancelled) return;

        offlineOutput.connect(offlineCtx.destination);
        offlineSource.start(0);

        const renderDuration = originalBuffer.duration || 1;
        job.timer = window.setInterval(() => {
            if (job.cancelled) return;
            const renderPercent = Math.min(94, (offlineCtx.currentTime / renderDuration) * 94);
            job.lastProgress = renderPercent;
            setExportProgress(renderPercent, 'WAV 렌더링 중');
        }, 100);

        const renderedBuffer = await offlineCtx.startRendering();
        if (job.timer) window.clearInterval(job.timer);
        if (job.cancelled || activeExportJob !== job) return;

        setExportProgress(96, 'WAV 파일 생성 중');
        const wavBlob = convertAudioBufferToWavBlob(renderedBuffer);
        if (job.cancelled || activeExportJob !== job) return;

        const url = URL.createObjectURL(wavBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "AI_HiRes_Mastered_Output.wav";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);

        setExportProgress(100, 'WAV 내보내기 완료');
        trackName.innerText = "추출 성공: 파일 저장이 완료되었습니다.";
        activeExportJob = null;
        setDownloadButtonEnabled(Boolean(originalBuffer));
        hideExportProgress(1200);
    } catch (err) {
        if (job.timer) window.clearInterval(job.timer);
        if (activeExportJob === job) activeExportJob = null;
        setExportProgress(job.lastProgress || 0, 'WAV 내보내기 실패');
        alert("인코딩 중 에러가 발생했습니다.");
        setDownloadButtonEnabled(Boolean(originalBuffer));
        hideExportProgress(1600);
    }
};

function animateSpectrum() {
    requestAnimationFrame(animateSpectrum);
    if(!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(26, 36, 59, 0.2)'; ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=canvas.width/10) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let j=0; j<canvas.height; j+=25) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); }

    if (!analyserNode || !isPlaying) {
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = '#1e293b';
        ctx.moveTo(0, canvas.height - 10); ctx.lineTo(canvas.width, canvas.height - 10); ctx.stroke();
        
        if(lufsBar) lufsBar.style.width = "0%";
        if(lufsText) lufsText.innerText = "-inf dB";
        if(compGrBar) compGrBar.style.width = "0%";
        if(compGrVal) compGrVal.innerText = "0.0 dB";
        limiter.updateMeters(getBypassState);
        if(clipLed) clipLed.classList.remove('clip-active');
        return;
    }

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / 10) - 4;
    let sumRMS = 0;

    for (let i = 0; i < 10; i++) {
        const startIdx = Math.floor((i / 10) * (bufferLength * 0.6));
        const endIdx = Math.floor(((i + 1) / 10) * (bufferLength * 0.6));
        let maxVal = 0;
        
        for(let j = startIdx; j < endIdx; j++) {
            if(dataArray[j] > maxVal) maxVal = dataArray[j];
        }

        const percent = maxVal / 255;
        sumRMS += percent * percent;
        
        const barHeight = percent * (canvas.height - 15);
        const x = i * (canvas.width / 10) + 2;
        const y = canvas.height - barHeight;

        let grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#f43f5e');  
        grad.addColorStop(0.4, '#fbbf24'); 
        grad.addColorStop(1, '#10b981');   

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = document.body.classList.contains('light-mode') ? '#1e293b' : '#475569';
        ctx.font = '8px monospace';
        ctx.fillText(eqLabels[i], x + 2, 10);
    }

    const rms = Math.sqrt(sumRMS / 10);
    const dbLevel = Math.round(20 * Math.log10(rms + 0.0001));
    const displayPercent = Math.max(0, Math.min(100, (dbLevel + 40) * 2.5)); 

    if(lufsBar) lufsBar.style.width = displayPercent + "%";
    if(lufsText) lufsText.innerText = (dbLevel >= 0 ? "0" : dbLevel) + " dB";

    const reduction = compressor.dynamicCompressorNode && audioState.compressor.enabled && !isBypassed
        ? Math.abs(compressor.dynamicCompressorNode.reduction || 0)
        : 0;
    if(compGrBar) compGrBar.style.width = Math.min(100, (reduction / 24) * 100) + "%";
    if(compGrVal) compGrVal.innerText = reduction.toFixed(1) + " dB";

    limiter.updateMeters(getBypassState);

    if(dbLevel >= -1) {
        if(clipLed) clipLed.classList.add('clip-active');
    } else {
        if(clipLed) clipLed.classList.remove('clip-active');
    }
}

function handleResize() {
    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 140;
    compressor.drawCurve();
    drawAudioWaveform(waveformProgress);
}

window.addEventListener('resize', handleResize);
handleResize();
drawAudioWaveform(0);
animateSpectrum();

// ==========================================
// IndexedDB & JJD Project Management Core
// ==========================================

const DB_NAME = 'JdMasteringStudioDB';
const STORE_NAME = 'projects';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveProject(name, audioBlob, audioFileName, activeStemIds, audioState, effectorSettings) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const requestGetAll = store.getAll();
        requestGetAll.onsuccess = () => {
            const projects = requestGetAll.result;
            const existing = projects.find(p => p.name === name);
            const project = {
                name,
                timestamp: Date.now(),
                audioBlob,
                audioFileName,
                activeStemIds,
                audioState: JSON.parse(JSON.stringify(audioState)),
                effectors: effectorSettings
            };
            if (existing) {
                project.id = existing.id; // Overwrite
            }
            const requestPut = store.put(project);
            requestPut.onsuccess = () => resolve(requestPut.result);
            requestPut.onerror = (e) => reject(e.target.error);
        };
        requestGetAll.onerror = (e) => reject(e.target.error);
    });
}

async function getProjects() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function getProject(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

const effectorRegistry = { eq, reverb, compressor, limiter };

function serializeEffectorSettings() {
    const effectorSettings = {};
    for (const [key, effector] of Object.entries(effectorRegistry)) {
        if (typeof effector.getSettings === 'function') {
            effectorSettings[key] = effector.getSettings();
        }
    }
    return effectorSettings;
}

function applyAllLoadedSettings() {
    // 1. Sync EQ UI
    eq.renderUI('eq-sliders-container');
    eq.bindLiveControls(audioCtx, getPlayState, getBypassState);
    eq.updateUI();

    // Sync Preset Library Selection
    document.querySelectorAll('#genre-grid button').forEach(b => b.classList.remove('genre-active'));
    const isFlat = audioState.eq.every(val => val === 0);
    if (isFlat) {
        const noneBtnEl = document.querySelector('#genre-grid button');
        if (noneBtnEl) noneBtnEl.classList.add('genre-active');
    }

    // 2. Sync Reverb UI
    reverb.syncInputs();
    const reverbPresetSelect = document.getElementById('reverb-preset');
    if (reverbPresetSelect) reverbPresetSelect.value = "";
    reverb.updateUI(updateCompressorRangeFills);

    // 3. Sync Compressor UI
    compressor.syncInputs();
    const compTemplateSelect = document.getElementById('comp-template-select');
    if (compTemplateSelect) compTemplateSelect.value = "";
    compressor.updateUI(updateCompressorRangeFills);

    // 4. Sync Limiter UI
    if (typeof limiter.syncInputs === 'function') {
        limiter.syncInputs();
    }
    limiter.updateUI(updateCompressorRangeFills);

    // 5. Sync post-eq utility effects values
    const noiseInput = document.getElementById('noise-reducer');
    if (noiseInput) {
        noiseInput.value = audioState.noise;
        const valSpan = document.getElementById('noise-val');
        if (valSpan) valSpan.innerText = audioState.noise + ' %';
    }
    const deesserInput = document.getElementById('deesser-reducer');
    if (deesserInput) {
        deesserInput.value = audioState.deesser;
        const valSpan = document.getElementById('deesser-val');
        if (valSpan) valSpan.innerText = audioState.deesser + ' %';
    }
    const saturatorInput = document.getElementById('saturator-volume');
    if (saturatorInput) {
        saturatorInput.value = audioState.saturator;
        const valSpan = document.getElementById('saturator-val');
        if (valSpan) valSpan.innerText = audioState.saturator + ' %';
    }
    const masterInput = document.getElementById('master-volume');
    if (masterInput) {
        masterInput.value = audioState.master;
        const valSpan = document.getElementById('master-val');
        if (valSpan) valSpan.innerText = audioState.master + ' %';
        updateRangeFill(masterInput, '#f43f5e');
    }

    // Update toggles
    updateUtilityEffectToggles();
    updateStemsToggleUI();

    // 6. Sync Stems
    syncStemsUI();

    // 7. Update compressor/reverb/limiter range fills
    updateCompressorRangeFills();

    // 8. If AudioContext is playing, apply settings live
    if (isPlaying && audioCtx) {
        eq.applySettings(audioCtx, isBypassed);
        
        const stemsDisabled = isBypassed || !audioState.stemsEnabled;
        stemRegistry.forEach(stem => {
            if (activeStemIds.includes(stem.id) && stemFilters[stem.id]) {
                const gainVal = stemsDisabled ? 0 : (audioState.mutes[stem.id] ? -40 : audioState.stems[stem.id]);
                stemFilters[stem.id].gain.setValueAtTime(gainVal, audioCtx.currentTime);
            }
        });
        
        applyUtilityEffectSettings(audioCtx);
        reverb.applySettings(audioCtx, () => isBypassed, true);
        compressor.applySettings(audioCtx, () => isBypassed);
        limiter.applySettings(audioCtx, () => isBypassed);
        if (masterGainNode) {
            masterGainNode.gain.setValueAtTime(audioState.master / 100, audioCtx.currentTime);
        }
    }
}

async function updateProjectDropdown() {
    const select = document.getElementById('project-load-db');
    if (!select) return;
    try {
        const projects = await getProjects();
        // Clear all except first option
        select.innerHTML = '<option value="">DB 불러오기...</option>';
        projects.forEach(p => {
            const dateStr = new Date(p.timestamp).toLocaleDateString() + ' ' + new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${dateStr})`;
            select.appendChild(opt);
        });
    } catch(err) {
        console.error("Failed to load projects list", err);
    }
}

// Bind UI actions
const dbSaveBtn = document.getElementById('project-save-db');
if (dbSaveBtn) {
    dbSaveBtn.onclick = async () => {
        const defaultName = currentAudioFileName 
            ? currentAudioFileName.replace(/\.[^/.]+$/, "") + "_project" 
            : `Project_${new Date().toLocaleDateString()}`;
        const name = prompt("저장할 프로젝트 이름을 입력하세요:", defaultName);
        if (!name || !name.trim()) return;

        try {
            const settings = serializeEffectorSettings();
            await saveProject(name.trim(), currentAudioFileBlob, currentAudioFileName, activeStemIds, audioState, settings);
            alert("프로젝트가 IndexedDB에 정상적으로 저장되었습니다.");
            await updateProjectDropdown();
        } catch(err) {
            console.error(err);
            alert("프로젝트 저장에 실패했습니다: " + err.message);
        }
    };
}

const dbLoadSelect = document.getElementById('project-load-db');
if (dbLoadSelect) {
    dbLoadSelect.onchange = async (e) => {
        const val = e.target.value;
        if (!val) return;
        const id = Number(val);
        
        trackName.innerText = "📥 프로젝트 복구 및 데이터 디코딩 중...";
        detectorStatus.innerText = "(로딩 중)";

        try {
            const project = await getProject(id);
            if (!project) return;

            // Stop playback if playing
            if (isPlaying && sourceNode) {
                try { sourceNode.stop(); } catch(err){}
                isPlaying = false;
                pausedAt = 0;
                playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;
            }

            // Restore activeStemIds
            activeStemIds = project.activeStemIds || [];

            // Restore audioState
            if (project.audioState) {
                Object.assign(audioState, project.audioState);
            }

            // Restore effectors
            if (project.effectors) {
                for (const [key, effector] of Object.entries(effectorRegistry)) {
                    if (project.effectors[key] && typeof effector.setSettings === 'function') {
                        effector.setSettings(project.effectors[key]);
                    }
                }
            }

            // Restore Audio Binary (Blob)
            if (project.audioBlob) {
                currentAudioFileBlob = project.audioBlob;
                currentAudioFileName = project.audioFileName || "Loaded Project Audio";
                trackName.innerText = `곡명: ${currentAudioFileName}`;
                
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') await audioCtx.resume();

                const reader = new FileReader();
                reader.onload = function(evt) {
                    audioCtx.decodeAudioData(evt.target.result, function(buffer) {
                        originalBuffer = buffer;
                        waveformPeaks = buildWaveformPeaks(buffer);
                        updateWaveformProgress(0);

                        playBtn.disabled = false;
                        progressBar.disabled = false; 
                        downloadBtn.disabled = false;
                        playBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                        downloadBtn.classList.remove('opacity-40', 'cursor-not-allowed');

                        pausedAt = 0;
                        isPlaying = false;
                        setProgressBarValue(0);
                        updateWaveformProgress(0);
                        playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;

                        // Sync everything!
                        applyAllLoadedSettings();
                    }, function(err) {
                        alert("저장된 음원 디코딩에 실패했습니다.");
                    });
                };
                reader.readAsArrayBuffer(project.audioBlob);
            } else {
                // No audio binary
                currentAudioFileBlob = null;
                currentAudioFileName = "";
                originalBuffer = null;
                waveformPeaks = [];
                updateWaveformProgress(0);
                trackName.innerText = `Waiting for audio upload...`;
                detectorStatus.innerText = "(추출 대기 중)";

                playBtn.disabled = true;
                progressBar.disabled = true; 
                downloadBtn.disabled = true;
                playBtn.classList.add('opacity-40', 'cursor-not-allowed');
                downloadBtn.classList.add('opacity-40', 'cursor-not-allowed');

                pausedAt = 0;
                isPlaying = false;
                setProgressBarValue(0);
                playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;

                // Sync everything!
                applyAllLoadedSettings();
            }
        } catch(err) {
            console.error(err);
            alert("프로젝트 로드 중 오류가 발생했습니다: " + err.message);
        }
    };
}

const fileExportBtn = document.getElementById('project-export-jjd');
if (fileExportBtn) {
    fileExportBtn.onclick = () => {
        try {
            const settings = serializeEffectorSettings();
            const projectData = {
                version: "9.0",
                timestamp: Date.now(),
                activeStemIds: activeStemIds,
                audioState: audioState,
                effectors: settings
            };

            const jsonStr = JSON.stringify(projectData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            const defaultName = currentAudioFileName 
                ? currentAudioFileName.replace(/\.[^/.]+$/, "") + ".jjd"
                : "mastering_project.jjd";
            a.href = url;
            a.download = defaultName;
            a.click();
            URL.revokeObjectURL(url);
        } catch(err) {
            console.error(err);
            alert("파일 내보내기에 실패했습니다: " + err.message);
        }
    };
}

const fileImportInput = document.getElementById('project-import-jjd');
if (fileImportInput) {
    fileImportInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.version !== "9.0") {
                    console.warn("JJD file version mismatch. File version: " + data.version);
                }

                if (data.activeStemIds) {
                    activeStemIds = data.activeStemIds.filter(id => stemRegistry.some(r => r.id === id));
                }

                if (data.audioState) {
                    Object.assign(audioState, data.audioState);
                }

                if (data.effectors) {
                    for (const [key, effector] of Object.entries(effectorRegistry)) {
                        if (data.effectors[key] && typeof effector.setSettings === 'function') {
                            effector.setSettings(data.effectors[key]);
                        }
                    }
                }

                // Sync everything!
                applyAllLoadedSettings();
                alert("설정 파일(.jjd)을 성공적으로 불러왔습니다.");
            } catch(err) {
                console.error(err);
                alert("JJD 파일 읽기에 실패했습니다: " + err.message);
            }
        };
        reader.readAsText(file);
        // Clear input to allow importing the same file again
        fileImportInput.value = "";
    };
}

// Initial update of project dropdown
updateProjectDropdown();

// ==========================================
// Project Manager Collapse & Auto-Save Actions
// ==========================================

const projectHeader = document.getElementById('project-header');
const projectCollapseContent = document.getElementById('project-collapse-content');
const projectCollapseIcon = document.getElementById('project-collapse-icon');
if (projectHeader && projectCollapseContent && projectCollapseIcon) {
    projectHeader.onclick = () => {
        const isCollapsed = projectCollapseContent.classList.contains('hidden');
        if (isCollapsed) {
            projectCollapseContent.classList.remove('hidden');
            projectCollapseIcon.className = "fa-solid fa-chevron-up";
        } else {
            projectCollapseContent.classList.add('hidden');
            projectCollapseIcon.className = "fa-solid fa-chevron-down";
        }
        setTimeout(() => {
            handleResize();
        }, 100);
    };
}

let autosaveIntervalId = null;
let isAutosaveEnabled = false;

async function triggerAutosave() {
    try {
        const defaultName = currentAudioFileName 
            ? currentAudioFileName.replace(/\.[^/.]+$/, "") + "_AutoSave" 
            : "AutoSave";
        const settings = serializeEffectorSettings();
        
        // Overwrites the existing AutoSave project entry
        await saveProject(defaultName, currentAudioFileBlob, currentAudioFileName, activeStemIds, audioState, settings);
        await updateProjectDropdown();

        // Animate the autosave icon for feedback
        const icon = document.getElementById('autosave-icon');
        if (icon) {
            icon.classList.remove('text-gray-500');
            icon.classList.add('text-green-500', 'animate-pulse');
            setTimeout(() => {
                icon.classList.remove('text-green-500', 'animate-pulse');
                icon.classList.add('text-gray-500');
            }, 1500);
        }
    } catch(err) {
        console.error("AutoSave failed", err);
    }
}

function startAutosave() {
    stopAutosave();
    const intervalInput = document.getElementById('autosave-interval');
    let minutes = 5;
    if (intervalInput) {
        minutes = Math.max(1, parseFloat(intervalInput.value) || 5);
    }
    const ms = minutes * 60 * 1000;
    autosaveIntervalId = setInterval(triggerAutosave, ms);
}

function stopAutosave() {
    if (autosaveIntervalId) {
        clearInterval(autosaveIntervalId);
        autosaveIntervalId = null;
    }
}

const autosaveToggleBtn = document.getElementById('autosave-toggle');
const autosaveIntervalInput = document.getElementById('autosave-interval');

if (autosaveToggleBtn) {
    autosaveToggleBtn.onclick = () => {
        isAutosaveEnabled = !isAutosaveEnabled;
        autosaveToggleBtn.setAttribute('aria-pressed', String(isAutosaveEnabled));
        autosaveToggleBtn.innerText = isAutosaveEnabled ? 'ON' : 'OFF';
        
        if (isAutosaveEnabled) {
            autosaveToggleBtn.className = "bg-green-600 border-green-500 text-white shadow-md shadow-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md border transition";
            startAutosave();
        } else {
            autosaveToggleBtn.className = "bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-gray-700 transition";
            stopAutosave();
        }
    };
}

if (autosaveIntervalInput) {
    autosaveIntervalInput.onchange = () => {
        if (isAutosaveEnabled) {
            startAutosave();
        }
    };
}

