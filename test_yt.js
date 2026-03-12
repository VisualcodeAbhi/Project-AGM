const fetch = require('node-fetch');

const API = 'https://project-agm.onrender.com/api';
const TOKEN = 'Bearer AGAPE_ADMIN_SECRET_2026';

async function addTestVideo() {
    const video = {
        title: "Sunday Service | 08 March 2026",
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replacement for real ID
        description: "Join us for our Sunday Worship Service live from Takkellapadu."
    };

    try {
        const res = await fetch(`${API}/youtube-videos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': TOKEN
            },
            body: JSON.stringify(video)
        });
        const data = await res.json();
        console.log('Video added:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

addTestVideo();
