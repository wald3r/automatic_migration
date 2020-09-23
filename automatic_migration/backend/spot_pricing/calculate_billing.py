
import sqlite3
from sqlite3 import Error
import sys
import datetime
import pytz
import os
import pandas as pd
import time
utc=pytz.UTC

def create_connection(db_file):

    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Error as e:
        print(e)

    return conn

def update_task(conn, task):

    sql = ''' UPDATE billing
              SET actualCost = ? ,
                  costNoMigration = ?,
                  updatedAt = ? 
              WHERE rowid = ?'''
    cur = conn.cursor()
    cur.execute(sql, task)

    conn.commit()



def main():

    if(len(sys.argv) != 7):
        print("Four Arguments needed! How to: python3 calculate_billing.py <instanceType> <productDescription> <currentzone> <start> <rowid> <startzone>")
        exit(0)


    start = datetime.datetime.fromtimestamp((int(sys.argv[4])-90400000)/1000.0)#utc.localize(datetime.datetime(2020, 8, 1, 2))
    product = str(sys.argv[2])
    instance = str(sys.argv[1])
    zone = str(sys.argv[3])
    rowid = str(sys.argv[5])
    startzone = str(sys.argv[6])

    path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
    filepath = path + '/backend/spot_pricing/pricing_history/' + instance

    df = pd.read_csv(filepath, delimiter = ',')

    #start zone
    df_start = df[df['AvailabilityZone'] == startzone]
    df_start = df_start[df_start['ProductDescription'] == product]

    df_last_row_start = df_start.tail(1)
    df_start = df_start.append(
        {'SpotPrice': df_last_row_start.SpotPrice.values[0], 'AvailabilityZone': df_last_row_start.AvailabilityZone.values[0], 'InstanceType': df_last_row_start.InstanceType.values[0],
         'ProductDescription': df_last_row_start.ProductDescription.values[0], 'Timestamp': datetime.datetime.now(), 'Training': 0}, ignore_index=True)

    df_start['Timestamp'] = pd.to_datetime(df_start['Timestamp'])

    df_start = df_start.drop_duplicates(subset=['Timestamp'])
    df_start = df_start.set_index('Timestamp')
    df_start = df_start.resample('H').pad()
    df_start = df_start.reset_index()

    df_start = df_start.loc[(df_start.Timestamp >= utc.localize(start))]
    df_start = df_start.loc[(df_start.Timestamp <= utc.localize(datetime.datetime.today()))]
    sum_start = df_start.groupby('AvailabilityZone')['SpotPrice'].agg(['sum'])

    #current zone
    df = df[df['AvailabilityZone'] == zone]
    df = df[df['ProductDescription'] == product]


    df_last_row = df.tail(1)
    df = df.append(
       {'SpotPrice': df_last_row.SpotPrice.values[0], 'AvailabilityZone': df_last_row.AvailabilityZone.values[0], 'InstanceType': df_last_row.InstanceType.values[0],
         'ProductDescription': df_last_row.ProductDescription.values[0], 'Timestamp': datetime.datetime.now(), 'Training': 0}, ignore_index=True)

    df['Timestamp'] = pd.to_datetime(df['Timestamp'])

    df = df.drop_duplicates(subset=['Timestamp'])
    df = df.set_index('Timestamp')
    df = df.resample('H').pad()
    df = df.reset_index()

    df = df.loc[(df.Timestamp >= utc.localize(start))]
    df = df.loc[(df.Timestamp <= utc.localize(datetime.datetime.today()))]
    print(df)
    sum = df.groupby('AvailabilityZone')['SpotPrice'].agg(['sum'])

    sum = df.groupby('AvailabilityZone')['SpotPrice'].agg(['sum'])
    database = path + '/backend/devsqlite.db'
    conn = create_connection(database)
    print(round(sum_start.values[0][0], 4), startzone, len(df_start), start, datetime.datetime.today())
    print(round(sum.values[0][0], 4), zone, len(df), start, datetime.datetime.today())

    with conn:
        update_task(conn, (round(sum.values[0][0], 4), round(sum_start.values[0][0], 4),int(round(time.time() * 1000)), rowid))


if __name__ == "__main__":
    main()
