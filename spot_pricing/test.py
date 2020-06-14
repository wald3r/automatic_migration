import pandas as pd
import os

df = pd.read_csv(os.getcwd()+'/pricing_history/t2.micro', sep=',')

df_group = df.groupby(['AvailabilityZone'])

for x, y in df_group:
    if(x == 'ap-south-1b'):
        print(x)
        print(y.to_string())