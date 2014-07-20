angular.module("App")
.controller("ParticleCtrl", ['$scope', '$routeParams', function ($scope, $routeParams) {
    $scope.canvas = $("canvas")[0];
    $scope.canvasHeightOffset = 2;
    $scope.canvasWidthOffset = 2;

    $("canvas").attr("width", $(window).width() - $scope.canvasWidthOffset);
    $("canvas").attr("height", $(window).height() - $scope.canvasHeightOffset);

    // resize $scope.canvas on window resize
    $(window).resize(function() {
        $("canvas").attr("width", $(window).width() - $scope.canvasWidthOffset);
        $("canvas").attr("height", $(window).height() - $scope.canvasHeightOffset);
    });

    // $scope.avgEnergy = 0;
    // $scope.greeting = "bye bye now";

    // $scope.$watch("avgEnergy", function (old, newVal) {
    //     $scope.greeting = "Hello " + newVal;
    //     console.log(newVal);
    // });

    function getAvgEnergy () {
        if (particles.length === 0) return 0;
        var total = particles.map(function (p) { return p.energy }).reduce(sum);
        return total / particles.length;
    };

    var particles = [];
    var nebulae = [];
    var blackholes = [];

    /********** Simulation configuration options ********************/
    /*
     * set a hard cap on the # of particles. TODO need to change some stuff before we can remove this
     */
    var maxParticles = 250;

    /** refers to radius */
    var maxParticleSpawnSize = 4;

    /** refers to radius */
    var minParticleSpawnSize = 1;

    /* refers to radius */
    var collapseSize = 100;

    /* this maximum is per direction */
    var maxMoveSpeed = 3;

    /* used to calculate minMoveSpeed */
    var baseMinMoveSpeed = maxMoveSpeed; // the speed at which the first particle will move

    /* this minimum is absolute magnitude */
    var minMoveSpeed = 1;

    /* frame rate for movement. This is = 1000/moveRate fps */
    var moveRate = 1000 / 24;

    /* refers to the radius of the nebula */
    var particleGenRange = 0;

    /** generate a new particle (in each nebula) every this many ms */
    var particleGenRate = 1000;

    /* age a particle this often (# of timesteps) */
    var ageThreshold = 10;

    /* how much to shrink particles at a time */
    var growthAmt = 0.3;

    var minEnergy = 1;

    var maxEnergy = 100;

    var blackholeMass = 5;

    var blackholeAbsorbDistanceSq = 4;

    /**
      * a number between 0 and 1
      * 0 is no loss over time, and 1 is very rapid loss over time
      */ 
    var energyLoss = 0.01;

    var nebulaColor = "purple";
    var blackholeColor = "green";
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
        var ctx = $scope.canvas.getContext("2d");
        ctx.fillStyle = nebulaColor;
        ctx.strokeStyle = ctx.fillStyle;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size + 1, 0, Math.PI * 2, true);
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

        // randomize it
        var spawnRate = Math.random() * this.particleSpawnRate + Math.random() * this.particleSpawnRate;

        // queue random gen again
        window.setTimeout(function() { that.genRandomParticle() }, spawnRate);
    };

    Nebula.prototype.toString = function () {
        return "Nebula @ " + this.pos.toString() + " of size " + this.size + " generating at rate " + this.particleSpawnRate;
    };

    var BlackHole = function (pos, mass) {
        this.pos = pos;
        this.mass = mass;
    };

    /**
     * return the particles which have *not* been absorbed
     */
    BlackHole.prototype.absorb = function () {
        var that = this;

        var absorbed = particles.filter(function (particle) {
            return particle.pos.distanceSqTo(that.pos) - Math.pow(particle.r, 2) <= blackholeAbsorbDistanceSq;
        });

        if (absorbed.length) console.log(absorbed.length);

        return particles.filter(function (particle) {
            return particle.pos.distanceSqTo(that.pos) - Math.pow(particle.r, 2) > blackholeAbsorbDistanceSq;
        });
    };

    BlackHole.prototype.draw = function () {
        var ctx = $scope.canvas.getContext("2d");
        ctx.fillStyle = blackholeColor;
        ctx.strokeStyle = ctx.fillStyle;

        ctx.beginPath();
        // makes more sense to draw in terms of mass
        ctx.arc(this.pos.x, this.pos.y, this.mass, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.fill();
    };

    /**
     * Change the direction of nearby particles
     */
    BlackHole.prototype.attract = function () {
        // apply some acceleration based on F_g = GMm / r ** 2
        // so the attraction on the smaller object should be GM / r ** 2
        // will just say
        // a = M (mass of black hole) / r ** 2
        
        var that = this;
        var delta = 0.01;
        
        // distance to ALL particles
        var acceleration = particles.map(function (particle) {
            var d = particle.pos.distanceSqTo(that.pos);
            if (d > delta) {
                var a =  that.mass / particle.pos.distanceSqTo(that.pos);
                particle.velocity.add(particle.pos.vectorTo(that.pos).scale(a));
            }
        });
    };

    /**
      * A particle has a position, a color, and a velocity representing movement direction
      */
    var Particle = function (pos, energy) {
        this.pos = pos;

        this.energy = energy;

        // radius is unrelated to size (think of this as mass)
        this.r = randomSize();

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

        var ctx = $scope.canvas.getContext("2d");
        ctx.fillStyle = energyColor(this.energy, maxEnergy);
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
            // this.r += this.growthAmt;
            this.energy *= (1 - energyLoss);
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
    };

    Particle.prototype.toString = function () {
        return "Particle at " + this.pos.toString() + " moving to " + this.velocity.toString() + " at speed " +
            Math.sqrt(this.velocity.sizeSq());
    };

    function randomSize() {
        // I want the size to be more likely small than large
        // return randomInRange(
        //     Math.sqrt(minParticleSpawnSize),
        //     Math.sqrt(maxParticleSpawnSize)
        // ), 2);
        // 
        return randomInRange(minParticleSpawnSize, maxParticleSpawnSize);
    }

    /**
     * Return a random energy value
     */
    function randomEnergy() {
        // I want the energy to be more likely to be near the middle
        return randomInRange(minEnergy / 2, maxEnergy / 2) + 
        randomInRange(minEnergy / 2, maxEnergy / 2);
        //var avg = (maxEnergy + minEnergy) / 2;
        //var dev = (maxEnergy - minEnergy) / 2;
        //return simulateGaussian(avg, dev);
    }

    function clearCanvas() {
        $scope.canvas.width = $scope.canvas.width;
    }

    function offScreen (particle) {
        return particle.pos.x < -particle.r || particle.pos.y < particle.r ||
               particle.pos.x > $scope.canvas.width + particle.r || particle.pos.y > $scope.canvas.height + particle.r;
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
        nebulae.map(function (n) { n.draw() });
        blackholes.map(function (b) { b.draw() });
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
        $scope.avgEnergy = getAvgEnergy();
        // console.log($scope.avgEnergy);

        // calculate black hole attraction
        // cannot do map, as these operations must happen sequentially
        for (var i = 0; i <  blackholes.length; i++) {
            particles = blackholes[i].absorb();
            blackholes[i].attract();
        }

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
     * A particle is generated from within the center of the $scope.canvas, then moves outward
     */
    function genParticle (spawnPos) {
        // update min-move speed
        minMoveSpeed = particleMinMoveSpeed();

        var energy = randomEnergy();

        particles.push(new Particle(spawnPos, energy));
    }

    function beginAnimate() {
        var nebulaePos = [
            new Vector($scope.canvas.width * 3 / 4, $scope.canvas.height * 1 / 2),
            new Vector($scope.canvas.width / 4, $scope.canvas.height / 3),
            new Vector($scope.canvas.width * 2 / 3, $scope.canvas.height / 3),
            new Vector($scope.canvas.width * .1, $scope.canvas.height * .9)
        ];

        nebulae = nebulaePos.map(function(p) {
            return new Nebula(p, particleGenRange, particleGenRate);
        });

        blackholes = [
            new BlackHole(new Vector($scope.canvas.width / 2, $scope.canvas.height / 2), 4),
            new BlackHole(new Vector($scope.canvas.width / 4, $scope.canvas.height * 2 / 3), 5),
            // large black hole off-screen
            new BlackHole(new Vector($scope.canvas.width + 20, $scope.canvas.height / 2), 10)
        ];

        // start generating particles in each Nebula
        for (var i = 0; i < nebulae.length; i++) {
            nebulae[i].genRandomParticle();
        }

        // and start the movement/drawing callback
        moveAllTheThings();
    }

    beginAnimate();
}]);