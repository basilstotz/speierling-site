

let isNode = ( typeof process === 'object' )

function nachbarn(geojson,maxdist){

    const degToRad = Math.PI / 180;
    const metersPerDegree = 111320;
    const kilometersPerDegree = 111.320;

    const maxDistDeg = maxdist / kilometersPerDegree;

    geojson.maxDist=maxdist;
    
    let features=geojson.features;

    for(let i=0;i<features.length;i++){
        features[i].env={ nachbarn: {}}
    }

    for(let i=0;i<features.length;i++){
        if(isNode && i%1000==0)process.stderr.write("*");
        let me=features[i];

        for(let j=i;j<features.length;j++){

            let other=features[j];

            if(me.id!=other.id){

                let meLon=me.geometry.coordinates[0];
                let otherLon=other.geometry.coordinates[0];
                let meLat=me.geometry.coordinates[1];    
                let otherLat=other.geometry.coordinates[1];

                
                const dy = (otherLat - meLat)  
                if(Math.abs(dy)<maxDistDeg){
                    
                    //const dx = (otherLon - meLon) * Math.cos(0.5*(meLat+otherLat)*degToRad);
                    const dx = (otherLon - meLon) * Math.cos(0.5*(meLat+otherLat)*degToRad);
                    if(Math.abs(dx)<maxDistDeg){
                        
                        let dist;
                        if(maxdist<50.0){
                           dist = Math.sqrt(dx * dx + dy * dy) * kilometersPerDegree;
                        }else{
                            dist = turf.distance(me.geometry.coordinates,other.geometry.coordinates);
                        }
                        if(dist<maxdist){
                            me.env.nachbarn[other.id]=dist; 
                            other.env.nachbarn[me.id]=dist; 
                        }
                        
                    }
                }    
            }
        }       
    }
    //add nachbarCount;
    features.map( (feature) => {
	let count = Object.entries(feature.env.nachbarn).length;
	let dichte = count / ( maxdist * maxdist * 3.141592 )  
	feature.env.nachbarCount=count;
	feature.env.nachbarDichte=dichte;
    });
    
    return geojson;
}

function cluster(geojson,dist,keepNachbarn=false){
    

    geojson.dist=dist;
    
    let clusterID=0;

    function init(geojson){

        //make indexed
        let indexed={};
        let features=geojson.features;
        for(let i=0;i<features.length;i++){
            let feature=features[i];
            
            //and clear clusterID
            feature.env.clusterID=-1;

            //add indexed
            let id=feature.id;
            indexed[id]=feature;
        }
        return indexed;
    }

    function find(feature,clusterID,dist){

        //let list=[];
        let max=0;

        function tree(feature,depth){
            //console.log(feature,cluster);
            if( feature.env.clusterID == -1 ){
                feature.env.clusterID=clusterID;
                //list.push(feature);
                let nachbarn=feature.env.nachbarn;

                //aufsteigend: a-b absteigend: b-a
                let nachbarnArray=Object.entries(nachbarn).sort( ([,a],[,b]) => { return a-b } )

                for (const [key, value] of nachbarnArray) {
                    if(value<dist){
                        let nachbar=indexed[key]
                        depth++;
                        if(depth>max)max=depth;
                        tree(nachbar,depth);
                    }
                }
            }
        }

        tree(feature,0);
        //return list;
    }
    
    let indexed=init(geojson);
   
    let features=geojson.features;
    for(let i=0;i<features.length;i++){
        //process.stderr.write("*");
        let feature=features[i];
        if(feature.env.clusterID==-1){
            //process.stderr.write(cluster+" ");
            find(feature,clusterID,dist);
            clusterID++;
        }
    }
    
    if(!keepNachbarn)geojson.features.forEach( (feature) => { delete feature.nachbarn });
    
    return geojson
}

//function multipoint(geojson,maxEdge,indexed=null){
function multipoint(geojson, keepMembers=true){
    

    //outputs feature
    function turfPoint(coord,properties={}){
        let out={ type: "Feature",
                  properties: properties,
                  geometry: { type: "Point", coordinates: coord }
                }
        return out;
    }


    function turfMultiPoint(coords,properties={}){
        let out={ type: "Feature",
                  properties: properties,
                  geometry: { type: "MultiPoint", coordinates: coords }
                }
        return out;
    }

    //outputs feature collection
    function turfFeatureCollection(features,properties={}){
        let out={ type: "FeatureCollecton",
                  properties: properties,
                  features: features
                }
        return out;
    }

    function turfPoints(coords,properties={}){
        out=[];
        coords.forEach( (coord) => { out.push(turfPoint(coord,properties)) });
        return turfFeatureCollection(out);
    }
    
    let features=geojson.features;

    /*
    if(!indexed){
        indexed={};
        features.forEach( (feature) => { indexed[feature.id]=feature });
    }
    */
    
    let res=[];

    //collect clusters in res[];
    for(let i=0;i<features.length;i++)res[i]=[];
    
    for(let i=0;i<features.length;i++){
        let feature=features[i];
        let clusterID=feature.env.clusterID;
        //qlet fc=[];
        if(clusterID>=0){
            res[clusterID].push(feature)
            //fc.push(feature)
        }
        //res[clusterID]=turf.featureCollection(fc);
    }
    //console.log(res);
    let featCol=[];
    //for all clusters do
    for(let i=0;i<res.length;i++){
        let item=res[i];  
        if(item.length>2){
            let coords=[];
            let ids=[];
            //for all members in cluster do
            for(let j=0;j<item.length;j++){
                //let id=item[j];               
                //let feature=indexed[id];
                let feature=item[j];
                let coord=feature.geometry.coordinates;
                
                //coords.push(turf.point(coord));
                coords.push(coord);
                ids.push(feature.id);       
            }
            //
            
            //let fc=turf.featureCollection(coords);
            //let multiPoint=turf.multiPoint(coords);
            let multiPoint=turfMultiPoint(coords);
            multiPoint.properties.clusterID=i;
            multiPoint.properties.memberCount=ids.length;
            if(keepMembers)multiPoint.properties.member=ids;
            //if(i==3)log(multiPoint);
            featCol.push(multiPoint)

            /*
            let fc=turf.featureCollection(multiPoint);
            if(i==3)log(fc);

            let mp = turf.concave(fc,{ maxEdge: maxEdge });
            if(mp){
                let area=turf.area(mp)/1000000;
                let count=item.length;
                mp.properties.area=area;
                mp.properties.memberount=count;
                mp.properties.density=count/area;
                mp.properties.members=ids;
                featCol.push(mp);
            }else{ //console.log("error")
                 }
            */
        }
    }
    //return turf.featureCollection(featCol);
    let out=turfFeatureCollection(featCol);
    out.maxDist=geojson.maxDist;
    out.dist=geojson.dist;

    return out
}

