// const fetch = require('node-fetch'); // Node v18+ doesn't need this

const API = 'http://localhost:3000/api/sermons';

const songs = [
    {
        title: "అద్వితీయుడా",
        speaker: "Adviteeyuda\nHosanna Ministries",
        video_url: "https://www.youtube.com/watch?v=R59vX9r8mF8",
        thumbnail_url: "https://img.youtube.com/vi/R59vX9r8mF8/maxresdefault.jpg",
        category: "Hosanna"
    },
    {
        title: "విజయా గీతము",
        speaker: "Vijaya Geethamu\nHosanna Ministries",
        video_url: "https://www.youtube.com/watch?v=5V2BvUvD5lY",
        thumbnail_url: "https://img.youtube.com/vi/5V2BvUvD5lY/maxresdefault.jpg",
        category: "Hosanna"
    },
    {
        title: "ఆనందం నీలోనే",
        speaker: "Anandam Neelone\nHosanna Ministries",
        video_url: "https://www.youtube.com/watch?v=680D92fA_S8",
        thumbnail_url: "https://img.youtube.com/vi/680D92fA_S8/maxresdefault.jpg",
        category: "Hosanna"
    },
    {
        title: "యూదా స్తుతి గోత్రపు సింహమా",
        speaker: "Yooda Sthuthi Gothrapu Simhamaa\nHosanna Ministries",
        video_url: "https://www.youtube.com/watch?v=Gk6WlkAEn3w",
        thumbnail_url: "https://img.youtube.com/vi/Gk6WlkAEn3w/maxresdefault.jpg",
        category: "Hosanna"
    }
];

async function addSongs() {
    for (const song of songs) {
        console.log(`Adding ${song.title}...`);
        await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(song)
        });
    }
    console.log("Done!");
}

addSongs();
