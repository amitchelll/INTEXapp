const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3002;
const bcrypt = require('bcrypt')

app.set("view engine", "ejs")

app.use(express.urlencoded({extended: true}));

app.use('/css', express.static(path.join(__dirname, 'views/css')));

app.use('/js', express.static(path.join(__dirname, 'views/js')));

app.use('/img', express.static(path.join(__dirname, 'views/img')));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

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

app.get("/", (req, res) => {
    res.render(path.join(__dirname + "/views/index.ejs"));
});

//dashboard
app.get("/resources", (req, res) => {
    res.render(path.join(__dirname + "/views/resources.ejs"));
});

//dashboard test requests
app.get("/dashboardtest", (req, res) => {
    res.render("dashboardtest", { user: "Conner" });
  });
  
//login page requests
app.get("/login", (req, res) => {
    res.render(path.join(__dirname + "/views/login.ejs"));
});

//create account page requests
app.get("/createAccount", (req, res) => {
    res.render(path.join(__dirname + "/views/createAccount.ejs"));
});
app.post("/createAccount", async (req, res) => {
    let {firstname, lastname, username, password, password2} = req.body

    console.log({
        firstname,
        lastname,
        username,
        password,
        password2
    })

    let errors =[]
    
    if (!firstname || !lastname || !username || !password || !password2) {
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

    pool.query(
        'SELECT * FROM login WHERE username = $1', [username], (err, results) => {
            if (err){
                throw err
            }
        
            console.log(results.rows);

            if (results.rows.length > 0){
                errors.push({message: "User already registered"});
                res.render('/createAccount', { errors })
            }
        }
    )
    }

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
const locationsArray = ['Plainsville', 'Provo'];

app.get("/viewData", (req, res) => {
    let query = knex
        .select(
            'participants.participant_id',
            'participants.timestamp',
            'participants.age',
            'participants.gender',
            'participants.relationship_status',
            'participants.occupation_status',
            'participants.organization_id',
            'participants.location',
            'participants.social_media',
            'participants.avg_time_spent',
            'survey_answers.question_id',
            'survey_answers.answer'
        )
        .from("participants")
        .innerJoin('survey_answers', 'participants.participant_id', 'survey_answers.participant_id')
        .innerJoin('survey_questions', 'survey_answers.question_id', 'survey_questions.question_id');
        
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
      console.log('Selected Location:', selectedLocation);
      res.status(500).send('Error retrieving participants');
    });
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

app.get("/addCountry", (req, res) => {
    res.render("addCountry");
 })
 app.post("/addCountry", (req, res)=> {
    knex("country").insert({
      country_name: req.body.country_name.toUpperCase(),
      popular_site: req.body.popular_site.toUpperCase(),
      capital: req.body.capital.toUpperCase(),
      population: req.body.population,
      visited: req.body.visited ? "Y" : "N",
      covid_level: req.body.covid_level.toUpperCase()
   }).then(mycountry => {
      res.redirect("/");
   })
 });

app.listen(port, () => console.log("Website started"));