import pandas as pd

df = pd.read_csv('training_data_v2.csv', sep=',')

df_tmp = df[df['AvailabilityZone'] == 0]
df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)

df_tmp = df_tmp.drop(df_tmp[(df_tmp.Year == 2020) & (df_tmp.Month == 4)].index)

df_tmp = df_tmp[['mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]


print(df_tmp.head(31).to_string())
features_set = []
labels = []
for i in range(30, len(df_tmp.values)):
    features_set.append(df_tmp.values[i - 30:i])
    labels.append(df_tmp.values[i])

print(features_set[0])
print(len(features_set[0]))
print(labels[0])
print(len(labels[0]))
#print(labels)





