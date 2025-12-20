const fs = require('fs');
const path = require('path');

console.log("--- DEBUGGING FILES ---");
console.log("Current Directory:", __dirname);

// 1. Check if 'models' folder exists
const modelsPath = path.join(__dirname, 'models');
if (fs.existsSync(modelsPath)) {
    console.log("✅ 'models' folder found.");
    
    // 2. List what is INSIDE the models folder
    const files = fs.readdirSync(modelsPath);
    console.log("Files inside 'models':", files);
} else {
    console.log("❌ 'models' folder NOT found. Check your spelling!");
}
console.log("-----------------------");

