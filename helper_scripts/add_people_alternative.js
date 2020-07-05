/* by adjusting the fourth parameter in readCSV, the number of people can be added to new.csv */

const stringify = require('csv-stringify');
// read data:
const parse = require('csv-parse');
const fs = require('fs');

const { generateRandomString } = require('./generate_random_string');

readCSV('',addPeople,'',500);//change last parameter to desired number of additional people, added to csv file
/*approximate add times using the below functions: 
    +250 to already 250: 3.341 secs
    +500 to already 500: 28.426 secs
*/

async function readCSV(person, callback, peopleOnHold, numberPeople) {
    const previousPeopleData = [];
    // use original.csv to reset (for testing purposes, never overwrite "original.csv" file)
    // keep at new.csv for testing ("new.csv" is overwritten during testing)

    await fs.createReadStream('read_write/new.csv') //change the file names to "test[].csv", to check it passes some previously failed tests
    .pipe(parse({ delimiter: ',' }))
    .on('data', (row) => {
    previousPeopleData.push(row);        
    })
    .on('end', () => {
        previousPeopleData.shift(); //remove headers
        console.log('CSV file successfully processed');
        callback(person, previousPeopleData, peopleOnHold, numberPeople);
    })
}

// Add person to existing queue:
// this person will be added to the end of all queues, and have his own queue filled with prev. people
function addPeople(newPerson, previousPeopleData, peopleOnHold, numberPeople) {
    //create copy of previousPeopleData into peopleData
    const peopleData = [];
    previousPeopleData.map(person => peopleData.push(person));

    while (numberPeople > 0) {
        numberPeople -= 1;
        const newID = peopleData.length + 1; //assign Id to new person

        //generate random string (same length for first and surname):
        const randomLength = (Math.ceil(Math.random() * 10)); //any length between 1 and 10
        const fName = generateRandomString(randomLength);
        const lName = generateRandomString(randomLength);
    
        const person = {
            Name: fName,
            Surname: lName
        }
    
        //add new person ID to MatchQueues of all previous persons:
        peopleData.map(person => {
            const matchQueueArray = person[3].split(",");
            matchQueueArray.push(newID);
            person[3] = matchQueueArray.toString();//reassign back to person object
        })
    
        // add new person to persons object (i.e. peopleData)
        const newMatchQueue = createUnmatchedIds(peopleData);
    
        const newPerson = [
            newID.toString(),
            person.Name,
            person.Surname,
            newMatchQueue.toString()
        ];
        peopleData.push(newPerson);
    }
    
    
    // write to csv file
    stringify(peopleData, { header: true, columns: PERSON_COLUMNS }, (err, output) => {
    if (err) throw err;
    fs.writeFile('read_write/new.csv', output, (err) => {
        if (err) throw err;
        console.log('added person to new.csv.');
    });
    });
}

function createUnmatchedIds(unmatchedPersons) {//parameter unmatchedPersons is an array of person objects
    // hold Ids of unmatched persons: 
    const unmatchedIds = []
    unmatchedPersons.map(person => {
      unmatchedIds.push(person[0]);
    })
    return unmatchedIds;
}

const PERSON_COLUMNS = {
    Id: 'Id',
    Name: 'Name',
    Surname: 'Surname',
    MatchQueue: 'MatchQueue'
  };