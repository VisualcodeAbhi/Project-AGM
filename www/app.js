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

// --- Global Connection & Offline Loader ---
function setupAppBootLoader() {
    const overlay = document.getElementById('server-wakeup-loader');
    if (!overlay) return;

    const updateStatus = () => {
        const text = overlay.querySelector('p');
        const title = overlay.querySelector('h2');
        
        if (!navigator.onLine) {
            overlay.classList.add('active');
            if (title) title.innerText = "No Connection";
            if (text) text.innerText = "Please check your internet and try again.";
        } else {
            // If online, let the fetch interceptor handle the "Waking up" message
            if (title) title.innerText = "Agape Gospel Ministries";
            if (text) text.innerText = "Connecting to the server, please wait...";
            
            // If we are currently NOT waiting for an API (activeApiRequests === 0), it will hide automatically
        }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}
document.addEventListener('DOMContentLoaded', setupAppBootLoader);

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
            width: 100px;
            height: 100px;
            position: relative;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .eclipse-logo {
            width: 50px;
            height: 50px;
            object-fit: contain;
            z-index: 2;
            filter: drop-shadow(0 0 5px rgba(212, 175, 55, 0.4));
        }
        .eclipse-ring {
            position: absolute;
            width: 85px;
            height: 85px;
            border-radius: 50%;
            box-shadow: 0 3px 0 0 #d4af37;
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
    // ALWAYS force show loader on startup immediately via class
    loaderOverlay.classList.add('active');

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
    let initialDataLoaded = false;

    window.fetch = async function(...args) {
        const urlObj = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
        const urlStr = urlObj ? String(urlObj) : '';
        const isApi = urlStr.includes('/api/') || urlStr.includes('/settings');

        if (isApi) {
            activeApiRequests++;
            if (activeApiRequests === 1) {
                // Keep loader visible for background API calls
                wakeupLoaderTimeout = setTimeout(() => {
                    loaderOverlay.classList.add('active');
                }, 800);
            }
        }
        
        try {
            const response = await originalFetch.apply(this, args);
            if (isApi) initialDataLoaded = true;
            return response;
        } catch (err) {
            throw err;
        } finally {
            if (isApi) {
                activeApiRequests--;
                if (activeApiRequests === 0) {
                    clearTimeout(wakeupLoaderTimeout);
                    // Hide only if we are online. If offline, the offline handler keeps it.
                    if (navigator.onLine) {
                        loaderOverlay.classList.remove('active');
                    }
                }
            }
        }
    };

    // --- Boot-up Fail-Safe ---
    // In case there's a page that makes no API calls, or a network failure
    // that doesn't trigger our interceptor, automatically hide after 3 seconds.
    setTimeout(() => {
        if (activeApiRequests === 0) {
            loaderOverlay.classList.remove('active');
        }
    }, 3000);
})();
