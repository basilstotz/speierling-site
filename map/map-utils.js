#!/usr/bin/env node
/*
import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import * as tilebelt from '@mapbox/tilebelt'
*/

//import * as tilebelt from '@mapbox/tilebelt' 
 

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2

 const TILE_SIZE = 256
 const EARTH_CIR_METERS = 40075016.686;

 function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

 function toDegrees(radians) {
  return (radians / Math.PI) * 180
}

//tilebelt bbox
 function tilebeltBboxToObject(bbox){
    return { west: bbox[0], south: bbox[1], east: bbox[2], north: bbox[3] }
}

 function objectBboxToTilebelt(bbox){
    return [ bbox.west, bbox.south, bbox.east, bbox.north ]
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
    const latRad = Math.atan( Math.sinh( Math.PI * ( 1.0 - 2*y/n )))
    return latRad * 180 / Math.PI;
}

/*
// same as lon2tileFraction
 function lonOnTile(lon, zoom) {
  return ((lon + 180) / 360) * Math.pow(2, zoom)
}
// same as lat2TileFraction;
 function latOnTile(lat, zoom) {
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


 function isInBbox(lat,lon,bbox){

    // https://gist.github.com/graydon/11198540
    
    let top=bbox.north;
    let left=bbox.west;
    let bottom=bbox.south;
    let right=bbox.east;

    let ans = ( ( lon > left ) && ( lon < right) && (lat > south) && ( lat < north) );

    if(ans){
	return "true"
    }else{
	return "false"
    }
}


 function calculateDistance(coord1, coord2) {

    const { lat: lat1, lon: lon1 } = coord1;
    const { lat: lat2, lon: lon2 } = coord2;

    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    const dLat = lat2Rad - lat1Rad;
    const dLon = lon2Rad - lon1Rad;

    // Calculation using the haversine formula (the formula is divided into two parts).
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) *
	Math.cos(lat2Rad) *
	Math.sin(dLon / 2) *
	Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //const earthRadius = 6371; // Earth's radius in kilometers.
    const earthRadius = EARTH_CIR_METERS / (2*Math.PI);
    const distance = earthRadius * c;
    // The distance between two geographic points in meters
    return distance;
}


/////////////////////////////////module//////////////////////////////////////////////////////////

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

    
    let ans = { north: tileTop, west: tileLeft, south: tileBottom, east: tileRight }

    //console.log(ans);
    return ans;
}


 function latLngToBounds(lat, lng, zoom, width, height){

    const degreesPerMeter = 360 / EARTH_CIR_METERS;
    const LIMIT_Y = toDegrees(Math.atan(Math.sinh(Math.PI))) // around 85.0511...

    const metersPerPixelEW = EARTH_CIR_METERS / Math.pow(2, zoom + 8);
    const shiftMetersEW = width/2 * metersPerPixelEW;
    const shiftDegreesEW = shiftMetersEW * degreesPerMeter;

    const southTile = (TILE_SIZE * lat2tileFraction(lat, zoom) + height/2) / TILE_SIZE
    const northTile = (TILE_SIZE * lat2tileFraction(lat, zoom) - height/2) / TILE_SIZE

    return {
      south: Math.max(tile2lat(southTile, zoom), -LIMIT_Y),
      west: lng-shiftDegreesEW,
      north: Math.min(tile2lat(northTile, zoom), LIMIT_Y),
      east: lng+shiftDegreesEW
    }
}

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

 function bboxToQuads(bbox,zoom){
    let tiles= bboxToTiles(bbox,zoom);
    let quads=[];
    for(let i=0;i<tiles.length;i+=2){
	quads.push(tileToQuadkey([ tiles[i],tiles[i+1],zoom ]));
    }
    return quads;
}
/*
 function tileToQuadKey(tile){
    return tilebelt.tileToQuadkey(tile)
}

 function quadkeyToTile(quadkey){
    return tilebelt.quadkeyToTile(quadkey)
}
*/
    
 function bboxToDimension(bbox,zoom){

    let top=lat2tile(bbox.north,zoom);
    let left=lon2tile(bbox.west,zoom);
    let bottom=lat2tile(bbox.south,zoom);
    let right=lon2tile(bbox.east,zoom);

    let dimX=Math.abs(left-right)+1;
    let dimY=Math.abs(top-bottom)+1;

    return { dimX: dimX, dimY: dimY }
}

