#!/bin/bash

ip=$1
key=$2

sudo chmod 400 $key &&
scp -i $key -o StrictHostKeyChecking=no -r /home/ec2-user/image ec2-user@$ip:/home/ec2-user
