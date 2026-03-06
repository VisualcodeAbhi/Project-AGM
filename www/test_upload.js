const fs = require('fs');
const filePath = require('path').join(__dirname, 'assets', 'church-logo.png');

async function testUpload() {
    const fileData = fs.readFileSync(filePath);
    const blob = new Blob([fileData], { type: 'image/png' });
    const formData = new FormData();
    formData.append('image', blob, 'church-logo.png');

    try {
        const response = await fetch('https://project-agm.onrender.com/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${data}`);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}
testUpload();
