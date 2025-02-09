
// https://gis.stackexchange.com/questions/330608/leaflet-marker-popup-link-from-outside-of-map-dynamically

///////////////////////////////////////popup////////////////////////////////////////



function projekt(feature){
    
    let projektDiv = false;

    let tags = feature.properties.tags;

    let count = 0;
    txt='<table class="tabelle">'; 
    for (let [key, value] of Object.entries(tags)) {
  

        if(key.startsWith('speierlingproject:')){
	    let k=key.split(':')[1];

	    let deny=[ 'gebiet','datum'];
	    if(!devMode){
		deny.push('hauptinfo');
		deny.push('bemerkung');
	    }
	    if( !deny.includes(k) ){
		let titel=false;
		switch(k){
		case 'hauptinfo':
		    titel = 'Hauptinfo';
		    break;
		case 'erhaltungs_plantage_biel_nr':
		    titel='Erhaltungsplantage&nbsp;Biel';
		    break;
		case 'seba':
		    titel='Seba';
		    break;
		case 'fruechte':
		    titel='Früchte'
		    break;
		case 'verluste_erklaerung':
		    titel='Verluste';
		    break;
		case 'dna_probe':
		    titel='DNA-Probe';
		    if(value.trim()=='DNA')value='&#9989;'  
		    break;
		case 'bemerkung':
		    titel='Bemerkung';
		    break;
		case 'reiser':
		    titel='Reiser';
		    break;
		default:
		    titel=k;
		    break;
		}
		if(titel){
		    count++;
		    txt+='<tr ><td style="text-align:right"><b>'+titel+':</b></td><td>'+value+'</td></tr>'
		}
	    }
	}
    }
    txt+='</table>';

    if(count>0){
	projektDiv = document.createElement('div');
	projektDiv.innerHTML=txt
    }
    
    return projektDiv
}


function notes(feature, diffs){
    
    let notes = getChanges(diffs,["note"])

    let notesDiv = false;
        
    if(notes.length>0){
	notesDiv = document.createElement("div");
	for(i=notes.length-1;i>=0;i--){
	    //for(i=0;i<notes.length;i++){
	    //noteDiv=document.getElementById("note"+history[0].id);
	    noteElm = document.createElement('p');
	    let note=notes[i]

	    if(i%2==0){
		noteElm.setAttribute("style","background:white;padding:0px;margin:0px");
	    }else{
		noteElm.setAttribute("style","padding:0px;margin:0px");
	    }
	    noteElm.innerHTML='<b style="background-color:lightgrey;width:100%">'+dateToString(note.timestamp.slice(0,10))+'</b><br/>'+note.note;
	    notesDiv.appendChild(noteElm);
	}
    }
    return notesDiv
}

