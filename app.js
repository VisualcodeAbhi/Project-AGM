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
        document.body.style.paddingTop = '40px';

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
