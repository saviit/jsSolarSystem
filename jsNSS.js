"use strict";
//-----------------------------------------------
// SOLAR SYSTEM ORRERY
// Sami Viitanen 2019
// github.com/saviit
//-----------------------------------------------
class Planet {
    constructor(x, y, r, name, color) {
        this.x = x;
        this.y = y;
        this.radius = r;
        this.name = name;
        this.color = color;
        this.type = 'planet';
        this.coords = [];
        this.currentCoord = 0;
    }

    draw(context, center) {
        if (this.radius < 1) {
            context.strokeStyle = this.color;
            context.beginPath();
            context.moveTo(center.x + this.x - 2, center.y + this.y);
            context.lineTo(center.x + this.x + 2, center.y + this.y);
            context.moveTo(center.x + this.x, center.y + this.y - 2);
            context.lineTo(center.x + this.x, center.y + this.y + 2);
            context.stroke();
        }
        else {
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(center.x + this.x, center.y + this.y, this.radius, 0, 2*Math.PI);
            context.fill();
        }
    }

    update() {
        this.currentCoord++;
        if (this.currentCoord > this.coords.length - 1) {
            this.currentCoord = 0;
        }
        else {
            this.x = this.coords[this.currentCoord].x;
            this.y = this.coords[this.currentCoord].y;
        }
    }

}

class Star {
    constructor(x, y, r, name, color) {
        this.x = x;
        this.y = y;
        this.radius = r;
        this.name = name;
        this.color = color;
        this.type = 'star';
        this.coords = [];
    }

