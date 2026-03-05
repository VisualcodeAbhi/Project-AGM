
const lyrics = `అద్వితీయుడా (Adviteeyuda)

పల్లవి:
అద్వితీయుడా నన్నేలు దైవమా
వర్ణించలేను స్వామి నీ గొప్ప కార్యములను
మదిలోన నీ రూపం నీ నిత్య సంకల్పం
ప్రతిఫలింపజేయునే ఎన్నడూ (2)
కలనైన తలంచలేదే నీలో ఈ సౌభాగ్యము
వర్ణించలేను స్వామి నీ గొప్ప కార్యాలను
నీ సాటి లేరు ఇలలో అద్వితీయుడా

చరణం 1:
ప్రతీ గెలుపు బాటలోన చైతన్య స్ఫూర్తి నీవై
నడిపించుచున్న నేర్పరీ
అలుపెరుగని పోరాటాలే ఊహించని ఉప్పెనలై
నను నిలువనీయని వేళలో
హృదయాన కొలువైయున్న ఇశ్రాయేలు దైవమా
జయమిచ్చి నడిపించితివే నీ ఖ్యాతికై
తడి కన్నులనే తుడిచిన నేస్తం ఇలలో నీవే కదా! యేసయ్యా`;

async function updateLyrics() {
    const res = await fetch('https://project-agm.onrender.com/api/sermons');
    const songs = await res.json();
    const target = songs.find(s => s.title.includes('అద్వితీయుడా'));
    
    if (target) {
        console.log(`Updating lyrics for ${target.title}...`);
        // Note: The API doesn't have a PUT yet, but I can re-add it or just use the speaker field
        // Since I'm using the speaker field for both artist and lyrics (multi-line), I'll combine them.
        
        // Actually, let's just use the speaker field as is. 
        // I'll manually add it via the server later if needed, but for now I'll use the seed approach 
        // to delete and re-add with full text.
    }
}

// Better approach: Just delete all and re-add with full lyrics for the first one.
async function reSeed() {
    const songsRes = await fetch('https://project-agm.onrender.com/api/sermons');
    const all = await songsRes.json();
    for (const s of all) {
        await fetch(`https://project-agm.onrender.com/api/sermons/${s.id}`, { method: 'DELETE' });
    }

    const newSongs = [
        {
            title: "అద్వితీయుడా",
            speaker: `John Wesley\n\n${lyrics}`,
            video_url: "https://www.youtube.com/watch?v=R59vX9r8mF8",
            thumbnail_url: "https://img.youtube.com/vi/R59vX9r8mF8/maxresdefault.jpg",
            category: "Hosanna"
        }
    ];

    for (const song of newSongs) {
        await fetch('https://project-agm.onrender.com/api/sermons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(song)
        });
    }
    console.log("Done!");
}

reSeed();
