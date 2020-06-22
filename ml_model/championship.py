import pandas as pd


df = pd.read_csv('predictions.csv', sep=',')
df.loc[df['difference'] < 0, 'difference'] *= (-1)

df1 = df[0:44]
df2 = df[44:88].reset_index(drop=True)
df3 = df[88:132].reset_index(drop=True)
df4 = df[132:176].reset_index(drop=True)
df5 = df[176:220].reset_index(drop=True)
df6 = df[220:264].reset_index(drop=True)

list_diff = []

for x in range(0,44):
    min = df1['difference'][x]
    min_id = 1

    if(min > df2['difference'][x]):
        min = df2['difference'][x]
        min_id = 2

    if (min > df3['difference'][x]):
        min = df3['difference'][x]
        min_id = 3

    if (min > df4['difference'][x]):
        min = df4['difference'][x]
        mind_id = 4

    if (min > df5['difference'][x]):
        min = df5['difference'][x]
        min_id = 5

    if (min > df6['difference'][x]):
        min = df6['difference'][x]
        min_id = 6

    list_diff.append(min_id)

list_mape = []
for x in range(0,44):
    min = df1['mape'][x]
    min_id = 1

    if(min > df2['mape'][x]):
        min = df2['mape'][x]
        min_id = 2

    if (min > df3['mape'][x]):
        min = df3['mape'][x]
        min_id = 3

    if (min > df4['mape'][x]):
        min = df4['mape'][x]
        mind_id = 4

    if (min > df5['mape'][x]):
        min = df5['mape'][x]
        min_id = 5

    if (min > df6['mape'][x]):
        min = df6['mape'][x]
        min_id = 6






    list_mape.append(min_id)


print(list_diff)
print(list_mape)

id1 = list_diff.count(1)
id2 = list_diff.count(2)
id3 = list_diff.count(3)
id4 = list_diff.count(4)
id5 = list_diff.count(5)
id6 = list_diff.count(6)

print(id1, id2, id3, id4, id5, id6)


id1 = list_mape.count(1)
id2 = list_mape.count(2)
id3 = list_mape.count(3)
id4 = list_mape.count(4)
id5 = list_mape.count(5)
id6 = list_mape.count(6)

print(id1, id2, id3, id4, id5, id6)