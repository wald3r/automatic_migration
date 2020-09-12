
import pandas as pd
import os
import time

class GenerateTrainingData(object):

    def __init__(self, file_name):
        self.file_name = file_name

    def prepare_timestamps(self, df):

        df['Timestamp'] = pd.to_datetime(df['Timestamp'])
        df = df.drop_duplicates(subset=['Timestamp', 'AvailabilityZone'])

        df = df.set_index("Timestamp")

        df = df.groupby("AvailabilityZone")
        df = df.resample('H').pad()
        df = df.reset_index(level=0, drop=True)
        df = df.reset_index()

        df['Timestamp'] = df['Timestamp'].dt.strftime('%Y-%m-%d-%H:%M:%S')
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

    def first_last(self, df):
        return df.iloc[1:-1]

    def first(self, df):
        return df.iloc[1:]

    def generate(self, instance_type, product_description):

        try:
            start = time.time()
            df_start = pd.DataFrame()

            chunksize = 10 ** 6

            path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
            filepath = path + '/backend/spot_pricing/pricing_history/'+instance_type
            for chunk in pd.read_csv(filepath, sep=',', chunksize=chunksize):
                df = chunk[chunk['InstanceType'] == instance_type]
                df = df[df['ProductDescription'] == product_description]
                if(0 == len(df)):
                    print('Error: Invalid product description!')
                    raise Exception()
                df = df.drop(['InstanceType'], axis=1)
                df = df.drop(['ProductDescription'], axis=1)

                df_start = pd.concat([df_start, df])


            df_stamps = self.prepare_timestamps(df_start)
            #df_stamps['AvailabilityZone'] = df_stamps['AvailabilityZone'].replace(self.mapping)
            df_stamps = df_stamps.groupby('AvailabilityZone', group_keys=False).apply(self.first).reset_index(drop=True)
            #df_grouped = df_grouped_day.groupby('AvailabilityZone', group_keys=False).apply(self.first_last).reset_index(drop=True)


            #df_grouped_day = df_stamps.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg(['mean', 'min', 'max', 'sum', 'count', 'mad', 'median']).reset_index()
            #df_grouped = df_grouped_day.groupby('AvailabilityZone', group_keys=False).apply(self.first_last).reset_index(drop=True)
            df_stamps.to_csv(self.file_name, header=True)

            #df_grouped.to_csv(self.file_name, header=True)
            end= time.time()
            print('Elapsed time:', end-start)
            return 1
        except:
            print('Error: Could not generate training data!')
            return 0