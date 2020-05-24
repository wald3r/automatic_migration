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


def amount_of_migrations(df):

    df = prepare_timestamps(df)

    df_old = df.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg('sum').reset_index()
    df_old = df_old.drop(df_old[(df_old['Month'] == '03') & (df_old['Year'] == '2019')].index)


    df_new = df_old.loc[df_old.groupby(['Year', 'Month', 'Day'])['SpotPrice'].idxmin()].reset_index()

    start_zone = df_new['AvailabilityZone'][0]
    df_startZone = df_old[df_old['AvailabilityZone'] == start_zone]
    df_startZone_sum = df_startZone['SpotPrice'].sum()

    migrations = 0
    sum = 0

    for indx in df_new.index:
        if(df_new['AvailabilityZone'][indx] != start_zone):
            start_zone = df_new['AvailabilityZone'][indx]
            migrations = migrations + 1

        sum = sum + df_new['SpotPrice'][indx]

    old_price = df_startZone_sum
    new_price = sum
    migrations = migrations
    saved = old_price - new_price
    old_days = len(df_startZone.index)
    new_days = len(df_new.index)

    return (old_price, old_days, new_price, new_days, saved, migrations)


def main():

    df_instances = pd.read_csv('spots_activity.csv', low_memory=False)
    df_instances = df_instances.drop(['AvailabilityZone', 'PriceChanges', 'min', 'max'], axis=1)
    df_instances = df_instances.drop_duplicates()

    for ind in df_instances.index:

        start = time.time()

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

        if df_start.empty:
            pass

        else:
            old_price, old_days, new_price, new_days, saved, migrations = amount_of_migrations(df_start)

            with open('possible_migrations_all_1.csv', 'a') as f:
                f.write("%s, %s, %s, %s, %s, %s, %s, %s\n" % (instanceType, productDescription, old_price, old_days, new_price, new_days, saved, migrations))

            print(instanceType, productDescription, old_price, old_days, new_price, new_days, saved, migrations)

            end = time.time()
            print('Elapsed time:', end - start, 'seconds')




if __name__ == "__main__":
    main()
