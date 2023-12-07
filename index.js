const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3003;

const bcrypt = require('bcrypt')

const session = require('express-session')

const flash = require('express-flash')

const passport = require('passport')

initialize(passport)

//middleware
app.set("view engine", "ejs")

app.use(express.urlencoded({extended: true}));

app.use('/css', express.static(path.join(__dirname, 'views/css')));

app.use('/js', express.static(path.join(__dirname, 'views/js')));

app.use('/img', express.static(path.join(__dirname, 'views/img')));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())

app.use(passport.session())

app.use(flash({
    
}))

//passport stuff
    //const {pool} = require("./dbConfig");
function initialize(passport) {

    const authenticateUser = (username, password, done) => {
        knex.raw(
            `SELECT * FROM login WHERE username = $1`, [username], (err, results)=> {
                if(err){
                    throw err;
                }
                console.log(results.rows)
                if (results.rows.length > 0) {
                    const user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch)=> {
                        if (err){
                            throw err
                        }
                        if (isMatch){
                            return done(null, user)
                        } else{
                            return done(null, false, {message: "Password is not correct."})
                        }
                    })
                } else {
                    return done(null, false, {message: "User is not registered."})
                }
            } 
        )
    }
    const LocalStrategy = require("passport-local").Strategy;
    passport.use(
        new LocalStrategy(
            {
                usernameField: "username",
                passwordField: "password"
            }, 
            authenticateUser
        )
    );
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        knex.raw(`SELECT * FROM login WHERE id = $1`, [id], (err, results)=> {
            if (err){
                throw err
            }
            return done(null, results.rows[0]);
        })
    })
}

module.exports = initialize


const knex = require("knex")({ // this is the database
        client: "pg",
        connection: {
            host: process.env.RDS_HOSTNAME || "mental-health.c5d3qntj7b7x.us-east-1.rds.amazonaws.com", 
            user: process.env.RDS_USERNAME || "postgres",
            password: process.env.RDS_PASSWORD || "password",
            database: process.env.RDS_DB_NAME || "postgres",
            port: process.env.RDS_PORT || 5432,
            ssl: {rejectUnauthorized: false},
        }
    })

app.get("/", (req, res) => {
    res.render(path.join(__dirname + "/views/index.ejs"));
});

//dashboard
app.get("/resources", (req, res) => {
    res.render(path.join(__dirname + "/views/resources.ejs"));
});

//dashboard test requests
app.get("/dashboardtest", checkNotAuthenticated, (req, res) => {
    res.render("dashboardtest", { user: req.user.first_name });
  });

  app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });

  
//login page requests
app.get("/login", checkAuthenticated, (req, res) => {
    res.render(path.join(__dirname + "/views/login.ejs"));
});

//create account page requests
app.get("/createAccount", checkAuthenticated, (req, res) => {
    res.render(path.join(__dirname + "/views/createAccount.ejs"));
});
app.post("/createAccount", async (req, res) => {
    let {first_name, last_name, username, password, password2} = req.body

    console.log({
        first_name,
        last_name,
        username,
        password,
        password2
    })

    let errors =[]
    
    if (!first_name || !last_name || !username || !password || !password2) {
        errors.push({message: "Please enter all fields."})
    }
    if (password.length < 6) {
        errors.push({message: "Password should be at least 6 characters."})
    }
    if (password != password2) {
        errors.push({message: "Passwords do not match."})
    }
    if (errors.length> 0) {
        res.render("createAccount", {errors})
    }else {
        //form validation has passed

        let hashedPassword = await bcrypt.hash(password, 10)
        console.log(hashedPassword);

    knex.raw(
        'SELECT * FROM login WHERE username = $1', [username], (err, results) => {
            if (err){
                throw err
            }
        
            console.log(results.rows);

            if (results.rows.length > 0){
                errors.push({message: "User already registered"});
                res.render('/createAccount', { errors })
            }else {
                knex.raw(`INSERT INTO login (first_name, last_name, username, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id, password`, [first_name, last_name, username, hashedPassword], (err, results) => {
                    if (err){
                        throw err 
                    }
                    console.log(results.rows);
                    req.flash('success_msg', "You have created an account successfully. Please log in!")
                    res.redirect('/login')
                })
            }
        }
    )
    }

});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboardtest',
    failureRedirect: '/login', 
    failureFlash: true
}));

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return res.redirect('/dashboardtest')
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

//adminaccess.ejs
app.get("/adminaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/adminaccess.ejs"));
});

//councilaccess.ejs
app.get("/councilaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/councilaccess.ejs"));
});

//city view data page requests
const locationsArray = ['Plainsville', 'Provo'];

app.get("/viewData", (req, res) => {
    let query = knex
        .select()
        .from("participants")
        .innerjoin("social_media_platforms", "participants.participant_id", "social_media_platforms.participant_id")
        
    // Extract the location filter value from the request query
    const locationFilter = req.query.location;
  
    // Apply location filtering if a location is selected
    if (locationFilter && locationFilter !== '') {
      query = query.where('location', locationFilter);
    }
  
    // Execute the query and render the view with filtered or all participants
    query.then(participants => {
        res.render("viewData", { myparticipants: participants, locations: locationsArray, locationFilter: locationFilter  });
    }).catch(error => {
      // Handle errors
    //   console.log('Selected Location:', selectedLocation);
      res.status(500).send('Error retrieving participants');
    });
});

// this is for survey
app.get("/surveyInput", (req, res) => {
    res.render(path.join(__dirname + "/views/surveyInput.ejs"));
});

//survey page requests
app.post("/storeSurvey", (req, res) => {
    const participantsData = {
        timestamp: knex.fn.now(),
        location: "Provo",
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationship_status,
        occupation_status: req.body.occupation_status,
        social_media: req.body.social_media,
        avg_time_spent: req.body.avg_time_spent,
        withoutpurpose: req.body.withoutpurpose,
        distractedbusy: req.body.distractedbusy,
        restless: req.body.restless,
        distracted: req.body.distracted,
        worries: req.body.worries,
        organization: req.body.organization,
        concentrate: req.body.concentrate,
        oftencompare: req.body.oftencompare,
        feelcompare: req.body.feelcompare,
        validation: req.body.validation,
        depressed: req.body.depressed,
        dailyactivity: req.body.dailyactivity,
        sleep: req.body.sleep,
        facebook: req.body.facebook,
        twitter: req.body.twitter,
        instagram: req.body.instagram,
        youtube: req.body.youtube,
        discord: req.body.discord,
        reddit: req.body.reddit,
        pinterest: req.body.pinterest,
        snapchat: req.body.snapchat,
        tiktok: req.body.tiktok
    };


    // this is for participants
    knex("participants")
        .insert(participantsData)
        .then(() => {
            // Redirect only after the participantsData has been inserted
            // Otherwise, it might redirect before the socialMediaData is inserted
            res.redirect("/");

            // this is for socialMedia
            knex("social_media_platforms")
                .insert(socialMediaData)
                .then(() => {
                    console.log("Survey data stored successfully");
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send("Error storing social media data");
                });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error storing survey data");
        });
});

    app.listen(port, () => console.log("Website started"));
