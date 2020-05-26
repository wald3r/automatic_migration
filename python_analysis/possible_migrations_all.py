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


def amount_of_migrations(df):

    df = prepare_timestamps(df)

    df_old = df.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg('sum').reset_index()
    df_old = df_old.groupby('AvailabilityZone', group_keys=False).apply(first_last).reset_index()


    df_new = df_old.loc[df_old.groupby(['Year', 'Month', 'Day'])['SpotPrice'].idxmin()].reset_index()


    start_zone = df_new['AvailabilityZone'][0]
    df_startZone = df_old[df_old['AvailabilityZone'] == start_zone].reset_index()


    bidprice = df_startZone['SpotPrice'][0] * 1.5

    #df_startZone_sum = df_startZone['SpotPrice'].sum()


    migrations = 0
    sum_new = 0
    sum_old = 0
    days = 0
    flag_old = 0
    flag_new = 0

    for indx in df_new.index:
        if(days >= len(df_startZone.index)):
            break

        if(df_startZone['SpotPrice'][indx] > bidprice):
            flag_old = flag_old + 1


        if(df_new['SpotPrice'][indx] > bidprice):
            flag_new = flag_new + 1

        if(df_new['AvailabilityZone'][indx] != start_zone):
            start_zone = df_new['AvailabilityZone'][indx]
            migrations = migrations + 1

        days = days + 1
        sum_old = sum_old + df_startZone['SpotPrice'][indx]
        sum_new = sum_new + df_new['SpotPrice'][indx]

    old_price = sum_old
    new_price = sum_new
    migrations = migrations
    saved = old_price - new_price


    return (old_price, days, new_price, saved, migrations, flag_old, flag_new)


def main():

    start = time.time()

    df_instances = pd.read_csv('spots_activity.csv', low_memory=False)
    df_instances = df_instances.drop(['AvailabilityZone', 'PriceChanges', 'min', 'max'], axis=1)
    df_instances = df_instances.drop_duplicates().reset_index()

    with open('possible_migrations_all_v3.csv', 'a') as f:
        f.write("%s, %s, %s, %s, %s, %s, %s, %s, %s\n" % ('Instance', 'Product/Description', 'Migrations', 'Days', 'SumStartingInstance', 'SumMigrations', 'BidPriceStart', 'BidPriceMigrations', 'Difference'))

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

        if df_start.empty:
            pass

        else:
            old_price, days, new_price, saved, migrations, bidprice_old, bidprice_new = amount_of_migrations(df_start)

            with open('possible_migrations_all_v3.csv', 'a') as f:
                f.write("%s, %s, %s, %s, %s, %s, %s, %s, %s\n" % (instanceType, productDescription, migrations, days, old_price, new_price, bidprice_old, bidprice_new, saved))

            print(instanceType, productDescription, migrations, days, old_price, new_price, bidprice_old, bidprice_new, saved)

    end = time.time()
    print('Elapsed time:', end - start, 'seconds')




if __name__ == "__main__":
    main()
