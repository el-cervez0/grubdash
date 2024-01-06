const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        })
    }
}

function bodyIsValid(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    if (deliverTo.length === 0) {
        next({
            status: 400,
            message: 'Deliver To must not be left empty'
        })
    }
    if (mobileNumber.length === 0 || mobileNumber.length > 20) {
        next({
            status: 400,
            message: "Please enter a valid phone number"
        })
    }
    for (dish of dishes) {
        if (dish.quantity <= 0 || !Number.isInteger(dish.quantity) || dish.quantity.length === 0) {
            next({
                status: 400, 
                message: `dish ${dish.id} must have a quantity that is an integer greater than`
            })
        }
    }
    if (!Array.isArray(dishes)) {
        next({
            status: 400,
            messge: "dish must contain a non-empty array"
        })
    }
    if (dishes.length === 0) {
        next({
            status: 400,
            message: "dish must not be empty!"
        })
    }
    return next();
}

function orderMatchesId(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (!id || orderId === id) {
        return next();
    }
    next({
        status: 400,
        message: `id in the body does not match the orderId in the route: ${id}`
    })
}

function orderExists(req, res, next) { 
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404, 
        message: `dish not found: ${orderId}`
    })
}

function checkStatusForUpdate(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delievered"]
    if (status && validStatuses.includes(status)) {
        return next()
    }
    next({
        status: 400,
        message: `Value of 'status' must be of one of the following: ${validStatuses}, received: ${status}`
    })
}

function list(req, res) {
    res.json({ data: orders })
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    };
    orders.push(newOrder)
    res.status(201).json({ data: newOrder });
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.status(200).json({ data: order })
}

function read(req, res, next) {
    res.json({ data: res.locals.order });
}

function destroy(req, res, next) {
    const orderData = res.locals.order
    
    if (orderData.status === "pending") {
        const index = orders.findIndex(order => order.id == orderData.id);
        const deletedOrders = orders.splice(index, 1);
        res.sendStatus(204);
    }
    next({
        status: 400, 
        message: "You may only delete orders in 'pending' status"
    })
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyIsValid,
        create
    ],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        bodyIsValid,
        orderMatchesId,
        checkStatusForUpdate,
        update
    ],
    read: [orderExists, read],
    delete: [orderExists, destroy]
}