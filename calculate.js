const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const {addPerson, readCSV, createPairs} = require('./read_write/write');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

//declaring global variables:
let fName = '';
let lName = '';

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html"); //display content in index.html
    console.log(`fName: ${fName}, lName: ${lName}`);
});

app.post("/", (req, res) => {
    fName = req.body.fName;
    lName = req.body.lName;
    const person = {
        Name: fName,
        Surname: lName
    }
    readCSV(person, addPerson);
    res.redirect("/");
});

app.post("/pairs", async (req, res, next) => {
    const person = '';

    await readCSV(person, createPairs);
    next();
    
    res.redirect("/");
});

const portUsed = process.env.PORT || 5000; //heroku assigned port or port 5000
app.listen(portUsed, () => {
    console.log(`Server is running on port ${portUsed}`);
});