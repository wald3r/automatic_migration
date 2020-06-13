import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np
from generate_training_data import GenerateTrainingData
from ml_model import MLModel

epochs=500
architecture_name='model_architecture_multivariate.json'
weights_name = 'model_weights_multivariate_multivariate.h5'
days = 30
batch_size = 32
shape = 2

def generate_training_data(df, availability_zone):

    df_tmp = df[df['AvailabilityZone'] == availability_zone]
    df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)


    #df_tmp = df_tmp[['AvailabilityZone', 'mean', 'min', 'max', 'mad', 'median', 'sum']]
    #df_tmp = df_tmp[['AvailabilityZone','sum']]
    df_tmp = df_tmp[['AvailabilityZone','SpotPrice']]

    df_tmp = df_tmp.head(len(df_tmp)-48)
    scaler = MinMaxScaler(feature_range=(0, 1))

    scaled_data = scaler.fit_transform(df_tmp.values)

    features_set = []
    labels = []

    for i in range(days, len(scaled_data)):
        features_set.append(scaled_data[i - days:i])
        labels.append(scaled_data[i])

    features_set, labels = np.array(features_set), np.array(labels)

    return (np.reshape(features_set, (features_set.shape[0], features_set.shape[2], features_set.shape[1])), labels, scaler)


def main():

    gen = GenerateTrainingData('training_data_v2.csv')

    df_instances = pd.read_csv('spots_activity_test.csv', low_memory=False)
    df_instances = df_instances.drop(['AvailabilityZone', 'PriceChanges', 'min', 'max'], axis=1)
    df_instances = df_instances.drop_duplicates().reset_index(drop=True)

    #try:
    #    df_already_begun = pd.read_csv('already_trained.csv', sep=',')
    #    start = len(df_already_begun.index)
    #    df_instances = df_instances[start:]
    #    print('File already exists!')
    #except:
    #    print('File does not exist yet!')

    for ind in df_instances.index:

        instanceType = df_instances['InstanceType'][ind]
        productDescription = df_instances['ProductDescription'][ind]
        if(gen.generate(instanceType, productDescription)):

            df = pd.read_csv('training_data_v2.csv', sep=',')
            #df['Instance'] = ind

            mlobj = MLModel(weights_name, architecture_name, shape, days, epochs, batch_size)
            model = mlobj.getModel()

            model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])

            zones = df['AvailabilityZone'].drop_duplicates().values

            for x in [42]:
                try:
                    training_features, labels, scaler = generate_training_data(df, x)
                    print('Train AvailabilityZone:' + str(x))
                    model = mlobj.train(model, training_features, labels)
                except:
                    print('Skip AvailabilityZone:' +str(x))

            mlobj.save_model(model)
            with open('already_trained.csv', 'a') as f:
                print('Trained:', instanceType, productDescription)
                f.write("%s, %s, %s\n" % (instanceType, productDescription, len(zones)))





if __name__ == "__main__":
    main()
