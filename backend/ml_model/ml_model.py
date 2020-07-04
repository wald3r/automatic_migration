from keras.models import Sequential, model_from_json
from keras.layers import Dense
from keras.layers import LSTM
from keras.losses import MeanSquaredError
from keras.losses import MeanAbsoluteError
from keras.losses import MeanAbsolutePercentageError
from sklearn.preprocessing import MinMaxScaler
import os
import numpy as np

class MLModel(object):

    def __init__(self, weights_name, architecture_name, input_shape_1, input_shape_2, epochs, batch_size, test_size, ticks):
        self.weights_name = weights_name
        self.architecture_name = architecture_name
        self.input_shape_1 = input_shape_1
        self.input_shape_2 = input_shape_2
        self.epochs = epochs
        self.batch_size = batch_size
        self.output_shape = input_shape_1
        self.ticks = ticks
        self.test_size = test_size


    def load_model(self):

        path = os.getcwd()+'/ml_model/models/'
        try:
            with open(path+self.architecture_name, 'r') as f:
                model = model_from_json(f.read())

            model.load_weights(path+self.weights_name)
            print('Model loaded')
            return model

        except:
            print('No model can be found')
            return None


    def save_model(self, model):


        folder_name = self.architecture_name.replace('_architecture.json', '')
        path = os.getcwd()+'/ml_model/models/'+folder_name+'/'
        print(path)
        os.mkdir(path)
        model.save_weights(path+self.weights_name)
        with open(path+self.architecture_name, 'w') as f:
            f.write(model.to_json())

        print('Model saved!')


    def getModel(self):

        model = self.load_model()
        if (model == None):
            return(self.create_model())

        return model


    def predict(self, model, test_features, scaler):

        predictions = model.predict(test_features)
        predictions = scaler.inverse_transform(predictions)

        return (predictions, model)


    def train(self, model, training_features, labels):
        model.fit(training_features, labels, epochs=self.epochs, batch_size=self.batch_size)

        return model


    def getErrors(self, predictions, test_data):

        mse = MeanSquaredError()
        mse_outcome = mse(np.insert(predictions, 0, self.batch_size, axis=0), np.insert(test_data, 0, self.batch_size, axis=0)).numpy()

        mae = MeanAbsoluteError()
        mae_outcome = mae(np.insert(predictions, 0, self.batch_size, axis=0), np.insert(test_data, 0, self.batch_size, axis=0)).numpy()

        mape = MeanAbsolutePercentageError()
        mape_outcome = mape(np.insert(predictions, 0, self.batch_size, axis=0), np.insert(test_data, 0, self.batch_size, axis=0)).numpy()

        return(mse_outcome, mae_outcome, mape_outcome)


    def generate_training_data(self, df, availability_zone):

        df_tmp = df[df['AvailabilityZone'] == availability_zone]
        df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)

        #df_tmp = df_tmp[['AvailabilityZone', 'mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
        #df_tmp = df_tmp[['AvailabilityZone', 'sum']]
        df_tmp = df_tmp[['SpotPrice']]

        df_tmp = df_tmp.head(len(df_tmp)-self.test_size)
        scaler = MinMaxScaler(feature_range=(0, 1))

        scaled_data = scaler.fit_transform(df_tmp.values)

        features_set = []
        labels = []

        for i in range(self.ticks, len(scaled_data)):
            features_set.append(scaled_data[i - self.ticks:i])
            labels.append(scaled_data[i])

        features_set, labels = np.array(features_set), np.array(labels)

        return (np.reshape(features_set, (features_set.shape[0], features_set.shape[2], features_set.shape[1])), labels, scaler)


    def generate_test_data(self, df, scaler, availability_zone):

        df = df[df['AvailabilityZone'] == availability_zone]
        df = df.drop(['Unnamed: 0'], axis=1)#

        #df_tmp = df[['AvailabilityZone','mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
        #df_tmp = df[['AvailabilityZone', 'sum']]
        df_tmp = df[['SpotPrice']]

        df_tmp = df_tmp.tail(self.test_size)


        #df_total = df[['AvailabilityZone','mean', 'min', 'max', 'count', 'mad', 'median', 'sum']]
        #df_total = df[['AvailabilityZone', 'sum']]
        df_total = df[['SpotPrice']]


        test_data = df_total[len(df_total) - len(df_tmp) - self.ticks:].values
        test_data = scaler.transform(test_data)

        test_features = []
        for i in range(self.ticks, len(test_data)):
            test_features.append(test_data[i - self.ticks:i])

        test_features = np.array(test_features)
        test_features = np.reshape(test_features, (test_features.shape[0], test_features.shape[2], test_features.shape[1]))

        return test_features, df_tmp.values


    def create_model(self):
        print('Create ml model')
        model = Sequential()

        model.add(LSTM(units=32, return_sequences=True, input_shape=(self.input_shape_1, self.input_shape_2)))
        model.add(LSTM(units=32))
        model.add(Dense(units=self.output_shape))

        return model
