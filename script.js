// ============================================
//  TIKDOWN - TikTok Downloader
//  Fix: Download via proxy + multi fallback
// ============================================

let currentData = null;
let photoUrls = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    createBackground();
    createStars();
    initInputWatcher();
    initScrollWatcher();

    setTimeout(() => {
        document.getElementById('pageLoader').classList.add('hidden');
    }, 1500);
});

// ===== BACKGROUND EFFECTS =====
function createBackground() {
    const container = document.getElementById('bgAnimation');
    const colors = ['#7c3aed', '#a78bfa', '#c084fc', '#e879f9', '#6d28d9'];

    for (let i = 0; i < 10; i++) {
        const orb = document.createElement('div');
        orb.classList.add('orb');
        const size = Math.random() * 250 + 100;
        orb.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${Math.random() * 20 + 20}s;
            animation-delay: ${Math.random() * 15}s;
        `;
        container.appendChild(orb);
    }
}

function createStars() {
    const container = document.getElementById('stars');
    for (let i = 0; i < 70; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 4 + 2}s;
            animation-delay: ${Math.random() * 4}s;
        `;
        container.appendChild(star);
    }
}

// ===== INPUT WATCHER =====
function initInputWatcher() {
    const input = document.getElementById('urlInput');
    const clearBtn = document.getElementById('btnClear');

    input.addEventListener('input', () => {
        clearBtn.classList.toggle('show', input.value.length > 0);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processVideo();
    });

    input.addEventListener('paste', () => {
        setTimeout(() => {
            clearBtn.classList.toggle('show', input.value.length > 0);
            if (isValidUrl(input.value.trim())) {
                showToast('Link TikTok terdeteksi!', 'info');
            }
        }, 100);
    });
}

// ===== SCROLL WATCHER =====
function initScrollWatcher() {
    const navbar = document.getElementById('navbar');
    const scrollBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 50);
        scrollBtn.classList.toggle('show', y > 400);
    });
}

// ===== NAVIGATION =====
function toggleMenu() {
    const nav = document.getElementById('navLinks');
    const burger = document.getElementById('hamburger');
    nav.classList.toggle('active');
    burger.classList.toggle('active');
}

function closeMenu() {
    document.getElementById('navLinks').classList.remove('active');
    document.getElementById('hamburger').classList.remove('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== UTILITIES =====
function clearInput() {
    const input = document.getElementById('urlInput');
    input.value = '';
    input.focus();
    document.getElementById('btnClear').classList.remove('show');
    hideAllResults();
}

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById('urlInput');
        input.value = text;
        document.getElementById('btnClear').classList.toggle('show', text.length > 0);
        if (isValidUrl(text.trim())) {
            showToast('Link berhasil di-paste!', 'success');
        }
        input.focus();
    } catch (err) {
        showToast('Tidak bisa akses clipboard. Paste manual ya!', 'error');
    }
}

function isValidUrl(url) {
    const patterns = [
        /https?:\/\/(www\.)?tiktok\.com\/@[\w.\-]+\/video\/\d+/,
        /https?:\/\/(www\.)?tiktok\.com\/@[\w.\-]+\/photo\/\d+/,
        /https?:\/\/vm\.tiktok\.com\/[\w]+/,
        /https?:\/\/vt\.tiktok\.com\/[\w]+/,
        /https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/,
        /https?:\/\/m\.tiktok\.com\/v\/\d+/,
    ];
    return patterns.some(p => p.test(url));
}

