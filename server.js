const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Function to get image filenames from public/images directory
function getImageFiles() {
    const imageDir = path.join(__dirname, 'public', 'images');
    try {
        return fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    } catch (err) {
        console.error('Error reading images directory:', err);
        return [];
    }
}

// Create public/images directory if it doesn't exist
const imageDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get list of images
app.get('/api/images', (req, res) => {
    const images = getImageFiles();
    res.json(images);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Place your images in the public/images directory');
});
