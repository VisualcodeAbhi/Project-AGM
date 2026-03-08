document.addEventListener('DOMContentLoaded', () => {
    // Select all navigation items
    const navItems = document.querySelectorAll('.nav-item');

    // Add click event to each nav item
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active class from all
            navItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');
            
            // For now, prevent default if it's just a placeholder link
            if (item.getAttribute('href') === '#') {
                e.preventDefault();
                alert('This section is coming soon! Still building the beautiful pages for you.');
            }
        });
    });

    // Admin Mode Global Logic
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        // Inject admin bar
        const bar = document.createElement('div');
        bar.className = 'admin-mode-bar';
        bar.innerHTML = `
            <span><i class="fa-solid fa-user-shield"></i> Admin Mode Active</span>
            <div style="display:flex; gap:10px; align-items:center;">
                <a href="admin.html" style="color:black; text-decoration:none; font-size:0.7rem; background:rgba(255,255,255,0.3); padding:4px 8px; border-radius:4px;">Dashboard</a>
                <button class="exit-btn" id="exitAdmin">Exit</button>
            </div>
        `;
        document.body.prepend(bar);
        document.body.style.paddingTop = '80px';

        document.getElementById('exitAdmin').onclick = () => {
            localStorage.removeItem('isAdmin');
            window.location.reload();
        };
    }
});

// Verse Modal Functions (Daily Verse Only)
function openVerseModal() {
    const modal = document.getElementById('verseModal');
    const modalImg = document.getElementById('modalImg');
    const verseImg = document.getElementById('verseImage');
    
    if (modal && modalImg && verseImg) {
        modal.classList.add('active');
        modalImg.src = verseImg.src;
        document.body.style.overflow = 'hidden'; // Prevent scrolling background
    }
}

