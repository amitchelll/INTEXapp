const express = require("express");

let app = express();

let path = require("path");

const port = 3001;

app.use(express.urlencoded({extended: true}));

app.set("view engine", "ejs")

const knex = require("knex")({ // this is the database
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost", 
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Ptennis1",
        database: process.env.RDS_DB_NAME || "survey",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/displaySurvey", (req, res) => {
    res.sendFile(path.join(__dirname + "/surveyInput.html"));
});

app.post("/storeSurvey", (req, res) => {
    let sOutput;

    sOutput = "Age: " + req.body.age;

    res.send(sOutput);
});

app.listen(port, () => console.log("Website started"));