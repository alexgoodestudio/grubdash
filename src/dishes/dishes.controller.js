const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
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

//middleware to find corresponding dishId
function dishExists(req, res, next) {
    // console.log("dishExist!!!!!!!!!!!!!!!!!!!!!!!")
    const dishId = Number(req.params.dishId);
    // console.log( dishId ,"dishId")
    // console.log("dishes:--)", dishes)

    const foundDish = dishes.find(dish => Number(dish.id) === dishId);
    // console.log(foundDish, "I'm Found!")
    if (foundDish) {
        res.locals.dish = foundDish;
        return next()
    }
        next({
        status: 404,
        message: `Dish id not found: ${req.params.dishId}`,
        });
    } 


//middleware - need to check if payload contains the properties
    function validateProperties(req, res, next){
        let properties = ["name", "description", "price", "image_url"];
        for (let key of properties){
            if(!req.body.data[key]){
                next({
                    status:400,
                    message:`Must include a ${key}`
                })
            }
        }
        next()
    }

    function validatePrice(req, res, next) {
        console.log("validatePrice","121212121212121212121212121")
        const { price } = req.body.data;
        console.log(price,"$$$$$$$$$$$$$$$$$$$$$$")
        if (price <= 0 || typeof(price)!=="number") {
          next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
          });
        } else {
          next();
        }
      }     

// handler to list all dishes
        function list(req, res, next){
            console.log("list")
            res.json({
                data: dishes,
            })
        }

//handler to create new dishes
    function create(req, res, next){
        console.log("create")
        const newDish = req.body.data;
        console.log("newDish", newDish)
        newDish.id = nextId();
        dishes.push(newDish)
        res.status(201).json({ data: newDish })
    }


//handler to list
const read = (req, res, next) => {
    // console.log({data:res.locals.dish},"read","*****************************")
    res.status(200).send({data:res.locals.dish})
};
      

//handler to update dish
const update = (req, res, next) => {
    const dish = res.locals.dish; 
    const { name, description, price, image_url } = res.locals.body; 

    // Update the dish properties
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.status(200).json({
      data: dish,
    });
    return next({
        status: 404
    })
};

    module.exports ={
        list,
        create:[validateProperties,validatePrice, create],
        read:[dishExists,read],
        update:[dishExists,validateProperties, hasBody, validatePrice,  update], 
    }

    //----------------------------------------------------------------------
