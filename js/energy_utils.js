/**
 * Requires the following to be defined:
 * 	- Vector
 *  - numToHex
 *  - linearScale
 */

/**
 * Translate the energy of a particle into the speed at which it travels
 * Speed should be positively correlated with energy
 */
function energyToSpeed(energy) {
    // I think a linear correlation is best
    return energy / 20;
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
  * Return a color based on the energy associated with a particle
  */
function energyColor(energy, maxEnergy) {
    // var delta = 1;
    var scaledEnergy = (energy / maxEnergy) * 255;

    var r, g, b;

    var blueRange = 0.75 * maxEnergy;
    var redRange = 0.25 * maxEnergy

    // this is a huge hack
    // I'm trying to get blackbody radiation, but failing so hard
    if (energy < redRange) {
        // very low energy, radiate at red
        // smooth transition from red to yellow
        b = 0;
        g = Math.floor(linearScale(0, redRange, 0, 255)(energy));
        r = 255;
    } else if (energy > blueRange) {
        // very high energy, radiate at blue
        
        // smooth transition from white to blue
        r = Math.floor(linearScale(blueRange, maxEnergy, 255, 0)(energy));
        g = Math.floor(linearScale(blueRange, maxEnergy, 255, 0)(energy));

        b = 255;
    } else {
        // medium energy, radiate at yellow
        r = 255;
        g = 255;

        // smooth transition from bright yellow to absolute white
        b = Math.floor(linearScale(redRange, blueRange, 0, 255)(energy));
    }    

    return "#" + numToHex(r) + numToHex(g) + numToHex(b);
}