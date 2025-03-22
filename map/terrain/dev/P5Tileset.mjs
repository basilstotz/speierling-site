#!/usr/bin/env node

//import { Jimp } from 'jimp';
//import { promises as fs } from 'fs';
//import { existsSync, writeFileSync, mkdirSync } from 'fs'
import * as utils from '../../../data/data-factory/modules/map-utils.mjs'
import * as tilebelt from '../node_modules/@mapbox/tilebelt/dist/esm/index.js';
//import { Jimp } from '../node_modules/jimp/dist/browser/index.js'
//import * as utils from './map-utils.mjs'

export class XYZTileset{

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

    
    
    async getTileFromURL(quadkey){
	let [x,y,z] = tilebelt.quadkeyToTile(quadkey);
	let url =  this.template.replace('{s}','a').replace('{x}',x).replace('{y}',y).replace('{z}',z); 
	return await p.loadImagePromise(url);
    }
    
    

    async getTiles(bbox,zoom){
	
	let quads  = utils.bboxToQuads(bbox,zoom);
	let tiles=[];
        for(let quad of quads){
	    if(this.cache[quad]){
		process.stderr.write('*');
		tiles.push(this.cache[quad].tile)
	    }else{
		let tile= await this.getTileFromURL(quad);
		let now=Date.now();
		this.cache[quad]= { tile: tile, timestamp: now } 
		tiles.push(tile);
	    }
	}
	//garbabe collection
	let cacheArray= Object.entries(this.cache);
	if(cacheArray.length>500){
	    cacheArray.sort( (a,b) => { return b[1].timestamp - a[1].timestamp } );
	    process.stderr.write('garbage');
	    for(let i=0;i<250;i++){
		let [key,value] = cacheArray[i];
		delete this.cache[key]
	    }
	}
	return tiles
    }

    async getImage(bbox,zoom){

	let tileImages = await this.getTiles(bbox,zoom);
	let dimension= utils.bboxToDimension(bbox, zoom);  //////////////////////////////////////////////////
	let dimX = dimension.dimX;
	let dimY = dimension.dimY;
	let w = dimX*this.TILE_SIZE;
	let h = dimY*this.TILE_SIZE;
	this.image = p.createImage(w,h);
	for(let y=0;y<dimY;y++){
	    for(let x=0;x<dimX;x++){
		let ts=this.TILE_SIZE;
		let posX = x*ts;
		let posY = y*ts;
		let index = x+y*dimX;
		this.image.copy(tileImages[index], 0,0, ts,ts, posX,posY, ts,ts);  
	    }
	}
	let tilesBbox= utils.bboxToTileBbox(bbox,zoom)  ////////////////////////////////////////////
        let pixelTopLeft = utils.latLonToPixel(bbox.north, bbox.west, tilesBbox, zoom); /////////////
        let pixelBottomRight = utils.latLonToPixel(bbox.south, bbox.east, tilesBbox, zoom); ///////////
	let xc = pixelTopLeft.x;
	let yc = pixelTopLeft.y;
	let wc = pixelBottomRight.x - pixelTopLeft.x;
	let hc = pixelBottomRight.y - pixelTopLeft.y;
	//console.log(xc,yc,wc,hc);
	this.image.get(xc,yc, wc,hc)            
	if(this.center){delete this.center}
	this.bbox = bbox;
	//console.log(this.bbox)
	return this.image
    }


    async getImageByPos(lat, lon, zoom, width, height){
        let bbox= utils.latLngToBounds(lat, lon, zoom, width, height) //////////////////////////////
        let image = await this.getImage(bbox,zoom)
	this.center = { lat: lat, lon: lon };
	//console.log(this.bbox)
	return image;
    }

    getPixelPosition(lat,lon){
	//console.log(this.bbox);
	let pos = utils.latLonToPixel(lat, lon, this.bbox, this.zoom); /////////////////////////////
	if(pos.x>this.image.width)pos.x=this.image.width;
	if(pos.y>this.image.height)pos.y=this.image.height;
	return pos
    }
    
    
    getInfo(){
	let info = {
	    zoom: this.zoom,
	    bbox: this.bbox,
	    center: this.center,
	    template: this.template,
	    width: this.image.width,
	    height: this.image.height
	}
	return info;
    }

}


