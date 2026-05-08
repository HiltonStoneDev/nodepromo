#!/bin/bash

# Update source files

# Add nodepromo directory to git config
echo "Adding nodepromo directory to git config and pulling latest..."
sudo git config --global --add safe.directory /opt/nodepromo
sudo -u www-data git config --global --add safe.directory /opt/nodepromo

# Ensure the repo is owned by www-data so it can write git objects
sudo chown -R www-data:www-data /opt/nodepromo

sudo -u www-data git -C /opt/nodepromo pull

# create log file
sudo touch /var/log/nodepromo-sync.log && sudo chown www-data:www-data /var/log/nodepromo-sync.log

# Prompt user for new hostname
echo "Current hostname: $(hostname)"
read -p "Enter new hostname (or press Enter to keep current): " new_hostname

# Change hostname if user provided input
if [ ! -z "$new_hostname" ]; then
    echo "Changing hostname to: $new_hostname"
    
    # Update hostname in /etc/hostname
    echo "$new_hostname" | sudo tee /etc/hostname > /dev/null
    
    # Update hostname in /etc/hosts
    sudo sed -i "s/127.0.1.1.*/127.0.1.1\t$new_hostname/g" /etc/hosts
    
    # Set hostname immediately
    sudo hostnamectl set-hostname "$new_hostname"
    
    echo "Hostname changed successfully!"
else
    echo "Keeping current hostname"
fi

# Prompt for slideshow ID and update .env JSON_URL
NODEPROMO_DIR="/opt/nodepromo"
ENV_FILE="$NODEPROMO_DIR/.env"
ENV_SAMPLE="$NODEPROMO_DIR/.env-sample"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_SAMPLE" ]; then
        echo "No .env file found. Copying from .env-sample..."
        sudo cp "$ENV_SAMPLE" "$ENV_FILE"
        sudo chown www-data:www-data "$ENV_FILE"
    else
        echo "Warning: $ENV_SAMPLE not found, cannot create .env"
    fi
fi

if [ -f "$ENV_FILE" ]; then
    current_id=$(grep -E '^JSON_URL=' "$ENV_FILE" | sed -E 's|.*/promos\.json/([0-9]+).*|\1|')
    echo "Current slideshow ID: ${current_id:-none}"
    read -p "Enter slideshow ID (or press Enter to keep current): " slideshow_id

    if [ ! -z "$slideshow_id" ]; then
        new_url="https://intranet.cocobrooks.com/promos.json/$slideshow_id"
        if grep -qE '^JSON_URL=' "$ENV_FILE"; then
            sudo sed -i "s|^JSON_URL=.*|JSON_URL=$new_url|" "$ENV_FILE"
        else
            echo "JSON_URL=$new_url" | sudo tee -a "$ENV_FILE" > /dev/null
        fi
        echo "Slideshow ID set to: $slideshow_id"
    else
        echo "Keeping current slideshow ID"
    fi
fi

# Remove Chromium singleton files
echo "Removing Chromium singleton files..."
rm -f /home/odroid/.config/chromium/Singleton*

# Reboot system
echo "Rebooting system in 3 seconds..."
sleep 3
reboot
