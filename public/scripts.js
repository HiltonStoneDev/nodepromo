// Enhanced slideshow script with dynamic image management
let images = [];
let currentIndex = 0;
let imageElements = [];
let rotationInterval = null;
let reloadInterval = null;
let isTransitioning = false;

// Configuration
const CONFIG = {
    rotationSpeed: 3000, // 3 seconds per image
    reloadInterval: 30000, // Check for new images every 30 seconds
    transitionDuration: 500 // Half second transition
};

// Initialize the slideshow
function initializeSlideshow() {
    console.log('🎬 Initializing slideshow...');
    loadImages();
    
    // Set up periodic reload to check for new images
    reloadInterval = setInterval(() => {
        console.log('🔄 Checking for image updates...');
        checkForImageUpdates();
    }, CONFIG.reloadInterval);
}

// Load images from server
async function loadImages() {
    try {
        console.log('📡 Fetching image list...');
        const response = await fetch('/api/images');
        const newImages = await response.json();
        
        // Hide server offline badge if it exists (server is back online)
        hideServerOfflineBadge();
        
        if (newImages.length === 0) {
            showMessage('No images found');
            return;
        }
        
        console.log(`📋 Found ${newImages.length} images`);
        
        // Check if image list has changed
        if (hasImageListChanged(newImages)) {
            console.log('📸 Image list changed, updating slideshow...');
            images = [...newImages];
            await createImageElements();
            startRotation();
        } else {
            console.log('✅ Image list unchanged');
        }
        
    } catch (error) {
        console.error('❌ Error fetching images:', error);
        showServerOfflineBadge();
    }
}

// Check if the image list has changed
function hasImageListChanged(newImages) {
    if (images.length !== newImages.length) return true;
    
    for (let i = 0; i < images.length; i++) {
        if (images[i] !== newImages[i]) return true;
    }
    
    return false;
}

// Create image elements for all images
async function createImageElements() {
    const container = document.getElementById('imageContainer');
    
    // Show loading message
    showMessage('Loading images...');
    
    // Clear existing images
    container.innerHTML = '';
    imageElements = [];
    currentIndex = 0;
    
    // Create image elements for each image
    for (let i = 0; i < images.length; i++) {
        const img = document.createElement('img');
        img.className = 'image-layer';
        const imageSrc = `/images/${images[i]}`;
        img.src = imageSrc;
        img.alt = `Image ${i + 1}`;
        // Set background image for the blurred effect
        img.style.backgroundImage = `url('${imageSrc}')`;
        // Don't set inline opacity - let CSS handle it
        
        // Set first image as active
        if (i === 0) {
            img.classList.add('active');
        }
        
        container.appendChild(img);
        imageElements.push(img);
        
        console.log(`📥 Added image ${i + 1}/${images.length}: ${images[i]}`);
    }
    
    // Add image counter
    addImageCounter();
    
    // Wait for first image to load before starting
    if (imageElements.length > 0) {
        await waitForImageLoad(imageElements[0]);
        hideMessage();
        console.log('🎉 All images loaded and ready');
    }
}

// Wait for an image to load
function waitForImageLoad(img) {
    return new Promise((resolve) => {
        if (img.complete) {
            resolve();
        } else {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
        }
    });
}

// Add image counter display
function addImageCounter() {
    const container = document.getElementById('imageContainer');
    const existing = container.querySelector('.image-info');
    if (existing) existing.remove();
    
    const counter = document.createElement('div');
    counter.className = 'image-info';
    counter.textContent = `1 / ${images.length}`;
    container.appendChild(counter);
}

// Update image counter
function updateImageCounter() {
    const counter = document.querySelector('.image-info');
    if (counter) {
        counter.textContent = `${currentIndex + 1} / ${images.length}`;
    }
}

// Show loading/error message
function showMessage(text) {
    const container = document.getElementById('imageContainer');
    let loading = container.querySelector('.loading');
    
    if (!loading) {
        loading = document.createElement('div');
        loading.className = 'loading';
        container.appendChild(loading);
    }
    
    loading.textContent = text;
    loading.style.display = 'block';
}

// Hide loading message
function hideMessage() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Show server offline badge
function showServerOfflineBadge() {
    const container = document.getElementById('imageContainer');
    const badge = document.createElement('div');
    badge.className = 'server-offline-badge';
    badge.textContent = 'Server Offline';
    container.appendChild(badge);
}

// Hide server offline badge
function hideServerOfflineBadge() {
    const badge = document.querySelector('.server-offline-badge');
    if (badge) {
        badge.remove();
    }
}

// Start the rotation cycle
function startRotation() {
    // Stop any existing rotation
    if (rotationInterval) {
        clearInterval(rotationInterval);
    }
    
    if (imageElements.length <= 1) {
        console.log('⚠️ Not enough images for rotation');
        return;
    }
    
    console.log('▶️ Starting image rotation');
    
    rotationInterval = setInterval(() => {
        if (!isTransitioning) {
            rotateToNextImage();
        }
    }, CONFIG.rotationSpeed);
}

// Rotate to the next image
async function rotateToNextImage() {
    if (isTransitioning || imageElements.length === 0) return;
    
    isTransitioning = true;
    
    const currentImg = imageElements[currentIndex];
    const nextIndex = (currentIndex + 1) % imageElements.length;
    const nextImg = imageElements[nextIndex];
    
    // If we've completed a full cycle, check for updates
    if (nextIndex === 0 && currentIndex === imageElements.length - 1) {
        console.log('🔄 Completed full cycle, checking for updates...');
        setTimeout(() => checkForImageUpdates(), 1000);
    }
    
    console.log(`🔄 Transitioning from image ${currentIndex + 1} to ${nextIndex + 1}`);
    
    // Cross-fade transition
    currentImg.classList.remove('active');
    nextImg.classList.add('active');
    
    // Update index and counter
    currentIndex = nextIndex;
    updateImageCounter();
    
    // Wait for transition to complete
    setTimeout(() => {
        isTransitioning = false;
    }, CONFIG.transitionDuration);
}

// Check for image updates
async function checkForImageUpdates() {
    await loadImages();
}

// Cleanup function
function cleanup() {
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
    if (reloadInterval) {
        clearInterval(reloadInterval);
        reloadInterval = null;
    }
}

// Initialize when page loads
window.addEventListener('load', initializeSlideshow);

// Cleanup when page unloads
window.addEventListener('beforeunload', cleanup);
