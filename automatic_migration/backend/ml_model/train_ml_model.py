import pandas as pd
from generate_training_data import GenerateTrainingData
from ml_model import MLModel
import sys
import os

def mark_trained_spots(instance_type, product_description, region):

    path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
    filepath = path + '/backend/spot_pricing/pricing_history/' + instance_type

    df = pd.read_csv(filepath, sep=',')
    df1 = df[df['InstanceType'] == instance_type]
    df1 = df1[df1['ProductDescription'] == product_description]
    if(region != 'worldwide'):
        df1 = df1[df1['AvailabilityZone'].str.contains(region)]

    df1['Training'] = 1
    df.update(df1)
    df.to_csv(filepath, index=False)


def replace_name(name):

    if(name == 'Linux/UNIX'):
        return 'Linux-Unix'

    if(name == 'Red Hat Enterprise Linux'):
        return 'RedHat'

    if(name == 'SUSE Linux'):
        return 'Linux-Suse'

    return name

def main():

    if (len(sys.argv) != 5):
        print("Four Arguments needed! How to: python3 train_ml_model.py <instanceType> <productDescription> <region> <test run = 1 or actual run = 2>")
        exit(0)

    version = int(sys.argv[4])

    if(version != 1 and version != 2):
        print("Last argument has to be 1 or 2")
        exit(0)

    region = str(sys.argv[3])
    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])

    gen = GenerateTrainingData('training_data_v2.csv')


    if(gen.generate(instance_type, product_description)):

        df = pd.read_csv('training_data_v2.csv', sep=',')

        zones = None
        if(region == 'worldwide'):
            #zones = df['AvailabilityZone'].drop_duplicates().values
            zones = ['ap-northeast-1a', 'eu-west-3a']
        else:
            all_zones = df['AvailabilityZone'].drop_duplicates().values
            zones = [s for s in all_zones if region in s]

        print(zones)
        for x in zones:
        #for x in ['ap-northeast-1a', 'ap-northeast-1c']:
            try:
                print('Train AvailabilityZone: ' + str(x))
                rep_product_description = replace_name(product_description)
                architecture_name = instance_type + '_' + rep_product_description + '_' + str(x) + '_architecture.json'
                weights_name = instance_type + '_' + rep_product_description + '_'+ str(x) + '_weights.h5'

                mlobj = MLModel(weights_name, architecture_name, instance_type, rep_product_description, region)
                model = mlobj.getModel()

                model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])

                training_features, labels, scaler = mlobj.generate_training_data(df, x, version, 1)

                model = mlobj.train(model, training_features, labels)

                mlobj.save_model(model)

            except:
                print('Skip AvailabilityZone:' +str(x))


        print('Trained:', instance_type, product_description)
        #with open('trained.csv', 'a') as f:
        #    f.write("%s, %s\n" % (instance_type, product_description))
        if(version == 2):
            mark_trained_spots(instance_type, product_description, region)





if __name__ == "__main__":
    main()
