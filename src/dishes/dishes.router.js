const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./dishes.controller")

router
//remember that the base path is set in app
    .route("/") 
    .get(controller.list)
    .post(controller.create)
    .all(methodNotAllowed);

router
    .route("/:dishId")
    .get(controller.read)
    .put(controller.update)
    .all(methodNotAllowed);


module.exports = router;
