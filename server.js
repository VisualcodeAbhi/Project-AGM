require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin (Only if service account is provided)
const serviceAccountPath = path.join(__dirname, 'agape-firebase-adminsdk.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized.');
} else {
    console.warn('Firebase Service Account not found. Push notifications will be skipped.');
}

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

// Email Transporter (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'agapegospelministries2003@gmail.com',
        pass: process.env.EMAIL_PASS // This should be a Gmail App Password
    }
});

// Middleware
app.use(cors());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Admin Authentication Middleware
const requireAdmin = (req, res, next) => {
    // In a real app this would use JWTs, but since it's a simple setup
    // we use a static token check that the frontend sends when logged in.
    const token = req.headers['authorization'];
    if (token === 'Bearer AGAPE_ADMIN_SECRET_2026') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }
};

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

const MessageSchema = new mongoose.Schema({ name: String, phone: String, subject: String, content: String }, { timestamps: true });
const Message = mongoose.model('Message', MessageSchema);

const DeviceTokenSchema = new mongoose.Schema({ token: { type: String, unique: true } }, { timestamps: true });
const DeviceToken = mongoose.model('DeviceToken', DeviceTokenSchema);

async function sendPushNotification(title, body, data = {}) {
    console.log(`[Push Notification] ${title}: ${body}`);
    const tokens = await DeviceToken.find();
    if (tokens.length === 0) return;

    const registrationTokens = tokens.map(t => t.token);
    const message = {
        notification: { title, body },
        data,
        tokens: registrationTokens,
    };

    if (admin.apps.length > 0) {
        try {
            const response = await admin.messaging().sendMulticast(message);
            console.log(`${response.successCount} messages were sent successfully`);
            if (response.failureCount > 0) {
                // Optionally cleanup failed tokens
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
}

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
        ['daily_verse_img', 'assets/Daily.jpeg'],
        ['instagram_url', ''],
        ['facebook_url', ''],
        ['youtube_url', ''],
        ['google_maps_url', '']
    ];
    for (let [key, value] of defaults) {
        await Setting.updateOne({ key }, { $setOnInsert: { value } }, { upsert: true });
    }
}

// --- Upload Route ---
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
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

app.post('/api/settings', requireAdmin, async (req, res) => {
    try {
        const settings = req.body;
        let notifyLive = false;
        let notifyVerse = false;

        for (const [key, value] of Object.entries(settings)) {
            const old = await Setting.findOne({ key });
            if (old && old.value !== value) {
                if (key === 'live_video_url') notifyLive = true;
                if (key === 'daily_verse_img') notifyVerse = true;
            }
            await Setting.updateOne({ key }, { value }, { upsert: true });
        }

        if (notifyLive) sendPushNotification("Agape Live", "The Ministry is starting a Live Broadcast! Tap to join.");
        if (notifyVerse) sendPushNotification("Daily Word", "Today's precious promise is available. Come and be blessed!");

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/register-device', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });
        await DeviceToken.updateOne({ token }, { token }, { upsert: true });
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

app.post('/api/events', requireAdmin, async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        sendPushNotification("New Event", `A new event "${event.title}" has been added. Don't miss out!`);
        res.json({ ...event.toObject(), id: event._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/events/:id', requireAdmin, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/events/:id', requireAdmin, async (req, res) => {
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

app.post('/api/sermons', requireAdmin, async (req, res) => {
    try {
        const sermon = new Sermon(req.body);
        await sermon.save();
        res.json({ ...sermon.toObject(), id: sermon._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/sermons/:id', requireAdmin, async (req, res) => {
    try {
        await Sermon.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sermons/:id', requireAdmin, async (req, res) => {
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
        
        // Notify others about new prayer request
        sendPushNotification("New Prayer Request", `${prayer.user_name} shared a need. Let's pray together.`);
        
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

app.post('/api/prayers/:id/pray', async (req, res) => {
    try {
        const prayer = await Prayer.findByIdAndUpdate(
            req.params.id, 
            { $inc: { praying_count: 1 } }, 
            { new: true }
        );
        res.json({ success: true, praying_count: prayer.praying_count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Messages (Contact Form) ---
app.post('/api/messages', async (req, res) => {
    try {
        const { name, phone, subject, content } = req.body;
        const msg = new Message({ name, phone, subject, content });
        await msg.save();

        // Send Email Notification
        const mailOptions = {
            from: `"Agape App" <${process.env.EMAIL_USER || 'agapegospelministries2003@gmail.com'}>`,
            to: 'agapegospelministries2003@gmail.com',
            subject: `New Message: ${subject}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #d4af37;">New Website Message</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d4af37;">${content}</p>
                    <p style="font-size: 0.8rem; color: #888; margin-top: 30px;">Sent via Agape Gospel Ministries Mobile App</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('Email error:', error);
            else console.log('Email sent:', info.response);
        });

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/messages', requireAdmin, async (req, res) => {
    try {
        const msgs = await Message.find().sort({ createdAt: -1 });
        res.json(msgs.map(m => ({ ...m.toObject(), id: m._id })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/messages/:id', requireAdmin, async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Global Search ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        if (!query) return res.json({ sermons: [], events: [], prayers: [] });
        
        const regex = new RegExp(query, 'i');
        
        const [sermons, events, prayers] = await Promise.all([
            Sermon.find({ $or: [{ title: regex }, { speaker: regex }] }).limit(5),
            Event.find({ title: regex }).limit(5),
            Prayer.find({ request: regex }).limit(5)
        ]);
        
        res.json({
            sermons: sermons.map(s => ({ ...s.toObject(), id: s._id })),
            events: events.map(e => ({ ...e.toObject(), id: e._id })),
            prayers: prayers.map(p => ({ ...p.toObject(), id: p._id }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
