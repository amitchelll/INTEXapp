const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3001;

app.set("view engine", "ejs")

app.use(express.urlencoded({extended: true}));

app.use('/css', express.static(path.join(__dirname, 'views/css')));

const knex = require("knex")({ // this is the database
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost", 
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "danielle1",
        database: process.env.RDS_DB_NAME || "ebdb",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
})

app.get("/", (req, res) => {
    res.render(path.join(__dirname + "/views/index.ejs"));
});
//dashboard
app.get("/dashboard", (req, res) => {
    res.render(path.join(__dirname + "/views/dashboard.ejs"));
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

//councilaccess.ejs

//city view data page requests
app.get("/viewData", (req, res) => {
    res.render(path.join(__dirname + "/views/viewData.ejs"));

    knex.select().from("participants").then( participants  => {
        res.render("displaydata", { myparticipants : participants});
    })
});
//survey page requests
app.get("/displaySurvey", (req, res) => {
    res.render(path.join(__dirname + "/views/surveyInput.ejs"));
});

app.post("/storeSurvey", (req, res) => {
    let sOutput;

    sOutput = "Age: " + req.body.age;

    res.send(sOutput);
});

app.listen(port, () => console.log("Website started"));