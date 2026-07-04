let BACKGROUND = "#7FCCFF" // Sky Color (Bright Day)
let FOREGROUND = "#ff5050"

game.width = 400;
game.height = 400;

const ctx = game.getContext("2d")

// Clears Screen (Enables Animations, Movement...)
function clear(){
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0,0,game.width,game.height)
}

// Vertice as a square of size s @ (x,y) point
function point({x, y}){
    const s = 10;
    ctx.fillStyle = FOREGROUND
    ctx.fillRect(x - s/2, y - s/2, s, s)
}

// Move Vertice to the middle of the canvas (middle@x:0,y:0)
function screen(p){
    return{ // -1 ..1 -> 0..2 -> 0..1 -> 0..w
        x: (p.x + 1)/2*game.width,
        y: (1-(p.y + 1)/2)*game.height //y is flipped
    }
}

// Based on a formula x'=x/z and y'=y/z from point (x,y,z)
function project({x,y,z}){
    return {
        x: x/z,
        y: y/z
    }
}

// Z Offset
function translate_z({x,y,z}, dz){
    return {x,y,z: z+dz};
}

//vertices - Cube
const vs = [
    {x:0.5, y:0.5, z: 0.5}, //@ z=0 the object is in the eye
    {x:-0.5, y:0.5, z: 0.5},
    {x:-0.5, y:-0.5, z: 0.5},
    {x:0.5, y:-0.5, z: 0.5},

    {x:0.5, y:0.5, z: -0.5},
    {x:-0.5, y:0.5, z: -0.5},
    {x:-0.5, y:-0.5, z: -0.5},
    {x:0.5, y:-0.5, z: -0.5}
]

let dz = 2; //Track z offset

clear()
for (const v of vs){
    point(screen(project(translate_z(v,dz))));
}
