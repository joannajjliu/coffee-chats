// write data:
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// read data:
const csv = require('csv-parser');
const fs = require('fs');

module.exports = {
//order of read files during test: original(to bring back to default) > addPerson > new (for remainder)
  readCSV: 
    function readCSV(person, callback) {
      const prevData = [];
      fs.createReadStream(`read_write/new.csv`)
      .pipe(csv())
      .on('data', (row) => {
        prevData.push(row);
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
        callback(person, prevData);
      });
    },

// Add person to existing queue:
//  this person will be added to the end of all queues, and have his own queue filled with prev. people
  addPerson: 
    function addPerson(person, prevData) {
        const newId = prevData.length + 1; //assign Id to new person
        //add new person ID to MatchQueues of all prev persons:
        prevData.map(person => {
          const matchQueueArray = person.MatchQueue.split(",");
          matchQueueArray.push(newId);
          person.MatchQueue = matchQueueArray.toString();//reassign back to person object
        })

        // add new person to persons object (i.e. prevData)
        const newMatchQueue = createUnmatchedIds(prevData);
        const newPerson = {
          Id: newId.toString(),
          Name: person.Name,
          Surname: person.Surname,
          MatchQueue: newMatchQueue.toString()
        };
        prevData.push(newPerson);
        
        // write to csv file
        const addPersonWriter = createCsvWriter({
          path: 'read_write/addPerson.csv',
          header: [
              {id: 'Id', title: 'Id'},
              {id: 'Name', title: 'Name'},
              {id: 'Surname', title: 'Surname'},
              {id: 'MatchQueue', title: 'MatchQueue'}
            ]
        });

        addPersonWriter
        .writeRecords(prevData)
        .then(() => {
          console.log('The person was successfully added to PREV csv file')
        });
      },

  createPairs: 
    function createPairs(undefined, prevData) {
      const pairs = [];
      let newData = [];
      while (prevData.length !== 0) {
        if (prevData.length === 1) {//for odd number of people
          newData.unshift(prevData[0]); //add last person to first position of people array
          break;
        }
        const matchQueueArray = prevData[0].MatchQueue.split(",");
        
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
          return person.Id == matchId;
        });
        
        matchPerson[0] = matchPerson[0] ? removeFromMatchQueue(matchPerson[0], prevData[0].Id) : null;
        
        prevData = prevData.filter(person => {//remove matched person
          return person.Id != matchId;
        });
        
        let pair = [prevData[0].Id, matchId[0]];
        let pair_Controller = {
          pairList: pair
        };
        pairs.push(pair_Controller);
        
        prevData[0].MatchQueue = matchQueueArray.toString();//reassign back to person object
        
        newData.push(prevData[0]);//add current first person to end of array
        newData.unshift(matchPerson[0]);//add matched person to beg. of array, thereby switching order each week
        
        prevData.shift();//remove person from persons array
      }
      console.log("newData: ", newData);
      console.log("pairs: ", pairs); 
      console.log("prevData: ", prevData);

      newCsvWriter
      .writeRecords(newData)
      .then(()=> console.log('The NEW CSV file was written successfully'));
    
      pairsCsvWriter
      .writeRecords(pairs)
      .then(()=> console.log('The pairs file was written successfully'));
    }
} //end of module.exports

// Assign new queues (newData array) and pairs:
function removeFromMatchQueue(person, removeID) {
  let matchArray =  person.MatchQueue.split(",");

  removeIndex = matchArray.findIndex(num => {
    return (
       num == parseInt(removeID)
    )});

  matchArray.splice(removeIndex, 1);
  person.MatchQueue = matchArray.toString()
  return person;
}

function createUnmatchedIds(unmatchedPersons) {//parameter unmatchedPersons is an array of person objects
     // hold Ids of unmatched persons: 
     const unmatchedIds = []
     unmatchedPersons.map(person => {
       unmatchedIds.push(person.Id);
     })
     return unmatchedIds;
}

// write in new queues and pairs:
const newCsvWriter = createCsvWriter({
  path: 'read_write/new.csv',
  header: [
    {id: 'Id', title: 'Id'},
    {id: 'Name', title: 'Name'},
    {id: 'Surname', title: 'Surname'},
    {id: 'MatchQueue', title: 'MatchQueue'}
  ]
});

const pairsCsvWriter = createCsvWriter({
  path: 'read_write/pairs.csv',
  header: [
    {id: 'pairList', title: 'pairList'}
  ]
});

// exporting functions