//let offline=false;

//let treesGeojson;

let searchItems=[];
let globalGeo;


function addParent(geojson){

    let indexed= {};

    // add featureIndex                                                                                                     
    for(let i=0;i<geojson.features.length;i++){
        let feature=geojson.features[i];
        feature.featureIndex=i;
    }

    // make indexOpbject                                                                                                    
    for(let i=0;i<geojson.features.length;i++){
        let feature=geojson.features[i];
        indexed[feature.properties.id]=feature;
    }

    // make parentIndex;                                                                                                    
    for(let i=0;i<geojson.features.length;i++){
        let feature=geojson.features[i];
        if(feature.properties.tags["propagation:parent"]){
            let parent=feature.properties.tags["propagation:parent"];
            if(indexed[parent]){
                let parentIndex=indexed[parent].featureIndex;
                feature.properties.parentIndex=parentIndex;

               // link to myself
                let parentFeature=geojson.features[parentIndex];
                feature.properties.parentFeature=parentFeature;

                //nicht richtig so !!!!!!!
                //add backling to parentFeature
                if(!parentFeature.properties.backlink)parentFeature.properties.backlink=[];
                parentFeature.properties.backlink.push(feature);                
            }
        }
    }
    return geojson;
}

function getRelationGeojson(geojson){

    let relationGeojson= { type: "FeatureCollection", features: [] };

    for(let i=0;i<geojson.features.length;i++){
        let feature=geojson.features[i];
        if(feature.properties.parentFeature){

            let coords=feature.geometry.coordinates;
            let pCoords=feature.properties.parentFeature.geometry.coordinates;

            let item={ "type": "Feature",
                       "properties": {},
                       "geometry": {
                              "type": "LineString",
                              "coordinates": [ pCoords, coords ]
                       }
                     };
            relationGeojson.features.push(item);
        }

    }
    return relationGeojson;
}

///////////////////////////////////////marker////////////////////////////////////////

let markerList = {};

function scaleMarkerRadius(scale){
    for(const value of Object.values(markerList)){
	value.marker.setRadius(scale*value.radius)
    }
}

function pointToLayer(feature, latlng) {

    let tags=feature.properties.tags;  

    let id=feature.properties.id;
    
    let color;
    let radius;
    let weight;

    if(tags.propagation){
        switch(tags.propagation){
            case 'planted':
                color='royalblue';
            break;
            case 'natural':
                color='seagreen';
                break;
            case 'graft':
                color='orange';
                break;
            case 'seed':
                color='tomato';
                break;
            case 'sucker':
                color='yellow';
                break;
            default:
                color='white';
                break;
        }
    }else{
        color='black'
    }

    if (tags.circumference) {
	let c=tags.circumference;
        radius=Math.round(6.0*Math.sqrt(c));
	if(radius<3)radius=3;
	fillOpacity=0.6;
    }else{
	radius=5;
	fillOpacity=0.6;
    }

    if(tags.media||tags.image){
	weight=3;
    }else{
	weight=0;
    }

    let m;
    let pro=false;
    if(tags['speierlingproject:neupflanzung'])pro=true;


    
    if(pro){
       m = L.shapeMarker(latlng, {
	   radius: radius,
	   weight: weight,
	   color: color,
	   opacity: 1.0,
	   fillColor: color,
           fillOpacity: fillOpacity,
           shape: "square"
        });         
    }else{
       m = L.circleMarker(latlng,
                          {
                              radius: radius,
                              weight: weight,
                              color: color,
                              opacity: 1.0,
                              fillColor: color,
                              fillOpacity: fillOpacity
                          }
                         );
    }

    markerList[id]={ marker: m, radius: radius }
    
    return m;
    //end neu                              
}

function onEachFeature(feature, layer) {

    //rohSet(tags+project);

    let options = { maxWidth: 700, minWidth: 500, maxHeight: 400 };
    let popup = L.popup(options); 

    // function popuopen is in popup.js
    layer
      .bindPopup(popup)
      .on("popupopen", (event) => { popupopen(event, feature)} );    

}


///////////////////////////////////////lightbox////////////////////////////////////////

lightbox.option({
      'resizeDuration': 200,
      'imageFadeDuration': 200,
      'fadeDuration': 600,
      'wrapAround': true
});

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////map/////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var map = L.map('map').setView([47.7,8.0 ], 10);
map.on('zoomend',adaptZoom);



//https://github.com/xtk93x/Leaflet.TileLayer.ColorFilter

let esriFilter = [
    'blur:0px',
    'brightness:100%',
    'contrast:100%',
    'grayscale:100%',
    'hue:0deg',
    'opacity:0%',
    'invert:0%',
    'saturate:100%',
    'sepia:0%'
];


