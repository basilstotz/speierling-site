
//let myTerrain;
//let myBox;
//let breite;
//let hoehe;
//let data;
//let scale=4;
//let tex;

let terrain;
let tex;
let terrainData;
let index=0;

function preload(){
    tex=loadImage('baum.jpeg');
}


function makeTerrain(){
    terrainData.noise(7,0.06);
    //terrainData.noise(7,0.02);
    terrain.update(terrainData);
}    

function one(x,y){
    return 0.001*(x*x+y*y)
}

function two(x,y){
    return 0.6*sin( 0.5*sqrt(y*y+x*x));
}

function three(x,y){
    s=0.03
    level=7;
    return level*noise(s*x,s*y)
}

function keyPressed(){
    switch(index){
    case 0:
	terrainData.setWorld(-40,40,-40,40);
	terrainData.forEach(one);
	break;
    case 1:
	terrainData.setWorld(-40,40,-40,40);
	terrainData.forEach(two);
	break;
    case 2:
	terrainData.noise(7,0.004);
	break;
    }
    terrain.update(terrainData,tex);

    index=(++index)%3
}

function setup(){
    createCanvas(windowWidth, windowHeight, WEBGL);

    breite=256;
    hoehe=256;

    terrainData= new TerrainData(breite,hoehe);


    let opts = {
	model: {
	    size: { x:512, y:512, z:128 },
	    scale: {              z: 2.3 },
	    align: { x:'center', y:'center', z:'bottom' },
	    translate: { x:0, y:0, z:-2 }
	},
	box: true,
	draw: 'wireframe'  // or '#ff00ff' 'normal' 
    }
    
    terrain = new Terrain();
    terrain.options({ width: 512,
		      height:512,
		      horizontalAlign: 'center',     // 'none', 'center'
		      verticalAlign: 'bottom',       // 'none', 'bottom', 'center', 'top'
		      box: { draw: true, align: 'bottom', offset: 0}
		    });

    makeTerrain();
    
}
s

function draw(){
    background(200);
    
    //debugMode();
    orbitControl();
    rotateX(PI/2);
    lights();
    terrain.draw();

}
