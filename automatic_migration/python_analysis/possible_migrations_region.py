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



def amount_of_migrations(df, instance, product):

    df = prepare_timestamps(df)
    df = df.groupby('AvailabilityZone', group_keys=False).apply(first_last).reset_index()

    df['Region'] = df['AvailabilityZone'].str[:-1]

    df_groups = df.groupby(['Region', 'AvailabilityZone', 'Year', 'Month', 'Day'])

    df_meanDay = df_groups['SpotPrice'].agg('mean')

    df_meanDay = df_meanDay.reset_index()
    df_old = df_meanDay.copy()


    df_min = df_meanDay.loc[df_meanDay.groupby(['Region', 'Year', 'Month', 'Day'])['SpotPrice'].idxmin()].reset_index()
    df_min = df_min.reset_index()

    migration_possibilites = df_min.groupby('Region')

    for name, group in migration_possibilites:
        flag = 1
        migration = 0
        zone = ''

        for x in group.AvailabilityZone:
            if(flag == 1):
                df_tmp = df_old[df_old['AvailabilityZone'] == x]
                flag = 0
                zone = x
            if(x != zone):
                zone = x
                migration = migration + 1

        tmp_group = df_tmp.groupby(['Region'])
        sum_old = tmp_group['SpotPrice'].sum().reset_index()['SpotPrice'][0]
        sum_new = group.SpotPrice.sum()

        diff = sum_old - sum_new
        len_new = len(group)
        len_old = len(df_tmp)

        with open('possible_migrations_region.csv', 'a') as f:
            f.write('%s, %s, %s, %s, %s, %s, %s, %s, %s\n' % (instance, product, name, migration, sum_old, len_old, sum_new, len_new, diff))

def main():

    df_instances = pd.read_csv('spots_activity.csv', low_memory=False)
    df_instances = df_instances.drop(['AvailabilityZone', 'PriceChanges', 'min', 'max'], axis=1)
    df_instances = df_instances.drop_duplicates()

    with open('possible_migrations_region.csv', 'a') as f:
        f.write('%s, %s, %s, %s, %s, %s, %s, %s, %s\n' % ('Instance', 'Product/Description', 'Region', 'Migrations', 'SumStartingInstance', 'DaysStartingInstance', 'SumMigrations', 'DaysMigrations', 'Difference'))

    for ind in df_instances.index:

        #start = time.time()
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
            amount_of_migrations(df_start, instanceType, productDescription)
            #end = time.time()

            #print('Elapsed Time:', end-start)


if __name__ == "__main__":
    main()