function dimension(feature, diffs){


    let dimensionDiv = false;
    let plotdata=[];
    
    let dim=[];
    if(diffs){
	dim = getChanges(diffs, ["height","circumference"]);
    }
    if(dim.length>1){
        const tags = feature.properties.tags;
        const id = feature.properties.id;

       dimensionDiv = document.createElement('div');
        let line=0;

        function appendTableRow2(table, header, key, circumference, height){

            let type;
            let row = document.createElement("tr");

            if(header){
                row.setAttribute("style","background-color:lightgrey;color:black");
                type="th";
            }else{
                if(line%2==0)row.setAttribute("style","background-color:white");
                line++;
                type="td"
            }
                
            let rowKey = document.createElement(type);
            //rowKey.setAttribute("style","text-align:right");
            rowKey.innerHTML=key;
            row.appendChild(rowKey);

            let rowCircum = document.createElement(type);
            rowCircum.innerHTML=circumference;
            row.appendChild(rowCircum);

            let rowHeight = document.createElement(type);
            rowHeight.innerHTML=height;
            row.appendChild(rowHeight);

            table.appendChild(row);
        }
        let tabelle = document.createElement("table");
        tabelle.setAttribute("style","padding-top:10px;padding-bottom:10px;max-height:50px;overflow:auto");
        tabelle.setAttribute("display","inline");
        tabelle.setAttribute("float","left");
        dimensionDiv.appendChild(tabelle);

        appendTableRow2(tabelle,true,"&nbsp;Datum","&nbsp;Umfang&nbsp;","&nbsp;Höhe&nbsp;");

        let circumference;
        let height;
        let datum;

       // get minimal circumference
       let minCircumference = 100000;
       for(let i=0;i<dim.length;i++){
	   let line=dim[i];
	   if(line.circumference){
	       if(line.circumference<minCircumference)minCircumference=line.circumference
	   }
       }

       // muss vorwärts sein!
       for(let i=0;i<dim.length;i++){
	   let record={}
	   let line=dim[i];
	   let timestamp=line.timestamp;
	   record["timestamp"]=timestamp;
	   if(minCircumference>0.1){
	       datum=timestamp.slice(0,4)
	   }else{
	       datum=timestamp.slice(0,7)
	   }
	   if(line.circumference){
	       circumference=line.circumference
	       record["circumference"]=circumference;
	   }else{
	       circumference=''
	   }

	   if(line.height){
	       height=line.height;
	       record['height']=height;
	   }else{
	       height=''
	   }

	   appendTableRow2(tabelle,false,'<b>'+datum+'</b>&nbsp;','&nbsp;'+circumference,'&nbsp;'+height);
	   plotdata.push( record )
       }
       feature.properties["plotdata"] = plotdata; 
   }
    return dimensionDiv
}

function plot(feature,diffs){

    let plotDiv=false;
    //let plotdata;
    //let layout;
    let plotdata = getChanges( diffs, ['circumference','height']);
    
    if(plotdata){
    
	let c=0;
	let h=0;

	for(let i=0;i<plotdata.length;i++){
	    let record=plotdata[i];
	    if(record.circumference)c++;
	    if(record.height)h++;
	}

	if(h>=2 || c>=2){
	    plotDiv = document.createElement('div');
	    plotDiv.setAttribute("id","plotdiv");
	    plotDiv.setAttribute('style','width:400px;height:300px;background-color:lightgrey');
	}
    }
    return plotDiv;
}

function backlink(feature){
    
    const tags = feature.properties.tags;
    const id = feature.properties.id;
    const backlink = feature.properties.backlink;
    
    let backlinkDiv = false;
    
    let txt;
    
    if(backlink){
	backlinkDiv = document.createElement('div');
	txt='<table><tr style="background:lightgrey"><th>Ort</th><th>Gebiet</th><th>Vermehrungstyp</th><th>Planzjahr</th></tr>';
        for(let i=0;i<backlink.length;i++){
            t=backlink[i].properties.tags
            let ort=t["addr:full"].split(',')[0];
            let gebiet=t["speierlingproject:gebiet"];
            let start_date=t.start_date;
            let propagation=t.propagation

            let typ;
	    let style;
            if(i%2==0){
                style=' style="background:white" '
            }else{
                style=''
            }
	    let color;
	    if(propagation=="graft"){
		typ='Reiser';
		color="orange"
	    }else{
		typ='Samen';
		color="red"
	    }             
            txt+='<tr '+style+' ><td>'+ort+'</td><td>'+gebiet+'</td><td style="color:'+color+'">'+typ+'</td><td>'+start_date+'</td></tr>'
        }
	backlinkDiv.innerHTML=txt+'</table></br>';
    }
    return backlinkDiv
    
}

