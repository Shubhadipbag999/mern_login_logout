import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//establish connection to mongodb using mongoose
mongoose.connect("mongodb://localhost:27017", {
    dbName: 'merndatabase'
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err))

//create user schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

//create model
const User = mongoose.model('User', userSchema)

const app = express();
app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.set("view engine", "ejs");
let arr = [];


//middle ware for checking authentication
const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;


    if (token) {
        const decoded = jwt.verify(token, "shjkjdkjdzkdkzdk")
        console.log(decoded)
        //save user infomation in req.user object permanantly
        req.user = await User.findById(decoded._id)
        // console.log(req.user)
        next()
    }
    else {
        res.render("login")
    }
}


//create new user
app.get("/", isAuthenticated, (req, res) =>
    res.render("home", { name: req.user.name })
)
app.get("/register", (req, res) => {
    res.render("register")
})

app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    // console.log(name, email, password)
    const user = await User.findOne({ email })
    //if user exists
    if (user) {
        return res.redirect("/login")
    }
    //if new user
    const codeedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({
        name: username,
        email,
        password: codeedPassword
    })

    if (newUser) {
        console.log("User is created")
        // console.log(newUser._id)
        console.log(newUser._id)
    }

    return res.redirect("/login")
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
        return res.redirect("/register")
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.log("Password mismatch")
        return res.render("login", { message: "Invalid Password", email: user.email })
    }
    console.log("Password match")
    const token = jwt.sign({ _id: user._id }, "shjkjdkjdzkdkzdk")


    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    })
    res.render("logout", { name: user.name })
})

app.get("/login", isAuthenticated, (req, res) => {
    res.render("logout")
})

app.get("/logout", isAuthenticated, (req, res) => {
    res.cookie("token", null,
        {
            httpOnly: true,
            expires: new Date(Date.now())
        }
    )
    res.redirect("/login")
})







const port = process.env.PORT || 8000;
app.listen(port, () => {

    console.log(`server is listening on port ${port}`);
})


