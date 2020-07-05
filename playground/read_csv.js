const parse = require('../public/read_write/csv-parse');
const fs = require('fs');

const data = []
fs.createReadStream('read_write/new.csv')
  .pipe(parse({ delimiter: ',' }))
  .on('data', (r) => {
    data.push(r);        
  })
  .on('end', () => {
    data.shift(); //remove headers
    console.log(data);
  })

const updatedCols = {
    Id: 'Id',
    Name: 'Name',
    Surname: 'Surname',
    MatchQueue: 'MatchQueue'
  };
