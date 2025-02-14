
// https://gis.stackexchange.com/questions/330608/leaflet-marker-popup-link-from-outside-of-map-dynamically

///////////////////////////////////////popup////////////////////////////////////////

function portrait(parentElm,feature, diffs){

    
    const tags = feature.properties.tags;
    const id = feature.properties.id;
    

    //const portraitDiv = document.getElementById("portrait"+id);
    const portraitDiv=parentElm;
    
    let line=0;
    
    function appendTableRow(table, key, values){
	
	let row = document.createElement("tr");
	if(line%2==0)row.setAttribute("style","background-color:white");
	line++;

	//appendRowData(row,"<b>"+key+"</b>");
	
	let rowKey = document.createElement("td");
	rowKey.setAttribute("style","text-align:right");
	rowKey.innerHTML="<b>"+key+"</b>";
	row.appendChild(rowKey);

	let rowValue = document.createElement("td");
	rowValue.innerHTML=values;
	row.appendChild(rowValue);
	
	table.appendChild(row);
    }

    
    let tabelle = document.createElement("table");
    tabelle.setAttribute("style","padding-top:10px;padding-bottom:10px");
    tabelle.setAttribute("display","inline");
    tabelle.setAttribute("float","left");
    portraitDiv.appendChild(tabelle);

    // coordinates
    let lon = feature.geometry.coordinates[0];
    let lat = feature.geometry.coordinates[1];
    appendTableRow(tabelle, 'Position:', '<a href="geo:'+lat+','+lon+'">'+lat+', '+lon+'</a>');


    
    if(tags.ele){
	appendTableRow(tabelle, "Elevation:", tags.ele+' m');
    }
    
    if(tags.latest_update){
	appendTableRow(tabelle, "Daten von:", year(tags.latest_update));
    }
    
    if(tags.circumference) {           
	appendTableRow(tabelle, "Umfang:", tags.circumference+' m');
    }

    if(tags.diameter_crown) {           
	appendTableRow(tabelle, "Krone:", tags.diameter_crown+' m');
    }

    if(tags.height) {           
	appendTableRow(tabelle, "Höhe:", tags.height+' m');
    }

    let propagation;
    if(tags.propagation){
	switch(tags.propagation){
        case 'natural':                                                                                           
            propagation='natürlich'
            break;                                                                                                
        case 'sucker':
            propagation='natürlich (Wurzelbrut)'
            break;                                                                                                
        case 'planted':
            propagation='gepflanzt';
            break;                                                                                                
        case 'graft':
            propagation='gepflanzt (Reiser)';
            break;
        case 'seed':                                                                                              
            propagation='gepflanzt (Samen)';
            break;            
        default:
            propagation='unbekannt';
            break;
	}
	appendTableRow(tabelle, "Vermehrungstyp:", propagation);
    }
    if(feature.properties.parentFeature){
        let parent = feature.properties.parentFeature;

        let pOrt = parent.properties.tags["addr:full"].split(',')[0];
        let pGebiet = parent.properties.tags["speierlingproject:gebiet"];
        let pCoords = parent.geometry.coordinates;

	let herkunft = '<span style="color:rgb(0,120,168)" onclick="map.setView(L.latLng('+pCoords[1]+','+pCoords[0]+'))">'+pOrt+'/'+pGebiet+'</span>';
	appendTableRow(tabelle, "Herkunft:", herkunft)
    }

    /*
    let jetzt=dateNowISO();
    */
    
    if(tags['start_date'] || tags['start_date:estimated']){
	
	let desc=''
	let start;
	let meth;
	if(tags.propagation){
	    switch(tags.propagation){
	    case 'natural':
	    case 'sucker':
		meth='Keimjahr';
		break;
	    default:
		meth='Planzjahr';
		break;	    
	    }
	}
	if(tags['start_date']){
	    desc='';
	    start=tags['start_date'];
	    start=Math.round(decimalYear(start));
	}else if(tags['start_date:estimated']){
	    desc='geschätztes ';
	    start=tags['start_date:estimated'];
            start=Math.round(decimalYear(start));
	    if(start<2000){
		start=Math.round(start/10)*10;
	    }
	}
	
	appendTableRow(tabelle, desc+meth, start);
    }
    
    if(tags['circumference:growth']){
	   appendTableRow(tabelle, "BHU-Wachstum:", tags['circumference:growth']+' cm/a');
    }else if(tags['circumference:growth:estimated']){
	   appendTableRow(tabelle, "BHU-Wachstum:", tags['circumference:growth:estimated']+' cm/a');
    }

    if(tags["speierlingproject:Fruechte"]){
	
	appendTableRow(tabelle, "Früchte:", tags["speierlingproject:Fruechte"])
    }
    
}

