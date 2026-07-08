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

// Adjusts Triangle Tessellation in-between gaps (amount = 0.5 to 1)
function expandTriangle(dx0, dy0, dx1, dy1, dx2, dy2, amount){
    const cx = (dx0 + dx1 + dx2) / 3;
    const cy = (dy0 + dy1 + dy2) / 3;

    function push(x, y){
        const vx = x - cx;
        const vy = y - cy;
        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        return { x: x + (vx / len) * amount, y: y + (vy / len) * amount };
    }

    return [push(dx0, dy0), push(dx1, dy1), push(dx2, dy2)];
}

// Triangle Tessellation
function drawTriangle(img, sx0, sy0, sx1, sy1, sx2, sy2, dx0, dy0, dx1, dy1, dx2, dy2){
    const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1);

    const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom;
    const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom;
    const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom;
    const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom;
    const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) / denom;
    const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) / denom;
    //Expand triangle to hide gaps
    const [e0, e1, e2] = expandTriangle(dx0, dy0, dx1, dy1, dx2, dy2, 0.6);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(e0.x, e0.y);
    ctx.lineTo(e1.x, e1.y);
    ctx.lineTo(e2.x, e2.y);
    ctx.closePath();
    ctx.clip();

    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
}

// Bilinear interpolation - gets the 4 corners of quad p0..3 (ex: bp(p0..3,1,1)=1 point, bp(p0..3,0,0)=2point & bp(p0..3,0.5,0.5)=quad centre)
function bilerp(p0, p1, p2, p3, u, v){
    const top = { x: p0.x + (p1.x - p0.x) * u, y: p0.y + (p1.y - p0.y) * u };
    const bottom = { x: p3.x + (p2.x - p3.x) * u, y: p3.y + (p2.y - p3.y) * u };
    return { x: top.x + (bottom.x - top.x) * v, y: top.y + (bottom.y - top.y) * v };
}

// Draws a texture and splits into (cols*rows*2) triangles per quad
function drawFace(face, textureImage, cols, rows) {
    const NEAR_PLANE = 0.1;
    // all 4 points are transformed to 3D camera space
    const transformedPoints = face.vs.map(i => {
        return rotate_yz(rotate_xz(translate_xyz(vs[i], dx, dy, dz), camYaw), camPitch);
    });
    // Near-plane clipping safety check
    for (const p of transformedPoints) {
        if (p.z < NEAR_PLANE) return;
    }
    // ADAPTIVE 3D CULLING :))))!!!
    // Vector A (from point 0 to point 1)
    const ax = transformedPoints[1].x - transformedPoints[0].x;
    const ay = transformedPoints[1].y - transformedPoints[0].y;
    const az = transformedPoints[1].z - transformedPoints[0].z;
    // Vector B (from point 0 to point 3)
    const bx = transformedPoints[3].x - transformedPoints[0].x;
    const by = transformedPoints[3].y - transformedPoints[0].y;
    const bz = transformedPoints[3].z - transformedPoints[0].z;
    // 3D Cross Product to find the face's perpendicular Normal Vector (Nx, Ny, Nz)
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;

    // Winding-order safety check in order to verify this face's normal actually points
    // away from the cube's own object-space center, using untransformed vertices.
    const localP0 = vs[face.vs[0]];
    const localP1 = vs[face.vs[1]];
    const localP3 = vs[face.vs[3]];
    const lax = localP1.x - localP0.x, lay = localP1.y - localP0.y, laz = localP1.z - localP0.z;
    const lbx = localP3.x - localP0.x, lby = localP3.y - localP0.y, lbz = localP3.z - localP0.z;
    const lnx = lay * lbz - laz * lby;
    const lny = laz * lbx - lax * lbz;
    const lnz = lax * lby - lay * lbx;
    const lcx = (localP0.x + localP1.x + localP3.x) / 3;
    const lcy = (localP0.y + localP1.y + localP3.y) / 3;
    const lcz = (localP0.z + localP1.z + localP3.z) / 3;
    if (lnx * lcx + lny * lcy + lnz * lcz < 0) {
        nx = -nx; ny = -ny; nz = -nz;
    }

    // Calculate the center point of the face relative to the camera
    const cx = (transformedPoints[0].x + transformedPoints[1].x + transformedPoints[2].x + transformedPoints[3].x) / 4;
    const cy = (transformedPoints[0].y + transformedPoints[1].y + transformedPoints[2].y + transformedPoints[3].y) / 4;
    const cz = (transformedPoints[0].z + transformedPoints[1].z + transformedPoints[2].z + transformedPoints[3].z) / 4;
    // 3D Dot Product: Compares the direction of the face to the camera's view line
    const dotProduct = nx * cx + ny * cy + nz * cz;
    // If the dot product is positive, the face is pointing away from the camera lens. Skip!!!!
    if (dotProduct > 0) {
        return;
    }
    const pts = transformedPoints.map(p => screen(project(p)));

    const w = textureImage.width;
    const h = textureImage.height;
    const s0 = { x: 0, y: 0 }, s1 = { x: w, y: 0 }, s2 = { x: w, y: h }, s3 = { x: 0, y: h };
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const u0 = col / cols;
            const u1 = (col + 1) / cols;
            const v0 = row / rows;
            const v1 = (row + 1) / rows;
            const dTL = bilerp(pts[0], pts[1], pts[2], pts[3], u0, v0);
            const dTR = bilerp(pts[0], pts[1], pts[2], pts[3], u1, v0);
            const dBR = bilerp(pts[0], pts[1], pts[2], pts[3], u1, v1);
            const dBL = bilerp(pts[0], pts[1], pts[2], pts[3], u0, v1);
            const sTL = bilerp(s0, s1, s2, s3, u0, v0);
            const sTR = bilerp(s0, s1, s2, s3, u1, v0);
            const sBR = bilerp(s0, s1, s2, s3, u1, v1);
            const sBL = bilerp(s0, s1, s2, s3, u0, v1);
            drawTriangle(textureImage, sTL.x, sTL.y, sTR.x, sTR.y, sBR.x, sBR.y, dTL.x, dTL.y, dTR.x, dTR.y, dBR.x, dBR.y);
            drawTriangle(textureImage, sTL.x, sTL.y, sBR.x, sBR.y, sBL.x, sBL.y, dTL.x, dTL.y, dBR.x, dBR.y, dBL.x, dBL.y);
        }
    }
}

