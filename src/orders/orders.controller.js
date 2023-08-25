const { request } = require("http");
const path = require("path");
const dishesController = require("../dishes/dishes.controller");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//request params on the order and calidate that it has a matching order.id
function orderExists(req, res, next){
const orderId = Number(req.params.orderId);
const orderFound = orders.find(order => Number(order.id === orderId.toString()))
// console.log("THE ORDER EXISTS")
if(orderFound){
    res.locals.order= orderFound;
    next()
    }else{
    next({
        status: 404,
        message:`Order id not found ${orderId}`
        })
    }
}
//validation for "deliverTo" "mobileNumber" "dishes"  | empty or missing string | "Order must include a deliverTo"

function validateProperties(req, res, next){
        let properties = [ "deliverTo", "mobileNumber", "dishes"]
        for(let keys of properties){
            if(!req.body.data[keys]) {
                next({
                    status:400,
                    message:`Order must include a ${keys}`
                })
            }
        }
    return next()
}

function validateDishQuantity(req, res, next) {
    const dishes = req.body.data.dishes;

    if (!Array.isArray(dishes) || dishes.length === 0 ) {
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
    // console.log("I got to noDelete, last middleware before update")
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
    create: [validateDishQuantity, validateProperties, create],
    read: [orderExists, read],
    update: [validateDishQuantity, orderExists, validateProperties, validateStatus, noDelete, validateId, update],
    delete: [orderExists, deletePendingStatus, destroy],
}



