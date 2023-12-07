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

// this is for survey
app.get("/surveyInput", (req, res) => {
    res.render(path.join(__dirname + "/views/surveyInput.ejs"));
});

//survey page requests
app.post("/storeSurvey", (req, res) => {
    // const organizationMapping = {
    //     university: '1',
    //     private: '2',
    //     schoolK12: '3',
    //     company: '4',
    //     government: '5',
    //     other: '6'
        knex("participants").insert({
            age: req.body.age,
            gender: req.body.gender,
            relationship_status: req.body.relationship,
            occupation_status: req.body.occupation,
            organization_id: '1',
            //organization_type: req.body[key] === organizationMapping[key] ? key : null
            location: 'Provo',
            social_media: req.body.use,
            avg_time_spent: req.body.avgtime
        })

        // do organization table

        //knex("social_media_platforms").insert({
            //facebook
        //})

        knex("survey_answers").insert({
            question_id: '1',
            answer: req.body.withPurpose,
            question_id: '2',
            answer: req.body.distractedBusy,
            question_id: '3',
            answer: req.body.restless,
            question_id: '4',
            answer: req.body.distracted,
            question_id: '5',
            answer: req.body.worries,
            question_id: '6',
            answer: req.body.concentrate,
            question_id: '7',
            answer: req.body.oftenCompare,
            question_id: '8',
            answer: req.body.feelCompare,
            question_id: '9',
            answer: req.body.validation,
            question_id: '10',
            answer: req.body.depressed,
            question_id: '11',
            answer: req.body.dailyActivity,
            question_id: '12',
            answer: req.body.sleep
        })

        .then(() => {         res.send("Survey data stored successfully!");     
        })

        .catch((error) => {
            console.error(error);
            res.status(500).send("Error storing survey data");
        });
    });


    // const insertPromises = Object.keys(organizationMapping)
    //     .filter(key => req.body[key] === organizationMapping[key])
    //     .map(key =>
    //         knex("participants").insert({
    //             age: req.body.age,
    //             gender: req.body.gender,
    //             relationship_status: req.body.relationship,
    //             occupation_status: req.body.occupation,
    //             organization_id: '1'
    //             //organization_type: req.body[key] === organizationMapping[key] ? key : null
    //         })
    //     );

    // Promise.all(insertPromises)


app.listen(port, () => console.log("Website started"));