// Returns a grid size dynamically based on the distance to put triangles
function getGridResolution(camX, camY, camZ, objX, objY, objZ) {
    const dx = camX - objX;
    const dy = camY - objY;
    const dz = camZ - objZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const t = (dist - MIN_DIST) / (MAX_DIST - MIN_DIST);
    const clampedT = Math.max(0, Math.min(1, t));

    const grid = Math.round(MAX_GRID - clampedT * (MAX_GRID - MIN_GRID));
    return grid;
}

function render(){
    //console.log("CAMERA: ("+dx+", "+dy+", "+dz+") PITCH:"+camPitch+" YAW:"+camYaw); //THIS TRACKS CAMERA POS&PITCH&YAW
    clear();
    for (const v of vs) {
        let transformed = translate_xyz(v, dx, dy, dz);
        transformed = rotate_xz(transformed, camYaw);
        transformed = rotate_yz(transformed, camPitch);

        //Near-plane clipping - this removes hallucination mirror effect when going opposite to object
        const NEAR_PLANE = 0.1; 
        if (transformed.z < NEAR_PLANE) {
            continue;
        }

        point(screen(project(transformed)));
    }
    const grid = getGridResolution(dx, dy, dz, 0, 0, 0); // TO DO - change 0s to obj xyz
    for (const f of Block.faces) {
        drawFace(f,img,grid,grid);
    }
}

// Camera Position
let dz = 2;
let dy = 0;
let dx = 0;
let camYaw = 0;
let camPitch = 0;
let mouseMoved = false;
// Detail (Level of detail) Config - closer = more triangles, far = less triangles
const MIN_GRID = 0.5;
const MAX_GRID = 6;
const MIN_DIST = 2;
const MAX_DIST = 6;

const block = new Block({x:0,y:0,z:0},"Dirt");
const img = new Image();
img.src = block.texture;
// When upscaled, texture becomes blurry.
ctx.imageSmoothingEnabled = false;
render();

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
        render();
        mouseMoved = false;
    }
    requestAnimationFrame(updateMovement);
}
requestAnimationFrame(updateMovement);

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