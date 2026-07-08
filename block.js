class Block{
    #name;      // Block Name. ex: Grass, Glass, etc..
    #pos;       // Position @ middle OBJ
    constructor({x,y,z}, name){
        this.#pos = {x, y, z};
        this.#name = name;
    }
    get name(){
        return this.#name;
    }
    get position(){
        return this.#pos;
    }
    //Returns Vertices based on the Block's Position
    get vs(){
        const { x, y, z } = this.#pos;
        return Block.baseVs.map(v => ({
            x: v.x + x,
            y: v.y + y,
            z: v.z + z
        }));
    }
    // Returns Texture Path
    get texture() {
        return Block.texture_paths[this.#name] || 'assets/textures/blocks/null.png';
    }
    //Cube vertices (the corners)
    static baseVs = [
        {x:0.5, y:0.5, z: 0.5},   {x:-0.5, y:0.5, z: 0.5},
        {x:-0.5, y:-0.5, z: 0.5}, {x:0.5, y:-0.5, z: 0.5},
        {x:0.5, y:0.5, z: -0.5},  {x:-0.5, y:0.5, z: -0.5},
        {x:-0.5, y:-0.5, z: -0.5},{x:0.5, y:-0.5, z: -0.5}
    ];
    // Binds the Verts to make faces .aka quad.
    static faces = [
        {vs:[4,7,6,5], dir:{x:0,y:0,z:-1}}, // back
        {vs:[0,1,2,3], dir:{x:0,y:0,z:1}},  // front
        {vs:[4,5,1,0], dir:{x:0,y:1,z:0}},  // top
        {vs:[3,2,6,7], dir:{x:0,y:-1,z:0}}, // bottom
        {vs:[5,6,2,1], dir:{x:-1,y:0,z:0}}, // left
        {vs:[0,3,7,4], dir:{x:1,y:0,z:0}}   // right
    ];
    // Texture Paths
    static texture_paths = {
        'Grass': 'assets/textures/blocks/grass.png',
        'Stone': 'assets/textures/blocks/stone.png',
        'Dirt':  'assets/textures/blocks/dirt.png'
    };
}