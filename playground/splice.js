//Add new elements via splice:
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
// months = [];
const monthsLen = months.length;
const insertIndex = Math.floor(Math.random() * (monthsLen + 1)); //returns an integer from 0 to (months.length)
// months.splice(7, 0, 'cucumber'); //works (inserts at end)
months.splice(insertIndex, 0, 'cucumber');
console.log("months: ", months)