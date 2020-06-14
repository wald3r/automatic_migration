import pandas as pd
from generate_training_data import GenerateTrainingData
from ml_model import MLModel
import sys
import os

def mark_trained_spots(instance_type, product_description):

    path = os.path.normpath(os.getcwd() + os.sep + os.pardir)
    filepath = path + 'spot_pricing/pricing_history/' + instance_type
    df = pd.read_csv(filepath, sep=',')
    df1 = df[df['InstanceType'] == instance_type]
    df1 = df1[df1['ProductDescription'] == product_description]

    df2 = df[df['InstanceType'] != instance_type]
    df2 = df2[df2['ProductDescription'] != product_description]

    df1['Training'] = 1
    df = df1.concat(df2)
    df.to_csv(filepath, index=False)

def main():

    if (len(sys.argv) != 3):
        print("Two Arguments needed! How to: python3 train_ml_model.py <instanceType> <productDescription>")
        exit(0)

    epochs = 250
    architecture_name = 'model_architecture_multivariate.json'
    weights_name = 'model_weights_multivariate_multivariate.h5'
    ticks = 30
    batch_size = 32
    shape = 2
    test_size = 24

    gen = GenerateTrainingData('training_data_v2.csv')

    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])

    if(gen.generate(instance_type, product_description)):

        df = pd.read_csv('training_data_v2.csv', sep=',')

        mlobj = MLModel(weights_name, architecture_name, shape, ticks, epochs, batch_size, test_size, ticks)
        model = mlobj.getModel()

        model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])

        zones = df['AvailabilityZone'].drop_duplicates().values

        for x in [42]:
            try:
                training_features, labels, scaler = mlobj.generate_training_data(df, x)
                print('Train AvailabilityZone:' + str(x))
                model = mlobj.train(model, training_features, labels)
            except:
                print('Skip AvailabilityZone:' +str(x))

        mlobj.save_model(model)
        print('Trained:', instance_type, product_description)
        mark_trained_spots(instance_type, product_description)





if __name__ == "__main__":
    main()
