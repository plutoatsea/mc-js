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

// Rotate xz
function rotate_xz({x,y,z},angle){
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return{
        x: x*c-z*s,
        y,
        z: x*s+z*c
    }
}

// Rotate yz
function rotate_yz({x, y, z}, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x,
        y: y * c - z * s,
        z: y * s + z * c
    };
}

// Rotate xy
function rotate_xy({x, y, z}, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: x * c - y * s,
        y: x * s + y * c,
        z
    };
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

// Camera Position
let dz = 2;
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
    let speed = 0.09;
    // Relative Directional Intent (Sync movement with camera)
    let moveX = 0;
    let moveZ = 0;

    // Fly Movement (Space)
    if (keys.Space) {
        dy -= speed;
        moved = true;
    }
    
    // Descent Movement (Shift)
    if (keys.Shift) {
        dy += speed;
        moved = true;
    }
    
    // Foward Movement (W)
    if (keys.W) {
        moveZ  -= speed;
        moved = true;
    }

    // Backward Movement (S)
    if (keys.S) {
        moveZ += speed;
        moved = true;
    }

    // Left Movement (A)
    if (keys.A) {
        moveX += speed;
        moved = true;
    }

    // Right Movement (D)
    if (keys.D) {
        moveX -= speed;
        moved = true;
    }
   
    // If horizontal mov = true then rotate the dir vector by yaw
    if (moveX !== 0 || moveZ !== 0) {
        const cos = Math.cos(-camYaw);
        const sin = Math.sin(-camYaw);
        
        dx += moveX * cos - moveZ * sin;
        dz += moveX * sin + moveZ * cos;
        moved = true;
    }

    if (moved || mouseMoved) {
        clear();
        for (const v of vs) {
            let transformed = translate_xyz(v, dx, dy, dz);
            transformed = rotate_xz(transformed, camYaw);
            transformed = rotate_yz(transformed, camPitch);
            point(screen(project(transformed)));
        }
        mouseMoved = false;
    }
    requestAnimationFrame(updateMovement);
}
requestAnimationFrame(updateMovement);

let camYaw = 0;
let camPitch = 0;
let mouseMoved = false;

// Locks Mouse Until Esc Clicked
game.addEventListener('click', () => {
    if (document.pointerLockElement !== game) {
        game.requestPointerLock();
    }
});

// Moves the Camera (Gives the Pitch & Yaw)
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === game) {
        let sensitivity = 0.003;
        camYaw += e.movementX * sensitivity;
        camPitch -= e.movementY * sensitivity;

        let maxPitch = Math.PI / 2.1;
        if (camPitch > maxPitch) camPitch = maxPitch;
        if (camPitch < -maxPitch) camPitch = -maxPitch;

        mouseMoved = true;
    }
});
