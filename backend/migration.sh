#!/bin/bash

ip=$1
key=$2
provider1=$3
provider2="aws"

if [ $provider1 == $provider2 ]; then
	sudo chmod 400 $key &&
	scp -i $key -o StrictHostKeyChecking=no -r /home/ec2-user/image ec2-user@$ip:/home/ec2-user
else
	scp -o StrictHostKeyChecking=no -r /home/walder/image walder@$ip:/home/walder
fi
