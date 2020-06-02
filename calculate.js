const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const addPerson = require('./read_write/write');

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
    const prevData = [
        {
        Id: 1,
        Name: 'John',
        Surname: 'Snow',
        MatchQueue: '2,3,4,5'
        }, {
        Id: 2,
        Name:'Clair',
        Surname: 'White',
        MatchQueue: '1,3,4,5'
        }
    ]
    addPerson(person, prevData);
    res.redirect("/");
});

const portUsed = process.env.PORT || 5000; //heroku assigned port or port 5000
app.listen(portUsed, () => {
    console.log(`Server is running on port ${portUsed}`);
});