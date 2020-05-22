import pandas as pd



def load(name):
    return pd.read_csv(name, delimiter=',')



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

    df_groups = df.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])

    df_meanDay = df_groups['SpotPrice'].agg('mean')

    df_final = df_meanDay.reset_index()
    df_final = df_final.sort_values(by=['Year', 'Month', 'Day', 'SpotPrice'])

    df_final = df_final.groupby(['Year', 'Month', 'Day'])['AvailabilityZone', 'SpotPrice'].agg('min')
    df_final = df_final.reset_index()

    df_groups = df_final.groupby('AvailabilityZone')

    return df_groups.ngroups

def main():

    list = []

    df_instances = load('spots_activity.csv')
    df_instances = df_instances[df_instances['PriceChanges'] != 0]

    for ind in df_instances.index:
        df = load('aws_spot_pricing.csv')

        instanceType = df_instances['InstanceType'][ind]
        productDescription = df_instances['ProductDescription'][ind]

        df = df[df['InstanceType'] == instanceType]
        df = df[df['ProductDescription'] == productDescription]
        df = df.drop(['InstanceType'], axis=1)
        df = df.drop(['ProductDescription'], axis=1)

        number = amount_of_migrations(df)

        print(instanceType, productDescription, number)
        list.append([instanceType, productDescription, number])

    df_final = pd.DataFrame(list, columns=['InstanceType', 'ProductDescription', 'Migrations'])
    df_final.to_csv('possible_migrations.csv', index=False)


if __name__ == "__main__":
    main()
