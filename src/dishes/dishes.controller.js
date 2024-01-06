const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


// TODO: Implement the /dishes handlers needed to make the tests pass
function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must incude a ${propertyName}`
        });
    };
}

function bodyIsValid(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (name.length === 0) {
        return next({
            status: 400,
            message: `Dish must include a name.`
        })
    }
    if (description.length === 0) {
        return next({
            status: 400,
            message: `Dish must include a description`
        })
    }
    if (price < 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        })
    }
    if (image_url.length === 0) {
        return next({
            status: 400, 
            message: `Dish must include an image_url`
        })
    }
    return next();
 } 
    
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `No dish found: ${dishId}`
    });
}

function dishMatchesId(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if (!id || dishId === id) {
        return next();
    }
    next({
        status: 400, 
        message: `id in the body does not match dishId in the route: ${id}`
    })
}

function list(req, res) {
    res.json({ data: dishes });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res, next) {
    res.json({ data: res.locals.dish });
}

function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { name, description, image_url, price } = {} } = req.body;

    dish.name = name;
    dish.description = description; 
    dish.image_url = image_url;
    dish.price = price;

    res.json({ data: dish });    
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        bodyIsValid,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        bodyIsValid,
        dishMatchesId,
        update
    ]
}