require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// --- FILE SERVER HELPER ---
// This reads files manually to bypass the ".vscode" folder security block
const renderPage = (res, fileName, type = 'text/html') => {
    const fullPath = path.join(__dirname, fileName);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        res.setHeader('Content-Type', type);
        res.send(content);
    } else {
        res.status(404).send(`Error: File ${fileName} not found`);
    }
};

// --- ROUTES ---

// 1. HTML Pages
app.get('/', (req, res) => renderPage(res, 'login.html'));
app.get('/login', (req, res) => renderPage(res, 'login.html'));
app.get('/register', (req, res) => renderPage(res, 'register.html'));
app.get('/dashboard', (req, res) => renderPage(res, 'dashboard.html'));

// 2. CSS File
app.get('/style.css', (req, res) => renderPage(res, 'style.css', 'text/css'));

// 3. Register Logic (Saves to Mongo)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ success: false, message: "User exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with 1000 credits
        const newUser = new User({ username, password: hashedPassword, credits: 1000 });
        await newUser.save();
        
        // Send success + credits back to browser
        res.json({ success: true, username: username, credits: 1000 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 4. Login Logic (Reads from Mongo)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        // Send success + credits back to browser
        res.json({ success: true, username: user.username, credits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));