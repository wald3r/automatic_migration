
import pandas as pd
import os

class GenerateTrainingData(object):

    def __init__(self, file_name):
        self.file_name = file_name


    mapping = {'us-east-1b': 0, 'us-east-1a': 1, 'us-east-1f': 2, 'us-east-1c': 3, 'us-west-2a': 4,
           'us-west-2c': 5, 'us-west-2b': 6, 'eu-central-1b': 7, 'eu-central-1a': 8, 'eu-west-2a': 9,
           'eu-west-2b': 10, 'ap-southeast-1b': 11, 'ap-southeast-1a': 12, 'ca-central-1b': 13,
           'us-east-2b': 14, 'us-east-2a': 15, 'ap-northeast-1c': 16, 'ap-northeast-1a': 17,
           'ap-southeast-2a': 18, 'ap-northeast-2c': 19, 'ap-northeast-2a': 20, 'eu-west-1b': 21,
           'eu-west-1a': 22, 'ap-southeast-2b': 23, 'us-east-1d': 24, 'eu-west-1c': 25, 'us-west-1c': 26,
           'us-west-1a': 27, 'us-east-2c': 28, 'us-east-1e': 29, 'sa-east-1c': 30,
           'sa-east-1b': 31, 'sa-east-1a': 32, 'eu-west-2c': 33, 'eu-central-1c': 34, 'ca-central-1a': 35,
           'ap-southeast-2c': 36, 'ap-southeast-1c': 37, 'ap-south-1c': 38, 'ap-south-1b': 39,
           'ap-south-1a': 40, 'ap-northeast-2b': 41, 'ap-northeast-1d': 42, 'ap-northeast-1b': 43, 'us-west-1b': 44}

    def prepare_timestamps(self, df):

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

    def first_last(self, df):
        return df.iloc[1:-1]


    def generate(self, instance_type, product_description):

        try:
            df_start = pd.DataFrame()

            chunksize = 10 ** 6

            path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
            filepath = path + 'spot_pricing/pricing_history/'+instance_type
            for chunk in pd.read_csv(filepath, sep=',', chunksize=chunksize):

                df = chunk[chunk['InstanceType'] == instance_type]
                df = df[df['ProductDescription'] == product_description]
                df = df.drop(['InstanceType'], axis=1)
                df = df.drop(['ProductDescription'], axis=1)
                df = df[df['Training'] == 0]

                df_start = pd.concat([df_start, df])



            df_stamps = self.prepare_timestamps(df_start)
            df_stamps['AvailabilityZone'] = df_stamps['AvailabilityZone'].replace(self.mapping)

            #df_grouped_day = df_stamps.groupby(['AvailabilityZone', 'Year', 'Month', 'Day'])['SpotPrice'].agg(['mean', 'min', 'max', 'sum', 'count', 'mad', 'median']).reset_index()
            #df_grouped = df_grouped_day.groupby('AvailabilityZone', group_keys=False).apply(self.first_last).reset_index(drop=True)
            df_stamps.to_csv(self.file_name, header=True)

            #df_grouped.to_csv(self.file_name, header=True)

            return 1
        except:

            return 0