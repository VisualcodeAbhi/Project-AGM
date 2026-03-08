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
            background: rgba(10, 25, 47, 0.95);
            backdrop-filter: blur(10px);
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
        .wakeup-video {
            width: 250px;
            max-width: 80%;
            border-radius: 20px;
            margin-bottom: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            object-fit: cover;
        }
    `;
    document.head.appendChild(style);

    // Create the overlay DOM element
    const loaderOverlay = document.createElement('div');
    loaderOverlay.id = 'server-wakeup-loader';
    loaderOverlay.innerHTML = `
        <video class="wakeup-video" autoplay loop muted playsinline>
            <source src="assets/loader.mp4" type="video/mp4">
        </video>
        <h2 style="font-family: 'Playfair Display', serif; font-size:1.8rem; margin-bottom: 10px; color: #d4af37;">Connecting...</h2>
        <p style="opacity: 0.8; font-size: 0.95rem; max-width: 80%;">Waking up the server.<br>This usually takes about 1-2 minutes on the first load, please wait...</p>
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
