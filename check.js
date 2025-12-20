const fs = require('fs');
const path = require('path');

console.log("--- DEBUGGING HTML FILES ---");
console.log("Looking in:", __dirname);

// Check if register.html exists
const registerPath = path.join(__dirname, 'register.html');
if (fs.existsSync(registerPath)) {
    console.log("✅ found: register.html");
} else {
    console.log("❌ MISSING: register.html");
    
    // Print ALL files in this folder to see what you actually have
    console.log("--- Files actually in this folder: ---");
    fs.readdirSync(__dirname).forEach(file => {
        console.log(" - " + file);
    });
}