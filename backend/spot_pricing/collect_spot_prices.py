import boto3
import datetime
import os
import pandas as pd
import pytz

utc=pytz.UTC

client=boto3.client('ec2', region_name='us-west-2')

instances = pd.read_csv('instances.csv', sep=',').values
regions = client.describe_regions()


token = ''

for y in instances:

    df_history = pd.read_csv('collection_history.csv', sep=',')
    filtered = df_history[df_history['instance'] == y[0]].reset_index(drop=True)
    filtered1 = df_history[df_history['instance'] != y[0]].reset_index(drop=True)
    filtered1 = filtered1.drop(columns={'Unnamed: 0'}, axis=1)

    end = utc.localize(datetime.datetime.now())

    if(filtered.empty):
        start = utc.localize(datetime.datetime(2020, 5, 1))
    else:
        start = utc.localize(datetime.datetime.strptime(filtered['end'][0], '%Y-%m-%d %H:%M:%S.%f+00:00'))

    if(start.date() != datetime.datetime.today().date()):

        print(y[0] + ' - collecting spot price history - '+str(start)+' - '+str(end))

        df = pd.DataFrame(columns=['Timestamp', 'AvailabilityZone', 'InstanceType', 'ProductDescription', 'SpotPrice'])

        for x in regions['Regions']:

            client=boto3.client('ec2', region_name=x['RegionName'])

            while(1):
                prices = client.describe_spot_price_history(StartTime=start,
                                                            EndTime=end,
                                                            NextToken=token,
                                                            InstanceTypes=[y[0]])

                token = prices['NextToken']
                print('Region:', x['RegionName'], 'Token', token)
                for z in prices['SpotPriceHistory']:
                    df.loc[len(df)] = [z['Timestamp'], z['AvailabilityZone'], z['InstanceType'], z['ProductDescription'], z['SpotPrice']]

                if(token == ''):
                    break



        df = df.loc[(df.Timestamp > start)]
        if (df.empty):
            print('Pass')
        else:
            df = df.iloc[::-1]
            df['Training'] = 0
            df = df.sort_values('Timestamp').reset_index(drop=True)
            df_groups = df.groupby(['InstanceType'])
            for name, group in df_groups:
                group.to_csv(os.getcwd() + '/pricing_history/' + name, index=False, header=False, mode='a')

            filtered1.loc[len(filtered1)] = [start, end, y[0]]
            filtered1.to_csv(os.getcwd()+'/collection_history.csv', mode='w')
            print(start, end, y)

    else:
        print('Skipped', y[0])