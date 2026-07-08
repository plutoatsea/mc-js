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