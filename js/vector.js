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

Vector.prototype.vectorTo = function (other) {
	return new Vector(other.x - this.x, other.y - this.y);
};

Vector.prototype.distanceSqTo = function (other) {
	return Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2);
};

Vector.prototype.add = function (other) {
	this.x += other.x;
	this.y += other.y;
};

Vector.prototype.scale = function (c) {
	this.x *= c;
	this.y *= c;
	return this;
};