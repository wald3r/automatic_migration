import pandas as pd

df = pd.read_csv('aws_spot_pricing.csv', sep=',')

df['AvailabilityZone'] = df['AvailabilityZone'].str[:-1]

df = df['AvailabilityZone'].unique()

print(df)