    draw(context) {
        context.fillStyle = this.color;
        if(this.radius < 1) {
            context.strokeStyle = this.color;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(this.x - 3, this.y);
            context.lineTo(this.x + 3, this.y);
            context.moveTo(this.x, this.y - 3);
            context.lineTo(this.x, this.y + 3);
            context.stroke();
        }
        else {
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
            context.fill();
        }
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distance(other) {
        let dx = this.x - other.x;
        let dy = this.y - other.y;
        return Math.sqrt(dx*dx + dy*dy);
    }
}

/**
 * 
 * @param {*} value to be scaled
 * @param {*} a0 min value for original scale
 * @param {*} a1 max value for original scale
 * @param {*} b0 min value for new scale
 * @param {*} b1 max value for new scale
 * @returns scaled value
 */
function scaleToRange(value, a0, a1, b0, b1) {
    return b0 + (b1 - b0) * ((value-a0)/(a1-a0));
}


function scaleToCanvas(value, refScale) {
    return scaleToRange(value, -refScale, refScale, -canvas.width / 2, canvas.width / 2);
}

//-----------------------------------------------


//###############################################
// PUBLIC DECLARATIONS
//###############################################

var canvas; //= document.getElementById("game");
var context; //= canvas.getContext('2d');
var center;

var datecount = 0;

var planets = [];
var sun;

var ANIMATION_RUNNING = false;

var DEFAULT_ZOOM = 6;
var SCALE = 6;

var DRAW_ORBITS = true;
var DRAW_EPOCH = true;
var DRAW_LABELS = true;

var SYSTEMSCALE = [
    //0: mercurian orbit (aphelion)
    // 69.8169E+06,
    70E+06,

    //1: venusian orbit (aphelion)
    //108.939E+06,
    110E+06,
    
    //2: terran orbit (aphelion)
    // 152.1E+06,
    153E+06,
    
    //3: martian orbit (aphelion)
    // 249.2E+06,
    250E+06,
    
    //4: jovian orbit (aphelion)
    // 816.62E+06,
    817E+06,
    
    //5: saturnian orbit (aphelion)
    // 1514.5E+06,
    1515E+05,

    //6: uranian orbit (aphelion)
    // 3008E+06,
    3008.5E+06,
    
    //7: neptunian orbit (aphelion)
    // 4540E+06
    4540.5E+06
];

var sunInfo = {
    "name": "Sol",
    "type": "mainS_Star",
    "group": "stars",
    "mean_radius": {
        "units": "km",
        "value": 695700
        },
    "mass": {
        "units": "kg",
        "value": 19885000E+23
        }
}
                
var planetRadii = 
[
    2440,   // mercury
    6052,   // venus
    6371,   // terra
    3390,   // mars
    69910,  // jupiter
    58230,  // saturn
    25360,  // uranus
    24620   // neptune
];

var mercury;
var venus;
var terra;
var mars;
var jupiter;
var saturn;
var uranus;
var neptune;

var pNames = ["Mercury", "Venus", "Terra", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
var pColors = ['brown',  'pink',  'blue',  'red',  'orange', 'BurlyWood', 'PaleTurquoise', 'SteelBlue'];

//###############################################
//###############################################

window.onload = function() {

    canvas = document.getElementById("game");
    let h = window.innerHeight;
    canvas.setAttribute("height", h);
    canvas.setAttribute("width", h);
    let zoomSlider = document.getElementById('zoomSlider');
    zoomSlider.value = DEFAULT_ZOOM;
    zoomSlider.addEventListener("change", changeWorldScale);
    let curr = document.getElementById("zSlider_current");
    curr.textContent = pNames[SCALE];
    let btnStartAnim = document.getElementById('anim-btn');
    btnStartAnim.addEventListener("click", function(ev) {
        ev.preventDefault();
        updateAnimation();
    });
    let cbLabels = document.getElementById('cboxOptionsDrawLabels');
    let cbOrbits = document.getElementById('cboxOptionsDrawOrbits');
    cbLabels.addEventListener("change",function(ev) {
        toggleLabels(ev.currentTarget.checked);
    });
    cbOrbits.addEventListener("change",function(ev) {
        toggleOrbits(ev.currentTarget.checked);
    });

    context = canvas.getContext('2d');

    center = new Point(canvas.width / 2, canvas.height / 2);
    //context.scale(2, 2);
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    mercury = mercuryData.coordinates;
    venus = venusData.coordinates;
    terra = terraData.coordinates;
    mars = marsData.coordinates;
    jupiter = jupiterData.coordinates;
    saturn = saturnData.coordinates;
    uranus = uranusData.coordinates;
    neptune = neptuneData.coordinates;
    
    initializeWorld();
    
    draw();
}

function changeWorldScale() {
    let zslider = document.getElementById('zoomSlider');
    SCALE = zslider.value;
    let curr = document.getElementById("zSlider_current");
    curr.textContent = pNames[SCALE];
}

function updateAnimation() {
    // re-initialize
    initializeWorld();
    // ANIMATION_RUNNING = true;
    // draw();
    
}

function toggleLabels(checkedStatus) {
    DRAW_LABELS = checkedStatus;
}

function toggleOrbits(checkedStatus) {
    DRAW_ORBITS = checkedStatus;
}

function initializeWorld() {
    var x, y, r;
    const numCoords = mercury.x.length;
    var pDataRef = [mercury, venus, terra, mars, jupiter, saturn, uranus, neptune];
    planets = [];

    r = scaleToCanvas(sunInfo.mean_radius.value, SYSTEMSCALE[SCALE]);
    sun = new Star(center.x, center.y, r, "Sol", 'yellow');

    for (let s = 0; s < pDataRef.length; s++) {
        x = scaleToCanvas(pDataRef[s].x[0], SYSTEMSCALE[SCALE]);
        y = scaleToCanvas(pDataRef[s].y[0], SYSTEMSCALE[SCALE]);
        r = scaleToCanvas(planetRadii[s], SYSTEMSCALE[SCALE]);
        var p = new Planet(/*center.x +*/ x, /*center.y +*/ y, r, pNames[s], pColors[s]);
        for (let i = 0; i < numCoords; i++) {
            p.coords.push({ x: /* center.x + */ scaleToCanvas(pDataRef[s].x[i], SYSTEMSCALE[SCALE]),
                            y: /* center.y + */ scaleToCanvas(pDataRef[s].y[i], SYSTEMSCALE[SCALE])});
        }
        planets.push(p);
        // s++;
    }

    //pDataRef = null;

}


function draw() {

    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    sun.draw(context);
    
    for (let i = 0; i < planets.length; i++) {
        planets[i].update();
        planets[i].draw(context, center);

        if(DRAW_ORBITS) {
            context.strokeStyle = planets[i].color;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(center.x + planets[i].coords[0].x, center.y + planets[i].coords[0].y);
            for (let j = 1; j < planets[i].currentCoord; j++) {
                context.lineTo(center.x + planets[i].coords[j].x, center.y + planets[i].coords[j].y);
            }
            context.stroke();
        }

        if(DRAW_LABELS) {
            
            // let x1 = planets[i].x;
            // let y1 = planets[i].y;
            
            let x1 = planets[i].x;
            let y1 = planets[i].y;

            let hypot = Math.sqrt(x1*x1 + y1*y1);
            // let angle = Math.sin(x1/hypot);
            let angle = Math.sin(y1/hypot); // * Math.PI * 2;
            

            let hypot2 = hypot + 100;
            // let x2 = (Math.cos(angle) * Math.PI * 2 * hypot2);
            // let y2 = (Math.sin(angle) * Math.PI * 2 * hypot2);
            
            let x2 = (Math.cos((Math.PI / 180) * angle) * hypot2);
            let y2 = (Math.sin((Math.PI / 180) * angle) * hypot2);
            // if (x1 < 0) {
            //     x2 = -x2;
            // } 
            // else if (y1 < 0) {
            //     y2 = -y2;
            // }
            
            

            context.strokeStyle = planets[i].color;
            context.font = "18px monospace";
            context.lineWidth = 1;
            let name = planets[i].name;
            let nameMetrics = context.measureText(name);
            
            context.beginPath();
            // context.moveTo(center.x + x1, center.y + y1);
            // context.lineTo(x2, y2);
            
            // context.moveTo(center.x, center.y);
            context.moveTo(center.x + x1, center.y + y1);
            context.lineTo(center.x + x2, center.y + y2);
            
            context.stroke();
            // context.fillStyle = 'black';
            // context.fillRect(x2-(nameMetrics.width / 2) - 5, y2-28, nameMetrics.width + 10, 28);
            // context.strokeRect(x2-(nameMetrics.width / 2)-5, y2-28, nameMetrics.width + 10, 28);
            // context.fillStyle = planets[i].color;
            // context.fillText(name, x2-(nameMetrics.width / 2), y2-8, x2+50);
            context.fillStyle = 'white';
            context.fillText("Center: (" + center.x + ", " + center.y + ")", center.x, canvas.height - 350, 1000);
            context.fillStyle = planets[i].color;
            let strx1 = (""+x1);
            let stry1 = (""+y1);
            let strx2 = (""+x2);
            let stry2 = (""+y2);
            let strh1 = (""+hypot);
            let strh2 = (""+hypot2);
            let strangle = "" + Math.asin(x1/hypot)/(Math.PI/180);
            context.fillText(`${name}  angle: ${strangle.substring(0, strangle.indexOf('.'))} x1: ${strx1.substring(0, strx1.indexOf('.'))} y1: ${stry1.substring(0, stry1.indexOf('.'))} x2: ${strx2.substring(0, strx2.indexOf('.'))} y2: ${stry2.substring(0, stry2.indexOf('.'))} hyp1: ${strh1.substring(0, strh1.indexOf('.'))} hyp2: ${strh2.substring(0, strh2.indexOf('.'))}`, 100, canvas.height - 300 + i*30, canvas.width); 
        }
    }

    if(DRAW_EPOCH) {
        let date = new Date(dates[datecount]);
        context.fillStyle = 'lightgray';
        context.font = '24px monospace';
        context.fillText(date, 10, canvas.height - 20, canvas.width);
    }

    // if (ANIMATION_RUNNING) {
        datecount++;
        requestAnimationFrame(draw);
    // }
}



function update() {

}

