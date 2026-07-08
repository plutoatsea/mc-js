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
function drawFace(transformedVs, face, textureImage, cols, rows) {
    const NEAR_PLANE = 0.1;

    const transformedPoints = face.vs.map(i => transformedVs[i]);

    for (const p of transformedPoints){
        if (p.z < NEAR_PLANE){
            return;
        }
    }
    const pts = transformedPoints.map(p => screen(project(p)));

    const w = textureImage.width;
    const h = textureImage.height;

    const s0 = {x:0,y:0};
    const s1 = {x:w,y:0};
    const s2 = {x:w,y:h};
    const s3 = {x:0,y:h};

    for(let row=0; row<rows; row++){
        for(let col=0; col<cols; col++){
            const u0 = col/cols;
            const u1 = (col+1)/cols;
            const v0 = row/rows;
            const v1 = (row+1)/rows;

            const dTL = bilerp(pts[0],pts[1],pts[2],pts[3],u0,v0);
            const dTR = bilerp(pts[0],pts[1],pts[2],pts[3],u1,v0);
            const dBR = bilerp(pts[0],pts[1],pts[2],pts[3],u1,v1);
            const dBL = bilerp(pts[0],pts[1],pts[2],pts[3],u0,v1);

            const sTL = bilerp(s0,s1,s2,s3,u0,v0);
            const sTR = bilerp(s0,s1,s2,s3,u1,v0);
            const sBR = bilerp(s0,s1,s2,s3,u1,v1);
            const sBL = bilerp(s0,s1,s2,s3,u0,v1);

            drawTriangle(textureImage,
                sTL.x,sTL.y,
                sTR.x,sTR.y,
                sBR.x,sBR.y,

                dTL.x,dTL.y,
                dTR.x,dTR.y,
                dBR.x,dBR.y
            );

            drawTriangle(textureImage,
                sTL.x,sTL.y,
                sBR.x,sBR.y,
                sBL.x,sBL.y,

                dTL.x,dTL.y,
                dBR.x,dBR.y,
                dBL.x,dBL.y
            );
        }
    }
}

// Returns a grid size dynamically based on the distance to put triangles
function getGridResolution(camX, camY, camZ, {x: objX, y: objY, z: objZ}) {
    const realCamX = -camX;
    const realCamY = -camY;
    const realCamZ = -camZ;

    const dx = realCamX - objX;
    const dy = realCamY - objY;
    const dz = realCamZ - objZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const t = (dist - MIN_DIST) / (MAX_DIST - MIN_DIST);
    const clampedT = Math.max(0, Math.min(1, t));

    const grid = Math.round(MAX_GRID - clampedT * (MAX_GRID - MIN_GRID));
    return grid;
}

function render(blocks){
    clear();
    // Build lookup table for neighbor culling
    const world = new Map();

    for(const b of blocks){
        const p = b.position;
        world.set(`${p.x},${p.y},${p.z}`, true);
    }

    for(const block of blocks){

        // Block center culling
        let center = translate_xyz(block.position,dx,dy,dz);
        center = rotate_xz(center,camYaw);
        center = rotate_yz(center,camPitch);
        if(center.z < -1){
            continue;
        }

        // Transform vertices
        const transformedVs = block.vs.map(v=>{
            let p = translate_xyz(v,dx,dy,dz);
            p = rotate_xz(p,camYaw);
            p = rotate_yz(p,camPitch);
            return p;
        });

        // Vert Points
        // for(const v of transformedVs){
        //     if(v.z > 0.1)
        //         point(screen(project(v)));
        // }

        //Grid Res to find how many triangles to put on a texture
        const grid = getGridResolution(dx,dy,dz,block.position);

        for(const face of Block.faces){
            // Neighbor face culling
            const nx = block.position.x + face.dir.x;
            const ny = block.position.y + face.dir.y;
            const nz = block.position.z + face.dir.z;

            if(world.has(`${nx},${ny},${nz}`)){
                continue;
            }

            // Backface culling
            const p0 = transformedVs[face.vs[0]];
            const p1 = transformedVs[face.vs[1]];
            const p2 = transformedVs[face.vs[2]];

            const ax = p2.x - p0.x;
            const ay = p2.y - p0.y;
            const az = p2.z - p0.z;

            const bx = p1.x - p0.x;
            const by = p1.y - p0.y;
            const bz = p1.z - p0.z;

            const nxFace = ay*bz-az*by;
            const nyFace = az*bx-ax*bz;
            const nzFace = ax*by-ay*bx;

            const dot = nxFace*p0.x+nyFace*p0.y+nzFace*p0.z;
            if(dot <= 0){
                continue;
            }

            drawFace(transformedVs,face,img,grid,grid);
        }
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

const blockz = [];
for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        blockz.push(new Block({ x: x, y: 0, z: z }, "Grass"));
    }
}

//const blockz = [new Block({x:0,y:0,z:0},"Grass"),new Block({x:1,y:0,z:0},"Grass"),new Block({x:0,y:0,z:1},"Grass"),new Block({x:1,y:0,z:1},"Grass")];
const img = new Image();
img.src = blockz[0].texture;
// When upscaled, texture becomes blurry.
ctx.imageSmoothingEnabled = false;
render(blockz);

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
        render(blockz);
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