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

readCSV('', findOptimalPairs, '');

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

// Helper functions:
function findOptimalPairs(filler, prevData, filler2) {
  console.log("prevData: ", prevData);
  const originalPeopleArray = prevData; //array of all people (remains unmodified)
  const originalIdArray = createPeopleIdArray(prevData); //storage of original Ids, pre-modification
  
  const maxPairs = Math.floor(prevData.length / 2);
  const stack = [];

  const remainingPeopleArray = createPeopleIdArray(prevData); //ids of remaining people; is dynamic - order dosen't matter
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
          const prevN = nArray.pop();

          const matchQueueArray = originalPeopleArray[prevN][3].split(",");
          prevM = matchQueueArray.findIndex((elem) => elem === lastAccessedMatchQueueVal);
          prevM += 1; //increment m of previous node
          
          console.log("matchedPeopleArray pre-pop: ", matchedPeopleArray);
          // Also, remove previous people from matchedPeopleArray of ids:
          matchedPeopleArray.pop();
          matchedPeopleArray.pop();
          
          currM = findLowestMIndex(originalPeopleArray, prevN, prevM, matchedPeopleArray); //update currM
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
// output: integer nextFeasibleN
function findNextFeasibleNIndex(peopleArray, currN, matchedPeopleIDs) {
  const doesNotIncludePersonID = (person) => !matchedPeopleIDs.includes(person[0]);
  let feasibleN = peopleArray.findIndex(doesNotIncludePersonID);
  while (feasibleN <= currN) {
    feasibleN = peopleArray.findIndex(doesNotIncludePersonID);
  }
  return feasibleN;
}

// input: Array, Int (for now), function
// output: desired index
// function myFindIndex(array, condition) {
//   array.map(condition(val));
// }

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
//      from remainingPeopleArray, taking into account the feasible/remaining unmatched people (i.e. unMatchedIds)
function createSinglePair(remainingPeopleArray, nIndex, mIndex) {
    const pair = [];
    const nPersonMatchQueue = createMatchQueue(remainingPeopleArray, nIndex); //nth person's matchQueue array
    const unmatchedIds = createUnmatchedIds(remainingPeopleArray); //array of unmatched IDs (i.e. everyone in remainingPeopleArray)
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
        return [remainingPeopleArray[nIndex][0], matchId[0]];
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