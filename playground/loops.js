// return in for loop
function forLoop() {
    for ( i = 0; i < 5; ++i) {
        if (i === 2) {
            return i;
        }
    };
    console.log("hello"); //never happens because for loop already returned
}

console.log(forLoop());

// return in double while loop
function doubleWhileLoop() {
    while (1 !== 2) {
        while (3 !== 4) {
            return 86; //returns from doubleWhileLoop() function
        }
    }
    console.log("unreachable");
}

console.log(doubleWhileLoop());