/**
 * Particle generator and jiggler.
 * Written by Daniel Kats
 */
var canvas = $("canvas")[0];
var canvasHeightOffset = 5;
var canvasWidthOffset = 5;

$("canvas").attr("width", $(window).width() - canvasWidthOffset);
$("canvas").attr("height", $(window).height() - canvasHeightOffset);

// resize canvas on window resize
$(window).resize(function() {
    $("canvas").attr("width", $(window).width() - canvasWidthOffset);
    $("canvas").attr("height", $(window).height() - canvasHeightOffset);
});

var particles = [];
var nebulae = [];

/********** Simulation configuration options ********************/
/*
 * set a hard cap on the # of particles. TODO need to change some stuff before we can remove this
 */
var maxParticles = 250;

/** refers to radius */
var maxParticleSize = 6;

/* refers to radius */
var collapseSize = 8;

/** refers to radius */
var minParticleSize = 1;

/* this maximum is per direction */
var maxMoveSpeed = 3;

/* used to calculate minMoveSpeed */
var baseMinMoveSpeed = maxMoveSpeed; // the speed at which the first particle will move

/* this minimum is absolute magnitude */
var minMoveSpeed = 1;

/* frame rate for movement. This is = 1000/moveRate fps */
var moveRate = 1000 / 24;

/* deviation on either side from center */
var particleGenRange = 0;

/** generate a new particle (in each nebula) every this many ms */
var particleGenRate = 250;

/* make a particle smaller */
var ageThreshold = 100;

/* how much to shrink particles at a time */
var growthAmt = 0.3;

var minEnergy = 1;

var maxEnergy = 100;
/**********************************************/

/**
 * A nebula is a particle-emitting region.
 * The size refers to the radius
 */
var Nebula = function (pos, size, particleSpawnRate) {
    this.pos = pos;
    this.size = size;
    this.particleSpawnRate = particleSpawnRate;
};

Nebula.prototype.draw = function () {
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.strokeStyle = ctx.fillStyle;

    ctx.beginPath();
    //ctx.arc(this.pos.x, this.pos.y, this.size + 1, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
};

/**
 * Have this Nebula generate a random particle.
 * Make it callback to itself at its own refresh interval
 */
Nebula.prototype.genRandomParticle = function () {
    if (particles.length < maxParticles) {
        var x = randomInRange(this.pos.x - this.size, this.pos.x + this.size);
        var y = randomInRange(this.pos.y - this.size, this.pos.y + this.size);
        var pos = new Vector(x, y);
        genParticle(pos);
    }

    var that = this;

    // queue random gen again
    window.setTimeout(function() { that.genRandomParticle() }, this.particleSpawnRate);
};

Nebula.prototype.toString = function () {
    return "Nebula @ " + this.pos.toString() + " of size " + this.size + " generating at rate " + this.particleSpawnRate;
};

/**
  * A particle has a position, a color, and a velocity representing movement direction
  */
var Particle = function (pos, energy) {
    this.pos = pos;

    this.energy = energy;

    // radius is unrelated to size (think of this as mass)
    this.r = randomSize();

    // color relates to energy
    this.c = energyColor(energy);

    // velocity is positively related to energy
    this.velocity = energyToRandomVelocity(energy);

    this.ticksAlive = 0;

    this.growthAmt = growthAmt;
    this.growthRate = ageThreshold;
    this.dead = false;
    this.exploding = false;
};

Particle.prototype.draw = function () {
    if (this.dead) return;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = this.c;
    ctx.strokeStyle = ctx.fillStyle;

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
};

/**
  * Update position by velocity
  */
Particle.prototype.move = function () {
    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;
    this.ticksAlive++;

    if (this.ticksAlive > 0 && (this.ticksAlive % this.growthRate) === 0) {
        this.r += this.growthAmt;
    }

    if (this.r < 0) {
        this.dead = true;
    }
};

Particle.prototype.explode = function () {
    // rapid shrinkage ;)
    console.log("boom");
    this.growthRate = this.growthRate / 4;
    this.growthAmt = -this.growthAmt;
    this.exploding = true;
    this.c = "#000";
};

Particle.prototype.toString = function () {
    return "Particle at " + this.pos.toString() + " moving to " + this.velocity.toString() + " at speed " +
        Math.sqrt(this.velocity.sizeSq()) + " with color" + this.c;
};

