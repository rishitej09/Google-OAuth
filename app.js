require("dotenv").config();
const express = require ("express");
const ejs = require ("ejs");
const bodyParser = require ("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require ("md5");

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const passport = require("passport");

const app = express();
app.use(express.static("public"));
app.set( "view engine" , "ejs" );
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});



// const secret = process.env.SECRET ;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});


userSchema.plugin(findOrCreate);
const User = new mongoose.model("User",userSchema);

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/OAuth",
    userProfileURL:"https://www.googleapis.com/oauth3/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get( "/" , function ( req , res ){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google",{scope:['profile']})
    );

app.get('/auth/google/OAuth', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get( "/login" , function ( req , res ){
    res.render("login");
});

app.get( "/register" , function ( req , res ){
    res.render("register");
});

app.post( "/register" , function ( req , res ){
    const newUser = new User ({
        email: req.body.username,
        password:md5(req.body.password)
    });

    newUser.save(function(err){
        if (err){
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.post ("/login" , function ( req , res ){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email:username},function ( err , foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser) {
                if  (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    })
})
app.listen ( 3000 , function ( req , res ) {
    console.log( "Port Has Started Successfully." );
});