function titel(parentElm,feature){
    
    const tags = feature.properties.tags;
    const id = feature.properties.id;

    //const titelDiv = document.getElementById("titel"+id);
    const titelDiv=parentElm;

    let dnArray=feature.properties.tags["addr:full"].split(',').slice(1);
    let dnString=dnArray.join(', ');
    let name=dnString+'<br>';

    let loca=feature.properties.tags["addr:gemeinde"]     
    
    if(tags["speierlingproject:gebiet"]){
       loca+=" ("+tags["speierlingproject:gebiet"]+")";
    }

    titelDiv.innerHTML='<h5 style="margin:0px">'+loca+'</h5>'+name;

}

function miniMap(feature){
    
    let lon=feature.geometry.coordinates[0];
    let lat=feature.geometry.coordinates[1];

    let mapid='karte'+feature.properties.id;
    var map = L.map(mapid, { zoomControl: false, 
                             attributionControl: false,
                             dragging: false,
                             doubleClickZoom: 'center',
                             scrollWheelZoom: false,
                             renderer: L.canvas()
                           }
                   );
 
    map.setView([lat, lon], 16);

    // https://tile.openstreetmap.org/{z}/{x}/{y}.png
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
    }).addTo(map);

    L.control.scale({imperial:false}).addTo(map);

    let color='black';
    if(feature.properties.tags.propagation){
       switch(feature.properties.tags.propagation){
         case 'natural': color='lightgreen';break;
         case 'sucker': color='yellow';break;
         case 'planted': color='dodgerblue';break;
         case 'seed': color='tomato';break;
         case 'graft': color='orange';break;
         case 'cutting': color='orange';break;
         default: color='white';break;
         }
    }
    
    let circle = L.circle([lat, lon], {
	color: color,
	opacity: 1.0,
	weight: 2,
      fillColor: color,
      fillOpacity: 0.0,
      radius: 10
  }).addTo(map);        
}

function bilder(parentElm,feature){
    
    const tags = feature.properties.tags;
    const id = feature.properties.id;

    //const bilderDiv = document.getElementById("bilder"+id);
    const bilderDiv=parentElm;
    
    let pics='';

    if(!feature.properties.media){
        if(tags.image){
          feature.properties.media={ "type": "mediaCollection", "pictures": [{ "picture": tags.image }] };    
        }
    }

    let minWidth;
    if(feature.properties.media){
	pics='<p>';
    	minWidth=400;
	let id=feature.id;
	let fpp=feature.properties.media.pictures;;
	minWidth=fpp.length*105;
	if(minWidth>420)minWidth=420;
	pics='<div style="min-height:'+100*(Math.floor(fpp.length/5)+1)+'">\n';
	let weitere=0;
	for(let i=0;i<fpp.length;i++){
	    let p=fpp[i];
	    let l;
	    if(i<4){
                if(!p.thumb)p.thumb=p.picture;
		l='<img style="width:100px;height:100px;object-fit:cover" src="'+p.thumb+'">';
		
	    }else{
		weitere++;
		l=''
	    }
	    pics+='<a href="'+p.picture+'" data-lightbox="1" data-title="'+"Titel"+'">'+l+'</a>\n';
	}
	if(weitere>0){
	    let weit
	    if(weitere==1){ weit=' weiteres Bild' }else{ weit=' weitere Bilder ...'}
	    pics+='</br>und noch '+weitere+weit;
	}
	pics+="</div></p>\n";
    }

    bilderDiv.innerHTML=pics;
}

function tops(contentElm,feature,diffs){

    const id = feature.properties.id;
    
   //titel
    let titelElm=document.createElement('p');
    titelElm.setAttribute('style','margin:0px;margin-bottom:5px');
    contentElm.appendChild(titelElm);
    
    titel(titelElm,feature);

    //portrait
    let portraitElm=document.createElement('span');
    portraitElm.setAttribute('style','float:left');                        
    contentElm.appendChild(portraitElm);

    portrait(portraitElm,feature,diffs);

    //karte
    let minimapElm=document.createElement('p');
    minimapElm.setAttribute('id','karte'+id);
    minimapElm.setAttribute('style','margin-left:5px;margin-bottom:5px;height:150px;width:150px;float:left');

    let mapurl='https://openstreetmap.org/'+feature.id;
    minimapElm.addEventListener('click', ()=>{ window.open(mapurl) });
    contentElm.appendChild(minimapElm);

    miniMap(feature);

    //trenner
    let trenner=document.createElement('div');
    trenner.setAttribute('style','clear:both');
    contentElm.appendChild(trenner);

    //bilder
    let bilderElm=document.createElement('p');
    bilderElm.setAttribute('style','margin:0px');
    contentElm.appendChild(bilderElm);

    bilder(bilderElm,feature);
}
