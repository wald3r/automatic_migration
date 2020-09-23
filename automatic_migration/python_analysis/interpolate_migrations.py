
import pandas as pd
import sys




def main():

    if(len(sys.argv) != 2):
        print('Number of arguments are not correct!')
        exit(1)

    fileName = str(sys.argv[1])
    df = pd.read_csv(fileName, sep=',')

    df.loc[(df[' MigrationsMin'] == 0), ' Difference'] = 0
    df = df[df[' Difference'] >= 0]

    df = df.sort_values(by=' Difference', ascending=False).reset_index(drop=True)

    df.to_csv('interpolated_'+fileName)

if __name__ == "__main__":
    main()
