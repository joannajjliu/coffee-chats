// press "ctrl + alt + n" in vscode to run
/* naming conventions:
      **no abbreviations**
      **no plurals (ex. use list instead)**
      **consistent verbs for similar functions**
      **capitalize two-letter acronyms**

      camelCase : functions & variables
      UPPERCASE: global variables & constants (ex. PI)
      PascalCase: new Constructor function, classes
      _underscorePrivateMethod: private methods

      Not followed: (lower_case_underscored: variables)
*/

//imports:
const stringify = require('csv-stringify');
// read data:
const parse = require('csv-parse');
const fs = require('fs');

// run createPairs
// readCSV('', createPairs, '');

readCSV('', createPairs, '');

async function readCSV(person, callback, peopleOnHold) {
    const previousPeopleData = [];
    // use original.csv to reset (for testing purposes, never overwrite "original.csv" file)
    // keep at new.csv for testing ("new.csv" is overwritten during testing)

    fs.createReadStream('read_write/new.csv') //change the file names to "test[].csv", to check it passes some previously failed tests
    .pipe(parse({ delimiter: ',' }))
    .on('data', (row) => {
      previousPeopleData.push(row);        
    })
    .on('end', () => {
        previousPeopleData.shift(); //remove headers
        console.log('CSV file successfully processed');
        callback(person, previousPeopleData, peopleOnHold);
    })
}

function createPairs(person = null, prevData, peopleOnHold = null) {
  //create copy of prevData into peopleData:
  const peopleData = [];
  prevData.map(person => peopleData.push(person));

  findOptimalPairs('',peopleData,'').then(pair => {
    let optimalPairs = pair;
    const newData = updatePeopleData(peopleData, optimalPairs);
    // writing persons with updated queues to csv:
    stringify(newData, { header: true, columns: PERSON_COLUMNS }, (err, output) => {
      console.log("stringify newData: ", newData);
      if (err) throw err;
      fs.writeFile('read_write/new.csv', output, (err) => {
        if (err) throw err;
        console.log('new.csv saved.');
      });
    });
    // writing pairs to csv:
    stringify(optimalPairs, { header: true, columns: PAIR_COLUMNS }, (err, output) => {
      if (err) throw err;
      fs.writeFile('read_write/pairs.csv', output, (err) => {
        if (err) throw err;
        console.log('newPairs.csv saved.');
      });
    });
  })
}

async function findOptimalPairs(filler, prevData, filler2) {
  console.log("prevData: ", prevData);
  // create copy of prevData into originalPeopleArray:
  let originalPeopleArray = [];
  prevData.map(person => originalPeopleArray.push(person));
  originalPeopleArray = originalPeopleArray.filter(person => person[3].split(",")[0] !== '');

  const maxNumberOfPairs = Math.floor(originalPeopleArray.length / 2);
  const pairStack = [];

  const matchedPeopleArray = []; //ids of matched people; is dynamic
  const nArray = []; //modifiable array of visited n indices, for easier retrieval

  let bestSoFar = []; //store array of pairs (best so far)
  let n = 0; //person index in originalPeopleArray
  let m = 0; //MatchQueue index

  //iterate until optimal pairings are found, 
  //  or reached end of backtracking:
    while (pairStack.length != maxNumberOfPairs) {

      //m is matchQueue index, of n person

      // find feasible currM, if it exists:
      let currM = findLowestMIndex(originalPeopleArray, n, m, matchedPeopleArray); //update currM

      // When currM dosen't exist:
      while (currM === -1) {//currM dosen't exist, therefore apply operations to go up one node:
        const recentPair = pairStack.pop(); //pop previous pair and store
        // -- update prevM: --
        const lastAccessedMatchQueueVal = recentPair[1];
        // const prevN = nArray.pop();
        n = nArray.pop();
        const matchQueueArray = originalPeopleArray[n][3].split(",");
        let prevM = matchQueueArray.findIndex((elem) => elem === lastAccessedMatchQueueVal);
        prevM += 1; //increment m of previous node
        // Also, remove previous people from matchedPeopleArray of ids:
        matchedPeopleArray.pop();
        matchedPeopleArray.pop();
        currM = findLowestMIndex(originalPeopleArray, n, prevM, matchedPeopleArray); //update currM
        // check if we've reached end of all backtracks, return function if we have:
        if (currM === -1 && pairStack.length === 0) {// reached end of function (no optimal result found):
          console.log("bestSoFar: ", bestSoFar);
          return bestSoFar; //no optimal solution found, return bestSoFar
        }
      }// end of backtrack while loop

      // if pair node exists (feasible values left in matchQueue of current person):

      //when currM returns with a viable match, create pair from person at position n, and their matchQueue pair at currM:
      const newPair = createSinglePair(originalPeopleArray, n, currM);
      pairStack.push(newPair);
      // -- add pair to matchedPeopleArray:--
      matchedPeopleArray.push(newPair[0]);
      matchedPeopleArray.push(newPair[1]);

      nArray.push(n); //add current n index to nArray; values in nArray should always be unique and increasing

      // create findNextFeasibleNIndex, greater than inputted n:
      n = findNextFeasibleNIndex(originalPeopleArray, n, matchedPeopleArray); //update n

      if (pairStack.length > bestSoFar.length) {//update bestSoFar pairs' array as we proceed
        bestSoFar = []; //reset
        pairStack.map(pair => bestSoFar.push(pair));
      }
    }// end of while loop; an optimal solution found

    console.log(`pairStack:`, pairStack);
    return pairStack;
}

