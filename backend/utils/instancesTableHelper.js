

const createInstanceObject = (rowid, type, product, bidprice, region, simulation, status, createdAt, updatedAt) => {

    let obj = {
        id: rowid,
        type: type,
        product: product,
        bidprice: bidprice,
        region: region,
        simulation: simulation,
        status: status,
        createdAt: createdAt,
        updatedAt: updatedAt
    }
    return obj

}


module.exports = {createInstanceObject}