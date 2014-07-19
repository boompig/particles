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
