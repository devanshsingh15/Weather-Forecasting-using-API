// jshint esversion:6

require('dotenv').config();

const express = require("express");

const https = require("https");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const ejs = require("ejs");

const { string } = require("prop-types");

const session = require('express-session');

const passport = require('passport');

const passportLocalMongoose = require('passport-local-mongoose');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public")); 

app.use(bodyParser.urlencoded ({extended: true}));

// app.get("/", function (req, res) {

//     res.sendFile(__dirname + "/index.html");

// });

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);

// mongoose.connect("mongodb://127.0.0.1:27017/weatherDB");

mongoose.connect("mongodb://127.0.0.1:27017/weatherDB");

const itemSchema = {
  fname: String,
  lname: String,
  contact: Number,
  email: String ,
  feedback: String
};

// creating model
const Info = mongoose.model("Infomation",itemSchema);

const userSchema = new mongoose.Schema({

  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy ());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

userSchema.plugin(passportLocalMongoose);

// app.get("/", function(req,res) {
//     res.render("home");
// });

app.get("/auth/google", 
    passport.authenticate('google', { scope: ["profile"]})
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {

        res.redirect("/landing");
    });

app.post("/reg", function(req, res){
  

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/landing");
      });
    }
  });


//   User.register({username: req.body.username}, req.body.password, function(err, user) {
//     if(err) {
//         console.log(err);
//         res.redirect("/");
//     }

//     else {
//         passport.authenticate("local")(req,res,function() {
//             res.redirect("/landing");
//         });
//     }
// });

});

app.post("/log", function(req, res){

//   const user = new User ({
//     username: req.body.username,
//     password: req.body.password
// });
// // user.save();
// // res.render("landing");

// req.login(user, function(err) {
//     if(err) {
//         console.log(err);
//     }

//     else {
//         passport.authenticate("local")(req, res, function() {
//             res.redirect("/landing");
//         });
//     }
// });


const user = new User({
  username: req.body.username,
  password: req.body.password
});

req.login(user, function(err){
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/landing");
    });
  }
});


});



//post request from the contact page to store the data

app.post("/home", function ( req, res) {

    // console.log(req.body.cityName);

        const query = req.body.cityName;

    const apiKey = "ec6b0ccc646115d95c0188268e5237ea";

    const unit = "metric";

    const url = "https://api.openweathermap.org/data/2.5/weather?q="+ query + "&appid=" + apiKey + "&units=" + unit;

    https.get( url, function (response) {

        // console.log(response.statusCode);

        response.on("data", function (data) {

            const weatherData = (JSON.parse(data));
           // console.log(weatherData);
        //     const object = {

        //         name: "Aditya",
        //         favoriteColor: "Black",
        //         hobby: "Football"
        //     }
        //     console.log(JSON.stringify(object));
        // });
          
        const temp = weatherData.main.temp;

        // console.log(temp);

        const des = weatherData.weather[0].description;

        // const coord = weatherData.coord;
        // console.log(coord);

        const visibility = weatherData.visibility;

        const icon = weatherData.weather[0].icon;

        const pres = weatherData.main.pressure;

        const humd = weatherData.main.humidity;

        const wind = weatherData.wind.speed;

        const lon = weatherData.coord.lon;

        const lat = weatherData.coord.lat;


        // body.style.backgroundImage = url ('bg.jpg');

        const imageURL =  "http://openweathermap.org/img/wn/" + icon + "@2x.png";

        res.render("response",{query:query, temp:temp, des:des, imageURL: imageURL, pres: pres, humd: humd, wind: wind, lat: lat, lon: lon, visibility: visibility});
/*
        res.write("<h1>The temperature in " + query + " is " + temp + " degrees Celcius. </h1>");

        res.write("<h1>Description of weather prevailing there: " + des + "</h1>");

        res.write("<img src=" +imageURL + ">");

        res.write("<h1>Pressure: " + pres + " hPa</h1>");

        res.write("<h1>Humidity: " + humd + " %</h1>");

        res.write("<h1>Wind Speed " + wind + " m/s</h1>");

        res.send();*/

    });

});

    // console.log("Post request recieved");
});

app.get("/contact", function (req, res) {

    res.render("contact");
  });


  app.post("/contact", function(req, res){
      const post = new Info({
      fname:req.body.firstname,
      lname:req.body.lastname,
      contact:req.body.num,
      email:req.body.mail,
      feedback:req.body.feedback
    }); 
    post.save();
    res.render("contact");   
  });
  

app.get("/destination", function (req, res) {

    res.render("destination");
  });

// app.get("/login", function (req, res) {

//   res.render("login");
// });

// app.get("/register", function (req, res) {

//   res.render("register");
// });


app.get("/home", function (req, res) {

    res.render("home");
  });

app.get("/landing", function (req, res) {

    res.render("landing");
  });

app.get("/", function(req, res) {

  res.render("auth");

  // res.render("landing");
});
  
// app.get("/", function (req, res) {

//     const day = date.getDate;

//     res.render("date", {listTitle: day});
//   });

app.listen(3000, function () {

    console.log("Server is running on port 3000");
} );