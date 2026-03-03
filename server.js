const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

// Initialize Database
const db = new sqlite3.Database('./prayers.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS prayers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT,
            request TEXT,
            praying_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            }
        });
    }
});

// API Routes
// GET all prayers
app.get('/api/prayers', (req, res) => {
    db.all(`SELECT * FROM prayers ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new prayer
app.post('/api/prayers', (req, res) => {
    const { userName, request } = req.body;
    
    if (!request) {
        return res.status(400).json({ error: 'Prayer request is required.' });
    }

    const sql = `INSERT INTO prayers (user_name, request) VALUES (?, ?)`;
    const params = [userName || 'Anonymous', request];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            userName: userName || 'Anonymous',
            request: request,
            praying_count: 0,
            created_at: new Date().toISOString()
        });
    });
});

// Increment praying count
app.post('/api/prayers/:id/pray', (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'increment' or 'decrement'
    
    let sql = `UPDATE prayers SET praying_count = praying_count + 1 WHERE id = ?`;
    if (action === 'decrement') {
        sql = `UPDATE prayers SET praying_count = praying_count - 1 WHERE id = ?`;
    }

    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
