const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const {addPerson, readCSV, createPairs} = require('./read_write/write');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); //serve resources from public folder
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html"); //display content in index.html
    const fName = '';
    const lName = '';
    console.log(`fName: ${fName}, lName: ${lName}`);
});

app.get("/pairs", (req, res) => {
    res.sendFile(__dirname + "/pairs.html"); //display content in pairs.html
});

app.post("/", (req, res) => {
    const fName = req.body.fName;
    const lName = req.body.lName;
    const person = {
        Name: fName,
        Surname: lName
    }
    const peopleOnHold = []
    readCSV(person, addPerson, peopleOnHold);
    res.redirect("/");
});

app.post("/pairs", (req, res) => {
    const person = '';
    const peopleOnHold = []
    readCSV(person, createPairs, peopleOnHold);
    res.redirect("/");
});

const portUsed = process.env.PORT || 5000; //heroku assigned port or port 5000
app.listen(portUsed, () => {
    console.log(`Server is running on port ${portUsed}`);
});