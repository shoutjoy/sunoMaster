const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const downloadBtn = document.getElementById('download-btn');

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

const playerSettingsBtn = document.getElementById('player-settings-btn');
const playerSettingsMenu = document.getElementById('player-settings-menu');
const playerModeInner = document.getElementById('player-mode-inner');
const playerModeFloat = document.getElementById('player-mode-float');
const playerFloatToggle = document.getElementById('player-float-toggle');
const exportPrefixInput = document.getElementById('export-prefix-input');
const exportFilenamePreview = document.getElementById('export-filename-preview');
const stemConsoleVisibilitySetting = document.getElementById('setting-show-stem-console');
const stemConsoleSection = document.getElementById('stem-console-section');
const spectrumBandCountInput = document.getElementById('spectrum-band-count');
const spectrumBarsBtn = document.getElementById('spectrum-bars-btn');
const spectrumWaveBtn = document.getElementById('spectrum-wave-btn');
const spectrumComboBtn = document.getElementById('spectrum-combo-btn');
const globalPlayerShell = document.getElementById('global-player-shell');
const PLAYER_MODE_STORAGE_KEY = 'jd-player-display-mode';
const EXPORT_PREFIX_STORAGE_KEY = 'jd-export-filename-prefix';
const STEM_CONSOLE_VISIBLE_STORAGE_KEY = 'jd-show-stem-console';
const SPECTRUM_BAND_COUNT_STORAGE_KEY = 'jd-spectrum-band-count';
const SPECTRUM_VIEW_MODE_STORAGE_KEY = 'jd-spectrum-view-mode';
const DEFAULT_EXPORT_PREFIX = 'mastered_';
const DEFAULT_SPECTRUM_BAND_COUNT = 20;
let spectrumBandCount = DEFAULT_SPECTRUM_BAND_COUNT;
let spectrumViewMode = 'bars';

function getStoredPlayerMode() {
    try {
        return localStorage.getItem(PLAYER_MODE_STORAGE_KEY) === 'float' ? 'float' : 'inner';
    } catch (error) {
        return 'inner';
    }
}

function applyPlayerMode(mode, persist = true) {
    const normalizedMode = mode === 'float' ? 'float' : 'inner';
    const isFloating = normalizedMode === 'float';
    document.body.classList.toggle('player-float', isFloating);
    if (globalPlayerShell) globalPlayerShell.dataset.playerMode = normalizedMode;
    if (playerModeInner) playerModeInner.checked = normalizedMode === 'inner';
    if (playerModeFloat) playerModeFloat.checked = normalizedMode === 'float';
    if (playerFloatToggle) {
        playerFloatToggle.classList.toggle('is-floating', isFloating);
        playerFloatToggle.setAttribute('aria-pressed', String(isFloating));
        playerFloatToggle.title = isFloating ? '플레이바 원래 위치로 복귀' : '플레이바 플로팅';
        playerFloatToggle.setAttribute('aria-label', playerFloatToggle.title);
        playerFloatToggle.innerHTML = `<i class="fa-solid fa-${isFloating ? 'compress' : 'up-right-and-down-left-from-center'}"></i>`;
    }
    if (persist) {
        try { localStorage.setItem(PLAYER_MODE_STORAGE_KEY, normalizedMode); } catch (error) {}
    }
}

function setPlayerSettingsOpen(open) {
    if (!playerSettingsBtn || !playerSettingsMenu) return;
    playerSettingsMenu.classList.toggle('hidden', !open);
    playerSettingsBtn.setAttribute('aria-expanded', String(open));
}

if (playerSettingsBtn && playerSettingsMenu) {
    playerSettingsBtn.onclick = (event) => {
        event.stopPropagation();
        setPlayerSettingsOpen(playerSettingsMenu.classList.contains('hidden'));
    };
    playerSettingsMenu.onclick = (event) => event.stopPropagation();
    document.addEventListener('click', () => setPlayerSettingsOpen(false));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setPlayerSettingsOpen(false);
    });
}
if (playerModeInner) playerModeInner.onchange = () => {
    if (playerModeInner.checked) {
        applyPlayerMode('inner');
        setPlayerSettingsOpen(false);
    }
};
if (playerModeFloat) playerModeFloat.onchange = () => {
    if (playerModeFloat.checked) {
        applyPlayerMode('float');
        setPlayerSettingsOpen(false);
    }
};
if (playerFloatToggle) {
    playerFloatToggle.onclick = () => {
        applyPlayerMode(document.body.classList.contains('player-float') ? 'inner' : 'float');
    };
}
applyPlayerMode(getStoredPlayerMode(), false);

function applyStemConsoleVisibility(visible, persist = true) {
    const shouldShow = Boolean(visible);
    if (stemConsoleSection) stemConsoleSection.hidden = !shouldShow;
    if (stemConsoleVisibilitySetting) stemConsoleVisibilitySetting.checked = shouldShow;
    if (persist) {
        try { localStorage.setItem(STEM_CONSOLE_VISIBLE_STORAGE_KEY, String(shouldShow)); } catch (error) {}
    }
}

let shouldShowStemConsole = false;
try {
    shouldShowStemConsole = localStorage.getItem(STEM_CONSOLE_VISIBLE_STORAGE_KEY) === 'true';
} catch (error) {}
applyStemConsoleVisibility(shouldShowStemConsole, false);

if (stemConsoleVisibilitySetting) {
    stemConsoleVisibilitySetting.onchange = () => {
        applyStemConsoleVisibility(stemConsoleVisibilitySetting.checked);
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    };
}

function normalizeSpectrumBandCount(value) {
    const parsed = Math.round(Number(value));
    return Number.isFinite(parsed) ? Math.max(8, Math.min(64, parsed)) : DEFAULT_SPECTRUM_BAND_COUNT;
}

function applySpectrumBandCount(value, persist = true) {
    spectrumBandCount = normalizeSpectrumBandCount(value);
    if (spectrumBandCountInput) spectrumBandCountInput.value = String(spectrumBandCount);
    if (persist) {
        try { localStorage.setItem(SPECTRUM_BAND_COUNT_STORAGE_KEY, String(spectrumBandCount)); } catch (error) {}
    }
}

function applySpectrumViewMode(mode, persist = true) {
    spectrumViewMode = mode === 'wave' || mode === 'combo' ? mode : 'bars';
    const isWave = spectrumViewMode === 'wave';
    const isCombo = spectrumViewMode === 'combo';
    const isBars = spectrumViewMode === 'bars';
    spectrumBarsBtn?.classList.toggle('is-active', isBars);
    spectrumWaveBtn?.classList.toggle('is-active', isWave);
    spectrumComboBtn?.classList.toggle('is-active', isCombo);
    spectrumBarsBtn?.setAttribute('aria-pressed', String(isBars));
    spectrumWaveBtn?.setAttribute('aria-pressed', String(isWave));
    spectrumComboBtn?.setAttribute('aria-pressed', String(isCombo));
    if (persist) {
        try { localStorage.setItem(SPECTRUM_VIEW_MODE_STORAGE_KEY, spectrumViewMode); } catch (error) {}
    }
}

let storedSpectrumBandCount = DEFAULT_SPECTRUM_BAND_COUNT;
let storedSpectrumViewMode = 'bars';
try {
    storedSpectrumBandCount = localStorage.getItem(SPECTRUM_BAND_COUNT_STORAGE_KEY) || DEFAULT_SPECTRUM_BAND_COUNT;
    storedSpectrumViewMode = localStorage.getItem(SPECTRUM_VIEW_MODE_STORAGE_KEY) || 'bars';
} catch (error) {}
applySpectrumBandCount(storedSpectrumBandCount, false);
applySpectrumViewMode(storedSpectrumViewMode, false);

if (spectrumBandCountInput) {
    spectrumBandCountInput.oninput = () => {
        if (spectrumBandCountInput.value !== '') applySpectrumBandCount(spectrumBandCountInput.value);
    };
    spectrumBandCountInput.onblur = () => applySpectrumBandCount(spectrumBandCountInput.value);
}
if (spectrumBarsBtn) spectrumBarsBtn.onclick = () => applySpectrumViewMode('bars');
if (spectrumWaveBtn) spectrumWaveBtn.onclick = () => applySpectrumViewMode('wave');
if (spectrumComboBtn) spectrumComboBtn.onclick = () => applySpectrumViewMode('combo');

const eqLabels = ["20", "31.5", "50", "80", "125", "200", "315", "500", "800", "1k", "1.25k", "2k", "3.15k", "4k", "5k", "6.3k", "8k", "10k", "12.5k", "16k"];

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
    "Low Shelf +0.3", "Low Shelf +0.5", "Low Shelf -0.3", "Low Shelf -0.5", "Sub Clean -0.4",
    "Kick Weight +0.4", "Mud Trim -0.4", "Mud Trim -0.7", "Low-Mid Body +0.3", "Low-Mid Body -0.3",
    "Box Trim -0.4", "Box Trim -0.6", "Warm Tilt +0.4", "Cool Tilt -0.4", "Neutral Polish A",
    "Neutral Polish B", "Center Clarity +0.3", "Vocal Pocket +0.4", "Vocal Harsh -0.3", "Vocal Air +0.5",
    "Presence +0.3", "Presence +0.5", "Presence Trim -0.3", "Presence Trim -0.5", "Sibilance Soft -0.4",
    "Air Shelf +0.3", "Air Shelf +0.6", "Air Shelf -0.3", "Top Smooth -0.4", "Top Smooth -0.6",
    "Stereo Master Flat+", "Streaming Soft A", "Streaming Soft B", "Streaming Bright A", "Streaming Warm A",
    "Pop Micro Lift", "Pop Vocal Seat", "Pop Low Control", "Pop Air Control", "Pop Dense Trim",
    "Hip-Hop Sub Tight", "Hip-Hop Vocal Clear", "Hip-Hop Hi-Hat Soft", "Hip-Hop Low-Mid Trim", "Hip-Hop Air Small",
    "Rock Body Small", "Rock Edge Tame", "Rock Presence Small", "Rock Low Tight", "Rock Top Smooth",
    "Metal Low Tight", "Metal Bite Trim", "Metal Air Small", "Metal Mud Cut", "Metal Presence Seat",
    "Acoustic Body +0.3", "Acoustic Boom -0.4", "Acoustic String Air", "Acoustic Pick Soft", "Acoustic Natural",
    "Piano Body +0.3", "Piano Box -0.4", "Piano Air +0.4", "Piano Bright Tame", "Piano Warm Micro",
    "EDM Sub Guard", "EDM Kick Seat", "EDM Top Smooth", "EDM Air +0.5", "EDM Mid Clean",
    "R&B Warm Micro", "R&B Vocal Silk", "R&B Low Tight", "R&B Air Soft", "R&B Presence Seat",
    "Jazz Natural A", "Jazz Natural B", "Jazz Low Clean", "Jazz Air Small", "Jazz Harsh Trim",
    "Cinematic Low +0.4", "Cinematic Mud -0.3", "Cinematic Air +0.5", "Cinematic Smooth Top", "Cinematic Neutral",
    "Podcast Body +0.3", "Podcast Mud -0.5", "Podcast Presence +0.4", "Podcast Sibilance -0.5", "Podcast Air -0.3",
    "Vinyl Low Trim", "Tape Soft Top", "Tube Warm Small", "Clean Translation", "Mono Safe Trim",
    "Car Check Low", "Earbud Clarity", "Laptop Low-Mid Trim", "Club Low Guard", "Master Final Polish"
];

