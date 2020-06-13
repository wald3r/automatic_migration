
from ml_model import MLModel
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from generate_training_data import GenerateTrainingData
from keras.losses import MeanSquaredError
from keras.losses import MeanAbsoluteError
from keras.losses import MeanAbsolutePercentageError
from sklearn.preprocessing import MinMaxScaler


epochs=500
architecture_name='model_architecture_multivariate.json'
weights_name = 'model_weights_multivariate_multivariate.h5'
days = 30
batch_size = 32
shape = 2

def generate_training_data(df, availability_zone):

    df_tmp = df[df['AvailabilityZone'] == availability_zone]
    df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)

    #df_tmp = df_tmp[['AvailabilityZone', 'mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
    #df_tmp = df_tmp[['AvailabilityZone', 'sum']]
    df_tmp = df_tmp[['AvailabilityZone', 'SpotPrice']]

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


def generate_test_data(df, scaler, availability_zone):

    df = df[df['AvailabilityZone'] == availability_zone]
    df = df.drop(['Unnamed: 0'], axis=1)#

    #df_tmp = df[['AvailabilityZone','mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
    #df_tmp = df[['AvailabilityZone', 'sum']]
    df_tmp = df[['AvailabilityZone', 'SpotPrice']]

    df_tmp = df_tmp.tail(48)


    #df_total = df[['AvailabilityZone','mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
    #df_total = df[['AvailabilityZone', 'sum']]
    df_total = df[['AvailabilityZone', 'SpotPrice']]


    test_data = df_total[len(df_total) - len(df_tmp) - days:].values
    test_data = scaler.transform(test_data)

    test_features = []
    for i in range(days, len(test_data)):
        test_features.append(test_data[i - days:i])

    test_features = np.array(test_features)
    test_features = np.reshape(test_features, (test_features.shape[0], test_features.shape[2], test_features.shape[1]))

    return test_features, df_tmp.values


def getErrors(predictions, test_data):

    mse = MeanSquaredError()
    mse_outcome = mse(np.insert(predictions, 0, batch_size, axis=0), np.insert(test_data, 0, batch_size, axis=0)).numpy()

    mae = MeanAbsoluteError()
    mae_outcome = mae(np.insert(predictions, 0, batch_size, axis=0), np.insert(test_data, 0, batch_size, axis=0)).numpy()

    mape = MeanAbsolutePercentageError()
    mape_outcome = mape(np.insert(predictions, 0, batch_size, axis=0), np.insert(test_data, 0, batch_size, axis=0)).numpy()

    print(epochs, mse_outcome, mae_outcome, mape_outcome)
    return(mse_outcome, mae_outcome, mape_outcome)

def plot_all(predictions, test_data):

    plt.plot(test_data, color='blue', label='Actual EC2 Price')
    plt.plot(predictions, color='red', label='Predicted EC2 Price')
    plt.title('EC2 Price Prediction - ' + str(epochs) + ' Epochs')
    plt.xlabel('Date')
    plt.ylabel('EC2 Price')
    plt.legend()
    plt.show()


def getIndex(instance, description):

    df_instances = pd.read_csv('spots_activity_test.csv', low_memory=False)
    df_instances = df_instances.drop_duplicates().reset_index(drop=True)

    df_instances = df_instances[df_instances['InstanceType'] == instance]
    df_instances = df_instances[df_instances['ProductDescription'] == description]

    return(df_instances.index[0])


def main():

    mlobj = MLModel(weights_name, architecture_name, shape, days, epochs, batch_size)
    model = mlobj.load_model()
    model.compile(optimizer='RMSprop', loss='mean_squared_error', metrics=['accuracy'])

    instance_type = 'm4.16xlarge'
    product_description = 'Linux/UNIX'

    #gen = GenerateTrainingData('training_data_v3.csv')
    #gen.generate(instance_type, product_description)

    df = pd.read_csv('training_data_v2.csv', sep=',')

    #df['Instance'] = getIndex(instance_type, product_description)
    zones = df['AvailabilityZone'].drop_duplicates().values

    for x in [42]:
        try:
            training_features, labels, scaler = generate_training_data(df, x)
            test_features, test_data = generate_test_data(df, scaler, x)

            predictions, model = mlobj.predict(model, test_features, scaler)

            column = 1

            mse_outcome, mae_outcome, mape_outcome = getErrors(predictions[:,column], test_data[:,column])

            sum_test = sum(predictions[:,column])
            sum_prediction = sum(test_data[:,column])

            print(sum(predictions[:,column]))
            print(sum(test_data[:,column]))
            print(sum_prediction - sum_test)
            print('------------------')

            with open('predictions.csv', 'a') as f:
                f.write("%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s\n" % (instance_type, product_description, x, epochs, days, batch_size, mse_outcome, mae_outcome, mape_outcome, sum_test, sum_prediction, sum_test-sum_prediction))

            print(predictions[:, column])
            print(test_data[:, column])
            plot_all(predictions[:, column], test_data[:, column])

        except:
            print('Skip', str(x))



if __name__ == "__main__":
    main()
