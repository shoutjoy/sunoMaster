(() => {
    'use strict';

    const DB_NAME = 'JdMasteringHandoffDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'handoff';
    const ACTIVE_KEY = 'active-package';
    const SOURCE = 'suno-mastering-app';
    const ACCEPTED_SOURCE_ORIGINS = new Set([location.origin, 'https://suno.com', 'https://www.suno.com']);
    const TARGETS = {
        track: 'https://jjaimsae.com/music/upload/track?from=%2Fmusic%2Fnew',
        album: 'https://jjaimsae.com/music/upload?from=%2Fmusic%2Fnew'
    };

    let state = {
        schemaVersion: 1,
        source: {},
        audioFile: null,
        coverFile: null,
        masteredFile: null,
        fingerprint: '',
        updatedAt: Date.now()
    };
    let databasePromise;
    let coverPreviewUrl = '';
    let pendingTransfer = null;
    let transferInProgress = false;
    const cacheRequests = new Map();
    const bridgeProbeRequests = new Map();

    const elements = {};

    function openDatabase() {
        if (databasePromise) return databasePromise;
        databasePromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                    request.result.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('전송 저장소를 열 수 없습니다.'));
        });
        return databasePromise;
    }

    async function readState() {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(ACTIVE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function writeState() {
        state.updatedAt = Date.now();
        const database = await openDatabase();
        await new Promise((resolve, reject) => {
            const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(state, ACTIVE_KEY);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        render();
    }

    function normalizedFile(value, fallbackName, fallbackType) {
        if (!(value instanceof Blob) || !value.size) return null;
        if (value instanceof File) return value;
        return new File([value], fallbackName, { type: value.type || fallbackType });
    }

    function extractGuid(url, explicitGuid = '') {
        if (/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(explicitGuid)) return explicitGuid;
        const match = String(url || '').match(/(?:song|songs)\/([0-9a-f-]{36})/i);
        return match?.[1] || '';
    }

    function normalizeIncoming(data) {
        const packageData = data.sourcePackage || data.package || data;
        const source = packageData.source || data.metadata || data;
        const audioCandidate = packageData.audio?.file || packageData.audioFile || data.audio?.file || data.audioFile || data.file;
        const coverCandidate = packageData.cover?.file || packageData.coverFile || data.cover?.file || data.coverFile || data.imageFile || data.image;
        const url = source.url || source.sourceUrl || source.sunoUrl || '';
        return {
            source: {
                guid: extractGuid(url, source.guid || data.guid),
                title: source.title || data.title || '',
                url,
                lyrics: source.lyrics || source.lyricsText || data.lyrics || data.lyricsText || '',
                receivedAt: Date.now()
            },
            audioFile: normalizedFile(audioCandidate, data.filename || 'suno-source.m4a', 'audio/mp4'),
            coverFile: normalizedFile(coverCandidate, data.imageFilename || 'suno-cover.jpg', 'image/jpeg')
        };
    }

    function setStatus(message, kind = '') {
        if (!elements.status) return;
        elements.status.textContent = message;
        elements.status.classList.toggle('is-error', kind === 'error');
        elements.status.classList.toggle('is-success', kind === 'success');
    }

    function render() {
        if (!elements.title) return;
        if (document.activeElement !== elements.title) elements.title.value = state.source.title || '';
        if (document.activeElement !== elements.url) elements.url.value = state.source.url || '';
        if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
        coverPreviewUrl = state.coverFile ? URL.createObjectURL(state.coverFile) : '';
        elements.preview.src = coverPreviewUrl;
        elements.coverPicker.classList.toggle('has-image', Boolean(coverPreviewUrl));
        const ready = Boolean(state.audioFile);
        elements.badge.textContent = ready ? '원곡 준비됨' : '정보 대기';
        elements.badge.classList.toggle('is-ready', ready);
        elements.track.disabled = !ready;
        elements.album.disabled = !ready;
    }

    async function fingerprint(blob) {
        if (!crypto.subtle || !(blob instanceof Blob)) return '';
        const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
        return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
    }

    async function registerAudioFile(file) {
        const normalized = normalizedFile(file, file?.name || 'source-audio', file?.type || 'audio/mpeg');
        if (!normalized) return;
        state.audioFile = normalized;
        if (!state.source.title) state.source.title = normalized.name.replace(/\.[^.]+$/, '');
        state.masteredFile = null;
        state.fingerprint = '';
        await writeState();
        setStatus('원본 음원을 보관했습니다. 마스터링 후 전송 대상을 선택하세요.', 'success');
    }

    async function setMasteredAudio({ blob, filename, metrics = {} }) {
        const file = normalizedFile(blob, filename || 'mastered.wav', 'audio/wav');
        if (!file) throw new Error('마스터 WAV를 만들지 못했습니다.');
        state.masteredFile = file;
        state.mastering = { metrics, renderedAt: Date.now() };
        state.fingerprint = await fingerprint(file);
        await writeState();
        setMasteredStatus('마스터 WAV와 원본 정보를 묶었습니다. 보낼 위치를 선택하세요.', 'success');
        return file;
    }

    function buildPayload(target, variant) {
        const file = variant === 'original' ? state.audioFile : state.masteredFile;
        if (!file) throw new Error(variant === 'original'
            ? '먼저 원곡을 불러와 주세요.'
            : '먼저 Mastering Data Execute를 실행해 주세요.');
        const title = (elements.title?.value || state.source.title || '').trim();
        const url = (elements.url?.value || state.source.url || '').trim();
        state.source = { ...state.source, title, url, guid: extractGuid(url, state.source.guid) };
        return {
            source: SOURCE,
            type: 'audio-file',
            handoffVersion: 1,
            target: target === 'album' ? 'jjim-album' : 'jjim-upload',
            file,
            coverFile: state.coverFile,
            guid: state.source.guid || '',
            title,
            albumTitle: title,
            url,
            lyrics: state.source.lyrics || '',
            lyricsText: state.source.lyrics || '',
            fingerprint: variant === 'mastered' ? state.fingerprint : '',
            sourceAudioName: state.audioFile?.name || '',
            variant,
            mastered: variant === 'mastered',
            mastering: state.mastering || {},
            createdAt: Date.now()
        };
    }

    function setMasteredStatus(message, kind = '') {
        if (!elements.masteredStatus) return;
        elements.masteredStatus.textContent = message;
        elements.masteredStatus.classList.toggle('is-error', kind === 'error');
        elements.masteredStatus.classList.toggle('is-success', kind === 'success');
    }

    function setTransferBusy(busy) {
        [elements.track, elements.album].forEach(button => {
            if (button) button.disabled = busy || !state.audioFile;
        });
        [elements.masteredTrack, elements.masteredAlbum].forEach(button => {
            if (button) button.disabled = busy;
        });
    }

    function cacheTimeoutFor(file) {
        const megabytes = Math.max(1, (file?.size || 0) / 1048576);
        return Math.min(120000, Math.max(30000, Math.ceil(megabytes * 1500)));
    }

    function createTransferKey() {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function cacheWithExtension(payload, transferKey) {
        const transferId = payload.transferId || crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const timer = window.setTimeout(() => {
                cacheRequests.delete(transferId);
                reject(new Error('확장 프로그램이 전송 패키지를 받지 못했습니다. 짜임새 전송을 지원하는 SD to JJaIMsae 확장이 이 마스터링 주소에서 활성화되어 있는지 확인해 주세요.'));
            }, cacheTimeoutFor(payload.file));
            cacheRequests.set(transferId, {
                resolve: () => { window.clearTimeout(timer); resolve(transferId); },
                reject: message => { window.clearTimeout(timer); reject(new Error(message || '전송 패키지 저장에 실패했습니다.')); }
            });
            window.postMessage({
                source: SOURCE,
                type: 'cache-jjim-transfer',
                transferId,
                transferKey,
                target: payload.target,
                file: payload.file,
                imageFile: payload.coverFile,
                filename: payload.file.name,
                guid: payload.guid,
                title: payload.title,
                albumTitle: payload.albumTitle,
                url: payload.url,
                lyricsText: payload.lyricsText,
                fingerprint: payload.fingerprint,
                variant: payload.variant,
                mastered: payload.mastered,
                mastering: payload.mastering
            }, location.origin);
        });
    }

    function probeExtensionBridge(timeout = 1500) {
        const probeId = crypto.randomUUID();
        return new Promise(resolve => {
            const timer = window.setTimeout(() => {
                bridgeProbeRequests.delete(probeId);
                resolve(false);
            }, timeout);
            bridgeProbeRequests.set(probeId, () => {
                window.clearTimeout(timer);
                resolve(true);
            });
            window.postMessage({ source: SOURCE, type: 'probe-jjim-bridge', probeId }, location.origin);
        });
    }

    function postPayloadToTarget(transfer) {
        if (!transfer?.targetWindow || transfer.targetWindow.closed || !transfer.payload) return false;
        transfer.targetWindow.postMessage(transfer.payload, 'https://jjaimsae.com');
        transfer.directSent = true;
        return true;
    }

    async function send(target, { variant = 'original' } = {}) {
        if (transferInProgress) throw new Error('이미 전송 패키지를 준비하고 있습니다.');
        const targetBaseUrl = TARGETS[target];
        if (!targetBaseUrl) throw new Error('알 수 없는 전송 대상입니다.');
        const transferId = crypto.randomUUID();
        const transferKey = createTransferKey();
        const payload = buildPayload(target, variant);
        payload.transferId = transferId;
        const flow = target === 'album' ? 'album' : 'upload';
        const hash = new URLSearchParams({
            'suno-downloader-import': flow,
            transferId,
            openerOrigin: location.origin,
            transferKey
        });
        const targetUrl = `${targetBaseUrl}#${hash}`;
        const targetWindow = window.open(targetUrl, `jjim-${target}-${transferId}`);
        if (!targetWindow) throw new Error('짜임새 창이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.');
        const report = (message, kind = '') => variant === 'mastered'
            ? setMasteredStatus(message, kind)
            : setStatus(message, kind);
        let resolveTargetReady;
        const targetReady = new Promise(resolve => { resolveTargetReady = resolve; });
        const transfer = {
            target, targetWindow, targetUrl, payload, transferId, variant,
            directSent: false, readyReceived: false, cacheStarted: false, cacheFailed: false,
            resolveTargetReady
        };
        pendingTransfer = transfer;
        transferInProgress = true;
        setTransferBusy(true);
        report('v210 확장 브리지를 확인하는 중...');
        try {
            if (!await probeExtensionBridge()) {
                throw new Error('v210 확장 브리지가 응답하지 않습니다. Chrome 확장 관리에서 SD to JJaIMsae 2.1.13을 다시 로드해 주세요.');
            }
            transfer.cacheStarted = true;
            report(`${variant === 'mastered' ? '마스터 WAV' : '원곡'}를 암호화하여 v210 브리지에 보관하는 중...`);
            await cacheWithExtension(payload, transferKey);
            if (pendingTransfer === transfer) {
                report('암호화 패키지 저장 완료. 짜임새에서 불러오는 중...', 'success');
            }
        } catch (error) {
            transfer.cacheFailed = true;
            if (pendingTransfer === transfer) report(error.message, 'error');
            throw error;
        } finally {
            transferInProgress = false;
            setTransferBusy(false);
        }
    }

    function showMasteredDialog() {
        if (!state.masteredFile || !elements.masteredDialog) return;
        elements.masteredFile.textContent = `${state.masteredFile.name} · ${(state.masteredFile.size / 1048576).toFixed(1)} MB`;
        setMasteredStatus('마스터링 결과를 보낼 위치를 선택하세요.');
        elements.masteredDialog.classList.remove('hidden');
        elements.masteredTrack.focus();
    }

    function hideMasteredDialog() {
        elements.masteredDialog?.classList.add('hidden');
    }

    async function receiveSourcePackage(event) {
        if (!ACCEPTED_SOURCE_ORIGINS.has(event.origin)) return;
        if (event.origin !== location.origin && event.source !== window.opener) return;
        if (event.data?.source !== 'suno-downloader' || !['audio-file', 'source-package'].includes(event.data?.type)) return;
        if (event.data.type === 'source-package' && ![1, '1'].includes(event.data.schemaVersion)) return;
        const incoming = normalizeIncoming(event.data);
        state.source = { ...state.source, ...Object.fromEntries(Object.entries(incoming.source).filter(([, value]) => value !== '')) };
        if (incoming.audioFile) state.audioFile = incoming.audioFile;
        if (incoming.coverFile) state.coverFile = incoming.coverFile;
        state.masteredFile = null;
        state.fingerprint = '';
        await writeState();
        setStatus('Suno 원본 음원, 커버 및 URL 정보를 안전하게 보관했습니다.', 'success');
    }

    function receiveTargetStatus(event) {
        if (event.origin !== 'https://jjaimsae.com' || event.source !== pendingTransfer?.targetWindow) return;
        if (!['suno-downloader', 'jjaimsae-app'].includes(event.data?.source)) return;
        if (event.data.source === 'jjaimsae-app' && event.data.transferId !== pendingTransfer.transferId) return;
        if (event.data.type === 'ready') {
            const report = pendingTransfer.variant === 'mastered' ? setMasteredStatus : setStatus;
            pendingTransfer.readyReceived = true;
            pendingTransfer.resolveTargetReady?.();
            if (pendingTransfer.cacheFailed && postPayloadToTarget(pendingTransfer)) {
                report('짜임새 입력 화면으로 파일과 정보를 직접 전송하는 중입니다.');
            } else if (!pendingTransfer.cacheStarted) {
                report('짜임새 입력 화면이 준비되었습니다.');
            }
        } else if (event.data.type === 'imported') {
            const report = pendingTransfer.variant === 'mastered' ? setMasteredStatus : setStatus;
            report('짜임새 입력 화면에 파일과 정보를 채웠습니다. 최종 내용을 확인하세요.', 'success');
            pendingTransfer = null;
        } else if (event.data.type === 'import-error') {
            const report = pendingTransfer.variant === 'mastered' ? setMasteredStatus : setStatus;
            report('짜임새 입력 중 오류가 발생했습니다. 입력 화면 상단 안내를 확인해 주세요.', 'error');
            pendingTransfer = null;
        }
    }

    function receiveCacheStatus(event) {
        if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'suno-downloader-extension') return;
        if (event.data.type === 'bridge-ready') {
            const resolve = bridgeProbeRequests.get(event.data.probeId);
            if (!resolve) return;
            bridgeProbeRequests.delete(event.data.probeId);
            resolve();
            return;
        }
        const request = cacheRequests.get(event.data.transferId);
        if (!request) return;
        cacheRequests.delete(event.data.transferId);
        if (event.data.type === 'cache-complete') request.resolve();
        else if (event.data.type === 'cache-error') request.reject(event.data.message);
    }

    function bindUi() {
        elements.title = document.getElementById('jjim-source-title');
        elements.url = document.getElementById('jjim-source-url');
        elements.preview = document.getElementById('jjim-cover-preview');
        elements.coverPicker = elements.preview?.closest('.jjim-cover-picker');
        elements.coverInput = document.getElementById('jjim-cover-input');
        elements.status = document.getElementById('jjim-handoff-status');
        elements.badge = document.getElementById('jjim-package-badge');
        elements.track = document.getElementById('jjim-send-track');
        elements.album = document.getElementById('jjim-send-album');
        elements.masteredDialog = document.getElementById('mastered-handoff-dialog');
        elements.masteredFile = document.getElementById('mastered-handoff-file');
        elements.masteredStatus = document.getElementById('mastered-handoff-status');
        elements.masteredTrack = document.getElementById('jjim-mastered-track');
        elements.masteredAlbum = document.getElementById('jjim-mastered-album');
        elements.masteredClose = document.getElementById('mastered-handoff-close');
        if (!elements.title) return;
        const saveFields = async () => {
            state.source.title = elements.title.value.trim();
            state.source.url = elements.url.value.trim();
            state.source.guid = extractGuid(state.source.url, state.source.guid);
            await writeState();
        };
        elements.title.addEventListener('change', saveFields);
        elements.url.addEventListener('change', saveFields);
        elements.coverInput.addEventListener('change', async () => {
            const file = elements.coverInput.files?.[0];
            if (!file) return;
            state.coverFile = file;
            await writeState();
            setStatus('전송할 커버 이미지를 보관했습니다.', 'success');
        });
        elements.track.addEventListener('click', () => void send('track', { variant: 'original' }).catch(() => {}));
        elements.album.addEventListener('click', () => void send('album', { variant: 'original' }).catch(() => {}));
        elements.masteredTrack.addEventListener('click', () => void send('track', { variant: 'mastered' }).catch(() => {}));
        elements.masteredAlbum.addEventListener('click', () => void send('album', { variant: 'mastered' }).catch(() => {}));
        elements.masteredClose.addEventListener('click', hideMasteredDialog);
        elements.masteredDialog.addEventListener('click', event => {
            if (event.target === elements.masteredDialog) hideMasteredDialog();
        });
        readState().then(saved => {
            if (saved) state = { ...state, ...saved, source: { ...state.source, ...saved.source } };
            render();
            if (saved?.audioFile) {
                setStatus('저장된 원곡 전송 패키지를 복원했습니다.', 'success');
                window.dispatchEvent(new CustomEvent('jjim-audio-restore', { detail: { file: saved.audioFile } }));
            }
        }).catch(error => setStatus(error.message, 'error'));
    }

    window.addEventListener('message', event => {
        void receiveSourcePackage(event).catch(error => setStatus(error.message, 'error'));
        receiveCacheStatus(event);
        receiveTargetStatus(event);
    });
    window.addEventListener('DOMContentLoaded', bindUi, { once: true });
    window.jjimHandoff = { registerAudioFile, setMasteredAudio, send, showMasteredDialog, getState: () => state };
})();