const audioState = {
    eq: new Array(20).fill(0),
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
    pan: 0,
    front: 0,
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
let isBypassed = true;
let isLooping = false;
let sectionRepeatEnabled = false;
let sectionRepeatStart = 0;
let sectionRepeatEnd = 0;
let sectionRepeatInitialized = false;
let sectionRepeatDrag = null;
let sectionRepeatSeeking = false;
let isUserSeeking = false; 
let activeStemIds = [];
let waveformPeaks = [];
let waveformProgress = 0;
let waveformLoadingState = null;
let waveformLoadingFrame = 0;
let waveformMessageTimer = 0;
let currentAudioFileBlob = null;
let currentAudioFileName = "";

function sanitizeFilenamePart(value) {
    return String(value ?? '').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').slice(0, 80);
}

function getExportPrefix() {
    const inputValue = exportPrefixInput ? exportPrefixInput.value : DEFAULT_EXPORT_PREFIX;
    return sanitizeFilenamePart(inputValue);
}

function getMasteredExportFilename() {
    const originalBaseName = sanitizeFilenamePart((currentAudioFileName || 'audio').replace(/\.[^/.]+$/, '')) || 'audio';
    return `${getExportPrefix()}${originalBaseName}.wav`;
}

function updateExportFilenamePreview() {
    const filename = getMasteredExportFilename();
    if (exportFilenamePreview) exportFilenamePreview.innerText = filename;
    if (downloadBtn) {
        downloadBtn.title = filename;
        downloadBtn.setAttribute('aria-label', `Mastering Data Execute: ${filename}`);
    }
}

if (exportPrefixInput) {
    try {
        const storedPrefix = localStorage.getItem(EXPORT_PREFIX_STORAGE_KEY);
        exportPrefixInput.value = storedPrefix === null ? DEFAULT_EXPORT_PREFIX : sanitizeFilenamePart(storedPrefix);
    } catch (error) {
        exportPrefixInput.value = DEFAULT_EXPORT_PREFIX;
    }
    exportPrefixInput.oninput = () => {
        const sanitized = sanitizeFilenamePart(exportPrefixInput.value);
        if (exportPrefixInput.value !== sanitized) exportPrefixInput.value = sanitized;
        try { localStorage.setItem(EXPORT_PREFIX_STORAGE_KEY, sanitized); } catch (error) {}
        updateExportFilenamePreview();
    };
}
updateExportFilenamePreview();


let stemFilters = {};
let noiseFilters = { lowCut: null, highCut: null, deEsser: null, waveShaper: null }; 
let frontFilters = { body: null, presence: null, air: null };
let stereoPannerNode = null;
let masterGainNode = null;
let analyserNode = null;
let levelSplitterNode = null;
let levelLeftAnalyser = null;
let levelRightAnalyser = null;
let levelSilentGain = null;

const playBtn = document.getElementById('play-btn');
const loopBtn = document.getElementById('loop-btn');
const upload = document.getElementById('audio-upload');
const exportProgressPanel = document.getElementById('export-progress-panel');
const exportProgressFill = document.getElementById('export-progress-fill');
const exportProgressText = document.getElementById('export-progress-text');
const exportStatusText = document.getElementById('export-status-text');
const exportCancelBtn = document.getElementById('export-cancel-btn');
const trackName = document.getElementById('track-name');
const timeDisplay = document.getElementById('time-display');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const skipBackBtn = document.getElementById('skip-back-btn');
const skipForwardBtn = document.getElementById('skip-forward-btn');
const seekStartBtn = document.getElementById('seek-start-btn');
const seekEndBtn = document.getElementById('seek-end-btn');
const panControl = document.getElementById('pan-control');
const panValue = document.getElementById('pan-val');
const frontControl = document.getElementById('front-control');
const frontValue = document.getElementById('front-val');
const sectionRepeatBtn = document.getElementById('section-repeat-btn');
const sectionRepeatEditor = document.getElementById('section-repeat-editor');
const sectionRepeatBar = document.getElementById('section-repeat-bar');
const sectionRepeatRegion = document.getElementById('section-repeat-region');
const sectionRepeatPlayhead = document.getElementById('section-repeat-playhead');
const sectionRepeatStartHandle = document.getElementById('section-repeat-start-handle');
const sectionRepeatEndHandle = document.getElementById('section-repeat-end-handle');
const sectionRepeatStartLabel = document.getElementById('section-repeat-start-label');
const sectionRepeatEndLabel = document.getElementById('section-repeat-end-label');
const sectionRepeatStartBadge = document.getElementById('section-repeat-start-badge');
const sectionRepeatEndBadge = document.getElementById('section-repeat-end-badge');
const sectionRepeatDurationLabel = document.getElementById('section-repeat-duration-label');
const levelMeter = document.querySelector('.output-level-meter');
const levelMeterLeft = document.getElementById('level-meter-left');
const levelMeterRight = document.getElementById('level-meter-right');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const spectrumAnalyzerPanel = document.getElementById('spectrum-analyzer-panel');
const spectrumHeightResizer = document.getElementById('spectrum-height-resizer');
const detectorStatus = document.getElementById('detector-status');
const clipLed = document.getElementById('clip-led');
const lufsBar = document.getElementById('lufs-bar');
const lufsText = document.getElementById('lufs-text');
const waveformCanvas = document.getElementById('audio-waveform');
const waveformCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
const waveformTime = document.getElementById('waveform-time');
const waveformLoadMessage = document.getElementById('waveform-load-message');
const compGrBar = document.getElementById('comp-gr-bar');
const compGrVal = document.getElementById('comp-gr-val');

function setAudioTransportAvailability(enabled) {
    document.querySelectorAll('[data-audio-transport]').forEach((button) => {
        button.disabled = !enabled;
    });
}

const LEVEL_METER_SEGMENTS = 16;
function setupOutputLevelMeter() {
    [levelMeterLeft, levelMeterRight].forEach((channel) => {
        if (!channel) return;
        channel.replaceChildren(...Array.from({ length: LEVEL_METER_SEGMENTS }, () => document.createElement('i')));
    });
}

function setLevelMeterChannel(channel, level) {
    if (!channel) return;
    const segments = Array.from(channel.children);
    const filled = Math.round(Math.max(0, Math.min(1, level)) * segments.length);
    segments.forEach((segment, index) => {
        segment.className = index < filled
            ? index >= segments.length - 2 ? 'is-clip' : index >= segments.length - 5 ? 'is-warn' : 'is-lit'
            : '';
    });
}

function readAnalyserLevel(analyser) {
    if (!analyser || !isPlaying) return 0;
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    let peak = 0;
    for (const sample of samples) {
        sum += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
    }
    return Math.min(1, Math.max(Math.sqrt(sum / samples.length) * 2.4, peak));
}

function updateOutputLevelMeter() {
    const left = readAnalyserLevel(levelLeftAnalyser);
    const right = readAnalyserLevel(levelRightAnalyser);
    setLevelMeterChannel(levelMeterLeft, left);
    setLevelMeterChannel(levelMeterRight, right);
    levelMeter?.setAttribute('aria-valuenow', String(Math.round(Math.max(left, right) * 100)));
}

setupOutputLevelMeter();

function setupMasterEffectPanels() {
    const target = document.getElementById('main-master-effects');
    if (!target) return;
    ['master-limiter-panel', 'master-reverb-panel', 'master-compressor-panel'].forEach((panelId) => {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        target.appendChild(panel);
        panel.classList.add('main-effect-panel');
        const header = panel.firstElementChild;
        if (!header || header.classList.contains('effect-panel-header')) return;
        header.classList.add('effect-panel-header');
        const content = document.createElement('div');
        content.className = 'effect-panel-content';
        while (header.nextSibling) content.appendChild(header.nextSibling);
        panel.appendChild(content);

        const toggle = header.querySelector('button');
        const actions = document.createElement('span');
        actions.className = 'effect-panel-header-actions';
        if (toggle) actions.appendChild(toggle);
        const collapse = document.createElement('button');
        collapse.type = 'button';
        collapse.className = 'effect-collapse-btn';
        const advancedContent = panelId === 'master-limiter-panel'
            ? content.querySelector('.limiter-advanced-content')
            : null;
        const collapseTarget = advancedContent || content;
        const startsCollapsed = collapseTarget.classList.contains('is-collapsed');
        collapse.setAttribute('aria-expanded', String(!startsCollapsed));
        collapse.setAttribute('aria-label', advancedContent ? '리미터 고급 분석 펼치기' : '패널 접기');
        collapse.innerHTML = `<i class="fa-solid fa-chevron-${startsCollapsed ? 'down' : 'up'}"></i>`;
        collapse.onclick = () => {
            const collapsed = !collapseTarget.classList.contains('is-collapsed');
            collapseTarget.classList.toggle('is-collapsed', collapsed);
            collapse.setAttribute('aria-expanded', String(!collapsed));
            collapse.setAttribute('aria-label', advancedContent
                ? (collapsed ? '리미터 고급 분석 펼치기' : '리미터 고급 분석 접기')
                : (collapsed ? '패널 펼치기' : '패널 접기'));
            collapse.innerHTML = `<i class="fa-solid fa-chevron-${collapsed ? 'down' : 'up'}"></i>`;
            if (!collapsed) {
                window.setTimeout(() => {
                    handleResize();
                    if (advancedContent) limiter.updateLimiterVisualizers?.();
                }, 0);
            }
        };
        actions.appendChild(collapse);
        header.appendChild(actions);
    });
}

setupMasterEffectPanels();

function setupPlayerSignalLevel() {
    const signalPanel = document.getElementById('signal-output-panel');
    const transportVolume = document.querySelector('.transport-volume');
    if (!signalPanel || !transportVolume) return;
    signalPanel.classList.add('transport-signal-level');
    transportVolume.appendChild(signalPanel);
}

setupPlayerSignalLevel();

function setupResizableEffectGraphs() {
    document.querySelectorAll('.effect-graph-resizer').forEach((resizer) => {
        if (resizer.dataset.resizeBound === 'true') return;
        const shell = document.getElementById(resizer.dataset.resizeTarget);
        if (!shell) return;
        const storageKey = resizer.dataset.resizeKey;
        try {
            const storedHeight = Number(localStorage.getItem(storageKey));
            if (Number.isFinite(storedHeight) && storedHeight >= 176 && storedHeight <= 608) shell.style.height = `${storedHeight}px`;
        } catch (error) {}
        let startY = 0;
        let startHeight = 0;
        const redraw = () => {
            reverb.updateReverbVisualizers?.();
            compressor.drawCurve();
            eq.drawEQCanvas?.();
        };
        const finish = (event) => {
            if (!resizer.classList.contains('is-resizing')) return;
            resizer.classList.remove('is-resizing');
            if (resizer.hasPointerCapture?.(event.pointerId)) resizer.releasePointerCapture(event.pointerId);
            try { localStorage.setItem(storageKey, String(Math.round(shell.getBoundingClientRect().height))); } catch (error) {}
            redraw();
        };
        resizer.onpointerdown = (event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            startY = event.clientY;
            startHeight = shell.getBoundingClientRect().height;
            resizer.classList.add('is-resizing');
            resizer.setPointerCapture?.(event.pointerId);
        };
        resizer.onpointermove = (event) => {
            if (!resizer.classList.contains('is-resizing')) return;
            shell.style.height = `${Math.max(176, Math.min(608, startHeight + event.clientY - startY))}px`;
            redraw();
        };
        resizer.onpointerup = finish;
        resizer.onpointercancel = finish;
        resizer.dataset.resizeBound = 'true';
    });
}

const loudnessMomentary = document.getElementById('loudness-momentary');
const loudnessShort = document.getElementById('loudness-short');
const loudnessIntegrated = document.getElementById('loudness-integrated');
const loudnessLra = document.getElementById('loudness-lra');
const loudnessPeak = document.getElementById('loudness-peak');
const loudnessMeterBars = {
    momentary: document.getElementById('loudness-momentary-bar'),
    shortTerm: document.getElementById('loudness-short-bar'),
    integrated: document.getElementById('loudness-integrated-bar'),
    lra: document.getElementById('loudness-lra-bar'),
    peak: document.getElementById('loudness-peak-bar')
};
const loudnessTime = document.getElementById('loudness-time');
const loudnessHistory = document.getElementById('loudness-history');
const loudnessHistoryResizer = document.getElementById('loudness-history-resizer');
const loudnessHistoryCard = loudnessHistory?.closest('.loudness-history-card');
const loudnessResetBtn = document.getElementById('loudness-reset-btn');
const loudnessCollapseBtn = document.getElementById('loudness-collapse-btn');
const loudnessPanelContent = document.getElementById('loudness-panel-content');
const streamingLimiterSync = document.getElementById('streaming-limiter-sync');
const streamingLimiterOutput = document.getElementById('streaming-limiter-output');
const streamingLimiterStatus = document.getElementById('streaming-limiter-status');
const streamingLimiterFit = document.getElementById('streaming-limiter-fit');
let loudnessSamples = [];
let loudnessChartPoints = [];
let loudnessTruePeak = 0;
let loudnessLastSampleAt = 0;
let loudnessEnergySum = 0;
let streamingFitHoldUntil = 0;
let streamingFitAppliedOutput = null;
let latestIntegratedLufs = NaN;
const LOUDNESS_HISTORY_HEIGHT_KEY = 'jd-loudness-history-height';

function updateStreamingLimiterOutput(limiterState = audioState.limiter) {
    const outputGain = Number(limiterState?.outputGain);
    const enabled = Boolean(limiterState?.enabled);
    if (streamingLimiterOutput) {
        streamingLimiterOutput.innerText = `${Number.isFinite(outputGain) ? outputGain.toFixed(1) : '0.0'} dB`;
    }
    if (streamingLimiterStatus) streamingLimiterStatus.innerText = enabled ? 'SYNC' : 'OUT';
    streamingLimiterSync?.classList.toggle('is-active', enabled);
    streamingLimiterSync?.setAttribute(
        'aria-label',
        `Limiter output ${Number.isFinite(outputGain) ? outputGain.toFixed(1) : '0.0'} decibels, ${enabled ? 'synchronized' : 'bypassed'}`
    );
}

function getLimiterOutputBounds() {
    const input = document.getElementById('limiter-output');
    return {
        min: Number(input?.min ?? -12),
        max: Number(input?.max ?? 6)
    };
}

function clampLimiterOutput(value) {
    const { min, max } = getLimiterOutputBounds();
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(min, Math.min(max, Math.round(numeric * 10) / 10));
}

function applyLimiterOutputFit(targetOutput) {
    const fittedOutput = clampLimiterOutput(targetOutput);
    audioState.limiter.enabled = true;
    audioState.limiter.outputGain = fittedOutput;
    streamingFitHoldUntil = performance.now() + 2500;
    streamingFitAppliedOutput = fittedOutput;
    const outputInput = document.getElementById('limiter-output');
    if (outputInput) outputInput.value = String(fittedOutput);
    limiter.syncInputs?.();
    limiter.updateUI(updateCompressorRangeFills);
    if (isPlaying && audioCtx) limiter.applySettings(audioCtx, getBypassState);
    updateStreamingLimiterOutput(audioState.limiter);
    return fittedOutput;
}

function getStreamingFitRecommendation(integrated) {
    if (!Number.isFinite(integrated)) return null;
    const targets = [...document.querySelectorAll('.target-row')]
        .map((row) => Number(row.dataset.targetLufs))
        .filter(Number.isFinite);
    if (!targets.length) return null;
    const currentOutput = Number(audioState.limiter?.outputGain || 0);
    const adjustments = targets.map((target) => target - integrated);
    const strictestAdjustment = Math.min(...adjustments);
    const hasTooLoudTarget = adjustments.some((adjustment) => adjustment < -0.1);
    return {
        hasTooLoudTarget,
        adjustment: strictestAdjustment,
        output: clampLimiterOutput(currentOutput + strictestAdjustment)
    };
}

function bindStreamingTargetFitButtons() {
    document.querySelectorAll('.target-row').forEach((row) => {
        const button = row.querySelector('.target-fit-btn');
        if (!button || button.dataset.fitBound === 'true') return;
        button.onclick = () => {
            const targetOutput = Number(row.dataset.fitOutput);
            if (!Number.isFinite(targetOutput)) return;
            const fitted = applyLimiterOutputFit(targetOutput);
            document.querySelectorAll('.target-fit-btn').forEach((candidate) => candidate.classList.remove('is-applied'));
            button.classList.add('is-applied');
            button.title = `Limiter Output ${fitted.toFixed(1)} dB 적용됨`;
        };
        button.dataset.fitBound = 'true';
    });
}

if (streamingLimiterFit) {
    streamingLimiterFit.onclick = () => {
        const recommendation = getStreamingFitRecommendation(latestIntegratedLufs);
        if (!recommendation || !recommendation.hasTooLoudTarget) return;
        const fitted = applyLimiterOutputFit(recommendation.output);
        streamingLimiterFit.innerText = 'FITTING';
        streamingLimiterFit.title = `가장 큰 타겟 초과분을 기준으로 Limiter Output ${fitted.toFixed(1)} dB 적용됨`;
        window.setTimeout(() => {
            if (streamingLimiterFit) streamingLimiterFit.innerText = 'AUTO FIT';
        }, 2500);
    };
}

window.addEventListener('limiter-output-change', (event) => {
    updateStreamingLimiterOutput(event.detail);
});
updateStreamingLimiterOutput();
bindStreamingTargetFitButtons();

function resetLoudnessStats() {
    loudnessSamples = [];
    loudnessChartPoints = [];
    loudnessTruePeak = 0;
    loudnessLastSampleAt = 0;
    loudnessEnergySum = 0;
    latestIntegratedLufs = NaN;
    [loudnessMomentary, loudnessShort, loudnessIntegrated, loudnessLra, loudnessPeak].forEach((element) => {
        if (element) element.innerText = '--';
    });
    Object.values(loudnessMeterBars).forEach((bar) => {
        if (!bar) return;
        bar.style.transform = 'scaleX(0)';
        bar.parentElement?.removeAttribute('aria-valuenow');
        bar.parentElement?.removeAttribute('aria-valuetext');
    });
    document.querySelectorAll('.target-row').forEach((row) => {
        const diff = row.querySelector('em');
        const status = row.querySelector('i');
        const fitButton = row.querySelector('.target-fit-btn');
        if (diff) diff.innerText = '--';
        if (status) { status.innerText = 'WAIT'; status.className = ''; }
        if (fitButton) {
            fitButton.disabled = true;
            fitButton.classList.remove('is-applied');
            fitButton.title = 'LUFS 측정 후 사용 가능';
        }
        delete row.dataset.fitOutput;
    });
    if (streamingLimiterFit) {
        streamingLimiterFit.disabled = true;
        streamingLimiterFit.title = 'LUFS 측정 후 사용 가능';
        streamingLimiterFit.innerText = 'AUTO FIT';
    }
    drawLoudnessHistory();
}

function getAnalyserMetrics(analyser) {
    if (!analyser) return { energy: 0, peak: 0 };
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    let energy = 0;
    let peak = 0;
    for (const sample of samples) {
        energy += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
    }
    return { energy: energy / Math.max(1, samples.length), peak };
}

function energyToLufs(energy) {
    return energy > 1e-12 ? -0.691 + (10 * Math.log10(energy)) : -Infinity;
}

function meanEnergy(samples) {
    if (!samples.length) return 0;
    return samples.reduce((sum, sample) => sum + sample.energy, 0) / samples.length;
}

function percentile(values, ratio) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * ratio)))];
}