let esriLayer;
   esriLayer  = L.tileLayer.colorFilter('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: "Sources: Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community",

        filter: esriFilter
   }) //.addTo(map);

/*
let shadeFilter = [
    'blur:0px',
    'brightness:100%',
    'contrast:100%',
    'grayscale:0%',
    'hue:0deg',
    'opacity:100%',
    'invert:0%',
    'saturate:100%',
    'sepia:0%'
];


let shadeLayer;
   shadeLayer  = L.tileLayer.colorFilter('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
        attribution: "Sources: Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community",

        filter: shadeFilter
   }).addTo(map);
*/

let osmFilter = [
    'blur:0px',
    'brightness:100%',
    'contrast:100%',
    'grayscale:100%',
    'hue:0deg',
    'opacity:70%',
    'invert:0%',
    'saturate:100%',
    'sepia:0%'
];


let osmLayer;
if(offline==true){
   // uses local scout server !!!!!!!!
   osmLayer = L.tileLayer('http://localhost:8553/v1/tile?style=pedestrian&daylight=1&scale=4&shift=0&z={z}&x={x}&y={y}', {
	maxZoom: 20,
        tileSize: 1024,
        zoomOffset: -2,
        detectRetina: true,
	attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, ' +
	'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
	'Imagery © <a href="https://github.com/rinigus/osmscout-server">OSM Scout Server</a>'
    }).addTo(map);
}else{                          //  https:(({a|b|c}.tile.opentopomap.org/{z}/{x}/{y}.png
    // 
    // http://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png
    osmLayer = L.tileLayer.colorFilter('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
        filter: osmFilter
   }).addTo(map);
}


// 


let slopeFilter = [
    'blur:0px',
    'brightness:100%',
    'contrast:100%',
    'grayscale:0%',
    'hue:0deg',
    'opacity:40%',
    'invert:0%',
    'saturate:100%',
    'sepia:0%'
];


let slopeLayer = L.tileLayer.colorFilter('https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.hangneigung-ueber_30/default/current/3857/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '© SwissTopo',
    filter: slopeFilter
});

//slopeLayer.addTo(map);




//let baseLayers = { "Openstreetmap": osmLayer, "Esri Satelite": esriLayer }
//let lc = L.control.layers(baseLayers).addTo(map);
//lc.setPosition('topleft');

L.control.scale({imperial:false, maxWidth: 100}).addTo(map);

var gps = new L.Control.Gps({
		//autoActive:true,
		autoCenter:true
	});//inizialize control

	gps
	.on('gps:located', function(e) {
		//	e.marker.bindPopup(e.latlng.toString()).openPopup()
		//console.log(e.latlng, map.getCenter())
	})
	.on('gps:disabled', function(e) {
		e.marker.closePopup()
	});

	gps.addTo(map);

////////////////////////////////    search   ////////////////////////////////////////

let mapState={};
let filteredTreeLayer=false;
let filtered=false;

function searchDisplay(geo){

    filtered=true;
    mapState= { bounds: map.getBounds(), zoom: map.getZoom() };

    let st= document.getElementById('searchtext')
    st.setAttribute('style','display:none');
    search=st.value;
    
    let result= document.getElementById('searchresult');
    result.setAttribute('style','display:inline-block;margin:3px;border-radius:5px');
    result.innerHTML='&nbsp;<b>'+search+'&nbsp;&nbsp;&#x232B;&nbsp</b>';

    //let button = document.getElementById('searchbutton');
    //button.setAttribute('style','display:inline-block');
    
    //let st = document.getElementById('searchtext');
    
    let features=geo.features;
    
    let filteredTrees  = { type: 'FeatureCollection', features: [] }
    
    let bounds = L.latLngBounds();
    for(let i=0;i<features.length;i++){
	let feature=features[i];
	let tags=feature.properties.tags;
	let coords=feature.geometry.coordinates;

	let arr= search.split(',');

	let searchValue=arr[0].trim();
	let found=false;
	let value;
	switch(arr.length){
	case 3:
	    value=tags['addr:gemeinde'];
	    if(value==searchValue)found=true;
	    break;
	case 2:
	    value=tags['addr:state']
	    if(value==searchValue)found=true;
	    break;
	case 1:
	    value=tags['addr:country']
	    if(value==searchValue)found=true;
	    break;
	}
	
	if(found){
	    if(coords[0] && coords[1]){
		//let p=L.point(coords[0], coords[1]);
		bounds.extend([ coords[1], coords[0] ] );
		filteredTrees.features.push(feature);
	    }
	}
    }

    filteredTreeLayer=L.geoJSON(filteredTrees, {
        //style: style,
        //filter: filter,
        onEachFeature: onEachFeature,
        pointToLayer: pointToLayer
    });

    /*
    for(let i=0;i<features.length;i++){
	let id=features[i].properties.id;
	markerList[id].marker.setRadius(0);
    }
    */
 
    if(map.hasLayer(treeLayer))map.removeLayer(treeLayer);
    if(map.hasLayer(relative))map.removeLayer(relative);

    map.flyToBounds(bounds.pad(0.2));

    /*
    for(let i=0;i<foundIds.length;i++){
	let id=foundIds[i];
	markerList[id].marker.setRadius(markerList[id].radius);
    }
    */
    
}

