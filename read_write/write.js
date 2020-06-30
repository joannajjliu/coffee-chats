const stringify = require('csv-stringify');
// write data:
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// read data:
const csv = require('csv-parser');
const parse = require('csv-parse');
const fs = require('fs');

module.exports = {
  //place person on-hold, stopping them from further matches
  placeOnHold:
    function placeOnHold(personID) {
      //TBC 
    },
//order of read files during test: original(to bring back to default) > addPerson > new (for remainder)
  readCSV: 
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
    },

// Add person to existing queue:
// this person will be added to the end of all queues, and have his own queue filled with prev. people
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
    function createPairs(undefined, prevData, peopleOnHold) {
      let optimalPairs = [];
      findOptimalPairs('', prevData, '').then(result => {
        optimalPairs = result;
        const newData = updatePeopleData(prevData, optimalPairs);
    
        // writing persons with updated queues to csv:
        stringify(newData, { header: true, columns: updatedCols }, (err, output) => {
          console.log("stringify newData: ", newData);
          if (err) throw err;
          fs.writeFile('read_write/new.csv', output, (err) => {
            if (err) throw err;
            console.log('new.csv saved.');
          });
        });
        // writing pairs to csv:
        stringify(optimalPairs, { header: true, columns: pairCols }, (err, output) => {
          if (err) throw err;
          fs.writeFile('read_write/pairs.csv', output, (err) => {
            if (err) throw err;
            console.log('newPairs.csv saved.');
          });
        });
      })
    }//end of function createPairs
} //end of module.exports

// updatePeopleData processes a previous array of Person data, 
//    and updates their matchQueues based on new pairings from optimalPairs
// input: arrayOf [Person], arrayOf [pair]
// output: arrayOf [Person]
function updatePeopleData(prevData, optimalPairs) {
  let personsData = []
  prevData.map(person => personsData.push(person)); //create copy of personsData to avoid side-effects
  const pairsData = []
  optimalPairs.map(pair => pairsData.push(pair)); //create copy of optimalPairs, to avoid side-effects
  let newPersonsData = []; //will be adding to, and returning this array
  while (pairsData.length > 0) {
    const currPair = pairsData.pop();
    const memOneId = currPair[0];
    const memTwoId = currPair[1];
    const memOneIndex = personsData.findIndex(person => person[0] === memOneId);
    const memTwoIndex = personsData.findIndex(person => person[0] === memTwoId);
    let personOne = personsData[memOneIndex];
    let personTwo = personsData[memTwoIndex];
    const memOneMatchQueue = personOne[3].split(",");
    const memTwoMatchQueue = personTwo[3].split(",");
    const memOneNewMatchQueue = memOneMatchQueue.filter(id => id != memTwoId);
    const memTwoNewMatchQueue = memTwoMatchQueue.filter(id => id != memOneId);
    
    //reassign matchQueues. Index at 3 is the matchQueue:
    personOne[3] = memOneNewMatchQueue.toString();
    personTwo[3] = memTwoNewMatchQueue.toString();

    //insert into newPersonsData array
    const currLength = newPersonsData.length;
    const insertIndexOne = Math.floor(Math.random() * (currLength + 1)); //random int from 0 to currLength
    const insertIndexTwo = Math.floor(Math.random() * (currLength + 1));
    newPersonsData.splice(insertIndexOne, 0, personOne);
    newPersonsData.splice(insertIndexTwo, 0, personTwo);
  }
  return newPersonsData;
}

