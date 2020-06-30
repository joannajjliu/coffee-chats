// The initial dumb algorithm that stops running after a point (kept for possible reference):
// press "ctrl + alt + n" in vscode to run

//imports:
const stringify = require('csv-stringify');
// write data:
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// read data:
const csv = require('csv-parser');
const parse = require('csv-parse');
const fs = require('fs');
const { match } = require('assert');

// run createPairs
// readCSV('', createPairs, '');

readCSV('', createPairsTwo, '');

function readCSV(person, nextAction, peopleOnHold) {
    const prevData = [];
    // use original.csv to reset (for testing purposes, never overwrite "original.csv" file)
    // keep at new.csv for testing ("new.csv" is overwritten during testing)
    fs.createReadStream('read_write/new.csv')
    .pipe(parse({ delimiter: ',' }))
    .on('data', (row) => {
        prevData.push(row);        
    })
    .on('end', () => {
        prevData.shift(); //remove headers
        console.log('CSV file successfully processed');
        nextAction(person, prevData, peopleOnHold);
    })
}

function createPairs(undefined, prevData, peopleOnHold) {
    const pairs = [];
    let newData = [];
    while (prevData.length !== 0) {
      if (prevData.length === 1) {//for odd number of people
        newData.unshift(prevData[0]); //add last person to first position of people array
        break;
      }

      const matchQueueArray = prevData[0][3].split(",");
      
      // hold Ids of unmatched persons: 
      const unmatchedIds = createUnmatchedIds(prevData);
      console.log(`unmatchedIds: ${unmatchedIds}`);
  
      let matchId = [];
      // match with first item in matchQueueArray, that is present in unmatchedIds
      for ( i = 0; i < matchQueueArray.length; ++i) {//loop thr match queue 
        if (unmatchedIds.includes(matchQueueArray[i])) {
          matchId = matchQueueArray.splice(i, 1);//remove id from queue on first match   
          break;//end nested loops
        }
      };
      console.log(`matchId: ${matchId}`);
      // when no one matches with current person (i.e. first person in previous data array)
      // if (matchId.length == 0) {
        // matchId.push("no person");
      // }

      matchPerson = prevData.filter(person => {//find matched person
        return person[0] == matchId;
      });
      
      matchPerson[0] = matchPerson[0] ? removeFromMatchQueue(matchPerson[0], prevData[0][0]) : null;
      
      prevData = prevData.filter(person => {//remove matched person
        return person[0] != matchId;
      });
      
      let pair = [prevData[0][0], matchId[0]];
      
      pairs.push(pair);
      
      prevData[0][3] = matchQueueArray.toString();//reassign back to person object's matchQueue
      
      newData.push(prevData[0]);//add current first person to end of array

      // if (matchPerson[0]) {//if matchPerson exists,
      newData.unshift(matchPerson[0]);//add matched person to beg. of array, thereby switching order each week
      // }

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

// Return matchQueue array for person at index, of personsArray:
function createMatchQueue(personsArray, index) {
    return personsArray[index][3].split(","); 
}

// Assign new queues (newData array) and pairs:
//  Inputs: person array, and ID to be removed from person's matchQueue
//  Output: new person array, with matchQueue modified
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