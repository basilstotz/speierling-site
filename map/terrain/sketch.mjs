#!/usr/bin/env node

import { HeightGrid } from './HeightGrid.mjs';
import * as tilebelt from '../node_modules/@mapbox/tilebelt/dist/esm/index.js';
import  { SphericalMercator } from '../node_modules/@mapbox/sphericalmercator/dist/esm/index.js';
import * as utils from '../../../data/data-factory/modules/map-utils.mjs'

var show = (p) => {


    p.Map = class{


	constructor(){
	    this.mercartor = new SphericalMercator({size: 256,antimeridian: true});
	    this.setMap(47.5,7.5,16,512,512);
	}	    
	
	setMap( lat,lon,zoom,width,height){
	    this.lon=lon;
	    this.lat=lat;
	    this.zoom=zoom;
	    this.width=width;
	    this.height=height
	    this.bounds=utils.latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	}

	setPan(lon,lat){
	    this.lon=lon;
	    this.lat=lat;
	    this.bounds=utils.latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	}

	setZoom(zoom){
	    this.zoom=zoom;
	    this.bounds=utils.latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	}

	setSize(width,height){
	    this.width=width;
	    this.height=height;
	    this.bounds=utils.latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	}	    

	setTerrainLayer(demLayer){
	    this.demLayer=demLayer
	}

	setTextureLayer(textureLayer){
	    this.textureLayer=textureLayer
	}

	getPixel(lon,lat){
	    let px0 = this.mercator.px( [ this.bounds.north, this.bounds.west ],this.zoom);
	    let px1 = this.mercator.px( [ lon,lat],this.zoom);
	    return [ px1[0]-px0[0], px1[1]-px0[1] ]
	}

	getLonLat(px,py){
	    let px0 = this.mercator.px( [ this.bounds.north, this.bounds.west ],this.zoom);
            return this.mercator.ll( [ px0[0]+px, px0[1]+py ],this.zoom );
	}
	
	createTerrain(){
	    let w=p.grid.width
	    let h=p.grid.height;
	    for(let y=0;y<h;y++){
		for(let x=0;x<w;x++){
		    const vx = x                  * p.sx;
		    const vy = y                  * p.sy;
		    const vz = p.grid.get(x,y) * p.sz;
		    const v = p.createVector(vx,vy,vz); 
		    this.vertices.push(v);
		    this.uvs.push(x/w);
		    this.uvs.push(y/h);
		    if(x>0 && y>0){
			const idx=this.vertices.length-1;
			this.faces.push( [ idx-p.rows-1, idx-1, idx-p.rows ]);
			this.faces.push( [ idx-p.rows  , idx-1, idx        ]);
		    }
		}
	    }
	    this.computeNormals(p.SMOOTH);
	}
	
	async update(){
	    if(this.demLayer){
		if(this.terrain)p.freeGeometry(this.terrain);
		if(this.box)p.freeGeometry(this.box);

		//if(this.terrain)delete this.terrain;
		//if(this.box)delete this.box;
		let demImage = await this.demLayer.getImage(this.bounds,12,true);
		//make grid
		let width = demImage.width;
		let height = demImage.height;
		demImage.loadPixels();
		let pixels = demImage.pixels;
		this.grid = new HeightGrid(pixels,width,height);
		this.grid.subMin(10);

		p.sx=16*this.width/256;
		p.sy=16*this.height/256;
		
		p.rows=width;
		p.cols=height;
		p.b=p.sx*p.rows;
		p.h=p.sy*p.cols;
		p.d=0;
		p.grid=this.grid;
		//makeModels	 
		this.terrain = new p5.Geometry(1,1,this.createTerrain)
		this.box= p.makeBox(this.grid);
	    }
	    if(this.textureLayer){
		if(this.tex)delete this.tex;
		this.tex = await this.textureLayer.getImage(this.bounds,this.zoom);
	    }
	}

	render(){
	    if(this.tex)p.texture(this.tex)
	    if(this.terrain)p.model(this.terrain)
	    if(this.box)p.model(this.box);	    
	}
    }

    p.RasterLayer = class{

	setOptions(options={}){
	    if(options.template){
		this.template=options.template;
	    }else{
		this.template='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	    }
	}

	constructor( options ){

	    this.TILE_SIZE=256;
	    this.setOptions(options);
	    this.cache={};
	}

        loadImage(path){
	    return new Promise(function(resolve,reject){
		p.loadImage(path,resolve,reject)
	    })
	}

	
	async getTileFromURL(quadkey){
	    let [x,y,z] = tilebelt.quadkeyToTile(quadkey);
	    let url =  this.template.replace('{s}','a').replace('{x}',x).replace('{y}',y).replace('{z}',z);
	    //console.log(url);
	    return await this.loadImage(url);
	}

	async getTiles(bbox,zoom){

	    let quads  = utils.bboxToQuads(bbox,zoom);
	    let tiles=[];
	    for(let quad of quads){
		if(this.cache[quad]){
		    //console.log('-');
		    tiles.push(this.cache[quad].tile)
		}else{
		    //console.log('+');
		    let tile= await this.getTileFromURL(quad);
		    let now=Date.now();
		    this.cache[quad]= { tile: tile, timestamp: now } 
		    tiles.push(tile);
		}
	    }
	   //garbabe collection
	    let cacheArray= Object.entries(this.cache);
	    if(cacheArray.length>100){
		cacheArray.sort( (a,b) => { return b[1].timestamp - a[1].timestamp } );
		//process.stderr.write('garbage');
		for(let i=0;i<20;i++){
		    let [key,value] = cacheArray[i];
		    delete this.cache[key]
		}
	    }
	    return tiles
	}

	async getImage(bbox,zoom,border=false){

	    let tileImages = await this.getTiles(bbox,zoom);
	    let { dimX, dimY } = utils.bboxToDimension(bbox, zoom);  /////////////
	    let w = dimX*this.TILE_SIZE;
	    let h = dimY*this.TILE_SIZE;
	    let image = p.createImage(w,h); //was this.image
	    for(let y=0;y<dimY;y++){
		for(let x=0;x<dimX;x++){
		    let ts=this.TILE_SIZE;
		    let posX = x*ts;
		    let posY = y*ts;
		    let index = x+y*dimX;
		    image.copy(tileImages[index], 0,0, ts,ts, posX,posY, ts,ts);  
		}
	    }
	    let tilesBbox= utils.bboxToTileBbox(bbox,zoom)
	    let pixelTopLeft = utils.latLonToPixel(bbox.north, bbox.west, tilesBbox, zoom);
	    let pixelBottomRight = utils.latLonToPixel(bbox.south, bbox.east, tilesBbox, zoom); 
	    let xc = pixelTopLeft.x;
	    let yc = pixelTopLeft.y;
	    let wc = pixelBottomRight.x - pixelTopLeft.x;
	    let hc = pixelBottomRight.y - pixelTopLeft.y;
	    if(border){
		wc++;
		hc++;
	    }
	    //console.log(xc,yc,wc,hc);
	    //this.bbox = bbox;
	    //console.log(this.bbox)
	    return image.get(xc,yc, wc,hc)            
	}
    }



    
    //p.id=6614870445 
/*    
    p.loadImagePromise = (path) => {
	return new Promise(function(resolve,reject){
            p.loadImage(path,resolve,reject)
	})
    }
*/
    p.loadJSONPromise = (path) => {
	return new Promise(function(resolve,reject){
            p.loadJSON(path,resolve,reject)
	})
    }
	

    p.updateMap = async function(feature,zoom=16,size=512){
	let coords=feature.geometry.coordinates;
	p.map.setZoom(zoom);
	p.map.setSize(size,size);
	p.map.setPan(coords[0],coords[1]);
	await p.map.update();
    }

    /*
    p.updateImage = async function(pfad,color,tags){
	try {
	    //p.auszug = await p.loadImagePromise(pfad+'dem-512.png');
	    //p.img = await p.loadImagePromise(pfad+'esri-512.png');
	    p.info = await p.loadJSONPromise(pfad+'info-512.json');
	    p.texte = await p.esri.getImage(p.info.bbox,p.info.zoom);
	    p.auszug = await p.dem.getImage(p.info.bbox,12);
	} catch {
	    console.log('error reading images');
	}
	p.treeColor=color;
	p.treeRadius=3;
	p.slope = { ele: tags.height, slope: tags.slope, aspect: tags.aspect }
	//console.log(tags);
	p.makeModels()
	p.cam.camera(0,-400,800,0,-100,0);
    }
*/
    p.setup = () => {

	// CORS !
	let template;
	if(Location.hostname=='localhost'){
	    template=Location.origin+'/data/maps/tiles/esri/{z}/{x}/{y}.jpeg'
	}else{
	    template='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
	}

	p.map= new p.Map(47.5,7.5,16,512,512);
	
	p.esri= new p.RasterLayer({ template: template });
	p.map.setTextureLayer(p.esri);
	
	p.dem= new p.RasterLayer({template: '../../data/maps/tiles/dem/{z}/{x}/{y}.png'});
	p.map.setTerrainLayer(p.dem);

	
	//p.tree= new p.GeoJSONLayer();
	//p.map.
	
	p.breite=900;
	p.hoehe=600;
	let cvs=document.getElementById('terrain')
	p.cvs=p.createCanvas(p.breite,p.hoehe,p.WEBGL,cvs);
	//console.log(p.cvs);
	p.sx=16
	p.sy=16;
	p.sz=1.5;
	p.bottom= 10;
	
	p.d=0;

	p.cam=p.createCamera();
	//console.log(p.cam);
	p.cam.camera(0,-400,800,0,-100,0);
	
    }


    
    p.makeBox = (grid) => {
	//texture(texte);
	let x,y;
	p.noStroke();
	p.beginGeometry();
	/*
	//normalMaterial();
	for(let y=0;y<cols-1;y++){
	beginShape(TRIANGLE_STRIP);
        for(let x=0;x<rows;x++){
        //console.log(x,y);
        let col1=grid[y][x]*p.sz;
        let col2=grid[y+1][x]*p.sz; 
        vertex(x*sx,y*sy,col1,(x*sx)/b,(y*sy)/h );
        vertex(x*sx,(y+1)*sy,col2,(x*sx)/b,((y+1)*sy)/h );
	}
	endShape();   
	}
	*/

	p.fill(183,139,6);
	//unten
	p.beginShape(p.TRIANGLE_STRIP);
	y=grid.height-1;
	for(x=0;x<grid.width;x++){
            p.vertex(x*p.sx, y*p.sy, grid.get(x,y)*p.sz);
            p.vertex(x*p.sx, y*p.sy, p.d);
	}
	p.endShape();
	//oben
	p.beginShape(p.TRIANGLE_STRIP);
	y=0;
	for(x=0;x<grid.width;x++){
            p.vertex(x*p.sx, y*p.sy, grid.get(x,y)*p.sz);
            p.vertex(x*p.sx, y*p.sy, p.d);
	}
	p.endShape();
	p.fill(204,153,0);
	//rechts
	p.beginShape(p.TRIANGLE_STRIP);
	x=grid.width-1;
	for(y=0;y<grid.height;y++){
            p.vertex(x*p.sx, y*p.sy, grid.get(x,y)*p.sz);
            p.vertex(x*p.sx, y*p.sy, p.d);
	}
	p.endShape();

	//links
	p.beginShape(p.TRIANGLE_STRIP);
	x=0;
	for(y=0;y<grid.height;y++){
            p.vertex(x*p.sx, y*p.sy, grid.get(x,y)*p.sz);
            p.vertex(x*p.sx, y*p.sy, p.d);
	}
	p.endShape();

	//bottom
	p.fill(155,117,3)
	p.beginShape()
	p.vertex(0,0,p.d);
	p.vertex(0, (grid.height-1)*p.sy, p.d);
	p.vertex((grid.width-1)*p.sx,(grid.height-1)*p.sy, p.d);
	p.vertex((grid.width-1)*p.sx ,0, p.d)
	p.endShape(p.CLOSE);
	p.noFill();

	p.bb = p.endGeometry();
	//return bb
	return p.bb;
    }

/*
    p.makeGrid = () => {
	let width=p.auszug.width;
	let height=p.auszug.height;
	p.auszug.loadPixels();
	let pixels= p.auszug.pixels;
	
	p.grid= new HeightGrid(pixels,width,height);
	p.min= p.grid.subMin(10);
	
	p.rows=width;
	p.cols=height;
	p.b=p.sx*p.rows;
	p.h=p.sy*p.cols;
	p.d=0;
    }
*/

    p.getGrid = (x,y) => {
        return p.map.grid.get(x,y);
    }

    

    /*
    p.makeModels = () => {
	p.makeGrid();
	
	//p.mx = Math.round(p.rows/2)
	//p.my = Math.round(p.cols/2)
	//p.mz = p.getGrid(p.mx,p.my);
	
//console.log(p.slope);
	if(p.landschaft)p.freeGeometry(p.landschaft);
	if(p.box)p.freeGeometry(p.box);
	p.landschaft = new p5.Geometry(1,1,p.createShape)
	//p.landschaft.saveObj();
	p.box = p.makeBox();
    }
*/
    
    p.draw = () => {
	p.background(0);
	p.ambientLight(64);
	p.directionalLight(255, 255, 255, -1, -1,1);
	//normalMaterial();
	p.noStroke();

	p.fill(0,0,255);
	p.sphere(10);
	//baum

	//rotateX(PI/2);
	//rotateY(frameCount/100);
	p.translate(-p.b/2,0,-p.h/2);
	p.fill(0,255,0);
	p.sphere(10);
	p.rotateX(p.PI/2);
	//rotateZ(PI/10)
	p.orbitControl();
	p.stroke(255);

	p.map.render();

	if( false && p.landschaft && p.box ){
            //tree
	    p.push();
	    //tree
	    //let color = p.color(255,0,0);
	    //p.colorMode(p.RGB);
	    p.stroke(p.treeColor)
	    //p.fill(p.treeColor)
	    let mmx=p.cols/2;
	    let mmy=p.rows/2;
	    p.translate(mmx*p.sx,mmy*p.sy,p.grid.getBilinear(mmx,mmy)*p.sz);
	    //p.translate(p.mx*p.sx, p.my*p.sy, p.mz*p.sz);
	    p.sphere(p.treeRadius*1.2);
	    //slope
	    p.colorMode(p.HSB);
	    p.angleMode(p.DEGREES);
	    let phi = p.slope.aspect*(180/Math.PI)+90;
	    if(phi<0)phi=phi+360;
	    if(phi>360)phi=phi-360;

	    phi= Math.round(phi/45)*45;
	    // süden: rot; osten: lila; norden: blau; westen: grün
	    //if(p.frameCount==100)console.log(phi,p.colorMode());
	    //let phi= Math.round((p.slope.aspect-Math.PI/2)/8)*(Math.PI/8);
	    let c = p.color(phi,100,100)
	    p.stroke(phi,85,90);
	    //p.fill(c)
	    
	    p.angleMode(p.RADIANS);
	    p.colorMode(p.RGB);
	    let lx=10*p.sx*p.slope.slope*Math.cos(p.slope.aspect);
	    let ly=10*p.sy*p.slope.slope*Math.sin(p.slope.aspect);

	    //let ll=Math.sqrt(lx*lx+ly*ly);
	    
	    p.strokeWeight(3);
	    p.line( 0, 0, 0 ,lx ,-ly ,0 )
	    //p.line( lx,ly,0,lx,ly,-slope.slope)
	    
	    p.pop()
            //terrain
	    /*
	    //p.stroke(255)
	    p.texture(p.texte)
	    p.model(p.landschaft)
	    p.fill(0,255,0);
	    p.noStroke();
	    p.model(p.box);
            */

	}
    }

}


let terrain;
export async function showTerrain(feature){
    if(!terrain)terrain  = new p5(show);
    await terrain.updateMap(feature)
    document.getElementById('terrainBackground').setAttribute('style','display:block');
}

export async function terrainSetPan(lon,lat){
    if(terrain){
	terrain.map.setPan(lon,lat);
	await terrain.map.update();
    }
}

export async function terrainSetZoom(zoom){
    if(terrain){
	terrain.map.setZoom(zoom);
	await terrain.map.update();
    }
}

export async function terrainSetSize(width,height){
    if(terrain){
	terrain.map.setSize(width,height);
	await terrain.map.update();
    }
}



/*
export async function showTerrain(pfad,color,tags){
    if(!terrain)terrain  = new p5(show);
    await terrain.updateImage(pfad,color,tags)
    document.getElementById('terrainBackground').setAttribute('style','display:block');
}
*/
/* 
   <script type="module">
     // https://stackoverflow.com/questions/67246229/mix-commonjs-and-es6-modules-in-same-project
     async function loadEsModules() {
         const module = await import('./terrain/sketch.mjs');
         window.showTerrain = module.showTerrain;
     }
     await loadEsModules();
   </script>
*/




/*
import * as funcs from './mapbox.mjs'
console.log(funcs);
*/


//let uhu= new XYZTileset();

//let i= await uhu.getImage(47.5,7.5,12)

/*
function PixelToEle(pixels, idx){
	//idx*=4;
	let red = pixels[idx+0];     
	let green = pixels[idx+1];     
	let blue = pixels[idx+2];     
	return ( (red * 256 * 256 + green * 256 + blue) * 0.1) - 10000 
	//return ( (red<<16 + green<<8 + blue) * 0.1) - 10000 
}


function getSlope(data,ncols,x,y){
 
	function H(idx){
            return data[idx]
	}
    
	let slope;
	let aspect;

	let zFactor=1.0/90.0

	let r=ncols;
	let i=y*ncols+x

	let H11 = H(i-r-1);
	let H12 = H(i-r);
	let H13 = H(i-r+1);
	let H21 = H(i-1)
	let H22 = H(i);
	let H23 = H(i+1);
	let H31 = H(i+r-1);
	let H32 = H(i+r);
	let H33 = H(i+r+1);

	let dzdy = ( H11 + 2*H12 + H13 - H31 - 2*H32 - H33 ) / 4.0
	let dzdx = ( H11 + 2*H21 + H31 - H13 - 2*H23 - H33 ) / 4.0
	 //console.log(N+' '+S+' '+E+' '+W);

	let dx=1;
	let dy=1;

	dzdx= dzdx/dx;
	dzdy= dzdy/dy;

	let d2=zFactor*Math.sqrt( dzdx*dzdx + dzdy*dzdy)

	//if(d2>0)console.log(d2+' '+dzdy+' '+dzdx);

	//slope=Math.atan(d2);
	slope=d2;
	aspect =  Math.atan2( dzdy, dzdx );

	let ans = { ele: H22, slope: slope, aspect: aspect };
//console.log(ans);
	return ans;
}


class HeightGrid {

    constructor(pixels,width,height){
	this.width=width;
	this.height=height;
	this.data = new Float32Array(width*height);
	
	for(let i=0;i<this.data.length;i++){
	    this.data[i]=PixelToEle(pixels,4*i);
	}

	
	//for(let i=0;i<uint32.length;i++){
	//    this.data[i]= ((uint32[i]>>8)-10000)*0.1;
	//}

//	console.log(pixels,this.data);
    }
    
    get(x,y){
	return this.data[Math.round(y)*this.width+Math.round(x)];
    }


    getBilinear(row, col) {
	var avg = function(v1, v2, f) {
            return v1 + (v2 - v1) * f;
        },
            rowLow = Math.floor(row),
	    rowHi = rowLow + 1,
	    rowFrac = row - rowLow,
	    colLow = Math.floor(col),
	    colHi = colLow + 1,
	    colFrac = col - colLow,
	    v00 = this.get(rowLow, colLow),
	    v10 = this.get(rowLow, colHi),
	    v11 = this.get(rowHi, colHi),
	    v01 = this.get(rowHi, colLow),
	    v1 = avg(v00, v10, colFrac),
	    v2 = avg(v01, v11, colFrac);

	    // console.log('row = ' + row);
	    // console.log('col = ' + col);
	    // console.log('rowLow = ' + rowLow);
	    // console.log('rowHi = ' + rowHi);
	    // console.log('rowFrac = ' + rowFrac);
	    // console.log('colLow = ' + colLow);
	    // console.log('colHi = ' + colHi);
	    // console.log('colFrac = ' + colFrac);
	    // console.log('v00 = ' + v00);
	    // console.log('v10 = ' + v10);
	    // console.log('v11 = ' + v11);
	    // console.log('v01 = ' + v01);
	    // console.log('v1 = ' + v1);
	    // console.log('v2 = ' + v2);

	return avg(v1, v2, rowFrac);
};


    getMin(){
	let min=1000000;
	for(let i=0;i<this.data.length;i++){
	    let tmp=this.data[i];
	    if(tmp<min)min=tmp;
	}
	return min;
    }

    subMin(offset=0){
	let min= this.getMin();
	for(let i=0;i<this.data.length;i++){
	    this.data[i]-=min-offset;
	}
	return min;
    }
}

*/
