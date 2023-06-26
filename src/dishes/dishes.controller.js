const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function validator(field) {
  return function (req, res, next) {
    if (req.body.data.price <= 0 || typeof req.body.data.price != "number") {
      next({
        status: 400,
        message: `price needs to be greater than 0`,
      });
    }
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

function validateDataExists(req, res, next) {
  if (req.body.data) {
    next();
  } else {
    next({
      status: 400,
      message: "request body must contain a data object",
    });
  }
}

function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const foundIndex = dishes.findIndex((dish) => dish.id === dishId);
  const foundDish = dishes[foundIndex];
  if (foundDish) {
    res.locals.foundDish = foundDish;
    res.locals.foundIndex = foundIndex;
    next();
  } else {
    next({
      status: 404,
      message: `Dish with id: ${dishId}`,
    });
  }
}

function update(req, res, next) {
  const { id, name, description, image_url, price } = req.body.data;
  if(id){
      if(id != res.locals.foundDish.id){
        next({
            status: 400,
            message:  `id: ${id} in data doesn't match in path`
        })
      }
  }
  const updatedDish = {
    ...res.locals.foundDish,
    name,
    description,
    image_url,
    price,
  };
  dishes[res.locals.foundIndex] = updatedDish;
  res.send({ data: updatedDish });
}

function create(req, res, next) {
  const newDish = {
    id: nextId(),
    name: req.body.data.name,
    description: req.body.data.description,
    price: req.body.data.price,
    image_url: req.body.data.image_url,
  };
  dishes.push(newDish);
  res.status(201).send({ data: newDish });
}

function list(req, res, next) {
  res.send({ data: dishes });
}

function read(req, res, next) {
  res.send({ data: res.locals.foundDish });
}
const fieldValidators = ["name", "description", "image_url", "price"].map(
  validator
);
module.exports = {
  list,
  create: [validateDataExists, ...fieldValidators, create],
  read: [validateDishExists, read],
  update: [validateDishExists, validateDataExists, ...fieldValidators, update],
};