function formatNum(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    const icons = { success: '✅', error: '❌', info: '💡' };
    toast.querySelector('.toast-icon').textContent = icons[type] || '💡';
    toast.querySelector('.toast-text').textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== STATUS =====
function showStatus(msg, type = 'info') {
    const el = document.getElementById('statusMessage');
    const icons = { success: '✅', error: '❌', info: '⏳' };
    el.querySelector('.status-icon').textContent = icons[type] || '💡';
    el.querySelector('.status-text').textContent = msg;
    el.className = `status-message ${type} show`;
}

function hideStatus() {
    document.getElementById('statusMessage').className = 'status-message';
}

// ===== PROGRESS =====
function showProgress() {
    const c = document.getElementById('progressContainer');
    document.getElementById('progressBar').style.width = '0%';
    c.classList.add('show');
}

function setProgress(p) {
    document.getElementById('progressBar').style.width = Math.min(p, 100) + '%';
}

function hideProgress() {
    document.getElementById('progressContainer').classList.remove('show');
}

// ===== HIDE RESULTS =====
function hideAllResults() {
    document.getElementById('resultVideo').classList.remove('show');
    document.getElementById('resultPhotos').classList.remove('show');
    hideStatus();
    hideProgress();
}

// ===== MAIN PROCESS =====
async function processVideo() {
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('btnDownload');
    const url = input.value.trim();

    hideAllResults();
    currentData = null;
    photoUrls = [];

    if (!url) {
        showStatus('Masukkan link TikTok terlebih dahulu!', 'error');
        showToast('Link kosong!', 'error');
        input.focus();
        return;
    }

    if (!isValidUrl(url)) {
        showStatus('Link tidak valid! Pastikan link dari TikTok.', 'error');
        showToast('Link TikTok tidak valid!', 'error');
        return;
    }

    btn.classList.add('loading');
    showProgress();
    showStatus('Sedang memproses link TikTok...', 'info');

    let progress = 0;
    const tick = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress > 88) progress = 88;
        setProgress(progress);
    }, 350);

    try {
        const resp = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                url: url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            })
        });

        clearInterval(tick);

        if (!resp.ok) throw new Error('Server error: ' + resp.status);

        const json = await resp.json();

        if (json.code !== 0 || !json.data) {
            throw new Error(json.msg || 'Gagal memproses video');
        }

        currentData = json.data;
        setProgress(100);

        setTimeout(() => {
            hideProgress();
            displayResult(currentData);
        }, 400);

    } catch (err) {
        clearInterval(tick);
        hideProgress();
        console.error('Error:', err);
        showStatus('Gagal: ' + (err.message || 'Coba lagi nanti'), 'error');
        showToast('Gagal memproses video', 'error');
    } finally {
        btn.classList.remove('loading');
    }
}

// ===== DISPLAY RESULT =====
function displayResult(data) {
    if (data.images && data.images.length > 0) {
        displayPhotos(data);
    } else {
        displayVideo(data);
    }
}

// ===== DISPLAY VIDEO =====
function displayVideo(data) {
    const container = document.getElementById('resultVideo');

    const noWM = document.getElementById('noWatermark').checked;
    const videoSrc = noWM ? (data.hdplay || data.play) : (data.wmplay || data.play);
    const player = document.getElementById('videoPlayer');
    player.src = videoSrc;
    player.poster = data.cover || data.origin_cover || '';

    document.getElementById('resultVideoId').textContent = data.id ? '#' + data.id : '';
    document.getElementById('videoTitle').textContent = data.title || 'Tanpa judul';

    const authorId = data.author?.unique_id || data.author?.nickname || 'user';
    document.getElementById('authorName').textContent = '@' + authorId;
    document.getElementById('authorSub').textContent = data.author?.nickname || '';

    const avatarEl = document.getElementById('authorAvatar');
    if (data.author?.avatar) {
        avatarEl.innerHTML = `<img src="${data.author.avatar}" alt="avatar" onerror="this.parentElement.textContent='${authorId[0].toUpperCase()}'">`;
    } else {
        avatarEl.textContent = authorId[0].toUpperCase();
    }

    const statsRow = document.getElementById('statsRow');
    statsRow.innerHTML = `
        <div class="stat-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ${formatNum(data.digg_count)}
        </div>
        <div class="stat-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${formatNum(data.comment_count)}
        </div>
        <div class="stat-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            ${formatNum(data.share_count)}
        </div>
        <div class="stat-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ${formatNum(data.play_count)}
        </div>
    `;

    container.classList.add('show');
    showStatus('Video berhasil diproses! Pilih format download.', 'success');
    showToast('Video siap didownload! 🎉', 'success');

    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}

