# NodePromo

A simple Node.js application using Express to serve a rotating image slideshow with automatic image synchronization.

## Setup
1. Ensure you have Node.js installed.
2. Clone this repository or download the files.
3. Navigate to the project directory and run `npm install` to install dependencies.
4. Place your images in the `public/images` directory, or use the sync script to download them automatically.
5. Start the server with `node server.js` or `npm start`.
6. Open your browser and visit `http://localhost:3000` to see the rotating images.

## Features
- Automatically rotates through images every 3 seconds.
- Dynamically loads images from the `public/images` directory.
- Serves static files from the `public` directory.
- Command-line image synchronization script for automated deployments.

## System Service Installation (Ubuntu)

To run NodePromo as a system service on Ubuntu using the provided init script:

### Prerequisites
1. Ensure your NodePromo application is installed in `/opt/nodepromo` (or modify the `APP_DIR` variable in the init script)
2. Make sure Node.js is installed at `/usr/bin/node`
3. Create the log directory: `sudo mkdir -p /var/log/nodepromo`

### Installation Steps

1. **Copy the init script to the system directory:**
   ```bash
   sudo cp nodepromo.init /etc/init.d/nodepromo
   ```

2. **Make the script executable:**
   ```bash
   sudo chmod +x /etc/init.d/nodepromo
   ```

3. **Enable the service to start at boot:**
   ```bash
   sudo update-rc.d nodepromo defaults
   ```

4. **Start the service:**
   ```bash
   sudo service nodepromo start
   ```

### Service Management Commands

- **Start the service:** `sudo service nodepromo start`
- **Stop the service:** `sudo service nodepromo stop`
- **Restart the service:** `sudo service nodepromo restart`
- **Check service status:** `sudo service nodepromo status`
- **View logs:** `sudo tail -f /var/log/nodepromo/nodepromo.log`

### Configuration

Before installing, you may need to modify the following variables in `nodepromo.init` to match your environment:

- `APP_DIR`: Directory where NodePromo is installed (default: `/opt/nodepromo`)
- `APP_USER`: User to run the service as (default: `www-data`)
- `APP_GROUP`: Group to run the service as (default: `www-data`)
- `NODE`: Path to Node.js executable (default: `/usr/bin/node`)

### Uninstalling the Service

To remove the service:

1. **Stop the service:**
   ```bash
   sudo service nodepromo stop
   ```

2. **Disable the service:**
   ```bash
   sudo update-rc.d nodepromo remove
   ```

3. **Remove the init script:**
   ```bash
   sudo rm /etc/init.d/nodepromo
   ```

## Image Synchronization

The `sync-images.js` script allows you to automatically download and sync images from a remote JSON source:

### Usage
```bash
node sync-images.js <json-url> [base-url]
```

### Examples
```bash
# For JSON with full URLs
node sync-images.js https://api.example.com/images.json

# For JSON with only filenames (requires base URL)
node sync-images.js https://api.example.com/promos.json https://cdn.example.com/images
```

### JSON Format
The script supports multiple JSON formats:

1. **Simple array of URLs:**
```json
[
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg"
]
```

2. **Object with images array (allows custom filenames):**
```json
{
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "filename": "custom_name1.jpg"
    },
    {
      "url": "https://example.com/image2.jpg", 
      "filename": "custom_name2.jpg"
    }
  ]
}
```

3. **Object with promos array (filenames only - requires base URL):**
```json
{
  "promos": [
    {"file_name": "image1.jpg"},
    {"file_name": "image2.webp"},
    {"file_name": "image3.png"}
  ]
}
```

### What the sync script does:
- Fetches the JSON data from the provided URL
- Downloads any new images to `public/images/`
- Removes any local images not present in the JSON list
- Provides detailed logging of all operations
- Includes retry logic for failed downloads
- Supports WebP, JPG, PNG, and GIF formats

### Cron Setup (Production)
To run the sync script every hour via cron:
```bash
# Edit crontab
crontab -e

# Add this line to run every hour (with base URL for promos format)
0 * * * * cd /path/to/nodepromo && node sync-images.js https://your-api.com/promos.json https://your-cdn.com/images >> /var/log/nodepromo-sync.log 2>&1
```

## Future Improvements
- Add image optimization and resizing
- Implement caching for better performance  
- Add configuration file support for the sync script
