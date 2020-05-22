import pandas as pd



def load():
    return pd.read_csv('aws_spot_pricing.csv', delimiter=',')



def active_pricing(df):

    df_grouped = df.groupby(["InstanceType", "ProductDescription", "AvailabilityZone"])

    df_tmp = df_grouped['SpotPrice'].agg(['min', 'max'])

    df_minmax = pd.DataFrame(df_tmp.reset_index())
    df_minmax.set_index('InstanceType')

    list = []

    for name, group in df_grouped:
        counter = 0
        flag = 1
        tmp = 0
        for x in group.SpotPrice:
            if(flag == 1):
                tmp = x
                flag = 0

            if(tmp != x):
                tmp = x
                counter = counter + 1
        list.append([name[0], name[1], name[2], counter])

    df_activity = pd.DataFrame(list, columns = ["InstanceType", "ProductDescription", "AvailabilityZone", 'PriceChanges'])
    df_activity.set_index('InstanceType')
    df_final = df_activity.merge(df_minmax)

    df_final = df_final.sort_values(by=['PriceChanges'])
    #df_final.to_csv('spots_activity.csv', index=False)

def main():

    df = load()
    active_pricing(df)
    print('File got generated!')




if __name__ == "__main__":
    main()