// ===== DISPLAY PHOTOS =====
function displayPhotos(data) {
    const container = document.getElementById('resultPhotos');

    const authorId = data.author?.unique_id || data.author?.nickname || 'user';
    document.getElementById('photoAuthorName').textContent = '@' + authorId;

    const avatarEl = document.getElementById('photoAuthorAvatar');
    if (data.author?.avatar) {
        avatarEl.innerHTML = `<img src="${data.author.avatar}" alt="" onerror="this.parentElement.textContent='${authorId[0].toUpperCase()}'">`;
    } else {
        avatarEl.textContent = authorId[0].toUpperCase();
    }

    document.getElementById('photoTitle').textContent = data.title || 'Slideshow TikTok';

    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '';
    photoUrls = [];

    data.images.forEach((imgUrl, i) => {
        photoUrls.push(imgUrl);

        const item = document.createElement('div');
        item.className = 'photo-item';
        item.innerHTML = `
            <span class="photo-index">${i + 1}</span>
            <img src="${imgUrl}" alt="Photo ${i + 1}" loading="lazy">
            <div class="photo-overlay">
                <button class="photo-dl-btn" onclick="downloadSinglePhoto(${i})">Download</button>
            </div>
        `;
        grid.appendChild(item);
    });

    container.classList.add('show');
    showStatus(`${data.images.length} foto ditemukan! Download satu-satu atau semua.`, 'success');
    showToast(`${data.images.length} foto siap didownload! 📸`, 'success');

    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
}

// ==============================================
//  DOWNLOAD FUNCTIONS - FIXED WITH MULTI METHOD
// ==============================================

// Prefix tikwm URLs properly
function getTikwmFullUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return 'https://www.tikwm.com' + path;
}

// Method 1: Blob fetch via no-cors proxy
async function downloadViaBlob(url, filename) {
    const proxyUrls = [
        'https://corsproxy.io/?' + encodeURIComponent(url),
        'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
        'https://proxy.cors.sh/' + url,
    ];

    // Try direct first
    try {
        const resp = await fetch(url, { mode: 'cors' });
        if (resp.ok) {
            const blob = await resp.blob();
            if (blob.size > 1000) {
                triggerBlobDownload(blob, filename);
                return true;
            }
        }
    } catch (e) {
        console.log('Direct fetch failed, trying proxies...');
    }

    // Try proxies
    for (const proxy of proxyUrls) {
        try {
            const resp = await fetch(proxy);
            if (resp.ok) {
                const blob = await resp.blob();
                if (blob.size > 1000) {
                    triggerBlobDownload(blob, filename);
                    return true;
                }
            }
        } catch (e) {
            console.log('Proxy failed:', proxy);
        }
    }

    return false;
}

// Trigger actual file download from blob
function triggerBlobDownload(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    }, 3000);
}

// Method 2: Use tikwm download endpoint directly
function downloadViaTikwm(type) {
    if (!currentData) return;

    let downloadPageUrl = '';
    const id = currentData.id;

    if (type === 'video_hd' || type === 'video_wm') {
        // tikwm direct video download link
        const noWM = type === 'video_hd';
        const videoPath = noWM ? (currentData.hdplay || currentData.play) : (currentData.wmplay || currentData.play);
        downloadPageUrl = getTikwmFullUrl(videoPath);
    } else if (type === 'audio') {
        downloadPageUrl = getTikwmFullUrl(currentData.music);
    }

    if (downloadPageUrl) {
        // Open in iframe trick for forced download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = downloadPageUrl;
        document.body.appendChild(iframe);

        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 10000);

        return true;
    }
    return false;
}

