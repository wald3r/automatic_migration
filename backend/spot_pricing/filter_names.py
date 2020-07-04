import pandas as pd
import os

df = pd.read_csv('aws_spot_pricing.csv', sep=',')


df_zones = df['AvailabilityZone'].unique()
df_instances = df['InstanceType'].unique()

with open(os.getcwd() + '/zones.csv', 'a') as f:
        f.write("%s\n" % ('Zones'))

with open(os.getcwd() + '/instances.csv', 'a') as f:
    f.write("%s\n" % ('instances'))


for x in df_zones:
    with open(os.getcwd() + '/zones.csv', 'a') as f:
        f.write("%s\n" % (x))


for x in df_instances:
    with open(os.getcwd() + '/instances.csv', 'a') as f:
        f.write("%s\n" % (x))


print(df_zones)
print(df_instances)


