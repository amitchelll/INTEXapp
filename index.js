const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3003;

const users = [{ username: 'admin', password: 'adminpassword'}];

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
 
//login page requests
app.get("/login", (req, res) => {
    res.render(path.join(__dirname + "/views/login.ejs"));
});

// Set the views directory explicitly
app.set("views", path.join(__dirname, "views"));

//create account page requests
app.get("/createAccount", (req, res) => {
    res.render("createAccount");
});

app.post("/login", (req, res) => {
    const {username, password } = req.body

const user = users.find(u => u.username === username && u.password === password);

console.log('gah', user);

if (user) {
        knex.select('participant_id', 'timestamp', 'age', 'gender', 'relationship_status', 'occupation_status', 'organization', 'location', 'social_media', 'avg_time_spent', 'withoutpurpose', 'distractedbusy', 'restless', 'distracted', 'worries', 'concentrate', 'oftencompare', 'feelcompare', 'validation', 'depressed', 'dailyactivity', 'sleep')
        .from('participants')
        .then(participants => {console.log('Data fetched successfully:', participants[0])

    res.render('viewData', {myparticipants: participants})
    })
    .catch(error => {
        console.error('error fetching data:', error);
        res.status(500).send('Internal Server Error')
    });
    } else {
        res.render('login', {error: 'Invalid username or password'});
    }
});
//array stuff
app.post('/createAccount', (req, res) => {
    const { username, password} = req.body
    //check if the username already exists
    const existingUser = users.find(login => login.username === username)

    if (existingUser) {
        res.render('createAccount', {successMessage : null, error: 'Username already exists. Please choose another username.'});
    } else {
        users.push({username, password})
        setTimeout(() => {
            res.render('createAccount', {successMessage: 'Account created successfully!', error:null})

        }, 1000)
    }
    
})

//adminaccess.ejs
app.get("/adminaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/adminaccess.ejs"));
});

//councilaccess.ejs
app.get("/councilaccess", (req, res) => {
    res.render(path.join(__dirname + "/views/councilaccess.ejs"));
});

//city view data page requests
// const locationsArray = ['Plainsville', 'Provo'];

app.get("/viewData", (req, res) => {
    knex
        .select()
        .from("participants")
        .then(participants => {
            res.render("viewData", { myparticipants: participants});
            })
         //Execute the query and render the view with filtered or all participants
        //  query.then(participants =>
        //     {res.render("viewData", { myparticipants: participants}); 
        // }).catch(error => {
  
        //     res.status(500).send('Error retrieving participants');
        // });
        
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
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error storing survey data");
        });
});

    app.listen(port, () => console.log("Website started"));