function displayLoudness(element, value, decimals = 1) {
    if (element) element.innerText = Number.isFinite(value) ? value.toFixed(decimals) : '-∞';
}

function displayLoudnessLevel(bar, value, min, max, unit) {
    if (!bar) return;
    const finiteValue = Number.isFinite(value) ? value : min;
    const ratio = Math.max(0, Math.min(1, (finiteValue - min) / Math.max(0.001, max - min)));
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    const meter = bar.parentElement;
    if (!meter) return;
    meter.setAttribute('aria-valuenow', String(Number.isFinite(value) ? Number(value.toFixed(1)) : min));
    meter.setAttribute('aria-valuetext', Number.isFinite(value) ? `${value.toFixed(1)} ${unit}` : `-infinity ${unit}`);
}

function updateStreamingTargets(integrated) {
    latestIntegratedLufs = Number(integrated);
    updateStreamingLimiterOutput();
    const recommendation = getStreamingFitRecommendation(latestIntegratedLufs);
    const isFitHolding = performance.now() < streamingFitHoldUntil;
    if (streamingLimiterFit) {
        streamingLimiterFit.disabled = isFitHolding || !recommendation?.hasTooLoudTarget;
        streamingLimiterFit.title = recommendation?.hasTooLoudTarget
            ? `가장 엄격한 타겟 기준으로 Limiter Output ${recommendation.output.toFixed(1)} dB 적용`
            : '현재 스트리밍 타겟 초과 없음';
        if (!isFitHolding) streamingLimiterFit.innerText = 'AUTO FIT';
    }
    document.querySelectorAll('.target-row').forEach((row) => {
        const target = Number(row.dataset.targetLufs);
        const adjustment = target - integrated;
        const diff = row.querySelector('em');
        const status = row.querySelector('i');
        const fitButton = row.querySelector('.target-fit-btn');
        if (!Number.isFinite(integrated)) {
            if (diff) diff.innerText = '--';
            if (status) { status.innerText = 'WAIT'; status.className = ''; }
            if (fitButton) {
                fitButton.disabled = true;
                fitButton.classList.remove('is-applied');
                fitButton.title = 'LUFS 측정 후 사용 가능';
            }
            delete row.dataset.fitOutput;
            if (streamingLimiterFit) {
                streamingLimiterFit.disabled = true;
                streamingLimiterFit.title = 'LUFS 측정 후 사용 가능';
            }
            return;
        }
        const currentOutput = Number(audioState.limiter?.outputGain || 0);
        const fittedOutput = clampLimiterOutput(currentOutput + adjustment);
        row.dataset.fitOutput = String(fittedOutput);
        if (diff) diff.innerText = `${adjustment > 0 ? '+' : ''}${adjustment.toFixed(1)} dB`;
        if (status) {
            const within = Math.abs(adjustment) <= 1;
            status.innerText = within ? 'OK' : adjustment < 0 ? 'TOO LOUD' : 'QUIET';
            status.className = within ? 'is-ok' : adjustment < 0 ? 'is-loud' : 'is-quiet';
        }
        if (fitButton) {
            const isApplied = streamingFitAppliedOutput !== null && Math.abs(fittedOutput - streamingFitAppliedOutput) <= 0.05;
            fitButton.disabled = isFitHolding || Math.abs(adjustment) <= 0.1;
            fitButton.title = `${row.querySelector('span')?.innerText || 'Target'} 기준으로 Limiter Output ${fittedOutput.toFixed(1)} dB 적용`;
            if (isFitHolding) fitButton.title = 'Limiter Output 반영 중입니다';
            fitButton.classList.toggle('is-applied', isFitHolding && isApplied);
        }
    });
}

