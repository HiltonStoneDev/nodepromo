const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Array of image filenames (you can add more images to the public/images directory)
const images = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg'
];

// Create public/images directory if it doesn't exist
const imageDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Serve the HTML page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Rotating Images</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f0f0f0;
                    font-family: Arial, sans-serif;
                }
                .container {
                    text-align: center;
                }
                #imageDisplay {
                    max-width: 80%;
                    max-height: 70vh;
                    border: 5px solid #333;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.2);
                }
                h1 {
                    color: #333;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Rotating Images</h1>
                <img id="imageDisplay" src="/images/${images[0]}" alt="Rotating Image">
            </div>
            <script>
                const images = ${JSON.stringify(images)};
                let currentIndex = 0;

                function rotateImage() {
                    currentIndex = (currentIndex + 1) % images.length;
                    document.getElementById('imageDisplay').src = `/images/${images[currentIndex]}`;
                }

                // Rotate image every 3 seconds
                setInterval(rotateImage, 3000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Place your images in the public/images directory');
});
