
const { addPerson, readCSV, createPairs } = require('../write');
const { generateRandomString } = require('./generate_random_string');

//this function doesn't yet work when variable peopleToAdd > 1 (probably to do with streams; need to look into it)
function addPeople() {
    let peopleToAdd = 1;
    while (peopleToAdd > 0) {
        //generate random string (same length for first and surname):
        const randomLength = (Math.ceil(Math.random() * 10)); //any length between 1 and 10
        const fName = generateRandomString(randomLength);
        const lName = generateRandomString(randomLength);

        const person = {
            Name: fName,
            Surname: lName
        }
        readCSV(person, addPerson, []).then(
            peopleToAdd -= 1
        );
        
    }
}

addPeople();