// Method 3: Window.open fallback
function downloadViaNewTab(url) {
    const w = window.open(url, '_blank');
    if (!w) {
        // Popup blocked, use link click
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

// ===== MAIN DOWNLOAD HANDLER =====
async function forceDownload(type) {
    if (!currentData) {
        showToast('Tidak ada data! Proses ulang link.', 'error');
        return;
    }

    let url = '';
    let filename = '';
    const id = currentData.id || Date.now();

    switch (type) {
        case 'video_hd':
            url = currentData.hdplay || currentData.play;
            filename = `tikdown_${id}_hd.mp4`;
            break;
        case 'video_wm':
            url = currentData.wmplay || currentData.play;
            filename = `tikdown_${id}_wm.mp4`;
            break;
        case 'audio':
            url = currentData.music;
            filename = `tikdown_${id}_audio.mp3`;
            break;
    }

    url = getTikwmFullUrl(url);

    if (!url) {
        showToast('Link download tidak tersedia!', 'error');
        return;
    }

    showToast('Memulai download...', 'info');

    // Try Method 1: Blob
    const blobSuccess = await downloadViaBlob(url, filename);

    if (blobSuccess) {
        showToast('File berhasil diunduh! ✅', 'success');
        return;
    }

    // Try Method 2: iframe
    console.log('Trying iframe method...');
    downloadViaTikwm(type);

    // Also try Method 3: new tab as backup
    setTimeout(() => {
        downloadViaNewTab(url);
        showToast('Download dibuka. Tekan lama/long-press untuk save.', 'info');
    }, 1500);
}

// ===== DOWNLOAD SINGLE PHOTO =====
async function downloadSinglePhoto(index) {
    if (!photoUrls[index]) {
        showToast('Foto tidak ditemukan!', 'error');
        return;
    }

    const url = getTikwmFullUrl(photoUrls[index]);
    const id = currentData?.id || Date.now();
    const filename = `tikdown_${id}_photo_${index + 1}.jpg`;

    showToast(`Mendownload foto ${index + 1}...`, 'info');

    // Try blob
    const blobSuccess = await downloadViaBlob(url, filename);

    if (blobSuccess) {
        showToast(`Foto ${index + 1} berhasil diunduh!`, 'success');
        return;
    }

    // Fallback: new tab
    downloadViaNewTab(url);
    showToast('Foto dibuka. Tekan lama untuk save.', 'info');
}

// ===== DOWNLOAD ALL PHOTOS =====
async function downloadAllPhotos() {
    if (photoUrls.length === 0) {
        showToast('Tidak ada foto!', 'error');
        return;
    }

    showToast(`Mendownload ${photoUrls.length} foto...`, 'info');
    showStatus(`Downloading 0/${photoUrls.length} foto...`, 'info');

    let success = 0;

    for (let i = 0; i < photoUrls.length; i++) {
        showStatus(`Downloading ${i + 1}/${photoUrls.length} foto...`, 'info');

        const url = getTikwmFullUrl(photoUrls[i]);
        const id = currentData?.id || Date.now();
        const filename = `tikdown_${id}_photo_${i + 1}.jpg`;

        const ok = await downloadViaBlob(url, filename);
        if (ok) success++;

        // Delay between downloads to not overwhelm browser
        await new Promise(r => setTimeout(r, 800));
    }

    if (success === photoUrls.length) {
        showStatus(`Semua ${success} foto berhasil diunduh!`, 'success');
        showToast('Semua foto berhasil diunduh! 🎉', 'success');
    } else if (success > 0) {
        showStatus(`${success}/${photoUrls.length} foto berhasil. Sisanya buka manual.`, 'info');
        showToast(`${success} foto berhasil, sisanya buka tab baru`, 'info');
        // Open remaining in new tabs
        for (let i = success; i < photoUrls.length; i++) {
            downloadViaNewTab(getTikwmFullUrl(photoUrls[i]));
            await new Promise(r => setTimeout(r, 300));
        }
    } else {
        showStatus('Blob download gagal. Membuka semua foto di tab baru...', 'info');
        for (let i = 0; i < photoUrls.length; i++) {
            downloadViaNewTab(getTikwmFullUrl(photoUrls[i]));
  
