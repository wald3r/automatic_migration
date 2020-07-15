#!bin/bash


sudo curl -sSL https://get.docker.com/ | sh &&
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
sudo chmod +x /usr/local/bin/docker-compose &&
sudo usermod -aG docker ec2-user &&
docker-compose up
