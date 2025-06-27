require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGE_DIR = path.join(__dirname, process.env.IMAGE_DIR || 'public/images');
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,gif,webp').split(',');

// Serve static files from public directory
app.use(express.static('public'));

// Function to get image filenames from the images directory
function getImageFiles() {
    try {
        const files = fs.readdirSync(IMAGE_DIR);
        const extPattern = new RegExp(`\\.(${ALLOWED_EXTENSIONS.join('|')})$`, 'i');
        return files.filter(file => extPattern.test(file));
    } catch (err) {
        console.error('Error reading images directory:', err);
        return [];
    }
}

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    console.log(`Created directory: ${IMAGE_DIR}`);
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
    console.log('Update images with sync-images.js or place into public/images directory');
});
