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

// XYZ Offset
function translate_xyz({x,y,z},dx,dy,dz){
    return {x: x+dx,y: y+dy,z: z+dz};
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
let dy = 0;
let dx = 0;

clear()
for (const v of vs){
    point(screen(project(translate_xyz(v,dx,dy,dz))));
}

const keys = {
    Space: false,
    Shift: false,
    W: false,
    S: false,
    A: false,
    D: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === ' ') keys.Space = true;
    if (e.key === 'Shift') keys.Shift = true;
    if (e.key.toLowerCase() === 'w') keys.W = true;
    if (e.key.toLowerCase() === 's') keys.S = true;
    if (e.key.toLowerCase() === 'a') keys.A = true;
    if (e.key.toLowerCase() === 'd') keys.D = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ') keys.Space = false;
    if (e.key === 'Shift') keys.Shift = false;
    if (e.key.toLowerCase() === 'w') keys.W = false;
    if (e.key.toLowerCase() === 's') keys.S = false;
    if (e.key.toLowerCase() === 'a') keys.A = false;
    if (e.key.toLowerCase() === 'd') keys.D = false;
});

function updateMovement() {
    let moved = false;

    // Fly Movement (Space)
    if (keys.Space) {
        dy -= 0.05;
        moved = true;
    }
    
    // Descent Movement (Shift)
    if (keys.Shift) {
        dy += 0.05;
        moved = true;
    }
    
    // Foward Movement (W)
    if (keys.W) {
        dz -= 0.05;
        moved = true;
    }

    // Backward Movement (S)
    if (keys.S) {
        dz += 0.05;
        moved = true;
    }

    // Left Movement (A)
    if (keys.A) {
        dx += 0.05;
        moved = true;
    }

    // Right Movement (D)
    if (keys.D) {
        dx -= 0.05;
        moved = true;
    }

    if (moved) {
        clear();
        for (const v of vs) {
            point(screen(project(translate_xyz(v, dx, dy, dz))));
        }
    }
    requestAnimationFrame(updateMovement);
}
requestAnimationFrame(updateMovement);
