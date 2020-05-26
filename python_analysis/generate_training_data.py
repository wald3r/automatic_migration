
import pandas as pd
import time

def prepare_timestamps(df):

    df['Timestamp'] = pd.to_datetime(df['Timestamp'])

    df = df.drop_duplicates(subset=['Timestamp', 'AvailabilityZone'])

    df = df.set_index("Timestamp")

    df = df.groupby("AvailabilityZone")
    df = df.resample('H').pad()

    df = df.reset_index(level=0, drop=True)
    df = df.reset_index()

    df['Timestamp'] = df['Timestamp'].dt.strftime('%Y-%m-%d-%r')

    df_split1 = df['Timestamp'].str.split('-', expand=True)
    df_split1 = df_split1.rename(columns={0: 'Year', 1: 'Month'})

    df_split2 = df_split1[2].str.split(' ', expand=True)
    df_split2 = df_split2.rename(columns={0: 'Day'})

    df_split3 = df_split1[3].str.split(':', expand=True)
    df_split3 = df_split3.rename(columns={0: 'Hour'})

    df_YearMonth = df_split1.drop([2, 3], axis=1)
    df_Day = df_split2
    df_Hour = df_split3.drop([1, 2], axis=1)

    df = df.drop(['Timestamp'], axis=1)

    df = df.merge(df_YearMonth, left_index=True, right_index=True)
    df = df.merge(df_Day, left_index=True, right_index=True)
    df = df.merge(df_Hour, left_index=True, right_index=True)

    return df

def first_last(df):
    return df.iloc[1:-1]

def main():

    start = time.time()

    df_instances = pd.read_csv('spots_activity.csv', low_memory=False)
    df_instances = df_instances.drop(['AvailabilityZone', 'PriceChanges', 'min', 'max'], axis=1)
    df_instances = df_instances.drop_duplicates().reset_index()

    flag = 1

    for ind in df_instances.index:

        instanceType = df_instances['InstanceType'][ind]
        productDescription = df_instances['ProductDescription'][ind]

        df_start = pd.DataFrame()

        chunksize = 10 ** 6
        for chunk in pd.read_csv('aws_spot_pricing.csv', sep=',', chunksize=chunksize):
            df = chunk[chunk['InstanceType'] == instanceType]
            df = df[df['ProductDescription'] == productDescription]
            df = df.drop(['InstanceType'], axis=1)
            df = df.drop(['ProductDescription'], axis=1)

            df_start = pd.concat([df_start, df])


        df_stamps = prepare_timestamps(df_start)
        df_grouped = df_stamps.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg('sum').reset_index()
        df_grouped = df_grouped.groupby('AvailabilityZone', group_keys=False).apply(first_last).reset_index(drop=True)
        df_grouped['InstanceType'] = instanceType
        df_grouped['ProductDescription'] = productDescription

        if(flag == 1):
            flag = 0
            df_grouped.to_csv('training_data_v1.csv', mode='a', header=True)

        else:
            df_grouped.to_csv('training_data_v1.csv', mode='a', header=False)

        print(df_grouped)


    end = time.time()
    print('Time elapsed:', end-start)

if __name__ == "__main__":
    main()
