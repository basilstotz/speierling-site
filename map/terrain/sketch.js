
var show = (p) => {

    //p.id=6614870445 

    p.loadImagePromise = (path) => {
	return new Promise(function(resolve,reject){
            p.loadImage(path,resolve,reject)
	})
    }
    
    p.updateImage = async function(pfad,color){
	p.auszug = await p.loadImagePromise(pfad+'dem-512.png');
	p.texte = await p.loadImagePromise(pfad+'esri-512.png');
	p.treeColor=color;
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
            p.vertex(p.x*p.sx,p.y*p.sy,p.getGrid(p.x,p.y)*p.sz);
            p.vertex(p.x*p.sx,p.y*p.sy,p.d);
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
	return p.bb.computeNormals();
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
    p.makeGrid = () => {
	p.min=10000;
	let width=p.auszug.width;
	let height=p.auszug.height;
	p.grid= new Uint16Array(width*height);
	p.auszug.loadPixels();
	for (let i=0; i<p.grid.length; i+=1) {
	    const idx=4*i;
	    const ele= (p.auszug.pixels[idx]*256+p.auszug.pixels[idx+1]);
	    if(ele<p.min)p.min=ele;
	    p.grid[i]=ele;
	}

	
        for(let i=0;i<p.grid.length;i++)p.grid[i]-=p.min-100;
	//console.log(p.min);
	//console.log(p.grid);
	
	p.rows=width;
	p.cols=height;
	p.b=p.sx*p.rows;
	p.h=p.sy*p.cols;
	//console.log(p.grid);
	p.d=0;
	//console.log(p.d);
    }


    p.getGrid = (x,y) => {
        return p.grid[y*p.rows+x]/10.0;
    }

    /*
    p.createShape = function(){
	for(p.y=0;p.y<p.cols;p.y++){
            for(p.x=0;p.x<p.rows;p.x++){
		p.vx = p.x*p.sx;
		p.vy = p.y*p.sy;
		p.vz = p.sz * p.grid[p.y][p.x];
		this.vertices.push(p.createVector(p.vx,p.vy,p.vz));
		this.uvs.push(p.vx/p.b);
		this.uvs.push(p.vy/p.h);
		if(p.x>0 && p.y>0){
		    p.idx=this.vertices.length-1;
                    this.faces.push( [ p.idx-p.rows-1, p.idx-1, p.idx-p.rows ]);
                    this.faces.push( [ p.idx-p.rows  , p.idx-1, p.idx        ]);
		}
            }
	}
	this.computeNormals();
    }
    */
    
    p.createShape2 = function(){
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
	if(p.landschaft)p.freeGeometry(p.landschaft);
	if(p.box)p.freeGeometry(p.box);
	p.landschaft = new p5.Geometry(1,1,p.createShape2)
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
	    let mx=Math.round(p.rows/2)
	    let my=Math.round(p.cols/2)
	    let mz=p.getGrid(mx,my);
	    p.push();
	    //let color = p.color(255,0,0);
	    p.fill(p.treeColor)
	    p.translate(mx*p.sx,my*p.sy,mz*p.sz);
	    p.sphere(5);
	    p.pop()
            //terrain
	    p.texture(p.texte)
	    p.model(p.landschaft)
	    p.fill(0,255,0);
	    p.noStroke();
	    p.model(p.box);
	}
    }

}


let terrain;

async function showTerrain(pfad,color){
    if(!terrain)terrain  = new p5(show);
    await terrain.updateImage(pfad,color)
    document.getElementById('terrainBackground').setAttribute('style','display:block');
}

