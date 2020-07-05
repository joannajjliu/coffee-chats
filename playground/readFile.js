const fs = require('fs');

// Use fs.readFile() method to read the file 
fs.readFile('read_write/new.csv', 'utf8', function(err, data){ 
      
    // Display the file content 
    console.log(data); 
}); 
console.log('readFile called');
