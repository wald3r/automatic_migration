#!/bin/bash

ip=$1
key=$2
provider1=$3
provider2=$4

if [[ $provider1 == $provider2 ]] && [[ $provider1 == "AWS" ]]; then
	sudo chmod 400 $key &&
	scp -i $key -o StrictHostKeyChecking=no -r /home/ec2-user/image ec2-user@$ip:/home/ec2-user
elif [[ $provider1 != $provider2 ]] && [[ $provider1 == "Google" ]]; then
	sudo chmod 400 $key &&
	scp -i $key -o StrictHostKeyChecking=no -r /home/walder/image ec2-user@$ip:/home/ec2-user
elif [[ $provider1 != $provider2 ]] && [[ $provider1 == "AWS" ]]; then
	sudo chmod 400 $key &&
	scp -i $key -o StrictHostKeyChecking=no -r /home/ec2-user/image walder@$ip:/home/walder
else
	sudo chmod 400 $key &&
	scp -i $key -o StrictHostKeyChecking=no -r /home/walder/image walder@$ip:/home/walder
fi
