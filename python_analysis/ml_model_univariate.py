import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import numpy as np
from keras.models import Sequential, model_from_json
from keras.layers import Dense
from keras.layers import LSTM
from keras.layers import Dropout
import matplotlib.pyplot as plt
from keras.losses import MeanSquaredError
from keras.losses import MeanAbsoluteError
from keras.losses import MeanAbsolutePercentageError

availability_zone = 14
epochs10 = 10
epochs100 = 100
epochs500 = 500
epochs750 = 750
epochs1000 = 1000
architecture_name='model_architecture.json'
weights_name = 'model_weights.h5'
days = 1
batch_size = 24

def generate_training_data(df):

    df_tmp = df[df['AvailabilityZone'] == availability_zone]
    df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)

    df_tmp = df_tmp.head(len(df_tmp)-30)

    scaler = MinMaxScaler(feature_range=(0, 1))

    scaled_data = scaler.fit_transform(df_tmp.iloc[:, 7:8].values)



    features_set = []
    labels = []
    for i in range(days, len(scaled_data)):
        features_set.append(scaled_data[i - days:i, 0])
        labels.append(scaled_data[i, 0])

    features_set, labels = np.array(features_set), np.array(labels)


    return (np.reshape(features_set, (features_set.shape[0], features_set.shape[1], 1)), labels, scaler)



def generate_test_data(df, scaler):

    df = df[df['AvailabilityZone'] == availability_zone]
    df = df.drop(['Unnamed: 0'], axis=1)

    df_tmp = df.tail(30)

    df_total = df['sum']

    test_data = df_total[len(df_total) - len(df_tmp) - days:].values
    test_data = test_data.reshape(-1, 1)

    test_data = scaler.transform(test_data)

    test_features = []
    for i in range(days, len(test_data)):
        test_features.append(test_data[i - days:i, 0])

    test_features = np.array(test_features)
    test_features = np.reshape(test_features, (test_features.shape[0], test_features.shape[1], 1))


    return test_features, df_tmp.iloc[:, 7:8].values

def print_errors(predictions, test_data, epochs):

    mse = MeanSquaredError()
    mse_outcome = mse(predictions, test_data).numpy()

    mae = MeanAbsoluteError()
    mae_outcome = mae(predictions, test_data).numpy()

    mape = MeanAbsolutePercentageError()
    mape_outcome = mape(predictions, test_data).numpy()

    print(epochs, mse_outcome, mae_outcome, mape_outcome)

def plot_all(predictions, test_data, epochs):

    plt.plot(test_data, color='blue', label='Actual EC2 Price')
    plt.plot(predictions, color='red', label='Predicted EC2 Price')
    plt.title('EC2 Price Prediction - ' + str(epochs) + ' Epochs')
    plt.xlabel('Date')
    plt.ylabel('EC2 Price')
    plt.legend()
    plt.show()

def save_model(model):

    model.save_weights(weights_name)
    with open(architecture_name, 'w') as f:
        f.write(model.to_json())

    print('Model saved!')


def load_model():

    try:
        with open(architecture_name, 'r') as f:
            model = model_from_json(f.read())

        model.load_weights(weights_name)
        print('Model loaded')
        return model
    except:
        print('No model can be found')
        return None

def create_model(training_features):

    print('Create ml model')
    model = Sequential()

    model.add(LSTM(units=32, return_sequences=True, input_shape=(training_features.shape[1], training_features.shape[2])))
    model.add(Dropout(0.2))

    model.add(LSTM(units=32))
    model.add(Dropout(0.2))

    model.add(Dense(units=1))

    return model




def train_and_predict(model, training_features, test_features, labels, epochs, scaler):

    model.fit(training_features, labels, epochs=epochs, batch_size=batch_size)
    predictions = model.predict(test_features)
    predictions = scaler.inverse_transform(predictions)

    return (predictions, model)


def main():

    df = pd.read_csv('training_data_v2.csv', sep=',')

    training_features, labels, scaler = generate_training_data(df)
    test_features, test_data = generate_test_data(df, scaler)

    model = load_model()
    if(model == None):
        model = create_model(training_features)


    model.compile(optimizer='adam', loss='mean_squared_error', metrics=['accuracy'])

    predictions10, model = train_and_predict(model, training_features, test_features, labels, epochs10, scaler)
    predictions250, model = train_and_predict(model, training_features, test_features, labels, 250, scaler)
    #predictions500, model = train_and_predict(model, training_features, test_features, labels, epochs500-epochs100, scaler)
    #predictions750, model = train_and_predict(model, training_features, test_features, labels, epochs750-epochs500, scaler)
    #predictions1000, model = train_and_predict(model, training_features, test_features, labels, epochs1000-epochs750, scaler)

    #predictions750, model = train_and_predict(model, training_features, test_features, labels, epochs750, scaler)


    print_errors(predictions10, test_data, 10)
    print_errors(predictions250, test_data, 250)
    #print_errors(predictions500, test_data, 500)
    #print_errors(predictions750, test_data, 750)
    #print_errors(predictions1000, test_data, 1000)
    #save_model(model)

    print(sum(predictions250))
    print(sum(test_data))
    plot_all(predictions250, test_data, 250)





if __name__ == "__main__":
    main()