// updatePeopleData processes a previous array of Person data, 
//    and updates their matchQueues based on new pairings from optimalPairs
// input: arrayOf [Person], arrayOf [pair]
// output: arrayOf [Person]
function updatePeopleData(prevData, optimalPairs) {
  //create copy of prevData into peopleData:
  const peopleData = []
  prevData.map(person => peopleData.push(person));
  
   //create copy of optimalPairs into pairsData
  const pairsData = []
  optimalPairs.map(pair => pairsData.push(pair));
  
  const newPeopleData = []; //will be adding to, and returning this array
  while (pairsData.length > 0) {
    const currPair = pairsData.pop();
    const memberOneId = currPair[0];
    const memberTwoId = currPair[1];
    const memberOneIndex = peopleData.findIndex(person => person[0] === memberOneId);
    const memberTwoIndex = peopleData.findIndex(person => person[0] === memberTwoId);
    let personOne = peopleData[memberOneIndex];
    let personTwo = peopleData[memberTwoIndex];
    const memberOneMatchQueue = personOne[3].split(",");
    const memberTwoMatchQueue = personTwo[3].split(",");
    const memberOneNewMatchQueue = memberOneMatchQueue.filter(id => id != memberTwoId);
    const memberTwoNewMatchQueue = memberTwoMatchQueue.filter(id => id != memberOneId);
    
    //reassign matchQueues. Index at 3 is the matchQueue:
    personOne[3] = memberOneNewMatchQueue.toString();
    personTwo[3] = memberTwoNewMatchQueue.toString();

    //insert into newPeopleData array
    const lengthSoFar = newPeopleData.length;
    const insertIndexOne = Math.floor(Math.random() * (lengthSoFar + 1)); //random int from 0 to lengthSoFar
    const insertIndexTwo = Math.floor(Math.random() * (lengthSoFar + 1));
    newPeopleData.splice(insertIndexOne, 0, personOne);
    newPeopleData.splice(insertIndexTwo, 0, personTwo);
  }
  // console.log("peopleData, after loop:", peopleData)
  // console.log("newPeopleData, after loop:", newPeopleData)

  const peopleDataID = [];
  const newPeopleDataID = [];
  peopleData.map(person => peopleDataID.push(person[0]));
  newPeopleData.map(person => newPeopleDataID.push(person[0]));

  const missingPersonID = peopleDataID.filter(id => newPeopleDataID.indexOf(id) === -1); //IDs of people not paired

  while (missingPersonID.length > 0) {//insert person when there's an odd number, or they weren't paired
    const lengthSoFar = newPeopleData.length;
    const insertIndex = Math.floor(Math.random() * (lengthSoFar + 1)); //random int from 0 to lengthSoFar
    const lastIndex = missingPersonID.length - 1;
    const nextPerson = peopleData.filter(person => person[0] == missingPersonID[lastIndex])[0];
    missingPersonID.pop();
    newPeopleData.splice(insertIndex, 0, nextPerson);
  }
  return newPeopleData;
}

// inputs: arrayOf [people], integer currN, arrayOf matchedPeopleIDs:
// output: integer nextFeasibleN, or -1 if it does not exist
function findNextFeasibleNIndex(peopleArray, currN, matchedPeopleIDs) {
  const findNotMatchedID = (person) => !matchedPeopleIDs.includes(person[0]);
  let feasibleN = peopleArray.findIndex(findNotMatchedID);
  while (feasibleN <= currN && feasibleN != -1) {
    feasibleN = peopleArray.findIndex(findNotMatchedID);
  }
  return feasibleN;
}

// Input: arrayOf [people], int nIndex, int startingMIndex, arrayOf int
// Output: lowest possible mIndex int, or -1 if none exists
function findLowestMIndex(originalPeopleArray, nIndex, startingMIndex, matchedIDs) {
    const nPersonMatchQueueArray = createMatchQueue(originalPeopleArray, nIndex); //nth person's matchQueue array
    let lowestM = [];
    // match with first item in matchQueueArray, that is NOT present in matchedIDs
    for ( i = startingMIndex; i < nPersonMatchQueueArray.length; ++i) {//loop thr match queue, starting from mIndex
        if (!matchedIDs.includes(nPersonMatchQueueArray[i])) {//if nPersonMatchQueueArray[i] is an unmatched person
            lowestM.push(i);
            break; //end nested loops
        }
    };
    if (lowestM.length == 0) {//no matches found
        return -1;
    } else {//return lowestM value (an integer)
        return lowestM[0];
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

function createUnmatchedIds(unmatchedPersons) {//parameter unmatchedPersons is an array of person objects
      // hold Ids of unmatched persons: 
      const unmatchedIds = []
      unmatchedPersons.map(person => {
        unmatchedIds.push(person[0]);
      })
      return unmatchedIds;
}
  
  // write in new queues and pairs:
  
const PERSON_COLUMNS = {
  Id: 'Id',
  Name: 'Name',
  Surname: 'Surname',
  MatchQueue: 'MatchQueue'
};

const PAIR_COLUMNS = {
  item1: 'item1',
  item2: 'item2'
};