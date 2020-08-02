from keras.models import Sequential, model_from_json
from keras.layers import Dense
from keras.layers import LSTM
from keras.losses import MeanSquaredError
from keras.losses import MeanAbsoluteError
from keras.losses import MeanAbsolutePercentageError
from sklearn.preprocessing import MinMaxScaler
import os
import numpy as np
import shutil
import datetime
import pandas as pd
class MLModel(object):

    def __init__(self, weights_name, architecture_name, instance, product):
        self.weights_name = weights_name
        self.architecture_name = architecture_name
        self.input_shape_1 = 1
        self.input_shape_2 = 15
        self.epochs = 1
        self.batch_size = 32
        self.output_shape = 1
        self.ticks = 15
        self.test_size = 24
        self.instance = instance
        self.product = product

    def load_model(self):

        folder_name = self.instance+'_'+self.product
        path = os.getcwd()+'/ml_model/models/'+folder_name+'/'
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


        folder_name = self.instance+'_'+self.product
        path = os.getcwd()+'/ml_model/models/'+folder_name+'/'
        if not os.path.exists(path):
            os.mkdir(path)
        model.save_weights(path+self.weights_name)
        with open(path+self.architecture_name, 'w') as f:
            f.write(model.to_json())

        print('Model saved!')

    def delete_model(self):

        path = os.getcwd()+'/ml_model/models/'+self.instance+'_'+self.product
        try:
            shutil.rmtree(path)

        except OSError as e:
            print('Could not delete %s - %s' %(e.filename, e.strerror))


    def getModel(self):

        model = self.load_model()
        if (model == None):
            return(self.create_model())

        return model


    def predict(self, model, test_features, scaler):

        predictions = model.predict(test_features)
        predictions = scaler.inverse_transform(predictions)

        return predictions


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


    def generate_training_data(self, df, availability_zone, version, flag):

        df_tmp = df[df['AvailabilityZone'] == availability_zone]
        df_tmp = df_tmp.drop(['Unnamed: 0'], axis=1)
        df_0 = df_tmp[df_tmp['Training'] == 0]
        df_1 = df_tmp[df_tmp['Training'] == 1]
        if(flag == 1):
            if(df_1.empty):
               pass
            else:
                df_1 = df_1.tail(self.ticks)
                df_tmp = df_1.append(df_0)

        df_tmp = df_tmp[['SpotPrice']]

        if(version == 1):
            df_tmp = df_tmp.head(len(df_tmp)-self.test_size) #important for testing
        else:
            df_tmp = df_tmp.head(len(df_tmp)) #important for predicting future

        scaler = MinMaxScaler(feature_range=(0, 1))

        scaled_data = scaler.fit_transform(df_tmp.values)

        features_set = []
        labels = []

        for i in range(self.ticks, len(scaled_data)):
            features_set.append(scaled_data[i - self.ticks:i])
            labels.append(scaled_data[i])

        features_set, labels = np.array(features_set), np.array(labels)

        return (np.reshape(features_set, (features_set.shape[0], features_set.shape[2], features_set.shape[1])), labels, scaler)


    def predict_testdata(self, df, scaler, availability_zone):

        model = self.load_model()
        df = df[df['AvailabilityZone'] == availability_zone]
        df = df.drop(['Unnamed: 0'], axis=1)

        df_tmp = df[['SpotPrice']]

        df_tmp = df_tmp.tail(self.test_size)

        df_total = df[['SpotPrice']]

        counter = 0
        predictions = None
        final_predictions = []

        while (counter < self.test_size):

            test_data = df_total[len(df_total) - len(df_tmp) - self.ticks:].values
            if (predictions != None):
                test_data[self.ticks + counter] = predictions[0][0]
            test_data = scaler.transform(test_data)

            test_features = []
            test_features.append(test_data[counter:self.ticks+counter])

            test_features = np.array(test_features)
            test_features = np.reshape(test_features,
                                       (test_features.shape[0], test_features.shape[2], test_features.shape[1]))

            predictions = self.predict(model, test_features, scaler)
            final_predictions.append(predictions[0][0])

            counter = counter + 1



        return final_predictions, df_tmp.values

    def add_artifical_data(self, df):
        df_last_row = df.tail(1)

        today = datetime.datetime.now()

        year = today.year
        month = today.month
        day = today.day
        hour = today.hour
        df = df.append({'SpotPrice': df_last_row.SpotPrice.values[0], 'AvailabilityZone': df_last_row.AvailabilityZone.values[0], 'Training': 0, 'Year': year, 'Month': month, 'Day': day, 'Hour': hour}, ignore_index=True)
        cols = ['Year', 'Month', 'Day']
        df['Time'] = df[cols].apply(lambda row: '-'.join(row.values.astype(str)), axis=1)
        cols = ['Time', 'Hour']
        df['test'] = '00:00'
        df['Time'] = df[cols].apply(lambda row: ' '.join(row.values.astype(str)), axis=1)
        df['Time'] = df[['Time', 'test']].apply(lambda row: ':'.join(row.values.astype(str)), axis=1)
        df = df.drop(['test', 'Year', 'Month', 'Day', 'Hour'], axis=1)
        df['Time'] = pd.to_datetime(df['Time'])
        df = df.set_index('Time')
        df = df.resample('H').pad()
        df = df.reset_index()
        df['Year'] = pd.to_datetime(df['Time']).dt.year
        df['Month'] = pd.to_datetime(df['Time']).dt.month
        df['Day'] = pd.to_datetime(df['Time']).dt.day
        df['Hour'] = pd.to_datetime(df['Time']).dt.hour
        df = df.drop(['Time'], axis=1)

        return df

    def predict_future(self, df, scaler, availability_zone):

        model = self.load_model()

        df = df[df['AvailabilityZone'] == availability_zone]
        df = df.drop(['Unnamed: 0'], axis=1)
        df = self.add_artifical_data(df)
        df_total = df[['SpotPrice']]

        counter = self.test_size
        predictions = None
        final_predictions = []
        while(counter != 0):
            if(predictions != None):
                df_total = df_total.append({'SpotPrice': predictions[0][0]}, ignore_index=True)
            test_data = df_total[len(df_total) - self.ticks:].values
            test_data = scaler.transform(test_data)

            test_features = []
            test_features.append(test_data[0:self.ticks])

            test_features = np.array(test_features)
            test_features = np.reshape(test_features, (test_features.shape[0], test_features.shape[2], test_features.shape[1]))

            predictions = self.predict(model, test_features, scaler)
            final_predictions.append(predictions[0][0])

            counter = counter - 1

        return final_predictions

    def create_model(self):
        print('Create ml model')
        model = Sequential()

        model.add(LSTM(units=32, return_sequences=True, input_shape=(self.input_shape_1, self.input_shape_2)))
        model.add(LSTM(units=32))
        model.add(Dense(units=self.output_shape))

        return model
