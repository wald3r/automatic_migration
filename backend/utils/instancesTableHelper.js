

const createInstanceObject = (rowid, type, product, bidprice, region, simulation, createdAt, updatedAt) => {

    let obj = {
        id: rowid,
        type: type,
        product: product,
        bidprice: bidprice,
        region: region,
        simulation: simulation,
        createdAt: createdAt,
        updatedAt: updatedAt
    }
    return obj

}


module.exports = {createInstanceObject}