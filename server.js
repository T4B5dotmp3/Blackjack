require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('/models/User'); // Import the User model

const app = express();

// --- MIDDLEWARE ---
// Allows the server to understand data sent from forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serves your HTML, CSS, and Image files from the current folder
app.use(express.static(__dirname));

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// --- ROUTES ---

// 1. Serve HTML Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 2. Handle Registration (Sign Up)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send("User already exists. <a href='/register'>Try again</a>");
        }

        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default $1000 credits
        const newUser = new User({
            username,
            password: hashedPassword,
            credits: 1000
        });

        await newUser.save();
        
        // Redirect to login page after success
        res.redirect('/login');
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user.");
    }
});

// 3. Handle Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Login Success! Send JSON back to the browser
        res.json({ 
            success: true, 
            username: user.username, 
            credits: user.credits 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});