// Import required packages
const express = require('express');          // Web framework for Node.js
const { UserModel, TodoModel } = require("./db"); // Import database models
const jwt = require("jsonwebtoken");         // For creating and verifying JWT tokens
const mongoose = require('mongoose');        // MongoDB ORM
const bcrypt = require('bcrypt');            // For hashing passwords
const { z } = require("zod");                // For request validation

// Secret key used to sign JWT tokens
// (In real apps, store this in environment variables)
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
   
    // Zod schema to validate request body
    const requiredBody = z.object({
        email: z.string()
            .min(3)                 // minimum length
            .max(100)               // maximum length
            .email(),               // must be valid email

        name: z.string()
            .min(3)
            .max(100),

        password: z.string()
            .min(8, "Password must be at least 8 characters long")
            // At least one lowercase letter
            .regex(/[a-z]/, "Password must contain a lowercase letter")
            // At least one uppercase letter
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
            // At least one number
            .regex(/[0-9]/, "Password must contain a number")
            // At least one special character
            .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
    });

    // Validate incoming request body
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    // If validation fails
    if(!parsedDataWithSuccess.success){
        return res.json({
            message: "Incorrect format",
            error: parsedDataWithSuccess.error.issues
        });
    }

    // Extract validated user data
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    let errorThrown = false;

    try{
        // Hash the password before storing in DB
        // 5 = salt rounds (cost factor)
        const hashedPassword = await bcrypt.hash(password, 5);

        // Create a new user in database
        await UserModel.create({
            email: email,
            password: hashedPassword, // store hashed password
            name: name
        });
    }
    catch(e){
        // If user already exists or any DB error
        res.json({
            message: "User already exists"
        });
        errorThrown = true;
    }

    // Send success response if no error occurred
    if(!errorThrown){
        res.json({
            message: "User created successfully"
        });
    }
});


// =========================
// SIGNIN ROUTE
// =========================
app.post("/signin", async function(req, res){

    // Get credentials from request
    const email = req.body.email;
    const password = req.body.password;

    // Find user in database
    const user = await UserModel.findOne({
        email: email,
    });

    // If user not found
    if (!user){
        return res.status(403).json({
            message: "User doesn't exist in database"
        });
    }

    // Compare entered password with hashed password in DB
    const passwordMatch = await bcrypt.compare(password, user.password);

    if(passwordMatch){
        // Create JWT token containing userId
        const token = jwt.sign({
            userId: user._id.toString()
        }, JWT_SECRET);

        // Send token to client
        res.json({
            token: token
        });
    } else {
        // Password incorrect
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

    // Get todo title from request body
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

    // Send todos back to client
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