function searchReset(){
    filtered=false;
    let st = document.getElementById('searchtext');
    st.setAttribute('style','display:inline-block');
    st.value='';
    let sr=document.getElementById('searchresult');
    sr.setAttribute('style','display:none');

    map.flyToBounds(mapState.bounds, mapState.zoom);

}


//////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// sdd gesojson layers   ////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////

let relative=false;
let treeLayer=false;
//let filteredTreeLayer=false;

function addGeojsonLayer(responseText){

    let geo=JSON.parse(responseText)
    // rapairTags and addParentIndex goes here

    let globalGeo=geo;
    
    search=[]
    //let searchStrings=[];
    let features=geo.features;
    for(let i=0;i<features.length;i++){
	//let label=features[i].properties.tags['addr:full']
	let tags=features[i].properties.tags;
	let country=tags['addr:country']
	//if(country=='Schweiz/Suisse/Svizzera/Svizra')country='Schweiz';
	//let label=country+', '+tags['addr:state']+', '+tags['addr:gemeinde']
	let label=tags['addr:gemeinde']+', '+tags['addr:state']+', '+country
	search.push(label);
	//let search= [ tags['addr:gemeinde'], tags['addr:state'], country ]; 
	//searchItems.push(search);
    }
    search.sort();
    last='';
    for(let i=0;i<search.length;i++){
	let item=search[i];
	if(item!=last){
	    searchItems.push(item);
	    last=item;
	}
    }
	
    autocomplete(globalGeo, document.getElementById('searchtext'),searchItems);
    let sr = document.getElementById('searchresult');
    sr.addEventListener('click', (e) => { searchReset() } );
    
    let stageone =addParent(geo);
    //let geojsonLayer= addGroth(stageone);
    
    let geojsonLayer=stageone; 
    
    treeLayer=L.geoJSON(geojsonLayer, {
        //style: style,
        //filter: filter,
        onEachFeature: onEachFeature,
        pointToLayer: pointToLayer
    });

 
    
    
    let relationGeojson=getRelationGeojson(geojsonLayer);
    relative=L.geoJSON( relationGeojson, {
        style: function(feature){return { opacity:0.15,color:"#000000" }}
        //filter: filter,
        //onEachFeature: onEachFeature,
        //pointToLayer: pointToLayer
    });

    relative.addTo(map);
    treeLayer.addTo(map);
    stopSpinner();

}

let distri=false;

function addGeojsonDistri(responseText){

    let geojsonLayer=JSON.parse(responseText);

    distri=L.geoJSON(geojsonLayer, {
        style: function(feature){return { opacity:0.0,fillOpacity:0.09,color:"#004400" }}
        //filter: filter,
        //onEachFeature: onEachFeature,
        //pointToLayer: pointToLayer
    });

    distri.addTo(map);
}

/*
function addGeojsonCliff(responseText){

    let geojsonLayer=JSON.parse(responseText);

    let cliff=L.geoJSON(geojsonLayer, {
        style: function(feature){return { opacity:0.5,fillOpacity:0.5,color:"#00ff00" }}
        //filter: filter,
        //onEachFeature: onEachFeature,
        //pointToLayer: pointToLayer
    });

    cliff.addTo(map);
}
*/

let rect=false;

function addGeojsonRect(responseText){

    let geojsonLayer=JSON.parse(responseText);

    rect=L.geoJSON(geojsonLayer, {
        style: function(feature){return { fill:true,opacity:1.0,fillOpacity:0.05,color:"#111111",weight:0 }}
        //filter: filter,
        //onEachFeature: onEachFeature,
        //pointToLayer: pointToLayer
    });

    rect.addTo(map);
}

///////////////////////////////////////////////////////////////////////////////////////////////

function httpGet(theUrl, callback){                                
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
	if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
	    //stopSpinner()                                                                                         
	    callback(xmlHttp.responseText);
	}                                                                                                           
    }         
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}



// load and add layers
//httpGet('cliff+045+005.geojson', addGeojsonCliff);

httpGet('Rect.geojson', addGeojsonRect);

httpGet('Sorbus_domestica_plg.geojson', addGeojsonDistri);

