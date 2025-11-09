#!/usr/bin/env node


p5.prototype.terrainSurface = function(data,w,h,sx,sy,sz){
    let geometry = new p5.Geometry();
    for(let y=0;y<h;y++){
	for(let x=0;x<w;x++){
	    const vx = x                  * sx   ;
	    const vy = y                  * sy   ; 
	    const vz = data[y*w+x]   * sz;
	    const v = createVector(vx,vy,vz); 
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
    geometry.computeNormals(SMOOTH);
    return geometry;    
}

p5.prototype.terrainBox = function(data,width,height,sx,sy,sz,d){
    
    let x,y;
    let dx=width*sx/2;
    let dy=height*sy/2;
    noStroke();
    beginGeometry();
    //unten
    fill(183,139,6);
    beginShape(TRIANGLE_STRIP);
    y=height-1;
    for(x=0;x<width;x++){
	vertex(x*sx, y*sy, data[(y*width+x)]*sz);
	vertex(x*sx, y*sy, d);
    }
    endShape();
    //oben
    beginShape(TRIANGLE_STRIP);
    y=0;
    for(x=0;x<width;x++){
	vertex(x*sx, y*sy, data[(y*width+x)]*sz);
	vertex(x*sx, y*sy, d);
    }
    endShape();
    fill(204,153,0);
    //rechts
    beginShape(TRIANGLE_STRIP);
    x=width-1;
    for(y=0;y<height;y++){
	vertex(x*sx, y*sy, data[(y*width+x)]*sz);
	vertex(x*sx, y*sy, d);
    }
    endShape();
    //links
    beginShape(TRIANGLE_STRIP);
    x=0;
    for(y=0;y<height;y++){
	vertex(x*sx, y*sy, data[(y*width+x)]*sz);
	vertex(x*sx, y*sy, d);
    }
    endShape();
    //bottom
    fill(155,117,3);
    beginShape();
    vertex(0,0,d);
    vertex(0, (height-1)*sy, d);
    vertex((width-1)*sx,(height-1)*sy, d);
    vertex((width-1)*sx ,0, d);
    endShape(CLOSE);
    noFill();
    return endGeometry().computeNormals(FLAT);
}

p5.prototype.RectFloat32 = class {

    constructor(width,height){
	if(width&&height){
	    this.width=width;
	    this.height=height;
	    this.data = new Float32Array(width*height);
	    for(let i=0;i<this.data.length;i++)this.data[i]=0;
	}
    }
}

p5.prototype.TerrainData = class {

    constructor(width,height){
	if(width&&height){
	    this.width=width;
	    this.height=height;
	    this.data=[];
	    let l=width*height;
	    for(let i=0;i<l;i++)this.data[i]=0;
	}
	this.setWorld();
    }

    setData(data,width,height){
	this.width=width;
	this.height=height;
	this.data=data;
	this.setWorld();
    }

    
    setRaster(img){
	
	let pixelToEle = function(pixels,i){
	    let idx=i*4;
            let red = pixels[idx+0];     
            let green = pixels[idx+1];     
            let blue = pixels[idx+2];     
            return ( (red * 256 * 256 + green * 256 + blue) * 0.1) - 10000 
            //return ( (red<<16 + green<<8 + blue) * 0.1) - 10000 
	}
	let data = new Float32Array(img.width*img.height);
	img.loadPixels();
	let pixels = img.pixels;
	for(let i=0;i<data.length;i++){
	    data[i]=pixelToEle(pixels,i);
	}
	this.data=data;
	this.width=img.width;
	this.height=img.height;
	this.setWorld();
    }

    noise(level,scale){
	let offset=random(1000);
	for(let x=0;x<this.width;x++){
	    for(let y=0;y<this.height;y++){
		this.data[y*this.width+x]=level*noise((x+offset)*scale,(y+offset)*scale);
	    }
	}
    }

    setWorld(xMin,xMax,yMin,yMax){
	if(xMin&&xMax&&yMin&&yMax){
	    this.xMin=xMin;
	    this.xMax=xMax;
	    this.yMin=yMin;
	    this.yMax=yMax;
	}else{
	    this.xMin=0;
	    this.xMax=this.width;
	    this.yMin=0;
	    this.yMax=this.height;
	}
    }
	    
    
    forEach(callback){
	for(let x=0;x<this.width;x++){
	    for(let y=0;y<this.height;y++){
		let nx=map(x,0,this.width,this.xMin,this.xMax);
		let ny=map(y,0,this.height,this.yMin,this.yMax);
		this.data[y*this.width+x]=callback(nx,ny);
	    }
	}
    }
	
    
    set(x,y,z){
	this.data[y*this.width+x]=z;
    }

    get(x,y){
        return this.data[y*this.width+x];
    }
    
    getNearest(x,y){
        return this.data[Math.round(y)*this.width+Math.round(x)];
    }
    
    getBilinear(x, y) {
        var avg = function(v1, v2, f) {
            return v1 + (v2 - v1) * f;
        },
            xLow = Math.floor(x),
            xHi = xLow + 1,
            xFrac = x - xLow,
            yLow = Math.floor(y),
            yHi = yLow + 1,
            yFrac = y - yLow,
            v00 = this.get(xLow, yLow),
            v10 = this.get(xLow, yHi),
            v11 = this.get(xHi, yHi),
            v01 = this.get(xHi, yLow),
            v1 = avg(v00, v10, yFrac),
            v2 = avg(v01, v11, yFrac);
        return avg(v1, v2, xFrac);
    }

    getNormalized(x,y){
	let mx=map(x,0,1,0,this.width,true);
	let my=map(y,0,1,0,this.height,true);
	return this.getBilinear(mx,my);
    }

    getWorld(x,y){
	let mx=map(x,this.xMin,this.xMax,0,this.width,true);
	let my=map(y,this.yMin,this.yMax,0,this.height,true);
	return this.getBilinear(mx,my);
    }

}

p5.prototype.Terrain = class {

    constructor(options){
	this.d=0;
	this.sz=1 //2;
	this.width=512;
	this.height=512;
	this.boxOptions={ draw:false } 
	if(options)this.options(options);
    }

    options(options){
	if(options.width)this.width=options.width;
	if(options.height)this.height=options.height;
	if(options.sz)this.sz=options.sz;
	if(options.d)this.d=options.d;
	if(options.box){
	    let opts=options.box;
	    if(opts.draw)this.boxOptions.draw=opts.draw;
	    if(opts.align)this.boxOptions.align=opts.align;
	    if(opts.offset)this.boxOptions.offset=opts.offset;
	}
    }
	
    
    update(dem,tex){
	
	//this.dem = dem;
	let sx = Math.round(this.width/dem.width);
	let sy = sx //this.height/dem.height;
	this.sz= sx/8; //let sz = 1;
	let data = dem.data;
	let width = dem.width;
	let height = dem.height;

	//this.width= width;
	//this.height=height;
	
	let options = this.boxOptions;
	let d = 0;
	if(!options.align)options.align='bottom';
	switch(options.align){
	case 'none':
	    break;
	case 'top':
	    d = -100000000;
	    for(let i=0;i<data.length;i++){if(data[i]>d)d=data[i];}
	    break;
	case 'center':
	    for(let i=0;i<data.length;i++)d+=data[i];
	    d/=data.length;
	    break;
	case 'bottom':	
	default:
	    d = 10000000;
	    for(let i=0;i<data.length;i++){if(data[i]<d)d=data[i];}
	    break;
	}
	if(options.offset)d+=options.offset;
	this.d=d*this.sz

	
	let surface = terrainSurface(data,width,height,sx,sy,this.sz)
	let box = terrainBox(data,width,height,sx,sy,this.sz,this.d)
	
	if(this.surface)freeGeometry(this.surface);
	this.surface = surface;
	if(this.box)freeGeometry(this.box);
	this.box = box;

	if(tex){
	    this.tex=tex
	    /*
	    this.tex=createGraphics(tex.width,tex.height,WEBGL);
	    this.tex.image(tex,0,0,);
	    
	    if(this.texBuffer){
		this.texBuffer.remove();
		this.texBuffer = undefined;
	    }
	    this.texBuffer= this.tex.createFramebuffer();
           */
	}
    }


    align(){
	translate(-this.width/2,-this.height/2,-this.d)
    }
    
    draw(){
	push();
	if(this.boxOptions.draw===true){
	    // noFill();
	    fill(255)
	    if(this.box)model(this.box)
	}
	if(this.tex){
	    texture(this.tex);
	}else{
	    fill(0,255,0);
	    //noFill();
	    //stroke(255);
	    //strokeWeight(2);
	    //normalMaterial();
	}
	if(this.surface)model(this.surface)
	pop();
    }
}
