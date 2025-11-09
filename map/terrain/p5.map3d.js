#!/usr/bin/env node
/**
 * Get the tile for a quadkey
 *
 * const tile = quadkeyToTile('00001033')
 * //=tile
 */
function quadkeyToTile(quadkey) {
    let x = 0;
    let y = 0;
    const z = quadkey.length;
    for (let i = z; i > 0; i--) {
        const mask = 1 << (i - 1);
        const q = +quadkey[z - i];
        if (q === 1)
            x |= mask;
        if (q === 2)
            y |= mask;
        if (q === 3) {
            x |= mask;
            y |= mask;
        }
    }
    return [x, y, z];
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
// 900913 properties;
const A = 6378137.0;
const MAXEXTENT = 20037508.342789244;
const SPHERICAL_MERCATOR_SRS = '900913'; // https://epsg.io/900913, https://epsg.io/3857
const WGS84 = 'WGS84'; // https://epsg.io/4326

const cache = {};
function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}
class SphericalMercator {
    #size;
    #expansion;
    #Bc;
    #Cc;
    #zc;
    #Ac;
    constructor(options = {}) {
        this.#size = options.size || 256;
        this.#expansion = options.antimeridian ? 2 : 1;
        if (!cache[this.#size]) {
            let size = this.#size;
            const c = (cache[this.#size] = {});
            c.Bc = [];
            c.Cc = [];
            c.zc = [];
            c.Ac = [];
            for (let d = 0; d < 30; d++) {
                c.Bc.push(size / 360);
                c.Cc.push(size / (2 * Math.PI));
                c.zc.push(size / 2);
                c.Ac.push(size);
                size *= 2;
            }
        }
        this.#Bc = cache[this.#size].Bc;
        this.#Cc = cache[this.#size].Cc;
        this.#zc = cache[this.#size].zc;
        this.#Ac = cache[this.#size].Ac;
    }
    px(ll, zoom) {
        if (isFloat(zoom)) {
            const size = this.#size * Math.pow(2, zoom);
            const d = size / 2;
            const bc = size / 360;
            const cc = size / (2 * Math.PI);
            const ac = size;
            const f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
            let x = d + ll[0] * bc;
            let y = d + 0.5 * Math.log((1 + f) / (1 - f)) * -cc;
            x > ac * this.#expansion && (x = ac * this.#expansion);
            y > ac && (y = ac);
            //(x < 0) && (x = 0);
            //(y < 0) && (y = 0);
            return [x, y];
        }
        else {
            const d = this.#zc[zoom];
            const f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
            let x = Math.round(d + ll[0] * this.#Bc[zoom]);
            let y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * -this.#Cc[zoom]);
            x > this.#Ac[zoom] * this.#expansion &&
                (x = this.#Ac[zoom] * this.#expansion);
            y > this.#Ac[zoom] && (y = this.#Ac[zoom]);
            //(x < 0) && (x = 0);
            //(y < 0) && (y = 0);
            return [x, y];
        }
    }
    ll(px, zoom) {
        if (isFloat(zoom)) {
            const size = this.#size * Math.pow(2, zoom);
            const bc = size / 360;
            const cc = size / (2 * Math.PI);
            const zc = size / 2;
            const g = (px[1] - zc) / -cc;
            const lon = (px[0] - zc) / bc;
            const lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
            return [lon, lat];
        }
        else {
            const g = (px[1] - this.#zc[zoom]) / -this.#Cc[zoom];
            const lon = (px[0] - this.#zc[zoom]) / this.#Bc[zoom];
            const lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
            return [lon, lat];
        }
    }
    convert(bbox, to) {
        if (to === SPHERICAL_MERCATOR_SRS) {
            return [
                ...this.forward(bbox.slice(0, 2)),
                ...this.forward(bbox.slice(2, 4)),
            ];
        }
        else {
            return [
                ...this.inverse(bbox.slice(0, 2)),
                ...this.inverse(bbox.slice(2, 4)),
            ];
        }
    }
    inverse(xy) {
        return [
            (xy[0] * R2D) / A,
            (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D,
        ];
    }
    forward(ll) {
        const xy = [
            A * ll[0] * D2R,
            A * Math.log(Math.tan(Math.PI * 0.25 + 0.5 * ll[1] * D2R)),
        ];
        // if xy value is beyond maxextent (e.g. poles), return maxextent.
        xy[0] > MAXEXTENT && (xy[0] = MAXEXTENT);
        xy[0] < -20037508.342789244 && (xy[0] = -20037508.342789244);
        xy[1] > MAXEXTENT && (xy[1] = MAXEXTENT);
        xy[1] < -20037508.342789244 && (xy[1] = -20037508.342789244);
        return xy;
    }
    bbox(x, y, zoom, tmsStyle, srs) {
        // Convert xyz into bbox with srs WGS84
        if (tmsStyle) {
            y = Math.pow(2, zoom) - 1 - y;
        }
        // Use +y to make sure it's a number to avoid inadvertent concatenation.
        const ll = [x * this.#size, (+y + 1) * this.#size]; // lower left
        // Use +x to make sure it's a number to avoid inadvertent concatenation.
        const ur = [(+x + 1) * this.#size, y * this.#size]; // upper right
        const bbox = [...this.ll(ll, zoom), ...this.ll(ur, zoom)];
        // If web mercator requested reproject to 900913.
        if (srs === SPHERICAL_MERCATOR_SRS)
            return this.convert(bbox, SPHERICAL_MERCATOR_SRS);
        return bbox;
    }
    xyz(bbox, zoom, tmsStyle, srs) {
        // If web mercator provided reproject to WGS84.
        const box = srs === SPHERICAL_MERCATOR_SRS ? this.convert(bbox, WGS84) : bbox;
        const ll = [box[0], box[1]]; // lower left
        const ur = [box[2], box[3]]; // upper right
        const px_ll = this.px(ll, zoom);
        const px_ur = this.px(ur, zoom);
        // Y = 0 for XYZ is the top hence minY uses px_ur[1].
        const x = [
            Math.floor(px_ll[0] / this.#size),
            Math.floor((px_ur[0] - 1) / this.#size),
        ];
        const y = [
            Math.floor(px_ur[1] / this.#size),
            Math.floor((px_ll[1] - 1) / this.#size),
        ];
        const bounds = {
            minX: Math.min.apply(Math, x) < 0 ? 0 : Math.min.apply(Math, x),
            minY: Math.min.apply(Math, y) < 0 ? 0 : Math.min.apply(Math, y),
            maxX: Math.max.apply(Math, x),
            maxY: Math.max.apply(Math, y),
        };
        if (tmsStyle) {
            const tms = {
                minY: Math.pow(2, zoom) - 1 - bounds.maxY,
                maxY: Math.pow(2, zoom) - 1 - bounds.minY,
            };
            bounds.minY = tms.minY;
            bounds.maxY = tms.maxY;
        }
        return bounds;
    }
}

/**
 * Get the quadkey for a tile
 *
 * const quadkey = tileToQuadkey([0, 1, 5])
 * //=quadkey
 */
function tileToQuadkey(tile) {
    let index = '';
    for (let z = tile[2]; z > 0; z--) {
        let b = 0;
        const mask = 1 << (z - 1);
        if ((tile[0] & mask) !== 0)
            b++;
        if ((tile[1] & mask) !== 0)
            b += 2;
        index += b.toString();
    }
    return index;
}

/*
import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import { existsSync, writeFileSync, mkdirSync } from 'fs'
*/

//../node_modules/@mapbox/tilebelt/dist/esm/
//import { tileToQuadkey } from  '@mapbox/tilebelt' 
 

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2

const TILE_SIZE = 256;
const EARTH_CIR_METERS = 40075016.686;

function toDegrees(radians) {
  return (radians / Math.PI) * 180
}


// coords to number  
function lon2tile(lon,zoom) {
    return (Math.floor(lon2tileFraction(lon,zoom)));
}
function lat2tile(lat,zoom)  {
    return Math.floor(lat2tileFraction(lat,zoom));
}


function lon2tileFraction(lon,zoom) {
    return (((lon+180)/360*Math.pow(2,zoom)));
}
function lat2tileFraction(lat,zoom)  {
    return (((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

// works also with x of R
function tile2long(x,z) {
    let n = Math.pow(2,z);
  return (x/n*360-180);
}
// works also with y of R
function tile2lat(y,z) {
  const n = Math.pow(2,z);
    const latRad = Math.atan( Math.sinh( Math.PI * ( 1.0 - 2*y/n )));
    return latRad * 180 / Math.PI;
}

/*
// same as lon2tileFraction
export function lonOnTile(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom)
}
// same as lat2TileFraction;
export function latOnTile(lat, zoom) {
  return (
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    Math.pow(2, zoom)
  )
} 
*/


function isInBbox(lon,lat,bbox){

    // https://gist.github.com/graydon/11198540
    
    let top=bbox.north;
    let left=bbox.west;
    let bottom=bbox.south;
    let right=bbox.east;

    let ans = ( ( lon > left ) && ( lon < right) && (lat > bottom) && ( lat < top) );
    return ans
}



/////////////////////////////////module//////////////////////////////////////////////////////////

/////////////////terrain use
function bboxToTileBbox(bbox,zoom){

    let top=lat2tile(bbox.north,zoom);
    let left=lon2tile(bbox.west,zoom);
    let bottom=lat2tile(bbox.south,zoom) + 1;
    let right=lon2tile(bbox.east,zoom) + 1;

    //console.log(top,left,bottom,right)
    
    let tileTop = tile2lat(top,zoom);
    let tileLeft= tile2long(left,zoom);
    let tileBottom = tile2lat(bottom,zoom);
    let tileRight = tile2long(right,zoom);

    
    let ans = { north: tileTop, west: tileLeft, south: tileBottom, east: tileRight };

    //console.log(ans);
    return ans;
}

////////////////terrain use
function latLngToBounds(lat, lng, zoom, width, height){

    const degreesPerMeter = 360 / EARTH_CIR_METERS;
    const LIMIT_Y = toDegrees(Math.atan(Math.sinh(Math.PI))); // around 85.0511...

    const metersPerPixelEW = EARTH_CIR_METERS / Math.pow(2, zoom + 8);
    const shiftMetersEW = width/2 * metersPerPixelEW;
    const shiftDegreesEW = shiftMetersEW * degreesPerMeter;

    const southTile = (TILE_SIZE * lat2tileFraction(lat, zoom) + height/2) / TILE_SIZE;
    const northTile = (TILE_SIZE * lat2tileFraction(lat, zoom) - height/2) / TILE_SIZE;

    return {
      south: Math.max(tile2lat(southTile, zoom), -LIMIT_Y),
      west: lng-shiftDegreesEW,
      north: Math.min(tile2lat(northTile, zoom), LIMIT_Y),
      east: lng+shiftDegreesEW
    }
}

///////////////terrain use
function latLonToPixel(lat,lon,bbox, zoom){
   
    let y=lat2tileFraction(bbox.north,zoom);
    let x=lon2tileFraction(bbox.west,zoom);
    let pointX=lon2tileFraction(lon,zoom);
    let pointY=lat2tileFraction(lat,zoom);
    
    /* tilebelt version
    let topleft=tilebelt.pointToTileFraction(bbox.west, bbox.north, zoom)
    let point=tilebelt.pointToTileFraction(lon, lat, zoom);
    // = [x,y,z]
    
    let x = topleft[0]
    let y = topleft[1]
    let pointX = point[0];
    let pointY = point[1];
    */
    
    let resX = Math.round( TILE_SIZE*(pointX - x));
    let resY = Math.round( TILE_SIZE*(pointY - y));

    return { x: resX, y: resY }
}

//////terrain use
function bboxToTiles(bbox,zoom){
    
    let top=lat2tile(bbox.north,zoom);
    let left=lon2tile(bbox.west,zoom);
    let bottom=lat2tile(bbox.south,zoom);
    let right=lon2tile(bbox.east,zoom);
    let tiles=[];
    for(let y=top;y<bottom+1;y++){
	for(let x=left;x<right+1;x++){
	    //tiles.push(zoom);
	    tiles.push(x);
	    tiles.push(y);
	}
    }
    return tiles;
}

////////////////terrain use
function bboxToQuads(bbox,zoom){
    let tiles= bboxToTiles(bbox,zoom);
    let quads=[];
    for(let i=0;i<tiles.length;i+=2){
	quads.push(tileToQuadkey([ tiles[i],tiles[i+1],zoom ]));
    }
    return quads;
}


////////////terrain use
function bboxToDimension(bbox,zoom){

    let top=lat2tile(bbox.north,zoom);
    let left=lon2tile(bbox.west,zoom);
    let bottom=lat2tile(bbox.south,zoom);
    let right=lon2tile(bbox.east,zoom);

    let dimX=Math.abs(left-right)+1;
    let dimY=Math.abs(top-bottom)+1;

    return { dimX: dimX, dimY: dimY }
}

//import Martini  from '../node_modules/@mapbox/martini/index.js'

//import {tilebelt,SpericalMercator,utils} from './mapBundle.js'

//import * as uhu from './mapBundle.js'


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
	//this.frame=false;
	//this.pInst=p5;
    }           

    init(){
	this.terrainLayer = new RasterLayer(this.pInst);
	this.textureLayer =  new RasterLayer(this.pInst);
	this.vectorLayer = new GeoJSONLayer(this.pInst);
	this.events = new Emitter();
	let options={ width: 512, height:512, box: { draw: true, align: 'bottom', offset: 0}, sz:2 };
	this.terrain = new Terrain(options);
	
	//this.frameBuffer = this.pInst.createFramebuffer();
    }

    ///////////////////////////////setter/////////////////////////////////////////
    
    setMap( lat,lon,zoom,width,height){
	this.lon=lon;
	this.lat=lat;
	this.zoom=zoom;
	this.width=width;
	this.height=height;
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

    setGeoJSON(geo){
	this.vectorLayer.set(geo);
    }

    ///////////////////////////getter//////////////////////////////777
    
    getPixel(lon,lat){
	let px0 = this.mercartor.px( [ this.bounds.west, this.bounds.north ],this.zoom);
	let px1 = this.mercartor.px( [ lon,lat],this.zoom);
	let dx=px1[0]-px0[0];
	let dy=px1[1]-px0[1];
	return [ dx,  dy  ]
    }

    getNormal(lon,lat){
	const [ px, py ] = this.getPixel(lon,lat);
	return [ px/this.width, py/this.height ]
    }

    getElevation(lon,lat){
	let [nx,ny] = this.getNormal(lon,lat);
	return this.terrainData.getNormalized(nx,ny);
    }

    sit(lon,lat){
	let [ px,py ] = this.getPixel(lon,lat);
	let pz = this.getElevation(lon,lat);
	this.pInst.translate( px,py,pz*Math.pow(2,this.zoom-15) );
    }	
    
    
    getLonLat(px,py){
	let px0 = this.mercator.px( [ this.bounds.north, this.bounds.west ],this.zoom);
	return this.mercator.ll( [ px0[0]+px, px0[1]+py ],this.zoom );
    }
   

    /////////////////////////////////////////update////////////////////////////////////////7
    on(event, callback){
	this.events.on(event, callback);
    }

    off(event, callback){
	this.events.off(event, callback);
    }

    update(){
	this.events.emit('updatestart','');
	setTimeout(async () => { await this.updateAsync(); },500); 
    }

    async updateAsync(){
	let terrain;
	let tex;
	let geo;
	
	this.bounds=latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
	//prepare dem
	if(this.terrainLayer){
	    terrain = new TerrainData();
	    let demImage = await this.terrainLayer.getImage(this.bounds,12,true);
	    terrain.setRaster(demImage);
	    this.terrainData= terrain;
	}
	//prepare tex
	if(this.textureLayer){
	    tex = await this.textureLayer.getImage(this.bounds,this.zoom);
	}
	//prepare geojson
	if(this.vectorLayer){
	    this.pInst.beginGeometry();
	    this.vectorLayer.forEach( (feature) => {
	         let coords=feature.geometry.coordinates;
		 if(isInBbox(coords[0],coords[1],this.bounds)){
		     this.pInst.push();
		     this.sit(coords[0],coords[1]); /////???????????????
		     this.vectorLayer.pointToLayer(feature,this.zoom);
		     this.pInst.pop();
		 }
	    });
	    geo = this.pInst.endGeometry();
	}
	    
	//update
	this.terrain.options( { width: this.width, height: this.height } );
        this.terrain.update(terrain,tex);
	this.geo = geo;
	this.events.emit('updateend','');    
    }

    /////////////////////////////////////////////////////////////////////////////////////////
    
    setLight(x,y,z){
	this.lightX=x;
	this.lightY=y;
	this.lightZ=z;
    }
    
    render(){
	//this.pInst.debugMode();
	this.pInst.rotateX(this.pInst.PI/2);
        this.pInst.ambientLight(64);
        this.pInst.directionalLight(255, 255, 255, this.lightX,this.lightY,this.lightZ);
        this.terrain.align();
	if(this.geo)this.pInst.model(this.geo);
        this.terrain.draw();
    }    
}


class GeoJSONLayer {
    constructor(pInst){
	this.pInst=pInst;
	this.pointTolayer = this.defaultPointToLayer;
    }

    

    set(geojson){
	this.geojson=geojson;
	//this.model = this.makeModel();
    }

    setPointToLayer(callback){
	this.pointToLayer=callback;
    }
    
    defaultPointToLayer(feature){
	this.pInst.fill(0,255,0);
	this.pInst.sphere(10);
    }
    

    pointToLayer(feature){
	let tags=feature.properties.tags;
	let propagation=tags.propagation;
	let col;
	switch(propagation){
	case 'natural':
	    col= this.pInst.color(0,255,0);
	    break;
	case 'planted':
	    col= this.pInst.color(0,0,255);
	    break;
	case 'seed':
	    col= this.pInst.color(255,0,0);
	    break;
	case 'graft':
	    col= this.pInst.color(255,255,0);
	    break;
	default:
	    col=this.pInst.color(255);
	}
	this.pInst.noStroke();
	//this.pInst.emissiveMaterial(col);
	this.pInst.fill(col);
	this.pInst.sphere(10);
	this.pInst.strokeWeight(3);
	this.pInst.stroke(255);
	this.pInst.line(0,10,0,10,0,0);
    }

    forEach(callback){
	let features=this.geojson.features;
	//this.pInst.beginGeometry();
	for(let i=0;i<features.length;i++){
	    let feature=features[i];
	    callback(feature);
	}
    }

}


class RasterLayer{
   
    constructor(pInst){
	this.TILE_SIZE=256;
	//this.setOptions(options);
	this.cache={};
	this.pInst=pInst;
    }

    setTemplate(template){
	if(template){
	    this.template=template;
	}else {
	    this.template='https://{s}.tile.openstreetmathis.pInst.org/{z}/{x}/{y}.png';
	}
    }

    loadImage(path){
	return new Promise((resolve,reject) =>{
	    this.pInst.loadImage(path,resolve,reject);
	})
    }

    async getTileFromURL(quadkey){
	let [x,y,z] = quadkeyToTile(quadkey);
	let url =  this.template.replace('{s}','a').replace('{x}',x).replace('{y}',y).replace('{z}',z);
	//console.log(url);
	return await this.loadImage(url);
    }

    async getTiles(bbox,zoom){

	let quads  = bboxToQuads(bbox,zoom);
	let tiles=[];
	for(let quad of quads){
	    if(this.cache[quad]){
		//console.log('-');
		tiles.push(this.cache[quad].tile);
	    }else {
		//console.log('+');
		let tile= await this.getTileFromURL(quad);
		let now=Date.now();
		this.cache[quad]= { tile: tile, timestamp: now }; 
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
		delete this.cache[key];
	    }
	}
	return tiles
    }

    async getImage(bbox,zoom,border=false){

	let tileImages = await this.getTiles(bbox,zoom);
	let { dimX, dimY } = bboxToDimension(bbox, zoom);  /////////////
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
	let tilesBbox= bboxToTileBbox(bbox,zoom);
	let pixelTopLeft = latLonToPixel(bbox.north, bbox.west, tilesBbox, zoom);
	let pixelBottomRight = latLonToPixel(bbox.south, bbox.east, tilesBbox, zoom); 
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




//https://www.youtube.com/watch?v=-c9RLgmdVXQ

p5.prototype.createMap3D =  function(pInst){
    const pMap3D = new Map3D();
    pMap3D.pInst = pInst;
    pMap3D.init();    
    return pMap3D;
};

p5.prototype.createRsterLayer =function(p5inst){
    const pRasterLayer = new RasterLayer();
    pRasterLayer.pInst=p5inst;
    return pRasterLayer;
};
