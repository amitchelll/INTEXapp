const express = require("express");

let app = express();

let path = require("path");

const port = 3000;

app.use(express.urlencoded({extended: true}));

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