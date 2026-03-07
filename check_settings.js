const https = require('https');

https.get('https://project-agm.onrender.com/api/settings', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const settings = JSON.parse(data);
            console.log('LIVE_VIDEO_URL:', JSON.stringify(settings.live_video_url));
        } catch (e) { console.error('Error parsing JSON:', e.message); }
    });
}).on('error', (err) => console.error('Error fetching settings:', err.message));
