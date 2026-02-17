// Import required packages
const express = require('express');
const { UserModel, TodoModel } = require("./db"); // Import models from db.js
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

// Secret key used to sign JWT tokens
const JWT_SECRET = "psp123";

// Create Express app
const app = express();

// Middleware to parse JSON body from requests
app.use(express.json());

// Connect to MongoDB database
mongoose.connect("mongodb+srv://admin:smxBNltsHGRTGkfX@cluster0.ygnl0xo.mongodb.net/todo-pranita");


// =========================
// SIGNUP ROUTE
// =========================
app.post("/signup", async function(req, res){

    // Extract user data from request body
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    // Create a new user in database
    await UserModel.create({
        email: email,
        password: password,
        name: name
    });

    // Send response back to client
    res.json({
        message: "User created successfully"
    });
});


// =========================
// SIGNIN ROUTE
// =========================
app.post("/signin", async function(req, res){

    // Get login credentials from request
    const email = req.body.email;
    const password = req.body.password;

    // Find user with matching email and password
    const user = await UserModel.findOne({
        email: email,
        password: password
    });

    console.log(user);

    // If user exists, create a token
    if(user){
        const token = jwt.sign({
            userId: user._id.toString()   // store userId inside token
        }, JWT_SECRET);

        res.json({
            token: token
        });
    } else {
        // If user not found
        res.status(403).json({
            message: "Incorrect Credentials"
        });
    }
});


// =========================
// CREATE TODO (Protected)
// =========================
app.post("/todo", auth, async function(req, res){

    // userId extracted from token in auth middleware
    const userId = req.userId;
    const title = req.body.title;

    // Create todo for that user
    await TodoModel.create({
        title: title,
        userId: userId
    });

    res.json({
        message: "Todo created"
    });
});


// =========================
// GET TODOS (Protected)
// =========================
app.get("/todos", auth, async function(req, res){

    // Get userId from middleware
    const userId = req.userId;

    // Find all todos belonging to this user
    const todos = await TodoModel.find({
        userId: userId
    });

    res.json({
        todos: todos
    });
});


// =========================
// AUTH MIDDLEWARE
// =========================
function auth(req, res, next){

    // Get token from request header
    const token = req.headers.token;

    try {
        // Verify token using secret key
        const decodedData = jwt.verify(token, JWT_SECRET);

        // Store userId from token into request object
        req.userId = decodedData.userId;

        // Move to next middleware or route
        next();
    } catch (err) {
        // If token invalid or missing
        res.status(403).json({
            message: "Invalid Credentials!"
        });
    }
}


// Start server on port 3000
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