function numToHex(n) {
    var hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function randomSize() {
    return randomInRange(minParticleSize, maxParticleSize);
    //var avg = (maxParticleSize + minParticleSize) / 2;
    //var dev = (maxParticleSize - minParticleSize) / 2;
    //return simulateGaussian(avg, dev);
}

/**
 * Return a random energy value
 */
function randomEnergy() {
    return randomInRange(minEnergy, maxEnergy);
    //var avg = (maxEnergy + minEnergy) / 2;
    //var dev = (maxEnergy - minEnergy) / 2;
    //return simulateGaussian(avg, dev);
}

/**
  * Return a color based on the energy associated with a particle
  * This is manifested via speed
  */
function energyColor(energy) {
    var delta = 1;
    var scaledEnergy = (energy / maxEnergy) * 255;

    var r, g, b;

    // very high energy guys should be blue, whereas low energy dudes should be red
    if (energy > maxEnergy / 2) {
        r = Math.floor(Math.max(0, 255 - scaledEnergy / 1.2));
        g = Math.floor(Math.max(0, 255 - scaledEnergy / 1.2));
        b = 255;
    } else {
        b = Math.floor(Math.min(scaledEnergy * 4 / 3, 255));
        g = Math.floor(Math.min(scaledEnergy * 4 / 3, 255));
        r = 255;
    }

    return "#" + numToHex(r) + numToHex(g) + numToHex(b);
}

function clearCanvas() {
    canvas.width = canvas.width;
}

function offScreen (particle) {
    return particle.pos.x < -particle.r || particle.pos.y < particle.r ||
           particle.pos.x > canvas.width + particle.r || particle.pos.y > canvas.height + particle.r;
}

function drawAllTheThings () {
    var i = 0;

    // filter out all off-screen particles
    particles = particles.filter(function (p) { return !offScreen (p) });

    // explode the ones which are too big
    // this is a bit hard
    //particles.filter(function (p) { return p.r > collapseSize && !p.exploding }).map(function (p) { p.explode() });
    //particles = particles.filter(function (p) { return !p.dead });

    // and draw the ones which are on-screen
    particles.map(function (p) { p.draw() });
    nebulae.map(function(n) { n.draw() });
}

/**
 * Translate the energy of a particle into the speed at which it travels
 * Speed should be positively correlated with energy
 */
function energyToSpeed(energy) {
    return Math.sqrt(energy);
}

function energyToRandomVelocity(energy) {
    // go in some random direction
    var angle = Math.random() * Math.PI * 2;

    var x = Math.cos(angle);
    var y = Math.sin(angle);
    var speed = energyToSpeed(energy);

    // convert energy to speed
    return new Vector(x * speed, y * speed);

}

/**
 * Return a random velocity, constrained by maxMoveSpeed
 */
function randomVector() {
    var x = 0, y = 0;
    var vec = new Vector(x, y);

    // make sure that each particle is moving non-trivially
    while (vec.sizeSq() < Math.pow(minMoveSpeed, 2)) {
        x = Math.random() * (maxMoveSpeed * 2) - maxMoveSpeed;
        y = Math.random() * (maxMoveSpeed * 2) - maxMoveSpeed;
        vec = new Vector(x, y);
    }

    //console.log("min move speed = " + Math.abs(x) + Math.abs(y));

    return new Vector(x, y);
}

function moveAllTheThings() {
    particles.map(function (p) { p.move() });

    clearCanvas();
    drawAllTheThings();

    window.setTimeout(moveAllTheThings, moveRate);
}

/**
 * Return the minimum speed for a particle, as a function of the # of particles
 * The idea is to make the first few particles fast, and go slower as move particles are needed
 */
function particleMinMoveSpeed() {
    if (particles.length === 0) {
        return baseMinMoveSpeed;
    } else {
        var frac = (maxParticles - particles.length) / maxParticles;
        var y = (Math.exp(baseMinMoveSpeed) - 1) * frac + 1;
        return baseMinMoveSpeed - Math.log(y);
    }
}

/*
 * Create a new particle.
 * A particle is generated from within the center of the canvas, then moves outward
 */
function genParticle (spawnPos) {
    // update min-move speed
    minMoveSpeed = particleMinMoveSpeed();

    var energy = randomEnergy();

    particles.push(new Particle(spawnPos, energy));
}

function beginAnimate() {
    var nebulaePos = [
        new Vector(canvas.width * 3 / 4, canvas.height * 1 / 2),
        new Vector(canvas.width / 4, canvas.height / 3),
        new Vector(canvas.width * 2 / 3, canvas.height / 3),
    ];

    nebulae = nebulaePos.map(function(p) {
        return new Nebula(p, particleGenRange, particleGenRate);
    });

    // start generating particles in each Nebula
    for (var i = 0; i < nebulae.length; i++) {
        nebulae[i].genRandomParticle();
    }

    // and start the movement/drawing callback
    moveAllTheThings();
}

beginAnimate();
