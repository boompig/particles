function randomItemInArray(arr) {
    return arr[Math.floor(randomInRange(0, arr.length))];
}

function randomInRange(a, b) {
    return Math.random() * (b - a) + a;
}

function sum (a, b) {
	return a + b;
}

function simulateGaussian(mean, stdDev) {
    var numbers = [1, 1, 1, 1, 1].map(function(x) { return randomInRange(-1, 1) });
    var sum = numbers.reduce(function(a, b) { return a + b });
    return sum * stdDev + mean;
}

/**
 * Convert a decimal # into a hexadecimal string
 */
function numToHex(n) {
    var hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Return a function which linearly scales from interval [a1, b1] to interval [a2, b2]
 */
function linearScale (a1, b1, a2, b2) {
    return function (x1) {
        // in the interval [0, 1]
        var t = (x1 - a1) / (b1 - a1);
        // in the interval [a2, b2]
        return t * (b2 - a2) + a2;
    }
}