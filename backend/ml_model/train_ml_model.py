import pandas as pd
from generate_training_data import GenerateTrainingData
from ml_model import MLModel
import sys
import os

def mark_trained_spots(instance_type, product_description):

    path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
    filepath = path + '/spot_pricing/pricing_history/' + instance_type
    df = pd.read_csv(filepath, sep=',')
    df1 = df[df['InstanceType'] == instance_type]
    df1 = df1[df1['ProductDescription'] == product_description]

    df2 = df[df['InstanceType'] != instance_type]
    df2 = df2[df2['ProductDescription'] != product_description]

    df1['Training'] = 1
    df = pd.concat([df1, df2])
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

    if (len(sys.argv) != 3):
        print("Two Arguments needed! How to: python3 train_ml_model.py <instanceType> <productDescription>")
        exit(0)

    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])

    epochs = 1
    ticks = 15
    batch_size = 32
    shape = 1
    test_size = 24

    gen = GenerateTrainingData('training_data_v2.csv')


    if(gen.generate(instance_type, product_description, 0)):

        df = pd.read_csv('training_data_v2.csv', sep=',')

        zones = df['AvailabilityZone'].drop_duplicates().values

        for x in zones:
            try:
                print('Train AvailabilityZone: ' + str(x))
                rep_product_description = replace_name(product_description)
                architecture_name = instance_type + '_' + rep_product_description + '_' + str(x) + '_architecture.json'
                weights_name = instance_type + '_' + rep_product_description + '_'+ str(x) + '_weights.h5'


                mlobj = MLModel(weights_name, architecture_name, shape, ticks, epochs, batch_size, test_size, ticks, instance_type, rep_product_description)
                model = mlobj.getModel()

                model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])


                training_features, labels, scaler = mlobj.generate_training_data(df, x)
                model = mlobj.train(model, training_features, labels)
                mlobj.save_model(model)

            except:
                print('Skip AvailabilityZone:' +str(x))


        print('Trained:', instance_type, product_description)
        with open('trained.csv', 'a') as f:
            f.write("%s, %s\n" % (instance_type, product_description))

        #mark_trained_spots(instance_type, product_description)





if __name__ == "__main__":
    main()
