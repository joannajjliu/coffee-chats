// press "ctrl + alt + n" in vscode to run
// press "ctrl + alt + m" in vscode to STOP code run

// implementing factorial using recursion
const factorial = function fac(num) {
    if (num === 1) {//terminating condition/base case
        return 1;
    }

    //recursive case:
    return num * fac(num - 1);
};

const final = factorial(5)
console.log(`final: ${final}`);