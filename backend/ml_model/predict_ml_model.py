
from ml_model import MLModel
import matplotlib.pyplot as plt
import pandas as pd
import sys
import os
from generate_training_data import GenerateTrainingData


def plot_all(predictions, test_data, epochs, instance, product, zone):

    plt.plot(test_data, color='blue', label='Actual EC2 Price')
    plt.plot(predictions, color='red', label='Predicted EC2 Price')
    plt.title(instance+' '+product+' '+zone+' - ' + str(epochs) + ' Epochs')
    plt.xlabel('Date')
    plt.ylabel('EC2 Price')
    plt.legend()
    plt.show()


def replace_name(name):

    if(name == 'Linux/UNIX'):
        return 'Linux-Unix'

    if(name == 'Red Hat Enterprise Linux'):
        return 'RedHat'

    if(name == 'SUSE Linux'):
        return 'Linux-Suse'

    return name

def main():

    if(len(sys.argv) != 4):
        print("Three Arguments needed! How to: python3 predict_ml_model.py <instanceType> <productDescription> <id>")
        exit(0)

    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])
    image_id = str(sys.argv[3])

    epochs = 1
    ticks = 15
    batch_size = 32
    shape = 1
    test_size = 24

    gen = GenerateTrainingData('training_data_v3.csv')
    if(gen.generate(instance_type, product_description, 1) == 0):
        exit(0)
    df = pd.read_csv('training_data_v3.csv', sep=',')

    zones = df['AvailabilityZone'].drop_duplicates().values

    rep_product_description = replace_name(product_description)
    
    file_name = 'predictions/'+instance_type+'_'+rep_product_description+'_'+image_id+'.csv'
    try:
    	os.remove(file_name)
    except:
    	pass
    	
    #for x in zones:
    for x in ['ap-northeast-1a', 'ap-northeast-1c']:

        try:
            architecture_name = instance_type + '_' + rep_product_description + '_' + str(x) + '_architecture.json'
            weights_name = instance_type + '_' + rep_product_description + '_' + str(x) + '_weights.h5'
            mlobj = MLModel(weights_name, architecture_name, shape, ticks, epochs, batch_size, test_size, ticks, instance_type, rep_product_description)
            model = mlobj.load_model()
            model.compile(optimizer='nadam', loss='mean_squared_error', metrics=['accuracy'])
            training_features, labels, scaler = mlobj.generate_training_data(df, x)
            test_features, test_data = mlobj.generate_test_data(df, scaler, x)

            predictions, model = mlobj.predict(model, test_features, scaler)

            column = 0

            mse_outcome, mae_outcome, mape_outcome = mlobj.getErrors(predictions[:,column], test_data[:,column])

            sum_test = sum(predictions[:,column])
            sum_prediction = sum(test_data[:,column])

            with open(file_name, 'a+') as f:
                f.write("%s,%s\n" % (round(sum_prediction, 4), x))

            #print(round(mape_outcome, 4), round(sum_test, 4), round(sum_prediction - sum_test, 4))
            #with open('predictions.csv', 'a') as f:
            #    f.write("%s, %s, %s, %s, %s, %s, %s, %s, %s, %s\n" % (instance_type, product_description, x, epochs, ticks, batch_size, round(mape_outcome, 4), round(sum_test, 4), round(sum_prediction, 4), round(sum_test-sum_prediction, 4)))

           # plot_all(predictions[:, column], test_data[:, column], epochs, instance_type, product_description, x)

        except:
            print('Skip', str(x))


    exit(0)

if __name__ == "__main__":
    main()
