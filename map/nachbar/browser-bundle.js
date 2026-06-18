(function (global, factory) {
   typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@turf/along'), require('@turf/angle'), require('@turf/area'), require('@turf/bbox'), require('@turf/bbox-clip'), require('@turf/bbox-polygon'), require('@turf/bearing'), require('@turf/bezier-spline'), require('@turf/boolean-clockwise'), require('@turf/boolean-concave'), require('@turf/boolean-contains'), require('@turf/boolean-crosses'), require('@turf/boolean-disjoint'), require('@turf/boolean-equal'), require('@turf/boolean-intersects'), require('@turf/boolean-overlap'), require('@turf/boolean-parallel'), require('@turf/boolean-point-in-polygon'), require('@turf/boolean-point-on-line'), require('@turf/boolean-touches'), require('@turf/boolean-valid'), require('@turf/boolean-within'), require('@turf/buffer'), require('@turf/center'), require('@turf/center-mean'), require('@turf/center-median'), require('@turf/center-of-mass'), require('@turf/centroid'), require('@turf/circle'), require('@turf/clean-coords'), require('@turf/clone'), require('@turf/clusters'), require('@turf/clusters-dbscan'), require('@turf/clusters-kmeans'), require('@turf/collect'), require('@turf/combine'), require('@turf/concave'), require('@turf/convex'), require('@turf/destination'), require('@turf/difference'), require('@turf/dissolve'), require('@turf/distance'), require('@turf/distance-weight'), require('@turf/ellipse'), require('@turf/envelope'), require('@turf/explode'), require('@turf/flatten'), require('@turf/flip'), require('@turf/geojson-rbush'), require('@turf/great-circle'), require('@turf/helpers'), require('@turf/hex-grid'), require('@turf/interpolate'), require('@turf/intersect'), require('@turf/invariant'), require('@turf/isobands'), require('@turf/isolines'), require('@turf/kinks'), require('@turf/length'), require('@turf/line-arc'), require('@turf/line-chunk'), require('@turf/line-intersect'), require('@turf/line-offset'), require('@turf/line-overlap'), require('@turf/line-segment'), require('@turf/line-slice'), require('@turf/line-slice-along'), require('@turf/line-split'), require('@turf/line-to-polygon'), require('@turf/mask'), require('@turf/meta'), require('@turf/midpoint'), require('@turf/moran-index'), require('@turf/nearest-neighbor-analysis'), require('@turf/nearest-point'), require('@turf/nearest-point-on-line'), require('@turf/nearest-point-to-line'), require('@turf/planepoint'), require('@turf/point-grid'), require('@turf/point-on-feature'), require('@turf/points-within-polygon'), require('@turf/point-to-line-distance'), require('@turf/point-to-polygon-distance'), require('@turf/polygonize'), require('@turf/polygon-smooth'), require('@turf/polygon-tangents'), require('@turf/polygon-to-line'), require('@turf/projection'), require('@turf/quadrat-analysis'), require('@turf/random'), require('@turf/rectangle-grid'), require('@turf/rewind'), require('@turf/rhumb-bearing'), require('@turf/rhumb-destination'), require('@turf/rhumb-distance'), require('@turf/sample'), require('@turf/sector'), require('@turf/shortest-path'), require('@turf/simplify'), require('@turf/square'), require('@turf/square-grid'), require('@turf/standard-deviational-ellipse'), require('@turf/tag'), require('@turf/tesselate'), require('@turf/tin'), require('@turf/transform-rotate'), require('@turf/transform-scale'), require('@turf/transform-translate'), require('@turf/triangle-grid'), require('@turf/truncate'), require('@turf/union'), require('@turf/unkink-polygon'), require('@turf/voronoi'), require('@turf/directional-mean')) :
   typeof define === 'function' && define.amd ? define(['exports', '@turf/along', '@turf/angle', '@turf/area', '@turf/bbox', '@turf/bbox-clip', '@turf/bbox-polygon', '@turf/bearing', '@turf/bezier-spline', '@turf/boolean-clockwise', '@turf/boolean-concave', '@turf/boolean-contains', '@turf/boolean-crosses', '@turf/boolean-disjoint', '@turf/boolean-equal', '@turf/boolean-intersects', '@turf/boolean-overlap', '@turf/boolean-parallel', '@turf/boolean-point-in-polygon', '@turf/boolean-point-on-line', '@turf/boolean-touches', '@turf/boolean-valid', '@turf/boolean-within', '@turf/buffer', '@turf/center', '@turf/center-mean', '@turf/center-median', '@turf/center-of-mass', '@turf/centroid', '@turf/circle', '@turf/clean-coords', '@turf/clone', '@turf/clusters', '@turf/clusters-dbscan', '@turf/clusters-kmeans', '@turf/collect', '@turf/combine', '@turf/concave', '@turf/convex', '@turf/destination', '@turf/difference', '@turf/dissolve', '@turf/distance', '@turf/distance-weight', '@turf/ellipse', '@turf/envelope', '@turf/explode', '@turf/flatten', '@turf/flip', '@turf/geojson-rbush', '@turf/great-circle', '@turf/helpers', '@turf/hex-grid', '@turf/interpolate', '@turf/intersect', '@turf/invariant', '@turf/isobands', '@turf/isolines', '@turf/kinks', '@turf/length', '@turf/line-arc', '@turf/line-chunk', '@turf/line-intersect', '@turf/line-offset', '@turf/line-overlap', '@turf/line-segment', '@turf/line-slice', '@turf/line-slice-along', '@turf/line-split', '@turf/line-to-polygon', '@turf/mask', '@turf/meta', '@turf/midpoint', '@turf/moran-index', '@turf/nearest-neighbor-analysis', '@turf/nearest-point', '@turf/nearest-point-on-line', '@turf/nearest-point-to-line', '@turf/planepoint', '@turf/point-grid', '@turf/point-on-feature', '@turf/points-within-polygon', '@turf/point-to-line-distance', '@turf/point-to-polygon-distance', '@turf/polygonize', '@turf/polygon-smooth', '@turf/polygon-tangents', '@turf/polygon-to-line', '@turf/projection', '@turf/quadrat-analysis', '@turf/random', '@turf/rectangle-grid', '@turf/rewind', '@turf/rhumb-bearing', '@turf/rhumb-destination', '@turf/rhumb-distance', '@turf/sample', '@turf/sector', '@turf/shortest-path', '@turf/simplify', '@turf/square', '@turf/square-grid', '@turf/standard-deviational-ellipse', '@turf/tag', '@turf/tesselate', '@turf/tin', '@turf/transform-rotate', '@turf/transform-scale', '@turf/transform-translate', '@turf/triangle-grid', '@turf/truncate', '@turf/union', '@turf/unkink-polygon', '@turf/voronoi', '@turf/directional-mean'], factory) :
   (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.myBundle = {}, null, null, global.area, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, global.clone, null, null, null, null, null, global.concave, null, null, null, null, global.distance));
})(this, (function (exports, along, angle, area, bbox, bboxClip, bboxPolygon, bearing, bezierSpline, booleanClockwise, booleanConcave, booleanContains, booleanCrosses, booleanDisjoint, booleanEqual, booleanIntersects, booleanOverlap, booleanParallel, booleanPointInPolygon, booleanPointOnLine, booleanTouches, booleanValid, booleanWithin, buffer, center, centerMean, centerMedian, centerOfMass, centroid, circle, cleanCoords, clone, clusters, clustersDbscan, clustersKmeans, collect, combine, concave, convex, destination, difference, dissolve, distance) { 'use strict';

   let isNode = ( typeof process === 'object' );

   function nachbarn(geojson,maxdist){

       const degToRad = Math.PI / 180;
       const kilometersPerDegree = 111.320;

       const maxDistDeg = maxdist / kilometersPerDegree;

       geojson.maxDist=maxdist;
       
       let features=geojson.features;

       for(let i=0;i<features.length;i++){
           features[i].env={ nachbarn: {}};
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

                   
                   const dy = (otherLat - meLat);  
                   if(Math.abs(dy)<maxDistDeg){
                       
                       //const dx = (otherLon - meLon) * Math.cos(0.5*(meLat+otherLat)*degToRad);
                       const dx = (otherLon - meLon) * Math.cos(0.5*(meLat+otherLat)*degToRad);
                       if(Math.abs(dx)<maxDistDeg){
                           
                           let dist;
                           if(maxdist<50.0){
                              dist = Math.sqrt(dx * dx + dy * dy) * kilometersPerDegree;
                           }else {
                               dist = distance.distance(me.geometry.coordinates,other.geometry.coordinates);
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
   	let dichte = count / ( maxdist * maxdist * 3.141592 );  
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

           function tree(feature){
               if( feature.env.clusterID == -1 ){
                   feature.env.clusterID=clusterID;
                   let nachbarn=feature.env.nachbarn;

                   //aufsteigend: a-b absteigend: b-a
                   let nachbarnArray=Object.entries(nachbarn).sort( ([,a],[,b]) => { return a-b } );

                   for (const [key, value] of nachbarnArray) {
                       if(value<dist){
                           let nachbar=indexed[key];
                           tree(nachbar);
                       }
                   }
               }
           }

           tree(feature);
       }
       
       let indexed=init(geojson);
      
       let features=geojson.features;
       for(let i=0;i<features.length;i++){
           if(isNode && i%1000==0)process.stderr.write("=");
           let feature=features[i];
           if(feature.env.clusterID==-1){
               find(feature,clusterID,dist);
               clusterID++;
           }
       }
       
       if(!keepNachbarn)geojson.features.forEach( (feature) => { delete feature.nachbarn; });
       
       return geojson
   }

   function multipoint(geojson, keepMembers=true){


       function turfMultiPoint(coords,properties={}){
           let out={ type: "Feature",
                     properties: properties,
                     geometry: { type: "MultiPoint", coordinates: coords }
                   };
           return out;
       }

       //outputs feature collection
       function turfFeatureCollection(features,properties={}){
           let out={ type: "FeatureCollecton",
                     properties: properties,
                     features: features
                   };
           return out;
       }
       
       let features=geojson.features;

       
       let res=[];

       //collect clusters in res[];
       for(let i=0;i<features.length;i++)res[i]=[];
       
       for(let i=0;i<features.length;i++){
           let feature=features[i];
           let clusterID=feature.env.clusterID;
           //qlet fc=[];
           if(clusterID>=0){
               res[clusterID].push(feature);
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
               featCol.push(multiPoint);

           }
       }
       //return turf.featureCollection(featCol);
       let out=turfFeatureCollection(featCol);
       out.maxDist=geojson.maxDist;
       out.dist=geojson.dist;

       return out
   }

   function polygon(mc,maxEdge){


       // turf.concave but with multiPoint (vs featureCollection of point) as input
       function concave$1(mpf,maxEdge){
           let coordinates=mpf.geometry.coordinates;
           let points=[];
   	//console.log(mpf)
           coordinates.forEach( (point) => { points.push(clone.point(point) );});      //console.log(points)
           let fc=clone.featureCollection(points);
           return concave.concave(fc,{maxEdge: maxEdge});
       }
       
       let outFeatures=[];
       let features=mc.features;//console.log(features);
       for(let i=0;i<features.length;i++){
           let feature=features[i];
                                                                  //if(i==3)log(feature);
           let poly=concave$1(feature,maxEdge);
           if(poly){
               poly.properties=feature.properties;
               let area$1=area.area(poly)/1000000.0;
               let memberCount=poly.properties.memberCount;
               let density=memberCount/area$1;
               poly.properties.area=area$1;
               poly.properties.density=density;
               outFeatures.push(poly);
           }
       }
       let out= clone.featureCollection(outFeatures);
       
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
       
       getNachbarn(maxDist){

           if(maxDist)this.maxDist=maxDist;

   	this.calcNachbarn();
   	
   	return this.geojson
       }

       getCluster(dist, maxDist){

           if(maxDist)this.maxDist=maxDist;
   	if(dist)this.dist=dist;

   	this.calcNachbarn();
   	this.calcMultipoint();

   	return this.geojson
       }

       getMultipoint(dist,maxDist){

           if(maxDist)this.maxDist=maxDist;
   	if(dist)this.dist=dist;

   	this.calcNachbarn();
   	this.calcMultipoint();

   	return this.multipoint
       }

       getPolygon(maxEdge,dist,maxDist) {

           if(maxDist)this.maxDist=maxDist;
   	if(dist)this.dist=dist;
   	if(maxEdge)this.maxEdge=maxEdge;

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

   exports.Nachbar = Nachbar;

}));
