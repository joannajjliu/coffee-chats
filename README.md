# coffee-chats
creating a coffee-chats algorithm and ui

## Screenshot of app:
![screenshot of coffee-chats app](/coffee-chats-screenshot.PNG)

## How to use:
- in this project's root folder, run "nodemon calculate.js". Then navigate to localhost:5000 to use the application.
- Add person:
    - Type name, and surname, then click "submit":
    - Check new.csv for added person
- Calculate pairs:
    - Click "Calculate Pairs":
    - Check new.csv for updated persons' ordering and unmatched queues
    - Check pairs.csv for new pairings
- Replace original.csv with new.csv in readCSV function on the following line, to see app performance (i.e. new pairings, and updated person objects) for consecutive weeks:
```
 fs.createReadStream('read_write/original.csv')
```
## Files' navigation:
- read_write/write.js contains all js logic used
- index.html contains the UI
- package.json and yarn.lock contain all npm dependen
cies used
- csv files in /read_write are used for testing purposes
    - In the final MVP, all read/write processes should be completed on two csv files (one for pairings, and one for new people and weekly updates)
- playground folder contains code snippets and test files
    - Does not affect application, but may be useful for referencing