function plotDim(feature,diffs){
//function plotDim(feature){

    //let plotdata=feature.properties.plotdata;
    let plotdata=getChanges(diffs, ['circumference','height']);
    
    var umfang = {
	x: [],
	y: [],
	yaxis: 'y',
	name: 'Umfang',
	type: 'scatter'
    };

    var hoehe = {
	x: [],
	y: [],
	name: 'Höhe',
	yaxis: 'y',
	type: 'scatter'
    };
    

    //let cMax=-200
    //let hMax=-200;
    
    for(let i=0;i<plotdata.length;i++){
	let record=plotdata[i];
	//let x=decimalYear(record.timestamp);
	let date=record.timestamp; 
	if(record.circumference){
	    //if(record.circumference>cMax)cMax=record.circumference;
	    umfang.x.push(date);
	    umfang.y.push(record.circumference.toString())
	}
	if(record.height){
	    //if(record.height>hMax)hMax=record.height;
	    hoehe.x.push(date);
	    hoehe.y.push(record.height.toString())
	}
    }    
    
 
    let umfangAxis= {
	rangemode: 'tozero',
	autorange: true,
	showgrid: true,
	//gridcolor: 'lightgrey',
	ticks: 'inside',
	
	//range: [0.0,cMax],
	//side: 'left',
	title: { text: 'Umfang [m]' }	
    }

    let hoeheAxis= {
	rangemode: 'tozero',
	autorange: true,
	//gridcolor: 'lightgrey',
	showgrid: true,
	ticks: 'inside',
	//range: [0.0,cMax],
	//side: 'left',
	//linecolor: 'green',
	title: { text: 'Höhe [m]' }	
    }


    let hoeheRechtsAxis = {
	rangemode: 'tozero',
	gridcolor: 'lightgrey',
	showgrid: false,
	//autorange: true,
	//range: [0.0,hMax],
	ticks: 'inside',
	title: { text: 'Höhe [m]'},        //, font: {color: 'red'} },
	//tickfont: {color: 'red'},
	overlaying: 'y',
	side: 'right'
    }
    
    let data;
    let layout = {
	paper_bgcolor: '#eeeeee',
	plot_bgcolor: 'white',
	font: { size: 10 },
	//modebar: { remove: ["lasso","zoom","pan","boxselect","zoomin","zoomout","autoscale","reset" ] },
	showlegend: true,
	margin: { b:30, l:40, r:40, t:40 },
	title: {text: 'Wachstum'},
   
	
	xaxis: { title: { text: 'Datum' }, type: 'date', ticks: 'inside' },
    };

    let plotU = (umfang.x.length >= 2);
    let plotH = (hoehe.x.length >= 2);

    if(plotU && !plotH){
	data = [ umfang ];
	layout['yaxis']=umfangAxis;
	layout.title.text="Umfang";
	layout.showlegend=false;
    }
    if(plotH && !plotU){
	data = [ hoehe ]
	layout['yaxis']=hoeheAxis;
	layout.showlegend=false;
	layout.title.text="Höhe"
    }

    if(plotU && plotH){
	hoehe.yaxis= 'y2';
	hoehe.showgrid=false;
	umfang.showgrid=false;
        layout['yaxis']=umfangAxis;
	layout['yaxis2']=hoeheRechtsAxis;
	layout.title.text="Umfang und Höhe"
	data= [ umfang, hoehe ];
    }
    
    //var data = [trace1, trace2];
    //console.log(data,layout)
    let options = {staticPlot: true, displaylogo: false }
    //console.log(data);
    Plotly.newPlot('plotdiv', data, layout, options);

}

function tabs(contentElm, feature, diffs){

    let tabsElm= document.createElement('div');
    //tabsElm.setAttribute('style','min-height:200px');
    contentElm.appendChild(tabsElm);

    let tabulator = new Tabulator(tabsElm);

    tabulator.addTab(backlink(feature), '<b>Kinder</b>');
    
    let plotElm = plot(feature,diffs);
    if(plotElm){
	tabulator.addTab(plotElm,'<b>Plot</b>');
	plotDim(feature,diffs);
    }

    tabulator.addTab( dimension(feature,diffs), '<b>Wachstum</b>');
        
    tabulator.addTab(projekt(feature), '<b>Projekt</b>');

    if(devMode)tabulator.addTab(notes(feature, diffs), '<b>Notizen</b>');

    tabulator.openFirstTab();

}

