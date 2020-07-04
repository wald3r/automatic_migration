import pandas as pd
import os



df = pd.read_csv('aws_spot_pricing.csv', sep=',')

df = df.iloc[::-1]
df['Training'] = 0

df_groups = df.groupby(['InstanceType'])
for name, group in df_groups:
    group.to_csv(os.getcwd() + '/pricing_history/' + name, index=False)