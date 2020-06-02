const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html"); //display content in index.html
});

app.post("/", (req, res) => {
    const fName = req.body.fName;
    const lName = req.body.lName;
});

const portUsed = process.env.PORT || 3000; //heroku assigned port or port 3000
app.listen(portUsed, () => {
    console.log(`Server is running on port ${portUsed}`);
});