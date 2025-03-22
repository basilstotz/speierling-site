var Map3D = (function (exports) {
	'use strict';

	//import { SphericalMercator } from '@mapbox/sphericalmercator';
	//import * as tilebelt from '@mapbox/tilebelt';
	//import * as utils from '../../../data/data-factory/modules/map-utils.mjs'
	//                        ../../../data/data-factory/modules/
	//    p.getSlope = (data,ncols,x,y) =>{


	function PixelToEle(pixels, idx){
		//idx*=4;
		let red = pixels[idx+0];     
		let green = pixels[idx+1];     
		let blue = pixels[idx+2];     
		return ( (red * 256 * 256 + green * 256 + blue) * 0.1) - 10000 
		//return ( (red<<16 + green<<8 + blue) * 0.1) - 10000 
	}


	class HeightGrid {

	    constructor(pixels,width,height){
		this.width=width;
		this.height=height;
		this.data = new Float32Array(width*height);
		
		for(let i=0;i<this.data.length;i++){
		    this.data[i]=PixelToEle(pixels,4*i);
		}

		/*
		for(let i=0;i<uint32.length;i++){
		    this.data[i]= ((uint32[i]>>8)-10000)*0.1;
		}
	*/
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

	class Martini {
	    constructor(gridSize = 257) {
	        this.gridSize = gridSize;
	        const tileSize = gridSize - 1;
	        if (tileSize & (tileSize - 1)) throw new Error(
	            `Expected grid size to be 2^n+1, got ${gridSize}.`);

	        this.numTriangles = tileSize * tileSize * 2 - 2;
	        this.numParentTriangles = this.numTriangles - tileSize * tileSize;

	        this.indices = new Uint32Array(this.gridSize * this.gridSize);

	        // coordinates for all possible triangles in an RTIN tile
	        this.coords = new Uint16Array(this.numTriangles * 4);

	        // get triangle coordinates from its index in an implicit binary tree
	        for (let i = 0; i < this.numTriangles; i++) {
	            let id = i + 2;
	            let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;
	            if (id & 1) {
	                bx = by = cx = tileSize; // bottom-left triangle
	            } else {
	                ax = ay = cy = tileSize; // top-right triangle
	            }
	            while ((id >>= 1) > 1) {
	                const mx = (ax + bx) >> 1;
	                const my = (ay + by) >> 1;

	                if (id & 1) { // left half
	                    bx = ax; by = ay;
	                    ax = cx; ay = cy;
	                } else { // right half
	                    ax = bx; ay = by;
	                    bx = cx; by = cy;
	                }
	                cx = mx; cy = my;
	            }
	            const k = i * 4;
	            this.coords[k + 0] = ax;
	            this.coords[k + 1] = ay;
	            this.coords[k + 2] = bx;
	            this.coords[k + 3] = by;
	        }
	    }

	    createTile(terrain) {
	        return new Tile(terrain, this);
	    }
	}

	class Tile {
	    constructor(terrain, martini) {
	        const size = martini.gridSize;
	        if (terrain.length !== size * size) throw new Error(
	            `Expected terrain data of length ${size * size} (${size} x ${size}), got ${terrain.length}.`);

	        this.terrain = terrain;
	        this.martini = martini;
	        this.errors = new Float32Array(terrain.length);
	        this.update();
	    }

	    update() {
	        const {numTriangles, numParentTriangles, coords, gridSize: size} = this.martini;
	        const {terrain, errors} = this;

	        // iterate over all possible triangles, starting from the smallest level
	        for (let i = numTriangles - 1; i >= 0; i--) {
	            const k = i * 4;
	            const ax = coords[k + 0];
	            const ay = coords[k + 1];
	            const bx = coords[k + 2];
	            const by = coords[k + 3];
	            const mx = (ax + bx) >> 1;
	            const my = (ay + by) >> 1;
	            const cx = mx + my - ay;
	            const cy = my + ax - mx;

	            // calculate error in the middle of the long edge of the triangle
	            const interpolatedHeight = (terrain[ay * size + ax] + terrain[by * size + bx]) / 2;
	            const middleIndex = my * size + mx;
	            const middleError = Math.abs(interpolatedHeight - terrain[middleIndex]);

	            errors[middleIndex] = Math.max(errors[middleIndex], middleError);

	            if (i < numParentTriangles) { // bigger triangles; accumulate error with children
	                const leftChildIndex = ((ay + cy) >> 1) * size + ((ax + cx) >> 1);
	                const rightChildIndex = ((by + cy) >> 1) * size + ((bx + cx) >> 1);
	                errors[middleIndex] = Math.max(errors[middleIndex], errors[leftChildIndex], errors[rightChildIndex]);
	            }
	        }
	    }

	    getMesh(maxError = 0) {
	        const {gridSize: size, indices} = this.martini;
	        const {errors} = this;
	        let numVertices = 0;
	        let numTriangles = 0;
	        const max = size - 1;

	        // use an index grid to keep track of vertices that were already used to avoid duplication
	        indices.fill(0);

	        // retrieve mesh in two stages that both traverse the error map:
	        // - countElements: find used vertices (and assign each an index), and count triangles (for minimum allocation)
	        // - processTriangle: fill the allocated vertices & triangles typed arrays

	        function countElements(ax, ay, bx, by, cx, cy) {
	            const mx = (ax + bx) >> 1;
	            const my = (ay + by) >> 1;

	            if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > maxError) {
	                countElements(cx, cy, ax, ay, mx, my);
	                countElements(bx, by, cx, cy, mx, my);
	            } else {
	                indices[ay * size + ax] = indices[ay * size + ax] || ++numVertices;
	                indices[by * size + bx] = indices[by * size + bx] || ++numVertices;
	                indices[cy * size + cx] = indices[cy * size + cx] || ++numVertices;
	                numTriangles++;
	            }
	        }
	        countElements(0, 0, max, max, max, 0);
	        countElements(max, max, 0, 0, 0, max);

	        const vertices = new Uint16Array(numVertices * 2);
	        const triangles = new Uint32Array(numTriangles * 3);
	        let triIndex = 0;

	        function processTriangle(ax, ay, bx, by, cx, cy) {
	            const mx = (ax + bx) >> 1;
	            const my = (ay + by) >> 1;

	            if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > maxError) {
	                // triangle doesn't approximate the surface well enough; drill down further
	                processTriangle(cx, cy, ax, ay, mx, my);
	                processTriangle(bx, by, cx, cy, mx, my);

	            } else {
	                // add a triangle
	                const a = indices[ay * size + ax] - 1;
	                const b = indices[by * size + bx] - 1;
	                const c = indices[cy * size + cx] - 1;

	                vertices[2 * a] = ax;
	                vertices[2 * a + 1] = ay;

	                vertices[2 * b] = bx;
	                vertices[2 * b + 1] = by;

	                vertices[2 * c] = cx;
	                vertices[2 * c + 1] = cy;

	                triangles[triIndex++] = a;
	                triangles[triIndex++] = b;
	                triangles[triIndex++] = c;
	            }
	        }
	        processTriangle(0, 0, max, max, max, 0);
	        processTriangle(max, max, 0, 0, 0, max);

	        return {vertices, triangles};
	    }
	}

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
		setTimeout(async () => { await this.updateAsync(); },500); 
	    }

	  
	    async updateAsync(){

		let terrain;
		let box;
		this.bounds=latLngToBounds(this.lat,this.lon,this.zoom,this.width,this.height);
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
	    
		if(this.textureLayer && false);
		if(terrain){
		    if(this.terrain)this.pInst.freeGeometry(this.terrain);
		    this.terrain = terrain;	    
		    if(this.box)this.pInst.freeGeometry(this.box);
		    this.box= box;

		}
		this.moveX=this.width/2;
		this.moveY=this.height/2;
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

		this.pInst.rotateX(this.pInst.PI/2);

	        this.pInst.ambientLight(32);                                                                                         //this.pInst.directionalLight(255, 255, 255, -1, -1,1);
	        this.pInst.directionalLight(255, 255, 255, this.lightX,this.lightY,this.lightZ);

		this.pInst.translate(-this.moveX,-this.moveY,-this.moveZ);

		this.pInst.fill(0,225,0);
		if(this.frame){
		    //if(this.tex)this.pInst.texture(this.tex)
		    if(htis.frameBuffer)this.pInst.texture(this.frameBuffer);
		}else {
		    if(this.tex)this.pInst.texture(this.tex);
		}
		if(this.terrain)this.pInst.model(this.terrain);
		this.pInst.noStroke();
		if(this.box)this.pInst.model(this.box);          

		this.pInst.pop();
	    }

	    makeMartini(grid,sx,sy,sz,d){
		new this.pInst.p5.Geometry();
		const martini = new Martini(grid.width);
		const tile = martini.CreateTile(grid.data);
		const mesh = tile.getMesh(10);
	        console.log(mesh);
	    }


	    
	    makeTerrain(grid,sx,sy,sz,d){
		let geometry = new this.pInst.p5.Geometry();
		let w=grid.width;
		let h=grid.height;
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

	function createMap3D(pInst){
	    const pMap3D = new Map3D();
	    pMap3D.pInst = pInst;
	    pMap3D.init();    
	    return pMap3D;
	}

	function createRasterLayer(p5inst){
	    const pRasterLayer = new RasterLayer();
	    pRasterLayer.pInst=p5inst;
	    return pRasterLayer;
	}

	exports.createMap3D = createMap3D;
	exports.createRasterLayer = createRasterLayer;

	return exports;

})({});
