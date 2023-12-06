
//normal setup
const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3002;

//passport setup
require("dotenv").config();
const PORT = process.env.PORT || 5000
var flash = require("connect-flash");
var passport = require("passport");
//var axios = require("axios");
var session = require("express-session");
var bodyParser = require("body-parser");

//normal setup
app.set("view engine", "ejs")

app.use(express.urlencoded({extended: true}));

app.use('/css', express.static(path.join(__dirname, 'views/css')));

app.use('/js', express.static(path.join(__dirname, 'views/js')));

app.use('/img', express.static(path.join(__dirname, 'views/img')));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

//passport setup
app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
const expressSession = require("express-session");
app.use(expressSession({secret: "mySecretKey"}));
app.use(passport.initialize());
app.use(passport.session());
app.use("/public", express.static(__dirname + "/public"));
app.use(flash());
app.use(session({secret: 'your-secret-key',
resave: false,
saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view options", { layout: false });

//passport routes
//const { knex, Client } = require("pg")
const bcrypt = require("bcrypt")
const { v4: uuidv4 } = require('uuid');
const LocalStrategy = require("passport-local").Strategy;
const knex = require("knex")({ // this is the database
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost", 
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "password",
        database: process.env.RDS_DB_NAME || "ebdb",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
})
app.use(express.static("public"));
passport.use('local', new LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
 
    loginAttempt();
    async function loginAttempt() {
    
    
    const client = await knex.connect()
    try{
    await client.query('BEGIN')
    var currentAccountsData = await JSON.stringify(client.query('SELECT id, "firstname", "username", "password” FROM “users” WHERE “username”=$1', [username], function(err, result) {
    
    if(err) {
    return done(err)
    } 
    if(result.rows[0] == null){
    req.flash('danger', "Oops. Incorrect login details.");
    return done(null, false);
    }
    else{
    bcrypt.compare(password, result.rows[0].password, function(err, check) {
    if (err){
    console.log('Error while checking password');
    return done();
    }
    else if (check){
    return done(null, [{email: result.rows[0].email, firstName: result.rows[0].firstName}]);
    }
    else{
    req.flash('danger', "Oops. Incorrect login details.");
    return done(null, false);
    }
    });
    }
    }))
    }
    
    catch(e){throw (e);}
    };
    
   }
   ))
   passport.serializeUser(function(user, done) {
    done(null, user);
   });
   passport.deserializeUser(function(user, done) {
    done(null, user);
   });

//NORMAL ROUTES
app.get("/", (req, res) => {
    res.render(path.join(__dirname + "/views/index.ejs"));
});

//dashboard
app.get("/resources", (req, res) => {
    res.render(path.join(__dirname + "/views/resources.ejs"));
});

//login page requests
app.get('/login', function (req, res, next) {
    if (req.isAuthenticated()) {
    res.redirect('/account');
    }
    else{
    res.render('login', {title: 'Log in', userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
    }
    
    });
    
app.post('/login', passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: '/login',
    failureFlash: true
    }), function(req, res) {
    if (req.body.remember) {
    req.session.cookie.maxAge = 1 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
    req.session.cookie.expires = false; // Cookie expires at end of session
    }
    res.redirect('/');
    });

//create logout page requests
app.get('/logout', function(req, res){
 
    console.log(req.isAuthenticated());
    req.logout();
    console.log(req.isAuthenticated());
    req.flash('success', 'Logged out. See you soon!');
    res.redirect('/');
    });

//create account page requests
app.get("/createAccount", (req, res) => {
    res.render(path.join(__dirname + "/views/createAccount.ejs"));
});

app.get("/createAccount", function (req, res, next) {
    res.render("createAccount", {title: 'CreateAccount', userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
    });
    
    
app.post('/createAccount', async function (req, res) {

try{
const client = await knex.connect()
await client.query('BEGIN')
var pwd = await bcrypt.hash(req.body.password, 5);
await JSON.stringify(client.query('SELECT id FROM “login” WHERE “username”=$1', [req.body.username], function (err, result) {
        if (result.rows[0]) {
            req.flash('warning', "This username is already registered. <a href='/login'>Log in!</a>");
            res.redirect('/createAccount');
        }
        else {
            client.query(INSERT, INTO, users(id, firstname, lastname, username, password), VALUES($1, $2, $3, $4, $5), [uuidv4(), req.body.firstname, req.body.lastname, req.body.username, pwd], function (err, result) {
                if (err) { console.log(err); }
                else {

                    client.query(COMMIT);
                    console.log(result);
                    req.flash('Success', 'User created.');
                    res.redirect('/login');
                    return;
                }
            });


        }

    }));
client.release();
} 
catch(e){throw(e)}
});

//adminaccess.ejs
app.get("/adminaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/adminaccess.ejs"));
});

//councilaccess.ejs
app.get("/councilaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/councilaccess.ejs"));
});

//city view data page requests
app.get("/viewData", (req, res) => {
    knex.select("participant_id", "timestamp", "age", "gender", "relationship_status", "occupation_status", 
                "organization_id", "location", "social_media", "avg_time_spent").from("participants").then( participants  => {
        res.render("viewData", { myparticipants : participants});
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
});
// account page requests
app.get('/account', function (req, res, next) {
    if(req.isAuthenticated()){
    res.render('account', {title: 'Account', userData: req.user, userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
    }
    else{
    res.redirect('/login');
    }
    });

//survey page requests
app.get("/surveyInput", (req, res) => {
    res.render(path.join(__dirname + "/views/surveyInput.ejs"));
});

app.post("/storeSurvey", (req, res) => {
    let sOutput;

    sOutput = "Age: " + req.body.age;

    res.send(sOutput);
});

app.listen(port, () => console.log("Website started"));