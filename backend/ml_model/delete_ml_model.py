from ml_model import MLModel

import sys



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
        print("Two Arguments needed! How to: python3 delete_ml_model.py <instanceType> <productDescription>")
        exit(0)

    instance_type = str(sys.argv[1])
    product_description = str(sys.argv[2])

    try:
        mlobj = MLModel(None, None, instance_type, replace_name(product_description))
        mlobj.delete_model()
        print('Ml model %s %s deleted' %(instance_type, product_description))
    except:
        print('Could not delete model %s %s' %(instance_type, product_description))

if __name__ == "__main__":
    main()