function closeVerseModal() {
    const modal = document.getElementById('verseModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
}

async function shareToWhatsApp() {
    const verseImg = document.getElementById('verseImage');
    if (!verseImg) return;
    
    // Check if the Web Share API is available and supports files
    if (navigator.share && navigator.canShare) {
        try {
            // Fetch the image and convert it to a blob
            const response = await fetch(verseImg.src);
            const blob = await response.blob();
            
            // Create a file object from the blob
            const file = new File([blob], 'DailyVerse.jpeg', { type: 'image/jpeg' });
            
            // Build the share data including the image file
            const shareData = {
                files: [file],
                title: 'Daily Verse',
                text: 'Agape Gospel Ministries - Daily Verse'
            };

            // Attempt to share
            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                throw new Error('This device does not support sharing images directly.');
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            // Fallback for devices that don't support file sharing
            alert("To share the image on WhatsApp:\n1. Long-press the image to save it.\n2. Open WhatsApp and share it from your gallery.");
        }
    } else {
        // Fallback for browsers without Share API
        alert("To share the image on WhatsApp:\n1. Long-press the image to save it.\n2. Open WhatsApp and share it from your gallery.");
    }
}

// --- Offline Loader Logic ---
function setupOfflineLoader() {
    const overlay = document.createElement('div');
    overlay.id = 'offline-overlay';
    overlay.className = navigator.onLine ? 'hidden' : '';
    overlay.innerHTML = `
        <i class="fa-solid fa-wifi offline-icon"></i>
        <h2 style="font-family: 'Playfair Display', serif; font-size:1.8rem;">No Internet</h2>
        <p style="opacity: 0.8; margin-top: 10px;">Please check your connection and try again.</p>
    `;
    document.body.appendChild(overlay);

    window.addEventListener('online', () => overlay.classList.add('hidden'));
    window.addEventListener('offline', () => overlay.classList.remove('hidden'));
}
document.addEventListener('DOMContentLoaded', setupOfflineLoader);

// Custom Notification System
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `<i class='fa-solid fa-${icon}'></i><span>${message}</span>`;
    container.appendChild(toast);

    // Auto remove after 3s
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Global alert replacement
window.showStatus = showToast;

// --- Global Server Connection Loader for Cold Starts ---
(function initServerWakeupLoader() {
    // Inject styles automatically
    const style = document.createElement('style');
    style.innerHTML = `
        #server-wakeup-loader {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 25, 47, 0.98);
            backdrop-filter: blur(15px);
            z-index: 9999;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #fdfaf5;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        #server-wakeup-loader.active {
            display: flex;
            opacity: 1;
        }
        
        /* Eclipse Loader Styles */
        .eclipse-container {
            width: 200px;
            height: 200px;
            position: relative;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .eclipse-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            z-index: 2;
            filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
        }
        .eclipse-ring {
            position: absolute;
            width: 160px;
            height: 160px;
            border-radius: 50%;
            box-shadow: 0 4px 0 0 #d4af37;
            animation: eclipse-spin 1s linear infinite;
            z-index: 1;
        }
        @keyframes eclipse-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Create the overlay DOM element
    const loaderOverlay = document.createElement('div');
    loaderOverlay.id = 'server-wakeup-loader';
    loaderOverlay.innerHTML = `
        <div class="eclipse-container">
            <img src="assets/church-logo.png" class="eclipse-logo">
            <div class="eclipse-ring"></div>
        </div>
        <h2 style="font-family: 'Playfair Display', serif; font-size:1.8rem; margin-bottom: 10px; color: #d4af37;">Agape Gospel Ministries</h2>
        <p style="opacity: 0.8; font-size: 0.95rem; max-width: 80%;">Waking up the server, please wait...</p>
    `;
    document.body.appendChild(loaderOverlay);

    // Intercept fetch requests
    const originalFetch = window.fetch;
    let activeApiRequests = 0;
    let wakeupLoaderTimeout = null;

    window.fetch = async function(...args) {
        const urlObj = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
        const urlStr = urlObj ? String(urlObj) : '';
        const isApi = urlStr.includes('/api/') || urlStr.includes('/settings');

        if (isApi) {
            activeApiRequests++;
            if (activeApiRequests === 1) {
                // If it takes more than 1000ms, assume the server is sleeping and show the loader
                wakeupLoaderTimeout = setTimeout(() => {
                    loaderOverlay.classList.add('active');
                }, 1000);
            }
        }
        
        try {
            return await originalFetch.apply(this, args);
        } finally {
            if (isApi) {
                activeApiRequests--;
                if (activeApiRequests === 0) {
                    clearTimeout(wakeupLoaderTimeout);
                    loaderOverlay.classList.remove('active');
                }
            }
        }
    };
})();

// --- Global Search Panel ---
(function initGlobalSearch() {
    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .search-trigger {
            position: fixed;
            top: 15px;
            right: 15px;
            width: 45px;
            height: 45px;
            background: rgba(10, 25, 47, 0.85);
            border: 1px solid var(--primary-gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-gold);
            z-index: 1001;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            transition: transform 0.2s ease;
        }
        .search-trigger:active { transform: scale(0.9); }
        
        #global-search-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10, 25, 47, 0.98);
            backdrop-filter: blur(15px);
            z-index: 99999;
            display: none;
            flex-direction: column;
            padding: 80px 20px 20px;
        }
        #global-search-overlay.active { display: flex; }
        
        .search-header {
            max-width: 500px;
            margin: 0 auto 30px;
            width: 100%;
            position: relative;
        }
        .search-input {
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--primary-gold);
            padding: 15px 50px 15px 20px;
            border-radius: 30px;
            color: #fff;
            font-size: 1.1rem;
            outline: none;
        }
        .search-close {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            cursor: pointer;
            font-size: 1.4rem;
        }
        
        .search-results {
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
            overflow-y: auto;
            flex: 1;
        }
        .result-group { margin-bottom: 25px; }
        .result-group h4 { 
            color: var(--primary-gold); 
            font-size: 0.8rem; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }
        .result-item {
            padding: 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            text-decoration: none;
            color: inherit;
            transition: background 0.2s;
        }
        .result-item:hover { background: rgba(255,255,255,0.08); }
        .result-icon {
            width: 40px; height: 40px;
            background: rgba(212, 175, 55, 0.1);
            color: var(--primary-gold);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .result-info h5 { margin: 0; font-size: 0.95rem; }
        .result-info p { margin: 0; font-size: 0.75rem; opacity: 0.6; }
    `;
    document.head.appendChild(style);

    // Create Search Trigger
    const trigger = document.createElement('div');
    trigger.className = 'search-trigger';
    trigger.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    trigger.onclick = () => {
        overlay.classList.add('active');
        input.focus();
    };

    // Create Search Overlay
    const overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.innerHTML = `
        <div class="search-header">
            <input type="text" class="search-input" placeholder="Search sermons, events, prayers...">
            <i class="fa-solid fa-xmark search-close"></i>
        </div>
        <div class="search-results">
            <div id="search-empty" style="text-align:center; padding: 40px; opacity:0.5;">
                <i class="fa-solid fa-magnifying-glass" style="font-size:3rem; margin-bottom:15px;"></i>
                <p>Type to search across the whole ministry</p>
            </div>
            <div id="search-content"></div>
        </div>
    `;

    document.body.appendChild(trigger);
    document.body.appendChild(overlay);

    const input = overlay.querySelector('.search-input');
    const closeBtn = overlay.querySelector('.search-close');
    const content = overlay.querySelector('#search-content');
    const empty = overlay.querySelector('#search-empty');

    closeBtn.onclick = () => overlay.classList.remove('active');

    let debounceTimer;
    input.oninput = () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (!query) {
            content.innerHTML = '';
            empty.style.display = 'block';
            return;
        }

        debounceTimer = setTimeout(async () => {
            const res = await fetch(`https://project-agm.onrender.com/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            empty.style.display = 'none';
            content.innerHTML = '';

            if (data.sermons.length > 0) {
                renderGroup('Sermons & Songs', data.sermons, 'fa-music', 'songs.html');
            }
            if (data.events.length > 0) {
                renderGroup('Upcoming Events', data.events, 'fa-calendar-days', 'events.html');
            }
            if (data.prayers.length > 0) {
                renderGroup('Prayer Wall', data.prayers, 'fa-heart-pulse', 'prayer.html');
            }

            if (content.innerHTML === '') {
                content.innerHTML = '<div style="text-align:center; padding:40px; opacity:0.5;"><p>No results found for "' + query + '"</p></div>';
            }
        }, 300);
    };

    function renderGroup(title, items, icon, link) {
        const group = document.createElement('div');
        group.className = 'result-group';
        group.innerHTML = `<h4>${title}</h4>`;
        
        items.forEach(item => {
            const div = document.createElement('a');
            div.href = link;
            div.className = 'result-item';
            div.innerHTML = `
                <div class="result-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="result-info">
                    <h5>${item.title || item.request.substring(0, 30) + '...'}</h5>
                    <p>${item.speaker || item.user_name || 'Ministry Update'}</p>
                </div>
            `;
            group.appendChild(div);
        });
        content.appendChild(group);
    }
})();
