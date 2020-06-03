const stringify = require('csv-stringify');
const fs = require('fs');

let data = [];
let columns = {
  id: 'id',
  name: 'Name'
};

for (var i = 0; i < 10; i++) {
  data.push([i, 'Name ' + i]);
}

stringify(data, { header: true, columns: columns }, (err, output) => {
  if (err) throw err;
  fs.writeFile('stringify_write.csv', output, (err) => {
    if (err) throw err;
    console.log('stringify_write saved.');
  });
});