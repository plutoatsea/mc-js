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
        {vs: [4,5,6,7]}, {vs: [0,1,2,3]}, {vs: [0,1,5,4]}, 
        {vs: [2,3,7,6]}, {vs: [1,2,6,5]}, {vs: [0,3,7,4]}
    ];
    // Texture Paths
    static texture_paths = {
        'Grass': 'assets/textures/blocks/grass.png',
        'Stone': 'assets/textures/blocks/stone.png',
        'Dirt':  'assets/textures/blocks/dirt.png'
    };
}