#!/bin/bash

sudo zypper install -y docker &&
sudo systemctl enable docker.service &&
sudo /usr/sbin/usermod -aG docker ec2-user && 
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
sudo chmod +x /usr/local/bin/docker-compose &&
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose &&
sudo docker-compose up -d
