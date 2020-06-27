const stringify = require('csv-stringify');
// write data:
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// read data:
const csv = require('csv-parser');
const parse = require('csv-parse');
const fs = require('fs');

module.exports = {
//order of read files during test: original(to bring back to default) > addPerson > new (for remainder)
  readCSV: 
    function readCSV(person, nextAction) {
      const prevData = [];
      // use original.csv to reset (for testing purposes, never overwrite "original.csv" file)
      // keep at new.csv for testing ("new.csv" is overwritten during testing)
      fs.createReadStream('read_write/original.csv')
      .pipe(parse({ delimiter: ',' }))
      .on('data', (row) => {
        prevData.push(row);        
      })
      .on('end', () => {
        prevData.shift(); //remove headers
        console.log('CSV file successfully processed');
        nextAction(person, prevData);
      })
    },

// Add person to existing queue:
//  this person will be added to the end of all queues, and have his own queue filled with prev. people
  addPerson: 
    function addPerson(person, prevData) {
        const newId = prevData.length + 1; //assign Id to new person
        //add new person ID to MatchQueues of all prev persons:
        prevData.map(person => {
          const matchQueueArray = person[3].split(",");
          matchQueueArray.push(newId);
          person[3] = matchQueueArray.toString();//reassign back to person object
        })

        // add new person to persons object (i.e. prevData)
        const newMatchQueue = createUnmatchedIds(prevData);

        const newPerson = [
          newId.toString(),
          person.Name,
          person.Surname,
          newMatchQueue.toString()
        ];
        prevData.push(newPerson);
        
        // write to csv file
        stringify(prevData, { header: true, columns: updatedCols }, (err, output) => {
          if (err) throw err;
          fs.writeFile('read_write/new.csv', output, (err) => {
            if (err) throw err;
            console.log('added person to new.csv.');
          });
        });
    },

  createPairs: 
    function createPairs(undefined, prevData) {
      const pairs = [];
      let newData = [];
      // console.log("createPairs prevData:", prevData);
      while (prevData.length !== 0) {
        if (prevData.length === 1) {//for odd number of people
          newData.unshift(prevData[0]); //add last person to first position of people array
          break;
        }

        const matchQueueArray = prevData[0][3].split(",");
        
        // hold Ids of unmatched persons: 
        const unmatchedIds = createUnmatchedIds(prevData);
    
        let matchId = [];
        // match with first item in matchQueueArray, that is present in unmatchedIds
        for ( i = 0; i < matchQueueArray.length; ++i) {//loop thr match queue 
          if (unmatchedIds.includes(matchQueueArray[i])) {
            matchId = matchQueueArray.splice(i, 1);//remove id from queue on first match   
            break;//end nested loops
          }
        };

        matchPerson = prevData.filter(person => {//find matched person
          return person[0] == matchId;
        });
        
        // console.log("matchPerson: ", matchPerson[0]);
        matchPerson[0] = matchPerson[0] ? removeFromMatchQueue(matchPerson[0], prevData[0][0]) : null;
        
        prevData = prevData.filter(person => {//remove matched person
          return person[0] != matchId;
        });
        
        let pair = [prevData[0][0], matchId[0]];
        
        pairs.push(pair);
        
        prevData[0][3] = matchQueueArray.toString();//reassign back to person object's matchQueue
        
        newData.push(prevData[0]);//add current first person to end of array
        newData.unshift(matchPerson[0]);//add matched person to beg. of array, thereby switching order each week
        
        prevData.shift();//remove person from persons array
      }
      console.log("newData: ", newData);
      console.log("pairs: ", pairs); 
      console.log("prevData: ", prevData);
      
      // writing persons with updated queues to csv:
      stringify(newData, { header: true, columns: updatedCols }, (err, output) => {
        if (err) throw err;
        fs.writeFile('read_write/new.csv', output, (err) => {
          if (err) throw err;
          console.log('new.csv saved.');
        });
      });

      // writing pairs to csv
      stringify(pairs, { header: true, columns: pairCols }, (err, output) => {
        if (err) throw err;
        fs.writeFile('read_write/pairs.csv', output, (err) => {
          if (err) throw err;
          console.log('newPairs.csv saved.');
        });
      });
    } //end of function createPairs
} //end of module.exports

// Assign new queues (newData array) and pairs:
function removeFromMatchQueue(person, removeID) {
  let matchArray = person[3].split(",");

  removeIndex = matchArray.findIndex(num => {
    return (
       num == parseInt(removeID)
    )});

  matchArray.splice(removeIndex, 1);
  person[3] = matchArray.toString() //reassign to person.matchQueue
  return person;
}

function createUnmatchedIds(unmatchedPersons) {//parameter unmatchedPersons is an array of person objects
     // hold Ids of unmatched persons: 
     const unmatchedIds = []
     unmatchedPersons.map(person => {
       unmatchedIds.push(person[0]);
     })
     return unmatchedIds;
}

// write in new queues and pairs:

const updatedCols = {
  Id: 'Id',
  Name: 'Name',
  Surname: 'Surname',
  MatchQueue: 'MatchQueue'
};

const pairCols = {
  item1: 'item1',
  item2: 'item2'
};
// exporting functions