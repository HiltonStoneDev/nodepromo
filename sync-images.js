#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
    jsonUrl: process.env.JSON_URL || 'https://intranet.cocobrooks.com/promos.json/1',
    baseUrl: process.env.BASE_URL || 'https://intranet.cocobrooks.com/storage/promos/',
    imagesDir: path.join(__dirname, process.env.IMAGE_DIR || 'public/images'),
    timeout: parseInt(process.env.DOWNLOAD_TIMEOUT) || 30000, // in milliseconds
    retries: parseInt(process.env.DOWNLOAD_RETRIES) || 3
};

// Helper function to make HTTP/HTTPS requests
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, { timeout: CONFIG.timeout }, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(new Error(`Invalid JSON response: ${err.message}`));
                }
            });
        }).on('error', reject).on('timeout', () => {
            reject(new Error('Request timeout'));
        });
    });
}

// Helper function to download a file
function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const file = fs.createWriteStream(filePath);
        
        client.get(url, { timeout: CONFIG.timeout }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }
            
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(err);
        }).on('timeout', () => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(new Error('Download timeout'));
        });
    });
}

// Get filename from URL
function getFilenameFromUrl(url) {
    const urlPath = new URL(url).pathname;
    return path.basename(urlPath) || `image_${Date.now()}.jpg`;
}

// Parse image list from JSON data
function parseImageList(jsonData) {
    let imageList = [];
    
    // Handle different JSON formats
    if (Array.isArray(jsonData)) {
        // Simple array format
        imageList = jsonData;
    } else if (jsonData.images && Array.isArray(jsonData.images)) {
        // Object with "images" array
        imageList = jsonData.images;
    } else if (jsonData.promos && Array.isArray(jsonData.promos)) {
        // Object with "promos" array (your format)
        imageList = jsonData.promos;
    } else {
        throw new Error('Unsupported JSON format. Expected array or object with "images" or "promos" array');
    }
    
    return imageList;
}

// Extract image info from list item
function extractImageInfo(imageItem) {
    let imageUrl, filename;
    
    if (typeof imageItem === 'string') {
        // Simple string URL
        imageUrl = imageItem;
        filename = getFilenameFromUrl(imageUrl);
    } else if (imageItem.url) {
        // Object with URL
        imageUrl = imageItem.url;
        filename = imageItem.filename || getFilenameFromUrl(imageUrl);
    } else if (imageItem.file_name) {
        // Object with file_name (your format)
        filename = imageItem.file_name;
        if (CONFIG.baseUrl) {
            imageUrl = CONFIG.baseUrl.endsWith('/') ? CONFIG.baseUrl + filename : CONFIG.baseUrl + '/' + filename;
        } else {
            throw new Error(`file_name format requires a base URL. Please provide base URL as second argument.`);
        }
    } else {
        throw new Error('Invalid image item format');
    }
    
    return { imageUrl, filename };
}

// Main sync function
async function syncImages() {
    try {
        console.log('🔄 Starting image sync...');
        console.log(`📡 Fetching image list from: ${CONFIG.jsonUrl}`);
        if (CONFIG.baseUrl) {
            console.log(`🌐 Base URL for downloads: ${CONFIG.baseUrl}`);
        }
        
        // Fetch JSON data
        const jsonData = await fetchJson(CONFIG.jsonUrl);
        
        // Parse image list
        const imageList = parseImageList(jsonData);
        console.log(`📋 Found ${imageList.length} images in the list`);
        
        // Create images directory if it doesn't exist
        if (!fs.existsSync(CONFIG.imagesDir)) {
            fs.mkdirSync(CONFIG.imagesDir, { recursive: true });
            console.log('📁 Created images directory');
        }
        
        // Get current images in directory
        const currentFiles = fs.readdirSync(CONFIG.imagesDir)
            .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        
        console.log(`📂 Current images in directory: ${currentFiles.length}`);
        
        // Determine which images to download
        const expectedFiles = [];
        const downloadTasks = [];
        
        for (const imageItem of imageList) {
            try {
                const { imageUrl, filename } = extractImageInfo(imageItem);
                
                expectedFiles.push(filename);
                const filePath = path.join(CONFIG.imagesDir, filename);
                
                // Check if file already exists
                if (!fs.existsSync(filePath)) {
                    downloadTasks.push({ url: imageUrl, filename, filePath });
                }
            } catch (err) {
                console.warn('⚠️  Skipping invalid image item:', imageItem, '-', err.message);
                continue;
            }
        }
        
        // Download new images
        if (downloadTasks.length > 0) {
            console.log(`⬇️  Downloading ${downloadTasks.length} new images...`);
            
            for (const task of downloadTasks) {
                let attempts = 0;
                while (attempts < CONFIG.retries) {
                    try {
                        console.log(`  📥 Downloading: ${task.filename}`);
                        await downloadFile(task.url, task.filePath);
                        console.log(`  ✅ Downloaded: ${task.filename}`);
                        break;
                    } catch (err) {
                        attempts++;
                        console.error(`  ❌ Failed to download ${task.filename} (attempt ${attempts}): ${err.message}`);
                        if (attempts >= CONFIG.retries) {
                            console.error(`  🚫 Giving up on ${task.filename} after ${CONFIG.retries} attempts`);
                        } else {
                            console.log(`  🔄 Retrying ${task.filename}...`);
                            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                        }
                    }
                }
            }
        } else {
            console.log('✅ All images are up to date');
        }
        
        // Remove images not in the list
        const filesToRemove = currentFiles.filter(file => !expectedFiles.includes(file));
        
        if (filesToRemove.length > 0) {
            console.log(`🗑️  Removing ${filesToRemove.length} obsolete images...`);
            for (const file of filesToRemove) {
                const filePath = path.join(CONFIG.imagesDir, file);
                fs.unlinkSync(filePath);
                console.log(`  🗑️  Removed: ${file}`);
            }
        } else {
            console.log('✅ No obsolete images to remove');
        }
        
        // Final summary
        const finalFiles = fs.readdirSync(CONFIG.imagesDir)
            .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        
        console.log(`🎉 Sync completed! Images in directory: ${finalFiles.length}`);
        
    } catch (error) {
        console.error('💥 Sync failed:', error.message);
        process.exit(1);
    }
}

// Start syncing with default parameters if none provided
syncImages().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
