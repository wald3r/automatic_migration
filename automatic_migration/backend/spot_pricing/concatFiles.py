import os
import pandas as pd


df = pd.read_csv('aws_spot_pricing.csv', delimiter=',')





for y in [1, 2, 3]:

    path = os.getcwd()
    path = path + '/'+str(y)+'/'
    files = os.listdir((path))
    print(y)
    for x in files:
        df_tmp = pd.read_csv(path+'/'+x, delimiter=',')
        df = pd.concat([df_tmp, df])
        df = df.reset_index(drop=True)
        df = df.drop_duplicates()
        print(x)


df.to_csv('aws_spot_pricing_1', index=False)
exit(0)