// takes feature collection with mutlipoints and converts it to a feature collection with polygons
function polygon(mc,maxEdge){
   

    // turf.concave with multiPoint feature argument (vs point collection)
    function concave(mpf,maxEdge){
        let coordinates=mpf.geometry.coordinates;
        let points=[];
	//console.log(mpf)
        coordinates.forEach( (point) => { points.push(turf.point(point) )});      //console.log(points)
        let fc=turf.featureCollection(points);
        return turf.concave(fc,{maxEdge: maxEdge});
    }
    
    let outFeatures=[];
    let features=mc.features;//console.log(features);
    for(let i=0;i<features.length;i++){
        let feature=features[i];
                                                               //if(i==3)log(feature);
        let poly=concave(feature,maxEdge);
        if(poly){
            poly.properties=feature.properties;
            let area=turf.area(poly)/1000000.0
            let memberCount=poly.properties.memberCount;
            let density=memberCount/area;
            poly.properties.area=area;
            poly.properties.density=density
            outFeatures.push(poly);
        }
    }
    let out= turf.featureCollection(outFeatures);
    
    out.maxDist=mc.maxDist;
    out.dist=mc.dist;
    out.maxEdge=maxEdge;

    return out;
}



class Nachbar {
    
    constructor(geojson) {
	//console.log(init);
	
	this.maxDist=10.0;
	this.dist=5.0;
	this.maxEdge=25.0;

	this.multipoint={};	
	this.polygon={};

	this.set(geojson);
		
	this.maxDist=10.0;
	this.dist=5.0;
	this.maxEdge=25.0;
    }
    

    set(geojson) {
	//if(geojson.dist)this.dist=geojson.dist;
	//if(geojson.maxDist)this.maxDist=geojson.maxDist;
	if(!geojson)geojson={ type: "FeatureCollection", features: []};
	this.geojson=geojson;
	if(this.polygon.maxEdge)delete this.polygon.maxEdge;
    }

//////////////////////////////////////////////////////////////////////////////////////////////
    
    getNachbarn(maxDist=10){

        this.maxDist=maxDist;

	this.calcNachbarn();
	
	return this.geojson
    }

    getCluster(maxDist=10,dist=8){

        this.maxDist=maxDist;
	this.dist=dist

	this.calcNachbarn();
	this.calcMultipoint();

	return this.geojson
    }

    getMultipoint(maxDist=10,dist=8){

        this.maxDist=maxDist;
	this.dist=dist

	this.calcNachbarn();
	this.calcMultipoint();

	return this.multipoint
    }

    getPolygon(maxDist=10,dist=8,maxEdge=25) {

        this.maxDist=maxDist;
	this.dist=dist
	this.maxEdge=maxEdge;

	this.calcNachbarn();
	this.calcMultipoint();
	this.calcPolygon();
	
	return this.polygon
    }

/////////////////////////////////////////////////////////////////////////////////////////////////

    calcNachbarn(){
	if(!(this.geojson.maxDist && this.maxDist==this.geojson.maxDist)){
	    nachbarn(this.geojson,this.maxDist);
	}
    }

    calcMultipoint(){
	//cluster & multipoint
	if(!(this.geojson.dist && this.dist==this.geojson.dist && this.maxDist==this.geojson.maxDist)){
	    cluster(this.geojson,this.dist);
	    if(this.multipoint.dist)delete this.multipoint.dist;
	}
	if(!(this.multipoint.dist && this.multipoint.dist==this.dist)){
	    this.multipoint = multipoint(this.geojson);
	    if(this.polygon.maxEdge)delete this.polygon.maxEdge;
	}
    }

    calcPolygon(){
	if(!(this.polygon.maxEdge && this.maxEdge==this.polygon.maxEdge)){
	    this.polygon = polygon(this.multipoint,this.maxEdge);
	}
    }

}//class

