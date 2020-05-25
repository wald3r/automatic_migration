
import pandas as pd





def main():

    df = pd.read_csv('possible_migrations_region.csv', sep=',')

    df_tmp = df[df[' Migrations'] == 0]
    df_tmp1 = df[df[' Migrations'] != 0]

    df_tmp[' Difference'] = 0
    df = pd.concat([df_tmp, df_tmp1])
    print(df_tmp)
    print(df_tmp1)
    print(df.to_string())

if __name__ == "__main__":
    main()
