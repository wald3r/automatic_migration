
from ml_model import MLModel
import matplotlib.pyplot as plt
import pandas as pd
import sys
from generate_training_data import GenerateTrainingData


def plot_all(predictions, test_data, epochs):

    plt.plot(test_data, color='blue', label='Actual EC2 Price')
    plt.plot(predictions, color='red', label='Predicted EC2 Price')
    plt.title('EC2 Price Prediction - ' + str(epochs) + ' Epochs')
    plt.xlabel('Date')
    plt.ylabel('EC2 Price')
    plt.legend()
    plt.show()


def main():

    if(len(sys.argv) != 3):
        print("Two Arguments needed! How to: python3 predict_ml_model.py <instanceType> <productDescription>")
        exit(0)

    epochs = 250
    architecture_name = 'model_architecture_multivariate.json'
    weights_name = 'model_weights_multivariate_multivariate.h5'
    ticks = 30
    batch_size = 32
    shape = 2
    test_size = 24

    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])

    mlobj = MLModel(weights_name, architecture_name, shape, ticks, epochs, batch_size, test_size, ticks)
    try:
        model = mlobj.load_model()
        model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])
    except:
        print('Error: Model does not exist!')

    #instance_type = 'm4.16xlarge'
    #product_description = 'Linux/UNIX'

    #gen = GenerateTrainingData('training_data_v3.csv')
    #if(gen.generate(instance_type, product_description, 1) == 0):
    #    exit(0)

    df = pd.read_csv('training_data_v2.csv', sep=',')

    zones = df['AvailabilityZone'].drop_duplicates().values

    for x in [42]:
        try:
            training_features, labels, scaler = mlobj.generate_training_data(df, x)
            test_features, test_data = mlobj.generate_test_data(df, scaler, x)

            predictions, model = mlobj.predict(model, test_features, scaler)

            column = 1

            mse_outcome, mae_outcome, mape_outcome = mlobj.getErrors(predictions[:,column], test_data[:,column])

            sum_test = sum(predictions[:,column])
            sum_prediction = sum(test_data[:,column])
            print(mse_outcome, mae_outcome, mape_outcome, sum_prediction - sum_test)

            #with open('predictions.csv', 'a') as f:
            #    f.write("%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s\n" % (instance_type, product_description, x, epochs, ticks, batch_size, mse_outcome, mae_outcome, mape_outcome, sum_test, sum_prediction, sum_test-sum_prediction))

            plot_all(predictions[:, column], test_data[:, column], epochs)

        except:
            print('Skip', str(x))



if __name__ == "__main__":
    main()
