
// https://gis.stackexchange.com/questions/330608/leaflet-marker-popup-link-from-outside-of-map-dynamically

///////////////////////////////////////popup////////////////////////////////////////

/*
function content(feature){

    let tags=feature.properties.tags;
    let id=feature.properties.id;

   function wopen(){
      window.open('https://openstreetmap.org/'+feature.id );
   }

    //ugly """"" and '''' trick
    let mapurl='https://openstreetmap.org/'+feature.id;
    let onclick=' onclick=window.open("'+mapurl+'") ';

    let karDiv='<div '+onclick+'  id="karte'+id+
         '" style="margin-left:5px;margin-bottom:5px;height:150px;width:150px;float:left"></div>';

    let titDiv='<p id="titel'+id+'" style="margin:0px;margin-bottom:5px"></p>';
    let porDiv='<span id="portrait'+id+'" style="float:left"></span>';
    let cDiv='<div style="clear:both"></div>';
    let bilDiv='<p id="bilder'+id+'" style="margin:0px"></p>';
    
    let notDiv='<div id="note'+id+'" style="max-height:200px;overflow:auto"></div>';
    let dimDiv='<div id="dimension'+id+'"></div>';
    let linDiv='<div id="backlink'+id+'"></div>';

    let tabDiv='<div id="tabs'+id+'" style="min-height:200px"></div>';

    style=""
    
    let content='<div id="content'+id+'" style="padding:5px;background:#eeeeee;max-height:400px;overflow:auto">'+
        titDiv+'<span>'+porDiv+karDiv+'</span>'+cDiv+bilDiv + notDiv+dimDiv+linDiv+tabDiv+
        '</div>';

    
    return content; 

}
*/


function doPopup(event,feature,diffs){

    const id = feature.properties.id; 

    //let cont=content(feature);
    let cont='<div id="content'+id+'" style="padding:5px;background:#eeeeee;max-height:400px;overflow:auto"></div>';
    event.popup.setContent(cont);

    let contentElm=document.getElementById('content'+id);

    tops(contentElm,feature,diffs);
    
    //tabs
    //let parentElm = document.getElementById("tabs"+id);
    let tabsElm= document.createElement('div');
    tabsElm.setAttribute('style','min-height:10px');
    contentElm.appendChild(tabsElm);
   
    
    tabs(contentElm, feature, diffs);
 
}


function popupopen(event,feature){

    const properties = feature.properties; 
    //const id = feature.properties.id; 


    let diffs=feature.properties.history;
 
    if(properties.tags.media){
	if(properties.media){
	    doPopup(event,feature,diffs);
	}else{
	    fetch(tags.media)
		.then((response) => response.json())
		.then((data) => {
		    properties.media=data
		    doPopup(event,feature,diffs);
		})
	}
    }else{
	doPopup(event,feature,diffs);   
    }


}
