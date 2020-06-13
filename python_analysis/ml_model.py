from keras.models import Sequential, model_from_json
from keras.layers import Dense
from keras.layers import LSTM
from keras.layers import Dropout


class MLModel(object):

    def __init__(self, weights_name, architecture_name, input_shape_1, input_shape_2, epochs, batch_size):
        self.weights_name = weights_name
        self.architecture_name = architecture_name
        self.input_shape_1 = input_shape_1
        self.input_shape_2 = input_shape_2
        self.epochs = epochs
        self.batch_size = batch_size
        self.output_shape = input_shape_1


    def load_model(self):

        try:
            with open(self.architecture_name, 'r') as f:
                model = model_from_json(f.read())

            model.load_weights(self.weights_name)
            print('Model loaded')
            return model

        except:
            print('No model can be found')
            return None


    def save_model(self, model):

        model.save_weights(self.weights_name)
        with open(self.architecture_name, 'w') as f:
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


    def create_model(self):
        print('Create ml model')
        model = Sequential()

        model.add(LSTM(units=32, return_sequences=True, input_shape=(self.input_shape_1, self.input_shape_2)))
        model.add(LSTM(units=32))
        model.add(Dense(units=self.output_shape))

        return model
