#!/usr/bin/env node

//import { SphericalMercator } from '@mapbox/sphericalmercator';
//import * as tilebelt from '@mapbox/tilebelt';
//import * as utils from '../../../data/data-factory/modules/map-utils.mjs'
//                        ../../../data/data-factory/modules/
//    p.getSlope = (data,ncols,x,y) =>{


export function PixelToEle(pixels, idx){
	//idx*=4;
	let red = pixels[idx+0];     
	let green = pixels[idx+1];     
	let blue = pixels[idx+2];     
	return ( (red * 256 * 256 + green * 256 + blue) * 0.1) - 10000 
	//return ( (red<<16 + green<<8 + blue) * 0.1) - 10000 
}


export function getSlope(data,ncols,x,y){
    /* on image data
    function H(idx){
        const i=4*idx:
        return (data[i+0]*256+data[i+1])/10.0
    }
    */

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


export class HeightGrid {

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
