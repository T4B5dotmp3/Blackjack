require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/User');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// FIXED: Added { dotfiles: 'allow' } so it can serve CSS from inside .vscode
app.use(express.static(__dirname, { dotfiles: 'allow' }));

const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// --- ROUTES ---

// Helper option to allow serving files from hidden folders
const fileOptions = { dotfiles: 'allow' };

// 1. Root Route -> LOGIN Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'), fileOptions);
});

// Explicit Login Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'), fileOptions);
});

// Register Route
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'), fileOptions);
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'), fileOptions);
});

// 2. Handle Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            credits: 1000
        });

        await newUser.save();
        res.json({ success: true, username: username });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 3. Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        res.json({ success: true, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));