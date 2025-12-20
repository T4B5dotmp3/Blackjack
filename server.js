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

// --- FILE HELPER ---
// Reads files manually to bypass the ".vscode" folder block
const renderPage = (res, fileName, type = 'text/html') => {
    const fullPath = path.join(__dirname, fileName);
    
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        res.setHeader('Content-Type', type);
        res.send(content);
    } else {
        console.log(`❌ Missing File: ${fileName}`); // Alert in terminal
        res.status(404).send(`Error: File ${fileName} not found. Check your terminal.`);
    }
};

// --- ROUTES ---

// 1. HTML Pages
app.get('/', (req, res) => renderPage(res, 'login.html'));
app.get('/login', (req, res) => renderPage(res, 'login.html'));
app.get('/register', (req, res) => renderPage(res, 'register.html'));
app.get('/dashboard', (req, res) => renderPage(res, 'dashboard.html'));

// 2. CSS File (Explicit Route)
app.get('/style.css', (req, res) => {
    renderPage(res, 'style.css', 'text/css');
});

// 3. Handle Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ success: false, message: "User exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, credits: 0 });
        await newUser.save();
        
        res.json({ success: true, username: username, credits: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 4. Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        res.json({ success: true, username: user.username, credits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- STARTUP CHECK ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Check if style.css exists
    const cssPath = path.join(__dirname, 'style.css');
    if (fs.existsSync(cssPath)) {
        console.log("✅ FOUND: style.css");
    } else {
        console.log("❌ MISSING: style.css (Please rename your file to 'style.css')");
    }
});