function drawLoudnessHistory() {
    if (!loudnessHistory) return;
    const rect = loudnessHistory.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(240, Math.round(rect.width * dpr));
    const height = Math.max(110, Math.round(rect.height * dpr));
    if (loudnessHistory.width !== width) loudnessHistory.width = width;
    if (loudnessHistory.height !== height) loudnessHistory.height = height;
    const context = loudnessHistory.getContext('2d');
    context.clearRect(0, 0, width, height);
    context.fillStyle = document.body.classList.contains('light-mode') ? '#f8fafc' : '#070c16';
    context.fillRect(0, 0, width, height);
    const pad = 22 * dpr;
    const minDb = -48;
    const maxDb = 0;
    const yOf = (value) => pad + ((maxDb - Math.max(minDb, Math.min(maxDb, value))) / (maxDb - minDb)) * (height - pad * 1.4);
    context.font = `${7 * dpr}px monospace`;
    [-6, -14, -23, -36, -48].forEach((db) => {
        const y = yOf(db);
        context.strokeStyle = db === -14 ? 'rgba(34,197,94,.55)' : 'rgba(100,116,139,.18)';
        context.setLineDash(db === -14 ? [4 * dpr, 3 * dpr] : []);
        context.beginPath(); context.moveTo(pad, y); context.lineTo(width, y); context.stroke();
        context.fillStyle = '#64748b'; context.fillText(String(db), 2 * dpr, y + 2 * dpr);
    });
    context.setLineDash([]);
    const points = loudnessChartPoints.slice(-1200);
    if (points.length < 2) return;
    const drawLine = (key, color) => {
        context.strokeStyle = color;
        context.lineWidth = 1.2 * dpr;
        context.beginPath();
        points.forEach((point, index) => {
            const x = pad + (index / Math.max(1, points.length - 1)) * (width - pad);
            const y = yOf(point[key]);
            if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.stroke();
    };
    drawLine('momentary', '#eab308');
    drawLine('shortTerm', '#f59e0b');
    drawLine('integrated', '#38bdf8');
}

function updateMasterLoudnessMeter() {
    const current = originalBuffer && audioCtx ? Math.max(0, Math.min(originalBuffer.duration, isPlaying ? audioCtx.currentTime - startTime : pausedAt)) : 0;
    if (loudnessTime) loudnessTime.innerText = formatTime(current);
    const now = performance.now();
    if (!isPlaying || !levelLeftAnalyser || !levelRightAnalyser || now - loudnessLastSampleAt < 100) return;
    loudnessLastSampleAt = now;
    const left = getAnalyserMetrics(levelLeftAnalyser);
    const right = getAnalyserMetrics(levelRightAnalyser);
    const energy = (left.energy + right.energy) / 2;
    loudnessTruePeak = Math.max(loudnessTruePeak, left.peak, right.peak);
    loudnessSamples.push({ time: now, energy });
    loudnessEnergySum += energy;
    if (loudnessSamples.length > 108000) {
        const removed = loudnessSamples.shift();
        loudnessEnergySum -= removed.energy;
    }
    const recentSamples = (windowMs) => {
        const result = [];
        for (let index = loudnessSamples.length - 1; index >= 0; index--) {
            const sample = loudnessSamples[index];
            if (now - sample.time > windowMs) break;
            result.push(sample);
        }
        return result;
    };
    const momentarySamples = recentSamples(400);
    const shortSamples = recentSamples(3000);
    const momentary = energyToLufs(meanEnergy(momentarySamples));
    const shortTerm = energyToLufs(meanEnergy(shortSamples));
    const integrated = energyToLufs(loudnessEnergySum / Math.max(1, loudnessSamples.length));
    latestIntegratedLufs = integrated;
    const shortValues = loudnessChartPoints.map((point) => point.shortTerm).filter(Number.isFinite);
    const lra = shortValues.length >= 10 ? Math.max(0, percentile(shortValues, 0.95) - percentile(shortValues, 0.10)) : 0;
    const peakDb = loudnessTruePeak > 0 ? 20 * Math.log10(loudnessTruePeak) : -Infinity;
    displayLoudness(loudnessMomentary, momentary);
    displayLoudness(loudnessShort, shortTerm);
    displayLoudness(loudnessIntegrated, integrated);
    displayLoudness(loudnessLra, lra);
    displayLoudness(loudnessPeak, peakDb);
    displayLoudnessLevel(loudnessMeterBars.momentary, momentary, -60, 0, 'LUFS');
    displayLoudnessLevel(loudnessMeterBars.shortTerm, shortTerm, -60, 0, 'LUFS');
    displayLoudnessLevel(loudnessMeterBars.integrated, integrated, -60, 0, 'LUFS');
    displayLoudnessLevel(loudnessMeterBars.lra, lra, 0, 20, 'LU');
    displayLoudnessLevel(loudnessMeterBars.peak, peakDb, -60, 3, 'dBTP');
    loudnessChartPoints.push({ momentary, shortTerm, integrated });
    if (loudnessChartPoints.length > 1200) loudnessChartPoints.shift();
    updateStreamingTargets(integrated);
    drawLoudnessHistory();
}

if (loudnessResetBtn) loudnessResetBtn.onclick = resetLoudnessStats;
if (loudnessHistoryCard && loudnessHistoryResizer) {
    try {
        const storedHeight = Number(localStorage.getItem(LOUDNESS_HISTORY_HEIGHT_KEY));
        if (Number.isFinite(storedHeight) && storedHeight >= 192 && storedHeight <= 672) {
            loudnessHistoryCard.style.height = `${storedHeight}px`;
        }
    } catch (error) {}

    let resizeStartY = 0;
    let resizeStartHeight = 0;
    const finishHistoryResize = (event) => {
        if (!loudnessHistoryResizer.classList.contains('is-resizing')) return;
        loudnessHistoryResizer.classList.remove('is-resizing');
        if (loudnessHistoryResizer.hasPointerCapture?.(event.pointerId)) {
            loudnessHistoryResizer.releasePointerCapture(event.pointerId);
        }
        try { localStorage.setItem(LOUDNESS_HISTORY_HEIGHT_KEY, String(Math.round(loudnessHistoryCard.getBoundingClientRect().height))); } catch (error) {}
    };
    loudnessHistoryResizer.onpointerdown = (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        resizeStartY = event.clientY;
        resizeStartHeight = loudnessHistoryCard.getBoundingClientRect().height;
        loudnessHistoryResizer.classList.add('is-resizing');
        loudnessHistoryResizer.setPointerCapture?.(event.pointerId);
    };
    loudnessHistoryResizer.onpointermove = (event) => {
        if (!loudnessHistoryResizer.classList.contains('is-resizing')) return;
        const nextHeight = Math.max(192, Math.min(672, resizeStartHeight + (event.clientY - resizeStartY)));
        loudnessHistoryCard.style.height = `${nextHeight}px`;
        drawLoudnessHistory();
    };
    loudnessHistoryResizer.onpointerup = finishHistoryResize;
    loudnessHistoryResizer.onpointercancel = finishHistoryResize;
}
if (loudnessCollapseBtn && loudnessPanelContent) {
    loudnessCollapseBtn.onclick = () => {
        const collapsed = !loudnessPanelContent.classList.contains('is-collapsed');
        loudnessPanelContent.classList.toggle('is-collapsed', collapsed);
        loudnessCollapseBtn.setAttribute('aria-expanded', String(!collapsed));
        loudnessCollapseBtn.innerHTML = `<i class="fa-solid fa-chevron-${collapsed ? 'down' : 'up'}"></i>`;
        if (!collapsed) drawLoudnessHistory();
    };
}
resetLoudnessStats();

// Bind file selection and drag-and-drop before the rest of the workstation UI initializes.
// This keeps uploading operational even if an unrelated panel fails later during startup.
initAudioUpload({
    input: upload,
    getAudioContext: async () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Decoding works while suspended. Do not await resume here: file change/drop
        // is not always accepted as an autoplay gesture and the promise may stay pending.
        if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => {});
        return audioCtx;
    },
    onLoading: (file) => {
        resetLoudnessStats();
        startWaveformLoading(file);
        trackName.innerText = `${file.name} 웨이브폼 불러오는 중...`;
        detectorStatus.innerText = '(분석 연산 중)';
    },
    onDecoded: ({ file, buffer }) => completeDecodedAudioWithLoading(file, buffer),
    onError: (error) => {
        stopWaveformLoading(false, error?.message || '파일 로드 실패');
        console.error('Audio upload failed:', error);
        alert(error.message || '오디오 데이터 디코딩에 실패했습니다. 포맷을 다시 확인해 주세요.');
    }
});

