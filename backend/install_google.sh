#! /bin/bash

sudo apt-get install -y \
          apt-transport-https \
          ca-certificates \
          curl \
          gnupg-agent \
          software-properties-common &&
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - &&
        sudo apt-key fingerprint 0EBFCD88 &&
        sudo add-apt-repository \
          "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) \
          stable" &&
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io &&
        sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose &&
        sudo chmod +x /usr/local/bin/docker-compose &&
        sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose &&
        sudo usermod -aG docker $USER &&
        sudo service docker restart