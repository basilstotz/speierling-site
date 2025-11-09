var mapu = (function (exports) {
    'use strict';

    const d2r = Math.PI / 180;
    const r2d = 180 / Math.PI;
    function tile2lon(x, z) {
        return (x / Math.pow(2, z)) * 360 - 180;
    }
    function tile2lat$1(y, z) {
        const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
        return r2d * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }
    /**
     * Get the bbox of a tile
     *
     * const bbox = tileToBBOX([5, 10, 10])
     * //=bbox
     */
    function tileToBBOX(tile) {
        const e = tile2lon(tile[0] + 1, tile[2]);
        const w = tile2lon(tile[0], tile[2]);
        const s = tile2lat$1(tile[1] + 1, tile[2]);
        const n = tile2lat$1(tile[1], tile[2]);
        return [w, s, e, n];
    }
    /**
     * Get a geojson representation of a tile
     *
     * const poly = tileToGeoJSON([5, 10, 10])
     * //=poly
     */
    function tileToGeoJSON(tile) {
        const bbox = tileToBBOX(tile);
        return {
            type: 'Polygon',
            coordinates: [
                [
                    [bbox[0], bbox[3]],
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[1]],
                    [bbox[2], bbox[3]],
                    [bbox[0], bbox[3]],
                ],
            ],
        };
    }
    /**
     * Get the tile for a point at a specified zoom level
     *
     * const tile = pointToTile(1, 1, 20)
     * //=tile
     */
    function pointToTile(lon, lat, z) {
        const tile = pointToTileFraction(lon, lat, z);
        tile[0] = Math.floor(tile[0]);
        tile[1] = Math.floor(tile[1]);
        return tile;
    }
    /**
     * Get the precise fractional tile location for a point at a zoom level
     *
     * const tile = pointToTileFraction(30.5, 50.5, 15)
     * //=tile
     */
    function pointToTileFraction(lon, lat, z) {
        const sin = Math.sin(lat * d2r);
        const z2 = Math.pow(2, z);
        let x = z2 * (lon / 360 + 0.5);
        const y = z2 * (0.5 - (0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI);
        // Wrap Tile X
        x = x % z2;
        if (x < 0)
            x = x + z2;
        return [x, y, z];
    }
    /**
     * Get the 4 tiles one zoom level higher
     *
     * const tiles = getChildren([5, 10, 10])
     * //=tiles
     */
    function getChildren(tile) {
        return [
            [tile[0] * 2, tile[1] * 2, tile[2] + 1],
            [tile[0] * 2 + 1, tile[1] * 2, tile[2] + 1],
            [tile[0] * 2 + 1, tile[1] * 2 + 1, tile[2] + 1],
            [tile[0] * 2, tile[1] * 2 + 1, tile[2] + 1],
        ];
    }
    /**
     * Get the tile one zoom level lower
     *
     * const tile = getParent([5, 10, 10])
     * //=tile
     */
    function getParent(tile) {
        return [tile[0] >> 1, tile[1] >> 1, tile[2] - 1];
    }
    function getSiblings(tile) {
        return getChildren(getParent(tile));
    }
    /**
     * Get the 3 sibling tiles for a tile
     *
     * const tiles = getSiblings([5, 10, 10])
     * //=boolean
     */
    function hasSiblings(tile, tiles) {
        const siblings = getSiblings(tile);
        for (let i = 0; i < siblings.length; i++) {
            if (!hasTile(tiles, siblings[i]))
                return false;
        }
        return true;
    }
    /**
     * Check to see if an array of tiles contains a particular tile
     *
     * const tiles = [
     *     [0, 0, 5],
     *     [0, 1, 5],
     *     [1, 1, 5],
     *     [1, 0, 5]
     * ]
     * hasTile(tiles, [0, 0, 5])
     * //=boolean
     */
    function hasTile(tiles, tile) {
        for (let i = 0; i < tiles.length; i++) {
            if (tilesEqual(tiles[i], tile))
                return true;
        }
        return false;
    }
    /**
     * Check to see if two tiles are the same
     *
     * tilesEqual([0, 1, 5], [0, 0, 5])
     * //=boolean
     */
    function tilesEqual(tile1, tile2) {
        return (tile1[0] === tile2[0] && tile1[1] === tile2[1] && tile1[2] === tile2[2]);
    }
    /**
     * Get the quadkey for a tile
     *
     * const quadkey = tileToQuadkey([0, 1, 5])
     * //=quadkey
     */
    function tileToQuadkey$1(tile) {
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
    /**
     * Get the tile for a quadkey
     *
     * const tile = quadkeyToTile('00001033')
     * //=tile
     */
    function quadkeyToTile$2(quadkey) {
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
    function getBboxZoom(bbox) {
        const MAX_ZOOM = 28;
        for (let z = 0; z < MAX_ZOOM; z++) {
            const mask = 1 << (32 - (z + 1));
            if ((bbox[0] & mask) !== (bbox[2] & mask) ||
                (bbox[1] & mask) !== (bbox[3] & mask)) {
                return z;
            }
        }
        return MAX_ZOOM;
    }
    /**
     * Get the smallest tile to cover a bbox
     *
     * const tile = bboxToTile([ -178, 84, -177, 85 ])
     * //=tile
     */
    function bboxToTile(bboxCoords) {
        const min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
        const max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
        const bbox = [min[0], min[1], max[0], max[1]];
        const z = getBboxZoom(bbox);
        if (z === 0)
            return [0, 0, 0];
        const x = bbox[0] >>> (32 - z);
        const y = bbox[1] >>> (32 - z);
        return [x, y, z];
    }

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        bboxToTile: bboxToTile,
        getChildren: getChildren,
        getParent: getParent,
        getSiblings: getSiblings,
        hasSiblings: hasSiblings,
        hasTile: hasTile,
        pointToTile: pointToTile,
        pointToTileFraction: pointToTileFraction,
        quadkeyToTile: quadkeyToTile$2,
        tileToBBOX: tileToBBOX,
        tileToGeoJSON: tileToGeoJSON,
        tileToQuadkey: tileToQuadkey$1,
        tilesEqual: tilesEqual
    });

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
    /**
     * Get the tile for a quadkey
     *
     * const tile = quadkeyToTile('00001033')
     * //=tile
     */
    function quadkeyToTile$1(quadkey) {
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


    function isInBbox(lat,lon,bbox){

        // https://gist.github.com/graydon/11198540
        
        bbox.north;
        let left=bbox.west;
        bbox.south;
        let right=bbox.east;

        let ans = ( ( lon > left ) && ( lon < right) && (lat > south) && ( lat < north) );
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

    function tileToQuadKey(tile){
        return tileToQuadkey(tile)
    }

    function quadkeyToTile(quadkey){
        return quadkeyToTile$1(quadkey)
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

    var mapUtils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        EARTH_CIR_METERS: EARTH_CIR_METERS,
        TILE_SIZE: TILE_SIZE,
        bboxToDimension: bboxToDimension,
        bboxToQuads: bboxToQuads,
        bboxToTileBbox: bboxToTileBbox,
        bboxToTiles: bboxToTiles,
        calculateDistance: calculateDistance,
        isInBbox: isInBbox,
        lat2tile: lat2tile,
        lat2tileFraction: lat2tileFraction,
        latLngToBounds: latLngToBounds,
        latLonToPixel: latLonToPixel,
        lon2tile: lon2tile,
        lon2tileFraction: lon2tileFraction,
        objectBboxToTilebelt: objectBboxToTilebelt,
        quadkeyToTile: quadkeyToTile,
        tile2lat: tile2lat,
        tile2long: tile2long,
        tileToQuadKey: tileToQuadKey,
        tilebeltBboxToObject: tilebeltBboxToObject,
        toDegrees: toDegrees,
        toRadians: toRadians
    });

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

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: Martini
    });

    exports.SphericalMercator = SphericalMercator;
    exports.martini = index;
    exports.tilebelt = index$1;
    exports.utils = mapUtils;

    return exports;

})({});
