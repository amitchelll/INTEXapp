const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3001;

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

//login page requests
app.get("/login", (req, res) => {
    res.render(path.join(__dirname + "/views/login.ejs"));
});

//create account page requests
app.get("/createAccount", (req, res) => {
    res.render(path.join(__dirname + "/views/createAccount.ejs"));
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
    let query = knex.select("participant_id", "timestamp", "age", "gender", "relationship_status", "occupation_status", 
                            "organization_id", "location", "social_media", "avg_time_spent")
                   .from("participants");
  
    // Extract the location filter value from the request query
    const locationFilter = req.query.location;
  
    // Apply location filtering if a location is selected
    if (locationFilter && locationFilter !== 'all') {
      query = query.where('location', locationFilter);
    }
  
    // Execute the query and render the view with filtered or all participants
    query.then(participants => {
        res.render("viewData", { myparticipants: participants, locations: locationsArray });
    }).catch(error => {
      // Handle errors
      console.error(error);
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

app.listen(port, () => console.log("Website started"));