function setProgressBarValue(value) {
    const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    if (progressBar) {
        progressBar.value = clampedValue;
        progressBar.style.setProperty('--playback-progress', `${clampedValue}%`);
        const duration = originalBuffer?.duration || 0;
        const current = duration * (clampedValue / 100);
        progressBar.setAttribute('aria-valuetext', `${formatTime(current)} / ${formatTime(duration)}`);
    }
    if (progressPercent) progressPercent.innerText = formatTime(originalBuffer?.duration || 0);
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

// UI 1: 20-band EQ renderer and response visualizer
eq.renderUI('eq-sliders-container');
eq.initVisualizer('eq-response-canvas');
eq.startVisualizer();

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
    audioState.eqEnabled = false;
    
    eq.frequencies.forEach((_, idx) => {
        eq.setEQValue(idx, 0, audioCtx, getPlayState, getBypassState, false);
    });
    eq.updateUI();
    if (audioCtx && isPlaying) eq.applySettings(audioCtx, getBypassState());
};
genreGrid.appendChild(noneBtn);

function buildMicroMasterPreset(name, presetIndex) {
    const valueAt = (idx) => {
        const freq = eq.frequencies[idx] || 1000;
        const logFreq = Math.log10(freq);
        const gaussian = (center, width, gain) => gain * Math.exp(-0.5 * Math.pow((logFreq - Math.log10(center)) / width, 2));
        let value = 0;

        if (name.includes("Low Shelf +")) value += gaussian(65, 0.42, name.includes("+0.5") ? 0.5 : 0.3);
        if (name.includes("Low Shelf -") || name.includes("Low Trim")) value -= gaussian(75, 0.42, name.includes("-0.5") ? 0.5 : 0.3);
        if (name.includes("Sub Clean") || name.includes("Sub Guard")) value -= gaussian(35, 0.28, 0.45);
        if (name.includes("Kick Weight")) value += gaussian(85, 0.25, 0.4);
        if (name.includes("Kick Seat")) value += gaussian(95, 0.23, 0.28);
        if (name.includes("Low Tight") || name.includes("Low Guard") || name.includes("Low Control")) value -= gaussian(180, 0.35, 0.35);
        if (name.includes("Mud Trim") || name.includes("Mud Cut") || name.includes("Mud -")) value -= gaussian(280, 0.28, name.includes("-0.7") ? 0.7 : 0.42);
        if (name.includes("Low-Mid Body") || name.includes("Body +") || name.includes("Body Small")) value += gaussian(220, 0.28, name.includes("-0.3") ? -0.3 : 0.32);
        if (name.includes("Box Trim") || name.includes("Box -")) value -= gaussian(480, 0.22, name.includes("-0.6") ? 0.6 : 0.38);
        if (name.includes("Center Clarity") || name.includes("Mid Clean") || name.includes("Clean Translation")) value += gaussian(1200, 0.28, 0.28);
        if (name.includes("Vocal Pocket") || name.includes("Vocal Clear") || name.includes("Presence +") || name.includes("Presence Small") || name.includes("Presence +0.4")) value += gaussian(2600, 0.25, name.includes("+0.5") ? 0.5 : 0.34);
        if (name.includes("Presence Trim") || name.includes("Harsh") || name.includes("Bite Trim") || name.includes("Bright Tame") || name.includes("Edge Tame")) value -= gaussian(3400, 0.24, name.includes("-0.5") ? 0.5 : 0.34);
        if (name.includes("Sibilance") || name.includes("Hi-Hat Soft")) value -= gaussian(6500, 0.22, name.includes("-0.5") ? 0.5 : 0.38);
        if (name.includes("Air +") || name.includes("String Air") || name.includes("Vocal Air") || name.includes("Laptop")) value += gaussian(11000, 0.3, name.includes("+0.6") ? 0.6 : 0.42);
        if (name.includes("Air -") || name.includes("Top Smooth") || name.includes("Soft Top") || name.includes("Air Soft")) value -= gaussian(11000, 0.32, name.includes("-0.6") ? 0.6 : 0.34);
        if (name.includes("Warm Tilt") || name.includes("Warm Micro") || name.includes("Tube Warm")) value += gaussian(160, 0.42, 0.28) - gaussian(9000, 0.42, 0.2);
        if (name.includes("Cool Tilt") || name.includes("Bright A")) value -= gaussian(170, 0.42, 0.22) + gaussian(9000, 0.42, 0.32);
        if (name.includes("Dense Trim") || name.includes("Translation") || name.includes("Mono Safe")) value -= gaussian(250, 0.3, 0.18) + gaussian(4200, 0.28, 0.15);

        const microVariation = Math.sin((presetIndex + 1) * 0.71 + idx * 0.83) * 0.08;
        const shaped = Math.max(-1.35, Math.min(1.35, value + microVariation));
        return Math.round(shaped * 10) / 10;
    };
    return eq.frequencies.map((_, idx) => valueAt(idx));
}

