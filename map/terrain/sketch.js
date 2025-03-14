//    p.getSlope = (data,ncols,x,y) =>{


function PixelToEle(pixels, idx){
	//idx*=4;
	let red = pixels[idx+0];     
	let green = pixels[idx+1];     
	let blue = pixels[idx+2];     
	return ( (red * 256 * 256 + green * 256 + blue) * 0.1) - 10000 
	//return ( (red<<16 + green<<8 + blue) * 0.1) - 10000 
}


function getSlope(data,ncols,x,y){
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
	return this.data[y*this.width+x];
    }

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
    }
}


var show = (p) => {

    //p.id=6614870445 

    p.loadImagePromise = (path) => {
	return new Promise(function(resolve,reject){
            p.loadImage(path,resolve,reject)
	})
    }
    
    p.updateImage = async function(pfad,color,tags){
	try {
	    p.auszug = await p.loadImagePromise(pfad+'dem-512.png');
	    p.texte = await p.loadImagePromise(pfad+'esri-512.png');
	} catch {
	    console.log('error reading images');
	}
	p.treeColor=color;
	p.treeRadius=3;
	p.slope = { ele: tags.height, slope: tags.slope, aspect: tags.aspect }
	console.log(tags);
	p.makeModels()
	p.cam.camera(0,-400,800,0,-100,0);
    }

    /*
    p.preload = () => {
	p.auszug=p.loadImage('./node/'+id+'/dem-512.png');
	p.texte=p.loadImage('./node/'+id+'/esri-512.png');
	//height=p.auszug.height;
    }
    */
    p.setup = () => {
	p.breite=900;
	p.hoehe=600;
	let cvs=document.getElementById('terrain')
	p.cvs=p.createCanvas(p.breite,p.hoehe,p.WEBGL,cvs);
	//console.log(p.cvs);
	p.sx=15;
	p.sy=15;
	p.sz=1.5;
	p.bottom= 10;
	
	p.d=0;

	//p.size=1024;
        //p.auszug=p.createGraphics(p.size,p.size);
	//p.debugMode();
	//p.noStroke();
        //p.makeModels();
	p.cam=p.createCamera();
	//console.log(p.cam);
	p.cam.camera(0,-400,800,0,-100,0);
	
    }


    
    p.makeBox = () => {
	//texture(texte);
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
	p.y=p.cols-1;
	for(p.x=0;p.x<p.rows;p.x++){
            p.vertex(p.x*p.sx,p.y*p.sy,p.getGrid(p.x,p.y)*p.sz);
            p.vertex(p.x*p.sx,p.y*p.sy,p.d);
	}
	p.endShape();
	//oben
	p.beginShape(p.TRIANGLE_STRIP);
	p.y=0;
	for(p.x=0;p.x<p.rows;p.x++){
            p.vertex(p.x*p.sx, p.y*p.sy, p.getGrid(p.x,p.y)*p.sz);
            p.vertex(p.x*p.sx, p.y*p.sy, p.d);
	}
	p.endShape();
	p.fill(204,153,0);
	//rechts
	p.beginShape(p.TRIANGLE_STRIP);
	p.x=p.rows-1;
	for(p.y=0;p.y<p.cols;p.y++){
            p.vertex(p.x*p.sx,p.y*p.sy,p.getGrid(p.x,p.y)*p.sz);
            p.vertex(p.x*p.sx,p.y*p.sy,p.d);
	}
	p.endShape();
	//links
	p.beginShape(p.TRIANGLE_STRIP);
	p.x=0;
	for(p.y=0;p.y<p.cols;p.y++){
            p.vertex(p.x*p.sx,p.y*p.sy,p.getGrid(p.x,p.y)*p.sz);
            p.vertex(p.x*p.sx,p.y*p.sy,p.d);
	}
	p.endShape();
	p.fill(155,117,3)
	//bottom
	p.beginShape()
	p.vertex(0,0,p.d);
	p.vertex(0,p.h-p.sy,p.d);
	p.vertex(p.b-p.sx,p.h-p.sy,p.d);
	p.vertex(p.b-p.sx,0,p.d)
	p.endShape(p.CLOSE);
	p.noFill();

	p.bb = p.endGeometry();
	//return bb
	return p.bb;
    }


    p.makeGrid = () => {
	let width=p.auszug.width;
	let height=p.auszug.height;
	p.auszug.loadPixels();
	let pixels= p.auszug.pixels;
	
	p.grid= new HeightGrid(pixels,width,height);
	p.grid.subMin(10);
	
	p.rows=width;
	p.cols=height;
	p.b=p.sx*p.rows;
	p.h=p.sy*p.cols;
	p.d=0;
    }


    p.getGrid = (x,y) => {
        return p.grid.get(x,y);
    }

/*    
    p.makeGrid = () => {
	p.grid=[];
	p.auszug.loadPixels();
	for (p.y=0; p.y< p.auszug.height; p.y+= 1) {
            p.row=[];
            for (p.x = 0; p.x < p.auszug.width; p.x += 1) {
		p.idx=4*(p.y*p.auszug.width+p.x);
		p.ele= (p.auszug.pixels[p.idx]*256+p.auszug.pixels[p.idx+1])/10.0;
		//p.ans=p.auszug.get(p.x, p.y);
		//p.ele=(p.ans[0]*256+p.ans[1])/10
		p.row.push(p.ele);
            }
            p.grid.push(p.row);
	}
	
	p.rows=p.auszug.width;
	p.cols=p.auszug.height;
	p.b=p.sx*p.rows;
	p.h=p.sy*p.cols;
    }
*/
    

  
 /*       
    p.makeGrid = () => {
	p.min=10000;
	let width=p.auszug.width;
	let height=p.auszug.height;
	p.grid= new Int32Array(width*height);     //           Uint16Array(width*height);
	
	p.auszug.loadPixels();
console.log(width,height);
console.log(p.auszug.pixels)
	for (let i=0; i<p.grid.length; i++) {
	    //const ele= (p.auszug.pixels[idx]*256+p.auszug.pixels[idx+1]);
	    const ele= PixelToEle(p.auszug.pixels,4*i);  //Uintarry ?????????????????
	    if(ele<p.min)p.min=ele;
	    p.grid[i]=ele;
	}
//console.log(p.grid)
	
        for(let i=0;i<p.grid.length;i++)p.grid[i]-=p.min-p.bottom;
	//console.log(p.min);
console.log(p.grid);
	
	p.rows=width;
	p.cols=height;
	p.b=p.sx*p.rows;
	p.h=p.sy*p.cols;
	//console.log(p.grid);
	p.d=0;
	//console.log(p.d);
    }


    p.getGrid = (x,y) => {
        return p.grid[y*p.rows+x];
    }
*/
    
    p.createShape = function(){
	const b = p.rows * p.sx;
	const h = p.cols * p.sy;
	for(let y=0;y<p.cols;y++){
            for(let x=0;x<p.rows;x++){
		
		const vx = p.sx * x;
		const vy = p.sy * y;
		const vz = p.sz * p.getGrid(x,y);
		const v = p.createVector(vx,vy,vz); 

		this.vertices.push(v);
		this.uvs.push(vx/b);
		this.uvs.push(vy/h);
		if(x>0 && y>0){
		    const idx=this.vertices.length-1;
                    this.faces.push( [ idx-p.rows-1, idx-1, idx-p.rows ]);
                    this.faces.push( [ idx-p.rows  , idx-1, idx        ]);
		}
            }
	}
	//this.flipV();
	//this.flipU();
	this.computeNormals(p.SMOOTH);
	//this.computeNormals();
    }
    
    p.makeModels = () => {
	p.makeGrid();
	
	p.mx = Math.round(p.rows/2)
	p.my = Math.round(p.cols/2)
	p.mz = p.getGrid(p.mx,p.my);
	
//console.log(p.slope);
	if(p.landschaft)p.freeGeometry(p.landschaft);
	if(p.box)p.freeGeometry(p.box);
	p.landschaft = new p5.Geometry(1,1,p.createShape)
	//p.landschaft.saveObj();
	p.box = p.makeBox();
    }

    
    p.draw = () => {
	p.background(0);
	p.ambientLight(96);
	p.directionalLight(255, 255, 255, -1, -1,1);
	//normalMaterial();
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
	if( p.landschaft && p.box ){
            //tree
	    p.push();
	    //tree
	    //let color = p.color(255,0,0);
	    //p.colorMode(p.RGB);
	    p.stroke(p.treeColor)
	    //p.fill(p.treeColor)
	    p.translate(p.mx*p.sx,p.my*p.sy,p.mz*p.sz);
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
	    //p.stroke(255)
	    p.texture(p.texte)
	    p.model(p.landschaft)
	    p.fill(0,255,0);
	    p.noStroke();
	    p.model(p.box);
	}
    }

}


let terrain;

async function showTerrain(pfad,color,tags){
    if(!terrain)terrain  = new p5(show);
    await terrain.updateImage(pfad,color,tags)
    document.getElementById('terrainBackground').setAttribute('style','display:block');
}