httpGet('../data/sorbusdomestica.geojson', addGeojsonLayer);


let ziel=0;
let jetzt=0;

let grayscale;

adaptZoom();



function  adaptZoom(){
    
    let zoom=map.getZoom();

    if(filtered){
	if(filteredTreeLayer){
            if(!map.hasLayer(filteredTreeLayer))map.addLayer(filteredTreeLayer);
	}
	if(map.hasLayer(treeLayer))map.removeLayer(treeLayer);
    }else{
	if(filteredTreeLayer){
	    if(map.hasLayer(filteredTreeLayer))map.removeLayer(filteredTreeLayer);
	}
	if(relative){
            if(!map.hasLayer(relative))map.addLayer(relative);
	}
	if(treeLayer){
            if(!map.hasLayer(treeLayer))map.addLayer(treeLayer);
	}
    }
    
    //grayscale of osm map
    let v=(20-zoom)*10.0;
    if(v>=100)v=100;	   
    if(v<=0)v=0;
    grayscale=Math.round(v)
    //osmLayer.updateFilter([ 'grayscale:'+grayscale+'%' ] )

    /*
    //opacity filter of esri
    v=50+(zoom-10)*10;
    if(v>=100)v=100;	   
    if(v<=0)v=0;
    let opacity=Math.round(v)
    esriLayer.updateFilter([ 'grayscale:'+grayscale+'%','opacity:'+opacity+'%' ] )
    */

    //relative
    /*
    if(relative){
	if(zoom>16){
	    relative.setStyle( function(feature){return { opacity:0.0,color:"#000000" }} )
	}else{
	    relative.setStyle( function(feature){return { opacity:0.15,color:"#000000" }} )
	}
    }
    */
    
    //project rectangle
    if(rect){
	let fillOpacity=0.3-(zoom-3.0)*0.15;
	if(fillOpacity>0.2)fillOpacity=0.3;
	if(fillOpacity<0.0)fillOpacity=0.0;  
	rect.setStyle(function(feature){return { fill:true,opacity:1.0,fillOpacity:fillOpacity,color:"#111111",weight:0 }});
    }
    //tree distribution
    if(distri){
	fillOpacity=0.3-(zoom-5.0)*0.05;
	if(fillOpacity>0.2)fillOpacity=0.3;
	if(fillOpacity<0.0)fillOpacity=0.0;  
	distri.setStyle(function(feature){return { opacity:0.0,fillOpacity:fillOpacity,color:"#004400" }})
    }

    //slope
    if(zoom>13){    // && zoom<17){
	if(!map.hasLayer(slopeLayer))map.addLayer(slopeLayer);
        slopeLayer.updateFilter( [ 'opacity:25%', 'grayscale:'+grayscale+'%' ] );
    }else{
	if(map.hasLayer(slopeLayer))map.removeLayer(slopeLayer);
    }
   
    //marker size
    let scale= 0.25+(zoom-5.0)/10.0;
    if(scale>1.0)scale=1.0;
    if(scale<0.2)scale=0.2;
    scaleMarkerRadius(scale);

    /*
    if(zoom>13){
	if(map.hasLayer(shadeLayer))map.removeLayer(shadeLayer);
    }else{
	if(!map.hasLayer(shadeLayer))map.addLayer(shadeLayer);
    }
    */
    if(zoom>16){
	ziel=100;
        if(ziel==100)if(!map.hasLayer(esriLayer))map.addLayer(esriLayer);
	doFader();
    }else{
	ziel=0;
	doFader();
    }

}

function doFader(){
    if(jetzt!=ziel){
	if(jetzt>ziel){
	    jetzt-=4;
	}else{
	    jetzt+=3;
	}
	if(jetzt>100)jetzt=100;
	if(jetzt<0)jetzt=0;
	let rest=0.15*(1.0-jetzt/100.0)
	if(relative)relative.setStyle( function(feature){return { opacity: rest ,color:"#000000" }} )
	fader(jetzt,grayscale);
	setTimeout(doFader,20);
    }else if(ziel==0){
	fader(0,grayscale);
	if(map.hasLayer(esriLayer))map.removeLayer(esriLayer);
    }
}

function fader(opacity,grayscale){
    
    let rest=100-opacity;
    //let slope=Math.round(25*rest/100);
    esriLayer.updateFilter( [ 'opacity:'+opacity+'%', 'grayscale:'+grayscale+'%' ] );
    osmLayer.updateFilter( [ 'opacity:'+rest+'%', 'grayscale:'+grayscale+'%' ] );
    //if(map.hasLayer(slopeLayer))slopeLayer( [ 'opacity:'+slope+'%', 'grayscale:'+grayscale+'%' ] );
    
}