// Helper functions:
async function findOptimalPairs(filler, prevData, filler2) {
  console.log("prevData: ", prevData);
  const originalPeopleArray = prevData; //array of all people (remains unmodified)

  const maxPairs = Math.floor(prevData.length / 2);
  const stack = [];

  const matchedPeopleArray = []; //ids of matched people; is dynamic
  const nArray = []; //modifiable array of visited n indices, for easier retrieval

  let bestSoFar = []; //store array of pairs (best so far)
  let n = 0; //person index in prevData
  let m = 0; //MatchQueue index

  //iterate until optimal pairings are found, 
  //  or reached end of backtracking:
    while (stack.length != maxPairs) {
      console.log("stackSoFar: ", stack);

        let currM = m; //m of current pair node
        let prevM = m; //m of prev pair node

        //Note to also: *** update n as we proceed ***/

        // find feasible currM, if it exists:
        currM = findLowestMIndex(originalPeopleArray, n, currM, matchedPeopleArray); //update currM
        console.log("currM", currM);

        // When currM dosen't exist:
        while (currM === -1) {//currM dosen't exist, therefore apply operations to go up one node:

          const recentPair = stack.pop(); //pop previous pair and store

          // -- update prevM: --
          const lastAccessedPairFirstPosition = recentPair[0];
          const lastAccessedMatchQueueVal = recentPair[1];
          // const prevN = nArray.pop();
          n = nArray.pop();
          console.log("popped n: ", n);

          const matchQueueArray = originalPeopleArray[n][3].split(",");
          prevM = matchQueueArray.findIndex((elem) => elem === lastAccessedMatchQueueVal);
          prevM += 1; //increment m of previous node
          
          console.log("matchedPeopleArray pre-pop: ", matchedPeopleArray);
          // Also, remove previous people from matchedPeopleArray of ids:
          matchedPeopleArray.pop();
          matchedPeopleArray.pop();
          
          currM = findLowestMIndex(originalPeopleArray, n, prevM, matchedPeopleArray); //update currM
          console.log("new currM: ", currM);

          // check if we've reached end of all backtracks, return function if we have:
          if (currM === -1 && stack.length === 0) {// reached end of function (no optimal result found):
              return bestSoFar; //no optimal solution found, return bestSoFar
          }
      }// end of backtrack while loop
      console.log("completed while loop check");
      // if pair node exists (feasible values left in matchQueue of current person):
        
      //when currM returns with a viable match, create pair from person at position n, and their matchQueue pair at currM:
      const newPair = createSinglePair(originalPeopleArray, n, currM);
      stack.push(newPair);
      console.log("stack after newPair pushed: ", stack);

      // -- add pair to matchedPeopleArray:--
      matchedPeopleArray.push(newPair[0]);
      matchedPeopleArray.push(newPair[1]);

      nArray.push(n); //add current n index to nArray; values in nArray should always be unique and increasing

      // create findNextFeasibleNIndex, greater than inputted n:
      n = findNextFeasibleNIndex(originalPeopleArray, n, matchedPeopleArray); //update n
      console.log("n so far: ",  n);

      if (stack.length > bestSoFar.length) {//update bestSoFar pairs' array as we proceed
        bestSoFar = stack;
      }
    }// end of while loop; an optimal solution found

    console.log(`stack:`, stack);
    return stack;
}

// inputs: arrayOf [people], integer currN, arrayOf matchedPeopleIDs:
// output: integer nextFeasibleN, or -1 if it does not exist
function findNextFeasibleNIndex(peopleArray, currN, matchedPeopleIDs) {
  const doesNotIncludePersonID = (person) => !matchedPeopleIDs.includes(person[0]);
  let feasibleN = peopleArray.findIndex(doesNotIncludePersonID);
  while (feasibleN <= currN && feasibleN != -1) {
    feasibleN = peopleArray.findIndex(doesNotIncludePersonID);
  }
  return feasibleN;
}

// Create only an array containing people IDs, to be reused
// input: array of people (id, first name, surname, matchQueue)
// output: array of only person ids
function createPeopleIdArray(peopleArray) {
    const idArray = [];
    peopleArray.map(person => {
        idArray.push(person[0]); //push on id (at index 0) of person
    })
    return idArray;
}

// Input: arrayOf [people], int nIndex, int startingMIndex, arrayOf int
// Output: lowest possible mIndex int, or -1 if none exists
function findLowestMIndex(originalPeopleArray, nIndex, startingMIndex, matchedIDs) {
    const nPersonMatchQueue = createMatchQueue(originalPeopleArray, nIndex); //nth person's matchQueue array
    let lowestM = [];
    // match with first item in matchQueueArray, that is NOT present in matchedIDs
    for ( i = startingMIndex; i < nPersonMatchQueue.length; ++i) {//loop thr match queue, starting from mIndex
        if (!matchedIDs.includes(nPersonMatchQueue[i])) {//if nPersonMatchQueue[i] is an unmatched person
            lowestM.push(i);
            break; //end nested loops
        }
    };
    if (lowestM.length == 0) {
        return -1; //no matches found
    } else {
        return lowestM[0]; //return lowestM value (an integer)
    }
};

// create single Pair array from person at nIndex, with their matchQueue at mIndex or greater,
//      from peopleArray, taking into account the feasible/remaining unmatched people (i.e. unMatchedIds)
function createSinglePair(peopleArray, nIndex, mIndex) {
    const nPersonMatchQueue = createMatchQueue(peopleArray, nIndex); //nth person's matchQueue array
    const unmatchedIds = createUnmatchedIds(peopleArray); //array of unmatched IDs (i.e. everyone in peopleArray)
    let matchId = [];//array with only max. one value at all times
    // match with first item in matchQueueArray, that is present in unmatchedIds
    for ( i = mIndex; i < nPersonMatchQueue.length; ++i) {//loop thr match queue, starting from mIndex
        if (unmatchedIds.includes(nPersonMatchQueue[i])) {//if matchQueue[i] is an unmatched person
            matchId = nPersonMatchQueue.splice(i, 1);//remove id from queue on first match   
            break;//end nested loops
        }
    };
    if (matchId.length == 0) {//no matches found
        return false;
    } else {//return single pair
        return [peopleArray[nIndex][0], matchId[0]];
    }
}

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