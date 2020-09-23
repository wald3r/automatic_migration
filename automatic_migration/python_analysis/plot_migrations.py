import pandas as pd
import matplotlib.pyplot as plt
import sys

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



def getPrice(df_new, df_startZone, indx):
    year = df_new['Year'][indx]
    month = df_new['Month'][indx]
    day = df_new['Day'][indx]
    filter1 = df_startZone["Year"] == year
    filter2 = df_startZone['Month'] == month
    filter3 = df_startZone['Day'] == day
    return df_startZone.where(filter1 & filter2 & filter3).dropna().reset_index(drop=True)

def get_dataframes(df):

    df = prepare_timestamps(df)

    df_old = df.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg('sum').reset_index()
    df_old = df_old.groupby('AvailabilityZone', group_keys=False).apply(first_last).reset_index()

    print(df_old.to_string())

    df_new = df_old.loc[df_old.groupby(['Year', 'Month', 'Day'])['SpotPrice'].idxmin()].reset_index(drop=True)

    start_zone = df_new['AvailabilityZone'][0]
    df_startZone = df_old[df_old['AvailabilityZone'] == start_zone].reset_index(drop=True)



    list = []

    for indx in df_new.index:

        if (df_new['AvailabilityZone'][indx] != start_zone):
            start_zone = df_new['AvailabilityZone'][indx]
            list.append(indx)

    return (df_new, df_startZone, list)



def plot(migrations, start, list, instance, product):

    plt.plot(migrations['SpotPrice'], color='green')
    plt.plot(start['SpotPrice'], color='red')
    plt.legend(['With Migrations', 'No Migrations'])

   # for xc in list:
   #     plt.axvline(x=xc)

    plt.xlabel('Days')
    plt.ylabel('SpotPrice')
    plt.title(instance+' - '+product)
    plt.show()

def main():

        if(len(sys.argv) != 2):
            print('Wrong number of arguments!')
            exit(1)


        product_list = ['Red Hat Enterprise Linux', 'SUSE Linux', 'Linux/UNIX', 'Windows']

        print('1: Red Hat Enterprise Linux')
        print('2: SUSE Linux')
        print('3: Linux/UNIX')
        print('4: Windows')

        number = 0
        while(1):
            try:
                number = int(input("Choose Product/Description: "))
                if(number == 1 or number == 2 or number == 3 or number == 4):
                    break
                else:
                    print('Not possible. Try again.')
            except:
                print('Not possible. Try again.')


        print('Start plotting...')
        instanceType = str(sys.argv[1])
        productDescription = product_list[number-1]

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
            df_migration, df_start, list = get_dataframes(df_start)

            print(df_start.to_string())
            print(df_migration.to_string())
            print(list)

            plot(df_migration, df_start, list, instanceType, productDescription)


if __name__ == "__main__":
    main()