presetNames.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = `preset-btn`;
    btn.innerHTML = `<span class="preset-num">${i+1}.</span>${name}`;
    btn.onclick = () => {
        document.querySelectorAll('#genre-grid button').forEach(b => b.classList.remove('genre-active'));
        btn.classList.add('genre-active');
        audioState.eqEnabled = true;
        const presetValues = buildMicroMasterPreset(name, i);
        presetValues.forEach((value, idx) => {
            eq.setEQValue(idx, value, audioCtx, getPlayState, getBypassState, false);
        });
        eq.updateUI();
        if (audioCtx && isPlaying) eq.applySettings(audioCtx, getBypassState());
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

function createLoadingWaveformPeaks(fileName, bucketCount = 900) {
    let seed = Array.from(String(fileName || 'audio')).reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
    const random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    return Array.from({ length: bucketCount }, (_, index) => {
        const position = index / Math.max(1, bucketCount - 1);
        const envelope = 0.42 + (0.25 * Math.sin(position * Math.PI * 5.4)) + (0.13 * Math.sin(position * Math.PI * 17));
        return Math.max(0.08, Math.min(0.95, envelope + (random() - 0.5) * 0.22));
    });
}

function showWaveformLoadMessage(message, done = false) {
    if (!waveformLoadMessage) return;
    window.clearTimeout(waveformMessageTimer);
    waveformLoadMessage.classList.remove('hidden');
    waveformLoadMessage.classList.toggle('is-done', done);
    const icon = document.createElement('i');
    icon.className = done ? 'fa-solid fa-circle-check' : 'fa-solid fa-wave-square fa-beat-fade';
    const text = document.createElement('span');
    text.textContent = message;
    waveformLoadMessage.replaceChildren(icon, text);
    if (done) {
        waveformMessageTimer = window.setTimeout(() => waveformLoadMessage.classList.add('hidden'), 2800);
    }
}

function startWaveformLoading(file) {
    if (waveformLoadingFrame) cancelAnimationFrame(waveformLoadingFrame);
    const state = {
        fileName: file?.name || '새 오디오 파일',
        startedAt: performance.now(),
        progress: 0,
        pulse: 0,
        peaks: createLoadingWaveformPeaks(file?.name)
    };
    waveformLoadingState = state;
    waveformProgress = 0;
    if (waveformTime) waveformTime.innerText = 'LOADING WAVEFORM...';
    showWaveformLoadMessage(`${state.fileName} 불러오는 중...`);
    const animate = (now) => {
        if (waveformLoadingState !== state) return;
        const elapsed = Math.max(0, now - state.startedAt);
        state.progress = Math.min(0.94, 1 - Math.exp(-elapsed / 720));
        state.pulse = elapsed / 1000;
        drawAudioWaveform(0);
        waveformLoadingFrame = requestAnimationFrame(animate);
    };
    waveformLoadingFrame = requestAnimationFrame(animate);
}

function stopWaveformLoading(done = false, message = '') {
    if (waveformLoadingFrame) cancelAnimationFrame(waveformLoadingFrame);
    waveformLoadingFrame = 0;
    waveformLoadingState = null;
    if (message) showWaveformLoadMessage(message, done);
    drawAudioWaveform(waveformProgress);
}

function completeDecodedAudioWithLoading(file, buffer) {
    const loadingState = waveformLoadingState;
    const elapsed = loadingState ? performance.now() - loadingState.startedAt : 900;
    const remaining = Math.max(0, 850 - elapsed);
    window.setTimeout(() => {
        if (loadingState && waveformLoadingState !== loadingState) return;
        handleDecodedAudio(file, buffer);
    }, remaining);
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

    const loading = waveformLoadingState;
    const peaks = loading?.peaks || (waveformPeaks.length ? waveformPeaks : new Array(180).fill(0.02));
    const barCount = Math.min(peaks.length, Math.floor(width / (3 * dpr)));
    const step = peaks.length / barCount;
    const barW = Math.max(1 * dpr, width / barCount - (1 * dpr));
    const playX = Math.max(0, Math.min(width, (loading ? loading.progress : progress) * width));

    for (let i = 0; i < barCount; i++) {
        const peak = peaks[Math.floor(i * step)] || 0;
        const x = i * (width / barCount);
        const loadingPulse = loading ? 0.9 + (0.1 * Math.sin((i * 0.24) + loading.pulse * 6)) : 1;
        const barH = Math.max(1.5 * dpr, peak * loadingPulse * (height - padY * 2));
        ctx2.fillStyle = x <= playX ? played : idle;
        ctx2.fillRect(x, centerY - (barH / 2), barW, barH);
    }

    if (loading) {
        const scanGradient = ctx2.createLinearGradient(Math.max(0, playX - 80 * dpr), 0, playX, 0);
        scanGradient.addColorStop(0, 'rgba(34,211,238,0)');
        scanGradient.addColorStop(1, 'rgba(34,211,238,.2)');
        ctx2.fillStyle = scanGradient;
        ctx2.fillRect(Math.max(0, playX - 80 * dpr), 0, Math.min(playX, 80 * dpr), height);
        ctx2.strokeStyle = '#22d3ee';
        ctx2.lineWidth = 2 * dpr;
        ctx2.beginPath(); ctx2.moveTo(playX, 0); ctx2.lineTo(playX, height); ctx2.stroke();
        return;
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
        ? "transport-btn is-looping"
        : "transport-btn";
}

function clampSectionTime(value) {
    const duration = originalBuffer?.duration || 0;
    return Math.max(0, Math.min(duration, Number(value) || 0));
}

function setSectionRepeatRange(start, end) {
    const duration = originalBuffer?.duration || 0;
    if (!duration) {
        sectionRepeatStart = 0;
        sectionRepeatEnd = 0;
        return;
    }
    let nextStart = clampSectionTime(Math.min(start, end));
    let nextEnd = clampSectionTime(Math.max(start, end));
    const minimum = Math.min(0.25, duration);
    if (nextEnd - nextStart < minimum) {
        nextEnd = Math.min(duration, nextStart + minimum);
        nextStart = Math.max(0, nextEnd - minimum);
    }
    sectionRepeatStart = nextStart;
    sectionRepeatEnd = nextEnd;
    updateSectionRepeatUI();
}

function updateSectionRepeatUI(current = isPlaying && audioCtx ? audioCtx.currentTime - startTime : pausedAt) {
    const duration = originalBuffer?.duration || 0;
    if (!sectionRepeatBtn || !sectionRepeatEditor) return;
    sectionRepeatBtn.setAttribute('aria-pressed', String(sectionRepeatEnabled));
    sectionRepeatBtn.classList.toggle('is-active', sectionRepeatEnabled);
    sectionRepeatEditor.classList.toggle('hidden', !sectionRepeatEnabled || !duration);
    if (!duration) return;

    const startPct = (sectionRepeatStart / duration) * 100;
    const endPct = (sectionRepeatEnd / duration) * 100;
    const playheadPct = (Math.max(0, Math.min(duration, current)) / duration) * 100;
    if (sectionRepeatRegion) {
        sectionRepeatRegion.style.left = `${startPct}%`;
        sectionRepeatRegion.style.width = `${Math.max(0, endPct - startPct)}%`;
    }
    if (sectionRepeatStartHandle) sectionRepeatStartHandle.style.left = `${startPct}%`;
    if (sectionRepeatEndHandle) sectionRepeatEndHandle.style.left = `${endPct}%`;
    if (sectionRepeatStartBadge) {
        sectionRepeatStartBadge.style.left = `${startPct}%`;
        sectionRepeatStartBadge.innerText = `A ${formatTime(sectionRepeatStart)}`;
    }
    if (sectionRepeatEndBadge) {
        sectionRepeatEndBadge.style.left = `${endPct}%`;
        sectionRepeatEndBadge.innerText = `B ${formatTime(sectionRepeatEnd)}`;
    }
    if (sectionRepeatDurationLabel) {
        sectionRepeatDurationLabel.style.left = `${startPct + ((endPct - startPct) / 2)}%`;
        sectionRepeatDurationLabel.innerText = `선택 ${formatTime(Math.max(0, sectionRepeatEnd - sectionRepeatStart))}`;
    }
    if (sectionRepeatPlayhead) sectionRepeatPlayhead.style.left = `${playheadPct}%`;
    const progress = sectionRepeatBar?.querySelector('.section-repeat-progress');
    if (progress) progress.style.width = `${playheadPct}%`;
    if (sectionRepeatStartLabel) sectionRepeatStartLabel.innerText = `A ${formatTime(sectionRepeatStart)}`;
    if (sectionRepeatEndLabel) sectionRepeatEndLabel.innerText = `B ${formatTime(sectionRepeatEnd)}`;
}

function sectionTimeFromPointer(clientX) {
    const rect = sectionRepeatBar?.getBoundingClientRect();
    const duration = originalBuffer?.duration || 0;
    if (!rect?.width || !duration) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
}

function startSectionRepeatDrag(mode, event) {
    if (!sectionRepeatEnabled || !originalBuffer || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const anchor = sectionTimeFromPointer(event.clientX);
    sectionRepeatDrag = { mode, anchor, start: sectionRepeatStart, end: sectionRepeatEnd };
    if (mode === 'create') setSectionRepeatRange(anchor, anchor);
    sectionRepeatBar?.setPointerCapture?.(event.pointerId);
}

function moveSectionRepeatDrag(event) {
    if (!sectionRepeatDrag) return;
    const time = sectionTimeFromPointer(event.clientX);
    if (sectionRepeatDrag.mode === 'start') setSectionRepeatRange(time, sectionRepeatDrag.end);
    else if (sectionRepeatDrag.mode === 'end') setSectionRepeatRange(sectionRepeatDrag.start, time);
    else if (sectionRepeatDrag.mode === 'create') setSectionRepeatRange(sectionRepeatDrag.anchor, time);
    else if (sectionRepeatDrag.mode === 'move') {
        const duration = originalBuffer?.duration || 0;
        const width = sectionRepeatDrag.end - sectionRepeatDrag.start;
        let start = sectionRepeatDrag.start + (time - sectionRepeatDrag.anchor);
        start = Math.max(0, Math.min(duration - width, start));
        setSectionRepeatRange(start, start + width);
    }
}

function stopSectionRepeatDrag(event) {
    if (!sectionRepeatDrag) return;
    sectionRepeatDrag = null;
    if (sectionRepeatBar?.hasPointerCapture?.(event.pointerId)) {
        sectionRepeatBar.releasePointerCapture(event.pointerId);
    }
}

if (sectionRepeatBtn) {
    sectionRepeatBtn.onclick = () => {
        if (!originalBuffer) return;
        sectionRepeatEnabled = !sectionRepeatEnabled;
        if (sectionRepeatEnabled && !sectionRepeatInitialized) {
            const duration = originalBuffer.duration;
            setSectionRepeatRange(duration * 0.2, duration * 0.8);
            sectionRepeatInitialized = true;
        }
        updateSectionRepeatUI();
    };
}
if (sectionRepeatBar) {
    sectionRepeatBar.onpointerdown = (event) => {
        const mode = event.target === sectionRepeatStartHandle
            ? 'start'
            : event.target === sectionRepeatEndHandle
                ? 'end'
                : event.target === sectionRepeatRegion
                    ? 'move'
                    : 'create';
        startSectionRepeatDrag(mode, event);
    };
    sectionRepeatBar.onpointermove = moveSectionRepeatDrag;
    sectionRepeatBar.onpointerup = stopSectionRepeatDrag;
    sectionRepeatBar.onpointercancel = stopSectionRepeatDrag;
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
    updateRangeFill(panControl, '#06b6d4');
    updateRangeFill(frontControl, '#8b5cf6');
}

function formatPanValue(value) {
    const amount = Math.round(Math.abs(value));
    if (amount === 0) return 'C';
    return `${value < 0 ? 'L' : 'R'}${amount}`;
}

function syncSpatialUI() {
    if (panControl) panControl.value = audioState.pan ?? 0;
    if (frontControl) frontControl.value = audioState.front ?? 0;
    if (panValue) panValue.value = formatPanValue(Number(audioState.pan) || 0);
    if (frontValue) {
        const value = Math.round(Number(audioState.front) || 0);
        frontValue.value = value > 0 ? `+${value}` : String(value);
    }
    updateRangeFill(panControl, '#06b6d4');
    updateRangeFill(frontControl, '#8b5cf6');
}

function applySpatialSettings(context = audioCtx) {
    if (!context) return;
    const now = context.currentTime || 0;
    const front = isBypassed ? 0 : Math.max(-100, Math.min(100, Number(audioState.front) || 0));
    const pan = isBypassed ? 0 : Math.max(-1, Math.min(1, (Number(audioState.pan) || 0) / 100));

    // Positive Front adds presence/air and trims body; negative values move the
    // source back with softer highs and slightly more low-mid body.
    frontFilters.body?.gain.setValueAtTime(-front * 0.015, now);
    frontFilters.presence?.gain.setValueAtTime(front * 0.06, now);
    frontFilters.air?.gain.setValueAtTime(front * 0.025, now);
    stereoPannerNode?.pan.setValueAtTime(pan, now);
}

function bindSpatialControls() {
    const commitSpatialInput = (input, nextValue) => {
        if (!input) return;
        const min = Number(input.min);
        const max = Number(input.max);
        input.value = Math.max(min, Math.min(max, Number(nextValue) || 0));
        input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    if (panControl) {
        panControl.oninput = (event) => {
            audioState.pan = Number(event.target.value) || 0;
            syncSpatialUI();
            applySpatialSettings();
        };
        panControl.ondblclick = () => commitSpatialInput(panControl, 0);
    }
    if (frontControl) {
        frontControl.oninput = (event) => {
            audioState.front = Number(event.target.value) || 0;
            syncSpatialUI();
            applySpatialSettings();
        };
        frontControl.ondblclick = () => commitSpatialInput(frontControl, 0);
    }
    document.querySelectorAll('[data-spatial-target]').forEach((button) => {
        button.onclick = () => {
            const input = document.getElementById(button.dataset.spatialTarget);
            const delta = Number(button.dataset.spatialDelta) || 0;
            commitSpatialInput(input, Number(input?.value || 0) + delta);
        };
    });
    syncSpatialUI();
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

    // 8. Front depth: a dedicated EQ contour independent of the graphic EQ.
    frontFilters.body = context.createBiquadFilter();
    frontFilters.body.type = 'lowshelf';
    frontFilters.body.frequency.value = 220;
    frontFilters.presence = context.createBiquadFilter();
    frontFilters.presence.type = 'peaking';
    frontFilters.presence.frequency.value = 2800;
    frontFilters.presence.Q.value = 0.8;
    frontFilters.air = context.createBiquadFilter();
    frontFilters.air.type = 'highshelf';
    frontFilters.air.frequency.value = 6500;
    lastOutputNode.connect(frontFilters.body);
    frontFilters.body.connect(frontFilters.presence);
    frontFilters.presence.connect(frontFilters.air);
    lastOutputNode = frontFilters.air;

    // 9. Limiter
    lastOutputNode = await limiter.connect(context, lastOutputNode, () => isBypassed);

    // 10. Stereo pan
    stereoPannerNode = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
    if (stereoPannerNode) {
        lastOutputNode.connect(stereoPannerNode);
        lastOutputNode = stereoPannerNode;
    }
    applySpatialSettings(context);

    // 11. Master volume out gain
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
                eqCollapseBtn.setAttribute('aria-expanded', 'true');
                window.setTimeout(() => eq.drawEQCanvas?.(), 0);
            } else {
                eqCollapseContent.classList.add('hidden');
                eqCollapseIcon.className = "fa-solid fa-chevron-down";
                eqCollapseBtn.setAttribute('aria-expanded', 'false');
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
limiter.initVisualizers();
limiter.updateUI(updateCompressorRangeFills);
bindLiveControlTriggers();
bindSpatialControls();
reverb.initVisualizers(updateCompressorRangeFills);
compressor.initGraphInteraction(updateCompressorRangeFills);
setupResizableEffectGraphs();

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
    executeBypassRouting(true);
    resetLoudnessStats();
    audioState.eq = new Array(20).fill(0);
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
    sectionRepeatEnabled = false;
    sectionRepeatInitialized = false;
    sectionRepeatStart = 0;
    sectionRepeatEnd = originalBuffer?.duration || 0;
    updateSectionRepeatUI(0);
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
    audioState.pan = 0;
    audioState.front = 0;
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
    syncSpatialUI();
    applySpatialSettings();
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

// Audio upload completion: keep workstation-specific state in the main application.
function handleDecodedAudio(file, buffer) {
    resetLoudnessStats();
    currentAudioFileBlob = file;
    currentAudioFileName = file.name;
    updateExportFilenamePreview();
    originalBuffer = buffer;
    sectionRepeatEnabled = false;
    sectionRepeatInitialized = false;
    sectionRepeatStart = 0;
    sectionRepeatEnd = buffer.duration;
    updateSectionRepeatUI(0);
    waveformPeaks = buildWaveformPeaks(buffer);
    stopWaveformLoading(true, `${file.name} 로드 완료`);
    updateWaveformProgress(0);
    trackName.innerText = `로드 완료: ${file.name}`;

    activeStemIds = [];
    const activeCount = Math.floor(Math.random() * 5) + 8;
    const shuffled = [...stemRegistry].sort(() => 0.5 - Math.random());
    for (let i = 0; i < activeCount; i++) activeStemIds.push(shuffled[i].id);

    // Re-initialize values for stems in audioState when new file is uploaded
    stemRegistry.forEach(s => {
        audioState.stems[s.id] = 0;
        audioState.mutes[s.id] = false;
    });

    syncStemsUI();
    playBtn.disabled = false;
    setAudioTransportAvailability(true);

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
}

progressBar.onmousedown = () => { isUserSeeking = true; };
progressBar.onmouseup = () => { isUserSeeking = false; };
progressBar.oninput = (e) => {
    if (!originalBuffer) return;
    setProgressBarValue(parseFloat(e.target.value));
    let pct = parseFloat(e.target.value) / 100;
    let targetTime = pct * originalBuffer.duration;
    timeDisplay.innerText = formatTime(targetTime);
    updateWaveformProgress(targetTime);
};

async function seekToTime(targetTime) {
    if (!originalBuffer) return;
    const target = Math.max(0, Math.min(originalBuffer.duration, Number(targetTime) || 0));
    const wasPlaying = isPlaying;
    if (sourceNode) {
        try { sourceNode.stop(); } catch (error) {}
    }
    isPlaying = false;
    pausedAt = target;
    setProgressBarValue(originalBuffer.duration ? (target / originalBuffer.duration) * 100 : 0);
    updateWaveformProgress(target);
    updateSectionRepeatUI(target);
    if (target >= originalBuffer.duration) {
        playBtn.innerHTML = `<i class="fa-solid fa-play ml-0.5"></i>`;
        return;
    }
    if (wasPlaying) await startPlaybackAt(target);
}

if (skipBackBtn) skipBackBtn.onclick = () => seekToTime((isPlaying && audioCtx ? audioCtx.currentTime - startTime : pausedAt) - 10);
if (skipForwardBtn) skipForwardBtn.onclick = () => seekToTime((isPlaying && audioCtx ? audioCtx.currentTime - startTime : pausedAt) + 10);
if (seekStartBtn) seekStartBtn.onclick = () => seekToTime(0);
if (seekEndBtn) seekEndBtn.onclick = () => seekToTime(originalBuffer?.duration || 0);
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
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.78;
    analyserNode.minDecibels = SPECTRUM_MIN_DB;
    analyserNode.maxDecibels = SPECTRUM_MAX_DB;

    finalizedOutput.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    // Read the post-pan left/right channels without adding a second audible path.
    levelSplitterNode = audioCtx.createChannelSplitter(2);
    levelLeftAnalyser = audioCtx.createAnalyser();
    levelRightAnalyser = audioCtx.createAnalyser();
    levelLeftAnalyser.fftSize = 256;
    levelRightAnalyser.fftSize = 256;
    levelSilentGain = audioCtx.createGain();
    levelSilentGain.gain.value = 0;
    finalizedOutput.connect(levelSplitterNode);
    levelSplitterNode.connect(levelLeftAnalyser, 0);
    levelSplitterNode.connect(levelRightAnalyser, 1);
    levelLeftAnalyser.connect(levelSilentGain);
    levelRightAnalyser.connect(levelSilentGain);
    levelSilentGain.connect(audioCtx.destination);

    bindLiveControlTriggers();

    const repeatOffset = sectionRepeatEnabled && sectionRepeatEnd > sectionRepeatStart && offset >= sectionRepeatEnd
        ? sectionRepeatStart
        : offset;
    pausedAt = Math.max(0, Math.min(repeatOffset, originalBuffer.duration));
    startTime = audioCtx.currentTime - pausedAt;
    sourceNode.start(0, pausedAt);
    isPlaying = true;
    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;

    sourceNode.onended = async () => {
        if (!isPlaying || audioCtx.currentTime - startTime < originalBuffer.duration - 0.1) return;

        if (sectionRepeatEnabled && sectionRepeatEnd > sectionRepeatStart) {
            pausedAt = sectionRepeatStart;
            updateWaveformProgress(sectionRepeatStart);
            await startPlaybackAt(sectionRepeatStart);
            return;
        }

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

    if (sectionRepeatEnabled && isPlaying && sectionRepeatEnd > sectionRepeatStart && current >= sectionRepeatEnd && !sectionRepeatSeeking) {
        sectionRepeatSeeking = true;
        void seekToTime(sectionRepeatStart).finally(() => { sectionRepeatSeeking = false; });
        return;
    }
    
    timeDisplay.innerText = formatTime(current);
    updateWaveformProgress(current);
    updateSectionRepeatUI(current);
    
    if (!isUserSeeking && progressBar) {
        setProgressBarValue((current / originalBuffer.duration) * 100);
    }
}, 250);

// A/B bypass routing switch
const btnA = document.getElementById('bypass-a');
const btnB = document.getElementById('bypass-b');
function enableMasterProcessors() {
    audioState.reverb.enabled = true;
    audioState.compressor.enabled = true;
    audioState.limiter.enabled = true;
    reverb.updateUI(updateCompressorRangeFills);
    compressor.updateUI(updateCompressorRangeFills);
    limiter.updateUI(updateCompressorRangeFills);
}

function executeBypassRouting(mode) {
    isBypassed = mode;
    if (isBypassed) {
        btnA.className = "is-active";
        btnB.className = "";
        if (isPlaying) {
            eq.applySettings(audioCtx, isBypassed);
            Object.values(stemFilters).forEach(f => f.gain.setValueAtTime(0, audioCtx.currentTime));
            applyUtilityEffectSettings(audioCtx);
            reverb.applySettings(audioCtx, () => isBypassed);
            compressor.applySettings(audioCtx, () => isBypassed);
            limiter.applySettings(audioCtx, () => isBypassed);
            if(masterGainNode) masterGainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
            applySpatialSettings();
        }
    } else {
        btnA.className = "";
        btnB.className = "is-active";
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
            applySpatialSettings();
        }
    }
}
btnA.onclick = () => executeBypassRouting(true);
btnB.onclick = () => {
    enableMasterProcessors();
    executeBypassRouting(false);
};

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
    const exportFilename = getMasteredExportFilename();

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
        link.download = exportFilename;
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

function formatSpectrumFrequency(frequency) {
    if (frequency >= 1000) {
        const kilo = frequency / 1000;
        return `${kilo >= 10 ? Math.round(kilo) : kilo.toFixed(1).replace('.0', '')}k`;
    }
    return String(Math.round(frequency));
}

function collectSpectrumBands(dataArray, count) {
    const sampleRate = analyserNode?.context?.sampleRate || 48000;
    const fftSize = analyserNode?.fftSize || dataArray.length * 2;
    const binHz = sampleRate / fftSize;
    const minHz = 31.5;
    const maxHz = Math.min(20000, sampleRate / 2);
    const ratio = maxHz / minHz;

    return Array.from({ length: count }, (_, index) => {
        const startHz = minHz * Math.pow(ratio, index / count);
        const endHz = minHz * Math.pow(ratio, (index + 1) / count);
        const startBin = Math.max(1, Math.min(dataArray.length - 1, Math.floor(startHz / binHz)));
        const endBin = Math.max(startBin + 1, Math.min(dataArray.length, Math.ceil(endHz / binHz)));
        let peak = 0;
        let energy = 0;
        let samples = 0;
        for (let bin = startBin; bin < endBin; bin++) {
            const value = dataArray[bin];
            peak = Math.max(peak, value);
            energy += value * value;
            samples++;
        }
        const rms = Math.sqrt(energy / Math.max(1, samples));
        return {
            frequency: Math.sqrt(startHz * endHz),
            percent: Math.min(1, ((peak * 0.72) + (rms * 0.28)) / 255)
        };
    });
}

const SPECTRUM_MIN_DB = -72;
const SPECTRUM_MAX_DB = 0;

function getSpectrumPlotRect() {
    const left = 32;
    const right = 6;
    const top = 24;
    const bottom = 8;
    return {
        left,
        top,
        right: canvas.width - right,
        bottom: canvas.height - bottom,
        width: Math.max(1, canvas.width - left - right),
        height: Math.max(1, canvas.height - top - bottom)
    };
}

function drawSpectrumDbScale() {
    const plot = getSpectrumPlotRect();
    const ticks = [0, -12, -24, -36, -48, -60, -72];
    ctx.save();
    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ticks.forEach((db) => {
        const ratio = (db - SPECTRUM_MIN_DB) / (SPECTRUM_MAX_DB - SPECTRUM_MIN_DB);
        const y = plot.bottom - ratio * plot.height;
        ctx.strokeStyle = db === 0 ? 'rgba(251,113,133,.28)' : 'rgba(71,85,105,.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(plot.left, y); ctx.lineTo(plot.right, y); ctx.stroke();
        ctx.fillStyle = db === 0 ? '#fb7185' : '#64748b';
        ctx.fillText(`${db}`, plot.left - 5, y);
    });
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('dB', 3, plot.top - 10);
    for (let index = 0; index <= 10; index++) {
        const x = plot.left + plot.width * index / 10;
        ctx.strokeStyle = 'rgba(71,85,105,.13)';
        ctx.beginPath(); ctx.moveTo(x, plot.top); ctx.lineTo(x, plot.bottom); ctx.stroke();
    }
    ctx.restore();
}

function drawSpectrumFrequencyLabels(bands) {
    const plot = getSpectrumPlotRect();
    const labelStep = Math.max(1, Math.ceil(bands.length / 10));
    ctx.save();
    ctx.fillStyle = document.body.classList.contains('light-mode') ? '#1e293b' : '#64748b';
    ctx.font = '8px ui-monospace, monospace';
    ctx.textAlign = 'center';
    bands.forEach((band, index) => {
        if (index % labelStep !== 0 && index !== bands.length - 1) return;
        const x = plot.left + ((index + 0.5) / bands.length) * plot.width;
        ctx.fillText(formatSpectrumFrequency(band.frequency), x, 10);
    });
    ctx.restore();
}

function drawBarSpectrum(bands) {
    const plot = getSpectrumPlotRect();
    const slotWidth = plot.width / bands.length;
    const gap = Math.max(1, Math.min(4, slotWidth * 0.16));
    const barWidth = Math.max(1, slotWidth - gap);
    bands.forEach((band, index) => {
        const barHeight = band.percent * plot.height;
        const x = plot.left + (index * slotWidth) + (gap / 2);
        const y = plot.bottom - barHeight;
        const gradient = ctx.createLinearGradient(0, y, 0, plot.bottom);
        gradient.addColorStop(0, '#f43f5e');
        gradient.addColorStop(0.4, '#fbbf24');
        gradient.addColorStop(1, '#10b981');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
    });
    drawSpectrumFrequencyLabels(bands);
}

function drawWaveSpectrum(bands, overlay = false) {
    const plot = getSpectrumPlotRect();
    const points = bands.map((band, index) => ({
        x: plot.left + ((index + 0.5) / bands.length) * plot.width,
        y: plot.bottom - (band.percent * plot.height)
    }));
    if (!points.length) return;

    if (!overlay) {
        const fillGradient = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
        fillGradient.addColorStop(0, 'rgba(244,63,94,.58)');
        fillGradient.addColorStop(0.42, 'rgba(251,191,36,.36)');
        fillGradient.addColorStop(1, 'rgba(16,185,129,.08)');
        ctx.beginPath();
        ctx.moveTo(points[0].x, plot.bottom);
        points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.lineTo(points[points.length - 1].x, plot.bottom);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();
    }

    const lineGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    lineGradient.addColorStop(0, '#10b981');
    lineGradient.addColorStop(0.55, '#22d3ee');
    lineGradient.addColorStop(1, '#fb7185');
    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = overlay ? 2.6 : 2.2;
    ctx.shadowColor = 'rgba(34,211,238,.65)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (bands.length <= 32) {
        ctx.fillStyle = '#e0f2fe';
        points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    if (!overlay) drawSpectrumFrequencyLabels(bands);
}

function animateSpectrum() {
    requestAnimationFrame(animateSpectrum);
    updateOutputLevelMeter();
    updateMasterLoudnessMeter();
    if(!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSpectrumDbScale();

    if (!analyserNode || !isPlaying) {
        const plot = getSpectrumPlotRect();
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = '#1e293b';
        ctx.moveTo(plot.left, plot.bottom); ctx.lineTo(plot.right, plot.bottom); ctx.stroke();
        
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
    const spectrumBands = collectSpectrumBands(dataArray, spectrumBandCount);
    if (spectrumViewMode === 'wave') {
        drawWaveSpectrum(spectrumBands);
    } else if (spectrumViewMode === 'combo') {
        drawBarSpectrum(spectrumBands);
        drawWaveSpectrum(spectrumBands, true);
    } else {
        drawBarSpectrum(spectrumBands);
    }

    const rms = Math.sqrt(spectrumBands.reduce((sum, band) => sum + (band.percent * band.percent), 0) / Math.max(1, spectrumBands.length));
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
    const spectrumRect = canvas.getBoundingClientRect();
    canvas.width = Math.max(260, Math.round(spectrumRect.width));
    canvas.height = Math.max(120, Math.round(spectrumRect.height));
    compressor.drawCurve();
    reverb.updateReverbVisualizers?.();
    limiter.updateLimiterVisualizers?.();
    drawAudioWaveform(waveformProgress);
    drawLoudnessHistory();
}

const SPECTRUM_PANEL_HEIGHT_STORAGE_KEY = 'jd-spectrum-panel-height';
function setupSpectrumHeightResize() {
    if (!spectrumAnalyzerPanel || !spectrumHeightResizer) return;
    try {
        const storedHeight = Number(localStorage.getItem(SPECTRUM_PANEL_HEIGHT_STORAGE_KEY));
        if (Number.isFinite(storedHeight) && storedHeight >= 220 && storedHeight <= 620) {
            spectrumAnalyzerPanel.style.height = `${storedHeight}px`;
        }
    } catch (error) {}
    let startY = 0;
    let startHeight = 0;
    const finish = (event) => {
        if (!spectrumHeightResizer.classList.contains('is-resizing')) return;
        spectrumHeightResizer.classList.remove('is-resizing');
        if (spectrumHeightResizer.hasPointerCapture?.(event.pointerId)) spectrumHeightResizer.releasePointerCapture(event.pointerId);
        try { localStorage.setItem(SPECTRUM_PANEL_HEIGHT_STORAGE_KEY, String(Math.round(spectrumAnalyzerPanel.getBoundingClientRect().height))); } catch (error) {}
        handleResize();
    };
    spectrumHeightResizer.onpointerdown = (event) => {
        event.preventDefault();
        startY = event.clientY;
        startHeight = spectrumAnalyzerPanel.getBoundingClientRect().height;
        spectrumHeightResizer.classList.add('is-resizing');
        spectrumHeightResizer.setPointerCapture?.(event.pointerId);
    };
    spectrumHeightResizer.onpointermove = (event) => {
        if (!spectrumHeightResizer.classList.contains('is-resizing')) return;
        spectrumAnalyzerPanel.style.height = `${Math.max(220, Math.min(620, startHeight + event.clientY - startY))}px`;
        handleResize();
    };
    spectrumHeightResizer.onpointerup = finish;
    spectrumHeightResizer.onpointercancel = finish;
}

window.addEventListener('resize', handleResize);
setupSpectrumHeightResize();
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
    syncSpatialUI();

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
        applySpatialSettings();
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
                updateExportFilenamePreview();
                trackName.innerText = `곡명: ${currentAudioFileName}`;
                
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') await audioCtx.resume();

                const reader = new FileReader();
                reader.onload = function(evt) {
                    audioCtx.decodeAudioData(evt.target.result, function(buffer) {
                        resetLoudnessStats();
                        originalBuffer = buffer;
                        sectionRepeatEnabled = false;
                        sectionRepeatInitialized = false;
                        sectionRepeatStart = 0;
                        sectionRepeatEnd = buffer.duration;
                        updateSectionRepeatUI(0);
                        waveformPeaks = buildWaveformPeaks(buffer);
                        updateWaveformProgress(0);

                        playBtn.disabled = false;
                        setAudioTransportAvailability(true);
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
                sectionRepeatEnabled = false;
                sectionRepeatInitialized = false;
                sectionRepeatStart = 0;
                sectionRepeatEnd = 0;
                updateSectionRepeatUI(0);
                waveformPeaks = [];
                updateWaveformProgress(0);
                trackName.innerText = `Waiting for audio upload...`;
                detectorStatus.innerText = "(추출 대기 중)";

                playBtn.disabled = true;
                setAudioTransportAvailability(false);
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

