// Import mongoose
const mongoose = require('mongoose');

// Get Schema constructor from mongoose
const Schema = mongoose.Schema;

// ObjectId type used for references
const ObjectId = mongoose.ObjectId;


// =========================
// USER SCHEMA
// =========================
// Defines structure of user document
const User = new Schema({
    email: { type: String, unique: true }, // unique email for login
    password: String, // user's password
    name: String // user's name
});


// =========================
// TODO SCHEMA
// =========================
// Defines structure of todo document
const Todo = new Schema({
    title: String,        // text of the todo
    done: Boolean,        // whether completed or not
    userId: ObjectId      // reference to the user who owns this todo
});


// =========================
// MODELS
// =========================
// Models are used to interact with MongoDB collections

const UserModel = mongoose.model('users', User);   // users collection
const TodoModel = mongoose.model('todos', Todo);   // todos collection


// =========================
// EXPORT MODELS
// =========================
module.exports = {
    UserModel: UserModel,
    TodoModel: TodoModel
};
