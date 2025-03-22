#!/usr/bin/env node

import { HeightGrid } from './HeightGrid.mjs';
import * as tilebelt from '../node_modules/@mapbox/tilebelt/dist/esm/index.js';
import  { SphericalMercator } from '../node_modules/@mapbox/sphericalmercator/dist/esm/index.js';
import * as utils from '../../../data/data-factory/modules/map-utils.mjs'
import Martini  from '../node_modules/@mapbox/martini/index.js'


class Emitter {
    constructor() {
        this.eventMap = new Map();
    }

    on(event, callback) {
        if (!this.eventMap.has(event)) {
            this.eventMap.set(event, []);
        }
        this.eventMap.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventMap.has(event)) {
            const callbacks = this.eventMap.get(event).filter(cb => cb !== callback);
            this.eventMap.set(event, callbacks);
        }
    }

    emit(event, ...data) {
        if (this.eventMap.has(event)) {
            this.eventMap.get(event).forEach(callback => {
                setTimeout(() => callback(...data), 0);
            });
        }
    }
}


class Map3D {

    constructor(){
	this.mercartor = new SphericalMercator({size: 256,antimeridian: true});
	this.setMap(47.5,7.5,16,512,512);
	this.frame=false;
	//this.pInst=p5;
    }           

    init(){
	this.terrainLayer = new RasterLayer(this.pInst);
	this.textureLayer =  new RasterLayer(this.pInst);
	this.events = new Emitter();
	
	this.frameBuffer = this.pInst.createFramebuffer();
    }

    addLayer
    
    setMap( lat,lon,zoom,width,height){
	this.lon=lon;
	this.lat=lat;
	this.zoom=zoom;
	this.width=width;
	this.height=height
    }

    setPan(lon,lat){
	this.lon=lon;
	this.lat=lat;
    }

    setZoom(zoom){
	this.zoom=zoom;
    }

    setSize(width,height){
	this.width=width;
	this.height=height;
    }           

    setTerrainTemplate(template){
	this.terrainLayer.setTemplate(template);
    }

