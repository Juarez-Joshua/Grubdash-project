const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { validateDataExists } = require("../dishes/dishes.controller");
// TODO: Implement the /orders handlers needed to make the tests pass

//validate an order exists
function validateOrder(req, res, next) {
  const { orderId } = req.params;
  const foundIndex = orders.findIndex((order) => order.id === orderId);
  const foundOrder = orders[foundIndex];
  if (foundOrder) {
    res.locals.foundOrder = foundOrder;
    res.locals.foundIndex = foundIndex;
    next();
  } else {
    next({
      status: 404,
      message: `Order with id ${orderId} doesn't exist`,
    });
  }
}
//validate all fields are in the data
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
//validate all data in the dishes is correct
function dishesValidator(req, res, next) {
  const dishes = req.body.data.dishes;
  if (!Array.isArray(dishes)) {
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
function statusValidator(req, res, next) {
  const { status } = req.body.data;
  if (status) {
    if (res.locals.foundOrder.status != "delivered") {
      if (
        status === "pending" ||
        status === "preparing" ||
        status === "out-for-delivery" ||
        status === "delivered"
      ) {
        next();
      } else {
        next({
          status: 400,
          message:
            "Order must have a status of pending, preparing or delivered",
        });
      }
    } else {
      next({
        status: 400,
        message: "a delivered order cannot be changed",
      });
    }
  } else {
    next({
      status: 400,
      message: "Order must have a status",
    });
  }
}
function update(req, res, next) {
  const { id, deliverTo, mobileNumber, status, dishes } = req.body.data;
  if (id) {
    if (id != res.locals.foundOrder.id) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.foundOrder.id}`,
      });
    }
  }
  const updatedOrder = {
    ...res.locals.foundOrder,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders[res.locals.foundIndex] = updatedOrder;
  res.send({ data: updatedOrder });
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
function read(req, res, next) {
  res.send({ data: res.locals.foundOrder });
}
const fieldValidators = ["deliverTo", "mobileNumber", "dishes"].map(validator);
module.exports = {
  list,
  create: [validateDataExists, ...fieldValidators, dishesValidator, create],
  read: [validateOrder, read],
  update: [
    validateDataExists,
    validateOrder,
    ...fieldValidators,
    dishesValidator,
    validator("status"),
    statusValidator,
    update,
  ],
};
