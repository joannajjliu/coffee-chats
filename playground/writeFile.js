const fs = require('fs');

// Use fs.appendFile() method to add to existing file
fs.appendFile('read_write/original_peopleOnHold.csv',',11','utf8', function(err){ 
    if (err) throw err;
    // Display the file content 
    console.log('The "data to append" was appended to file!'); 
});

// fs.writeFile also works
