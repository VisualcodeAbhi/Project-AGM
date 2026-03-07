require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Set up Cloudinary for uploads
cloudinary.config({
    cloud_name: 'dfv52ejiq',
    api_key: '342431531922748',
    api_secret: 'sx6EpwUADNn6sJV8zJVXAQMCWV4'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'agape_images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Initialize MongoDB
const mongoURI = 'mongodb+srv://abhilashdurgam0_db_user:KZOl6ANdJdt1Jr1W@cluster0.jppct2m.mongodb.net/agapeministries?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB.');
        initializeDefaultSettings();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Schemas
const SettingSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: String });
const Setting = mongoose.model('Setting', SettingSchema);

const EventSchema = new mongoose.Schema({ title: String, date: String, time: String, location: String, image_url: String }, { timestamps: true });
const Event = mongoose.model('Event', EventSchema);

const SermonSchema = new mongoose.Schema({ title: String, speaker: String, video_url: String, thumbnail_url: String, category: String }, { timestamps: true });
const Sermon = mongoose.model('Sermon', SermonSchema);

const PrayerSchema = new mongoose.Schema({ user_name: { type: String, default: 'Anonymous' }, request: String, praying_count: { type: Number, default: 0 } }, { timestamps: true });
const Prayer = mongoose.model('Prayer', PrayerSchema);

async function initializeDefaultSettings() {
    const defaults = [
        ['church_name', 'Agape Gospel Ministries'],
        ['founded_date', '23rd December 2003'],
        ['location_name', 'Takkellapadu'],
        ['mission_statement', '"Walking in Faith since 2003"'],
        ['phone', '+91 9394300400'],
        ['email', 'agapegospelministries2003@gmail.com'],
        ['live_video_url', 'https://www.youtube.com/embed/HOuTe90NEeQ'],
        ['live_thumbnail', 'assets/sermons-preview.png'],
        ['daily_verse_img', 'assets/Daily.jpeg']
    ];
    for (let [key, value] of defaults) {
        await Setting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true });
    }
}

// --- Upload Route ---
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Secure URL natively provided by Cloudinary
    res.json({ url: req.file.path });
});

// --- Settings ---
app.get('/api/settings', async (req, res) => {
    try {
        const rows = await Setting.find();
        const settings = {};
        rows.forEach(row => settings[row.key] = row.value);
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            await Setting.updateOne({ key }, { value }, { upsert: true });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Events ---
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events.map(e => ({ ...e.toObject(), id: e._id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.json({ ...event.toObject(), id: event._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Sermons (Songs) ---
app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await Sermon.find().sort({ createdAt: -1 });
        res.json(sermons.map(s => ({ ...s.toObject(), id: s._id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sermons', async (req, res) => {
    try {
        const sermon = new Sermon(req.body);
        await sermon.save();
        res.json({ ...sermon.toObject(), id: sermon._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/sermons/:id', async (req, res) => {
    try {
        await Sermon.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sermons/:id', async (req, res) => {
    try {
        await Sermon.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Prayers ---
app.get('/api/prayers', async (req, res) => {
    try {
        const prayers = await Prayer.find().sort({ createdAt: -1 });
        res.json(prayers.map(p => ({ ...p.toObject(), id: p._id, created_at: p.createdAt })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/prayers', async (req, res) => {
    try {
        const { userName, request } = req.body;
        if (!request) return res.status(400).json({ error: 'Request required' });
        const prayer = new Prayer({ user_name: userName || 'Anonymous', request, praying_count: 0 });
        await prayer.save();
        res.json({ id: prayer._id, userName: prayer.user_name, request: prayer.request, praying_count: 0, created_at: prayer.createdAt });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndUpdate(req.params.id, { request: req.body.request });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
