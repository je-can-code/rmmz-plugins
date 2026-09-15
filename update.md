sudo sed -i 's/^update_initramfs=yes/update_initramfs=no/' /etc/initramfs-tools/update-initramfs.conf

sudo dpkg --configure -a

sudo apt-get install -f

sudo apt purge linux-image-7.0.8-pikaos linux-headers-7.0.8-pikaos linux-image-7.0.11-pikaos linux-headers-7.0.11-pikaos linux-image-7.1.2-pikaos linux-headers-7.1.2-pikaos linux-image-7.1.3-pikaos linux-headers-7.1.3-pikaos

ls /boot/booster.img-7.2.4-pikaos
dpkg -l | awk 'NR>5 && $1!~/^(ii|rc|un)$/' | wc -l