    setTextureTemplate(template){
	this.textureLayer.setTemplate(template);
	this.textureLayer.cache={};
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

    update(){
	this.events.emit('updatestart','');
	setTimeout(async () => { await this.updateAsync() },500); 
    }

  
    async updateAsync(){

	let terrain;
	let box;
	this.bounds=utils.latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	if(this.terrainLayer){
	    //console.log(this.lat,this.lon,this.zoom,this.width,this.height);
	    let demImage = await this.terrainLayer.getImage(this.bounds,12,true);
	    //make grid
	    demImage.loadPixels();
	    let pixels = demImage.pixels;
	    let grid = new HeightGrid(pixels,demImage.width,demImage.height);
            //calc factors
	    let fac=32/grid.width;
	    let sx=this.width/grid.width;
	    let sy=this.height/grid.height;
	    let sz=2*fac;	    
	    let d=sz*(grid.getMin()-10);
	    this.dTemp=d;
	    //makeModels
	    box = this.makeBox(grid,sx,sy,sz,d);	    
	    terrain = this.makeTerrain(grid,sx,sy,sz,d);
	}

	/*
	if(this.textureLayer&&false){
	    if(this.tex)delete this.tex;
	    this.tex = await this.textureLayer.getImage(this.bounds,this.zoom);
	}
        */
    
	if(this.textureLayer && false){
	    let tex = await this.textureLayer.getImage(this.bounds,this.zoom);
	    if(this.frame){
		if(this.frameBuffer && tex){
		    this.frameBuffer.resize(tex.width,tex.height);
		    this.frameBuffer.begin();
		    image(tex,0,0);
		    this.frameBuffer.end();
		}
	    }else{
		this.tex=tex;
	    }
	}
	if(terrain){
	    if(this.terrain)this.pInst.freeGeometry(this.terrain);
	    this.terrain = terrain;	    
	    if(this.box)this.pInst.freeGeometry(this.box);
	    this.box= box;

	}
	this.moveX=this.width/2;
	this.moveY=this.height/2
	this.moveZ=this.dTemp;

	this.events.emit('updateend','');    
    }
    
    setLight(x,y,z){
	this.lightX=x;
	this.lightY=y;
	this.lightZ=z;
    }

    render(){
	//this.pInst.translate(-1*this.breite/2,-2*this.min,-1*this.hoehe/2);
	//this.pInst.translate(-1*this.breite/2,this.hoehe,1*this.min);
	//this.pInst.rotateX(this.pInst.PI/2)
	this.pInst.push();

	this.pInst.rotateX(this.pInst.PI/2)

        this.pInst.ambientLight(32);                                                                                         //this.pInst.directionalLight(255, 255, 255, -1, -1,1);
        this.pInst.directionalLight(255, 255, 255, this.lightX,this.lightY,this.lightZ);

	this.pInst.translate(-this.moveX,-this.moveY,-this.moveZ);

	this.pInst.fill(0,225,0);
	if(this.frame){
	    //if(this.tex)this.pInst.texture(this.tex)
	    if(htis.frameBuffer)this.pInst.texture(this.frameBuffer);
	}else{
	    if(this.tex)this.pInst.texture(this.tex);
	}
	if(this.terrain)this.pInst.model(this.terrain)
	this.pInst.noStroke();
	if(this.box)this.pInst.model(this.box);          

	this.pInst.pop();
    }

    makeMartini(grid,sx,sy,sz,d){
	let geometry= new this.pInst.p5.Geometry();
	const martini = new Martini(grid.width);
	const tile = martini.CreateTile(grid.data);
	const mesh = tile.getMesh(10);
        console.log(mesh);
    }


    
    makeTerrain(grid,sx,sy,sz,d){
	let geometry = new this.pInst.p5.Geometry();
	let w=grid.width
	let h=grid.height
	for(let y=0;y<h;y++){
	    for(let x=0;x<w;x++){
		const vx = x                  * sx;
		const vy = y                  * sy;
		const vz = grid.get(x,y)      * sz;
		const v = this.pInst.createVector(vx,vy,vz); 
		geometry.vertices.push(v);
		geometry.uvs.push(x/w);
		geometry.uvs.push(y/h);
		if(x>0 && y>0){
		    const idx=geometry.vertices.length-1;
		    geometry.faces.push( [ idx-w-1, idx-1, idx-w ]);
		    geometry.faces.push( [ idx-w  , idx-1, idx        ]);
		}
	    }
	}
	geometry.computeNormals(this.pInst.SMOOTH);
	return geometry;
    }
  

     makeBox(grid,sx,sy,sz,d){
	 //texture(texte);
	 let x,y;
	 this.pInst.noStroke();
	 this.pInst.beginGeometry();

	 this.pInst.fill(183,139,6);
	 //unten
	 this.pInst.beginShape(this.pInst.TRIANGLE_STRIP);
	 y=grid.height-1;
	 for(x=0;x<grid.width;x++){
	     this.pInst.vertex(x*sx, y*sy, grid.get(x,y)*sz);
	     this.pInst.vertex(x*sx, y*sy, d);
	 }
	 this.pInst.endShape();
	 //oben
	 this.pInst.beginShape(this.pInst.TRIANGLE_STRIP);
	 y=0;
	 for(x=0;x<grid.width;x++){
	     this.pInst.vertex(x*sx, y*sy, grid.get(x,y)*sz);
	     this.pInst.vertex(x*sx, y*sy, d);
	 }
	 this.pInst.endShape();
	 this.pInst.fill(204,153,0);
	 //rechts
	 this.pInst.beginShape(this.pInst.TRIANGLE_STRIP);
	 x=grid.width-1;
	 for(y=0;y<grid.height;y++){
	     this.pInst.vertex(x*sx, y*sy, grid.get(x,y)*sz);
	     this.pInst.vertex(x*sx, y*sy, d);
	 }
	 this.pInst.endShape();

	 //links
	 this.pInst.beginShape(this.pInst.TRIANGLE_STRIP);
	 x=0;
	 for(y=0;y<grid.height;y++){
	     this.pInst.vertex(x*this.pInst.sx, y*sy, grid.get(x,y)*sz);
	     this.pInst.vertex(x*sx, y*sy, d);
	 }
	 this.pInst.endShape();

	 //bottom
	 this.pInst.fill(155,117,3);
	 this.pInst.beginShape();
	 this.pInst.vertex(0,0,d);
	 this.pInst.vertex(0, (grid.height-1)*sy, d);
	 this.pInst.vertex((grid.width-1)*sx,(grid.height-1)*sy, d);
	 this.pInst.vertex((grid.width-1)*sx ,0, d);
	 this.pInst.endShape(this.pInst.CLOSE);
	 this.pInst.noFill();

	 return this.pInst.endGeometry().computeNormals();
     }
}


class RasterLayer{
   
    constructor(pInst){
	this.TILE_SIZE=256;
	//this.setOptions(options);
	this.cache={};
	this.pInst=pInst
    }


    setTemplate(template){
	if(template){
	    this.template=template;
	}else{
	    this.template='https://{s}.tile.openstreetmathis.pInst.org/{z}/{x}/{y}.png';
	}
    }

    loadImage(path){
	return new Promise((resolve,reject) =>{
	    this.pInst.loadImage(path,resolve,reject)
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
	let image = this.pInst.createImage(w,h); //was this.image
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


class GeoJSONLayer {
    constructor(pInst){
	this.pInst=pInst
    }


    setGeoJSON(geojson){
	this.geojson=geojson
    }

    pointToLayer(feature){
	

    }

}

//https://www.youtube.com/watch?v=-c9RLgmdVXQ

export function createMap3D(pInst){
    const pMap3D = new Map3D();
    pMap3D.pInst = pInst;
    pMap3D.init();    
    return pMap3D;
}

export function createRasterLayer(p5inst){
    const pRasterLayer = new RasterLayer();
    pRasterLayer.pInst=p5inst;
    return pRasterLayer;
}
