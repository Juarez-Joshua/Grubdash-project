const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { validateDataExists } = require("../dishes/dishes.controller");
// TODO: Implement the /orders handlers needed to make the tests pass
function validator(field) {
  return function (req, res, next) {
    if (req.body.data[field]) {
      next();
    } else {
      next({
        status: 400,
        message: `you forgot the ${field} field`,
      });
    }
  };
}
function dishesValidator(req, res, next) {
  const dishes = req.body.data.dishes;
  if(!Array.isArray(dishes)) {
    next({
      status: 400,
      message: "dishes must be an array",
    });
  } else if (dishes.length === 0) {
    next({
      status: 400,
      message: "dishes needs at least one dish",
    });
  }
  dishes.forEach((dish, index) => {
    if (dish.quantity <= 0) {
      next({
        status: 400,
        message: `Dish at index ${index} must have a quantity that is an integer greater than 0`,
      });
    } else if (typeof dish.quantity != "number") {
      next({
        status: 400,
        message: `Dish quantity at index ${index} needs to be a number`,
      });
    }
  });
  next();
}

function create(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).send({ data: newOrder });
}
function list(req, res, next) {
  res.send({ data: orders });
}

const fieldValidators = ["deliverTo", "mobileNumber", "dishes"].map(validator);
module.exports = {
  list,
  create: [validateDataExists, ...fieldValidators, dishesValidator, create],
};
