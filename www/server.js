const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, '')));

// Initialize Database
const db = new sqlite3.Database('./prayers.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS prayers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_name TEXT, request TEXT, praying_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, date TEXT, time TEXT, location TEXT, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`CREATE TABLE IF NOT EXISTS sermons (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, speaker TEXT, video_url TEXT, thumbnail_url TEXT, category TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`, (err) => {
            if (!err) {
                const defaults = [
                    ['church_name', 'Agape Gospel Ministries'],
                    ['founded_date', '23rd December 2003'],
                    ['location_name', 'Takkellapadu'],
                    ['mission_statement', '"Walking in Faith since 2003"'],
                    ['phone', '+91 9394300400'],
                    ['email', 'agapegospelministries2003@gmail.com'],
                    ['live_video_url', 'https://www.youtube.com/embed/HOuTe90NEeQ'],
                    ['live_thumbnail', 'assets/sermon1.jpg'],
                    ['daily_verse_img', 'assets/Daily.jpeg']
                ];
                defaults.forEach(d => db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, d));
            }
        });
    }
});

// --- Upload Route ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
    db.all(`SELECT * FROM settings`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const settings = req.body;
    const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`);
    db.serialize(() => {
        for (const [key, value] of Object.entries(settings)) {
            stmt.run(key, value);
        }
        stmt.finalize(() => res.json({ success: true }));
    });
});

// --- Events ---
app.get('/api/events', (req, res) => {
    db.all(`SELECT * FROM events ORDER BY date ASC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/events', (req, res) => {
    const { title, date, time, location, image_url } = req.body;
    db.run(`INSERT INTO events (title, date, time, location, image_url) VALUES (?, ?, ?, ?, ?)`, 
        [title, date, time, location, image_url], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/events/:id', (req, res) => {
    db.run(`DELETE FROM events WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/events/:id', (req, res) => {
    const { title, date, time, location } = req.body;
    db.run(`UPDATE events SET title = ?, date = ?, time = ?, location = ? WHERE id = ?`,
        [title, date, time, location, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// --- Sermons ---
app.get('/api/sermons', (req, res) => {
    db.all(`SELECT * FROM sermons ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sermons', (req, res) => {
    const { title, speaker, video_url, thumbnail_url, category } = req.body;
    db.run(`INSERT INTO sermons (title, speaker, video_url, thumbnail_url, category) VALUES (?, ?, ?, ?, ?)`, 
        [title, speaker, video_url, thumbnail_url, category], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/sermons/:id', (req, res) => {
    db.run(`DELETE FROM sermons WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.put('/api/sermons/:id', (req, res) => {
    const { title, speaker, video_url, thumbnail_url, category } = req.body;
    db.run(`UPDATE sermons SET title = ?, speaker = ?, video_url = ?, thumbnail_url = ?, category = ? WHERE id = ?`,
        [title, speaker, video_url, thumbnail_url, category, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// --- Prayers ---
app.get('/api/prayers', (req, res) => {
    db.all(`SELECT id, user_name, request, praying_count, created_at || 'Z' as created_at FROM prayers ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/prayers', (req, res) => {
    const { userName, request } = req.body;
    if (!request) return res.status(400).json({ error: 'Request required' });
    db.run(`INSERT INTO prayers (user_name, request) VALUES (?, ?)`, [userName || 'Anonymous', request], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, userName: userName || 'Anonymous', request, praying_count: 0, created_at: new Date().toISOString() });
    });
});

app.put('/api/prayers/:id', (req, res) => {
    db.run(`UPDATE prayers SET request = ? WHERE id = ?`, [req.body.request, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/prayers/:id', (req, res) => {
    db.run(`DELETE FROM prayers WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
