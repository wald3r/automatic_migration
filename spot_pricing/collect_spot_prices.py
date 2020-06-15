import boto3
import datetime
import os
import pandas as pd
import pytz

utc=pytz.UTC

client=boto3.client('ec2', region_name='us-west-2')

regions = client.describe_regions()

#df = pd.read_csv('collection_history.csv', sep=',')

#start=df.index[len(df)]['1']
start=utc.localize(datetime.datetime(2020, 5, 1))
end=utc.localize(datetime.datetime.now())

token = ''

for x in regions['Regions']:

    client=boto3.client('ec2', region_name=x['RegionName'])

    df = pd.DataFrame(columns=['Timestamp', 'AvailabilityZone', 'InstanceType', 'ProductDescription', 'SpotPrice'])

    print('Collecting spot price history from:', x['RegionName'])

    while(1):
        prices = client.describe_spot_price_history(StartTime=start,
                                                    EndTime=end,
                                                    NextToken=token)

        token = prices['NextToken']
        print('Token', token)
        for y in prices['SpotPriceHistory']:
            df.loc[len(df)] = [y['Timestamp'], y['AvailabilityZone'], y['InstanceType'], y['ProductDescription'], y['SpotPrice']]

        if(token == ''):
            break

    if(df.empty):
        pass
    else:
        #df = df.loc[(df.Timestamp > start)]
        df = df.iloc[::-1]
        df['Training'] = 0
        df_groups = df.groupby(['InstanceType'])
        for name, group in df_groups:
            group.to_csv(os.getcwd() + '/pricing_history/' + name, index=False, header=False, mode='a')

        with open(os.getcwd()+'/collection_history.csv', 'a') as f:
            print(start, end, x['RegionName'])
            f.write("%s, %s, %s\n" % (start, end, x['RegionName']))