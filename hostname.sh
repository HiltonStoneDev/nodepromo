#!/bin/bash

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

# Add nodepromo directory to git config
echo "Adding nodepromo directory to git config and pulling latest..."
git config --global --add safe.directory /opt/nodepromo
git pull
# Remove Chromium singleton files
echo "Removing Chromium singleton files..."
rm -f /home/odroid/.config/chromium/Singleton*

# Reboot system
echo "Rebooting system in 3 seconds..."
sleep 3
reboot
