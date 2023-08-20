const { request } = require("http");
const path = require("path");
const dishesController = require("../dishes/dishes.controller");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//middleware- destructure data | save body to res.locals for update handler
function hasBody(req, res, next) {
    const { data } = req.body;

    if (data) {
        res.locals.body = data;
        return next();
    }
    next({
        status: 400,
        message: `No body: ${JSON.stringify(req.body)}`,
    });
}

//request params on the order and calidate that it has a matching order.id
function orderExists(req, res, next){
const orderId = Number(req.params.orderId);
const orderFound = orders.find(order => Number(order.id === orderId))
// console.log("THE ORDER EXISTS")
if(orderFound){
    res.locals.order= orderFound;
    return next()
}
next({
    status: 404,
    message:`Order id not found ${req.params.orderId}`
    })
}

//validation for "deliverTo" "mobileNumber" "dishes"  | empty or missing string | "Order must include a deliverTo"

function validateProperties(req, res, next){
        let properties = [ "deliverTo", "mobileNumber", "dishes"]
        for(let keys of properties){
            if(!req.body.data[keys]) {
                next({
                    status:400,
                    message:`Must include a ${keys}`
                })
            }
        }
    return next()
}


//other validations for "dishes" | array is empty ( "Order must include at least one dish" )| property is not an array ("Order must include at least one dish") | 

function validateDishes(req, res, next){
    const data = req.body.data;
    if(data === [] || data === ""){
        return next({
        status:400, 
        message: "Order must include at least one dish"
        })
    }
    next()
}

//validation for "quantity" |  a dish quantity property is missing  ("Dish ${index} must have a quantity") | a dish quantity property is zero or less ("Dish ${index} must have a quantity that is an integer greater than 0") | a dish quantity property is not an integer("Dish ${index} must have a quantity")

function validateDishQuantity(req, res, next) {
    const dishes = req.body.data.dishes;

    if (!Array.isArray(dishes)) {
        return next({
            status: 400,
            message: "Order must include at least one dish"
        });
    }

    for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        if (!dish.quantity || typeof dish.quantity !== 'number' || dish.quantity <= 0) {
            return next({
                status: 400,
                message: `Dish ${i} must have a quantity that is an integer greater than 0`
            });
        }
    }
    next();
}

//--------------------------------------------------------------
//The **UPDATE** validation must include all of the same validation as the POST /orders route, plus the following:


//update val: id of body does not match :orderId from the route("Order id does not match route id. Order: ${id}, Route: ${orderId}.")
function validateId(req, res, next) {
    const { id } = req.body.data;
    const { orderId } = req.params;

    if (id && id !== orderId) {
        return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        });
    }
    next();
}


//update val: status property is missing or empty("Order must have a status of pending, preparing, out-for-delivery, delivered")
function validateStatus(req, res, next) {
    const status = req.body.data.status;
    const validStatuses = ["pending", "preparing", "out-for-delivery", "delivered"];

    if (!status || !validStatuses.includes(status)) {
        return next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
        });
    }
    next();
}
// update val: validate status property of the existing order === "delivered"("A delivered order cannot be changed")

function noDelete(req, res, next) {
    const order = res.locals.order;

    if (order.status === "delivered") {
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        });
    }
    next();
}

//	An order cannot be deleted unless it is pending. Returns a 400 status code. status property of the order !== "pending"
function deletePendingStatus(req, res, next) {
    const order = res.locals.order;

    if (order.status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        });
    }
    next();
}


// handler for list

function list(req, res, next){
    res.json({
        data:orders
    })
}

// handler for create

const create = (req, res, next) => {
    const { deliverTo, mobileNumber, dishes } = req.body.data;
    const newOrder = {
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      dishes: dishes,
      id: nextId(),
    };
    orders.push(newOrder);
    res.status(201).json({
      data: newOrder,
    });
  };

// handler for read

function read(req, res, next){
    res.status(200).send({data:res.locals.order})
}

// handler for update

function update(req, res, next) {
    const order = res.locals.order;
    const { deliverTo, mobileNumber, dishes, status } = req.body.data;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.status = status;

    res.json({ data: order });
}


// handler for delete

const destroy = (req, res, next)=>{
    const indexOfOrder = orders.findIndex(o=>o.id===res.locals.order.id)
    orders.splice(indexOfOrder, 1);
    res.status(204).json()
  }

  module.exports = {
    list,
    create: [validateDishQuantity, validateDishes, validateProperties, create],
    read: [orderExists, read],
    update: [validateDishQuantity, orderExists, validateProperties, validateDishes, hasBody, validateStatus, noDelete, validateId, update],
    delete: [orderExists, deletePendingStatus, destroy],
}



//