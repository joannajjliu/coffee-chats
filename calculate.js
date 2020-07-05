const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const {addPerson, addOnHoldPerson, readCSV, createPairs} = require('./write');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); //serve resources from public folder
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html"); //display content in index.html
});

app.get("/pairs", (req, res) => {
    res.sendFile(__dirname + "/pairs.html"); //display content in pairs.html
});

app.post("/", (req, res) => {
    const fName = req.body.fName || undefined;
    const lName = req.body.lName || undefined;
    const onHoldID = req.body.personID || 0;
    console.log("fName:", fName);
    console.log("lName:", lName);
    console.log("onHoldID:", onHoldID);
    if (fName || lName) {
        console.log("fName/lName values entered");
        const person = {
            Name: fName,
            Surname: lName
        }
        readCSV(person, addPerson, 0);
        res.redirect("/");
    }
    if (onHoldID) {
        console.log("onHoldID value entered", onHoldID);
        readCSV('', addOnHoldPerson, onHoldID);
        res.redirect("/");
    }
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