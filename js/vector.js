/**
 * 2D vector
 */
var Vector = function (x, y) {
    this.x = x;
    this.y = y;
};

Vector.prototype.toString = function () {
    return "(" + this.x + ", " + this.y + ")";
};

/**
  * Return square size of velocity
  */
Vector.prototype.sizeSq = function () {
    return Math.pow(this.x, 2) + Math.pow(this.y, 2);
};
