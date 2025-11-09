
let records;
let aspect;

let tbody;
let thead;

let timeout;

let options={ filter: {}, sorter: {} };

let theadRows=[];

//let noArrow = '&#x2BC1;';
let noArrow = '&#x2B1A;';
let upArrow = '&#x1F845;';
let downArrow = '&#x1F847;';

function propagation(elm,inhalt){
    let color;
    switch(inhalt){
    case 'natural':
	color='mediumseagreen';
	break;
    case 'sucker':
	color='yellow';
	break;
    case 'planted':
	color='dodgerblue';
	break;
    case 'seed':
	color='tomato'
	break;
    case 'graft':
	color='orange'
	break;
    default:
	//color='lightgrey'
	break;
    }
    if(color)elm.setAttribute('style','background-color:'+color);
}

function umfang(elm,inhalt){
    let bhu=parseFloat(inhalt);
    let field=document.createElement('div');
    field.setAttribute('style','height:100%;width:'+Math.round(50*bhu)+'px;background-color:green;opacity:0.5;position:relative;top:0px;left:0px');
    elm.appendChild(field);

}

let columns = [
    {title:"Land", field:"addr:country", sorter:"string",headerFilter:true },
    {title:"Kanton", field:"addr:state", sorter:"string",headerFilter:true },
    {title:"Gemeinde", field:"addr:gemeinde", sorter:"string", headerFilter:true  },
    {title:"Gebiet", field:"speierlingproject:gebiet", sorter:"string", headerFilter:true },
    {title:"Vermehrungstyp", field:"propagation", styleFunc: propagation, sorter:"string", headerFilter:true },
    {title:"Datum", field:"start_date", sorter:"numeric",headerFilter:false   },
    {title:"Umfang", field:"circumference", sorter:"numeric",headerFilter:false  },
    {title:"Höhe", field:"height", sorter:"numeric", headerFilter:false  },
    
    {title:"Lat", field:"lat", hidden:true  },
    {title:"Lon", field:"lon", hidden:true  },
    {title:"Openstreetmap", field:"openstreetmap", hidden:true  }
];


function keyInfo(key){
    for(const col of columns){
	if(col.field==key){ return col; }
    }
}
	
/*
function onBody(){

    toHome();
    records=[];
    
    fetch('sorbusdomestica.geojson')
    .then((resp) => resp.json())
	.then(function(data) {
	    let features=data.features;
	  
            for(const feature of features){
		let tags=feature.properties.tags
		let coordinates=feature.geometry.coordinates;
		let link='https://openstreetmap.org/'+feature.id;
		tags['openstreetmap']=link;
		tags['lat']=coordinates[1];
		tags['lon']=coordinates[0];
		records.push(tags);
	    }
	    tableMain('tabelle',records,columns);     
    })
    .catch(function(error) {
      console.log(error);
    });
}
*/

function tableMain(parentId,records,columns){

    let tabelle=document.createElement('table');
    tabelle.setAttribute("style","margin:auto;background-color:lightgrey");

    aspect=records;
    
    thead=document.createElement('thead');
    tabelle.appendChild(thead);
    tableHeader(thead,columns);

    tbody=document.createElement('tbody');
    tabelle.appendChild(tbody)
    tableBody(tbody,aspect);
    
    let parentElm=document.getElementById(parentId);
    parentElm.appendChild(tabelle);
}


function getAspect(records,options){
    let out=doFilter(records,options.filter);
    sort(out,options.sorter);
    return out;
}

//only called by getAspect()
function sort(records,sorter){

    let key=sorter.key;
    let value=sorter.order;
    
    function func(a,b){
	let ans;
	let x,y;
	if(a[key] && b[key]){
	    if(sorter.type=='string'){
	        x=a[key].toLowerCase();
		y=b[key].toLowerCase();
	    }else if(sorter.type=='numeric'){
		x=parseFloat(a[key]);
		y=parseFloat(b[key]);
	    }
	    if(x<y)ans = -1;
	    if(x>y)ans = 1;
	    if(value=='desc')ans*=-1;
	    return ans;
	} else if(a[key]){
	    return -1;
	}else if(b[key]){
	    return 1
	}
    }

    if(value!='null')records.sort(func);
    
}


//only called by getAspect()
function doFilter(records,filters){

    let out=[];
    
    for(let i=0;i<records.length;i++){

	let ans=true
	let record=records[i];

	for(const [key,value] of Object.entries(filters)){
	    if(ans===true){
		if(record[key]){
		    let inhalt=record[key].toLowerCase();
		    if(!value || value==''){
			//ans= true
		    }else if(inhalt.includes(value)){
			//ans=true
		    }else{
			ans=false;
		    }
		}else{
		    ans=false;
		}
	    }
	}
	if(ans===true)out.push(record);	
    }
    return out;
}


function clone(x){
    return JSON.parse(JSON.stringify(x));
}


function updateFilter(event,key){

    let filters=options.filter;
    
    let v=event.target.value.toLowerCase();
    if(filters[key] && v==''){
	delete filters[key]
    }else{
	filters[key]=v;
    }
    
    if(timeout)clearTimeout(timeout);
    timeout = setTimeout( () => {
	aspect=getAspect(records,options);
	tableBody(tbody,aspect)
	tableHeader(thead,columns);

    } , 1000 )
}

function updateSorter(event,key){

    let sortType=keyInfo(key).sorter;

    let sorter=options.sorter;
    
    if(sorter['key']){
	if(sorter['key']==key){
	    switch(sorter['order']){
	    case 'null':
		sorter['order']='asc'
		break;
	    case 'asc':
		sorter['order']='desc';
		break;
	    case 'desc':
		//default:
		//sorter={}
		delete sorter['key']
		delete sorter['order']
		delete sorter['type']
		//sorter['order']='null'
		break;
	    }
	}else{
	    sorter['key']=key;
	    sorter['order']='asc';
	    sorter['type']=sortType;
	}
    }else{
	sorter['key']=key
	sorter['order']='asc';
	sorter['type']=sortType;
    }
				  
    tableHeader(thead,columns);
    aspect=getAspect(records,options);
    tableBody(tbody,aspect);

}

function tableHeader(theadElm,columns){

    let hasMembers;
    let tr;

    
    let inhalt='<div style="float:left"><span style="font-size:24px">&nbsp;&nbsp;'+aspect.length+' Speierlinge</span></div>'+
  '<div style="float:right;margin-top:3px"><button  onclick="downloadCSV()">Aktuelle Ansicht als CSV-Datei herunterladen</button></div>';
   
    //let num=0;
    //if(aspect)num=aspect.length;
    /*
       let inhalt='<span style="font-size:24px;color:white;text-align:left" id="count">'+aspect.length+' Speierlinge</span>'+
  '<button  onclick="downloadCSV()">Aktuelle Ansicht als CSV-Datei herunterladen</button>';
*/
    
   // let inhalt='fgdfgsdfg';

    //status
    if(!theadRows.includes('status')){
	tr=document.createElement('tr')
	let count=0;
	for(const item of columns){
	    if(!item.hidden){
		count++
	    }
	}
	let th=document.createElement('td');
	th.setAttribute("colspan",count);
	th.setAttribute("id","status");
	
	th.innerHTML=inhalt;
	tr.appendChild(th);
	theadRows.push('status');
	theadElm.appendChild(tr);
    }else{
	document.getElementById('status').innerHTML=inhalt;
    }
        

    
    //titel
    if(!theadRows.includes('title')){
	tr=document.createElement('tr')
	for(const item of columns){
	    if(!item.hidden){
		let th=document.createElement('th');
		th.innerHTML=item.title
		tr.appendChild(th);
	    }
	}
	theadRows.push('title');
	theadElm.appendChild(tr);
    }
    
    //search
    if(!theadRows.includes('search')){
	tr=document.createElement('tr')
	hasMembers=false;
	for(const item of columns){
	    if(!item.hidden){
		 let th=document.createElement('th');
		 if(item.headerFilter){
		     hasMembers=true;
		     let input=document.createElement('input');
		     input.addEventListener( 'input', (event) => { updateFilter(event,item.field) });
		     th.appendChild(input);
		 }
		tr.appendChild(th);
	    }
	}
	if(hasMembers){
	    theadRows.push('search');
	    theadElm.appendChild(tr);
	}
    }

    //sort
    if(!theadRows.includes('sort')){
	tr=document.createElement('tr');
	hasMembers=false;
	for(const item of columns){
	    if(!item.hidden){
		let th=document.createElement('th');
		if(item.sorter!=''){
		    hasMembers=true;
		    th.setAttribute('id',item.field);
		    th.addEventListener( 'click', (event) => { updateSorter(event,item.field) });
		    th.innerHTML=noArrow;
		}
		tr.appendChild(th);
	    }
	}
	if(hasMembers){
	    theadRows.push('sort');
	    theadElm.appendChild(tr);
	}
    }else{
	for(const item of columns){
	    if(!item.hidden){
		let th=document.getElementById(item.field);

		let sorter=options.sorter;
		if(th){
		    if(sorter['key'] && sorter['key']==item.field){
			let v; //='&#x2BC0;'
			switch(sorter['order']){
			case 'null':
			    v=noArrow
			    break;
			case 'asc':
			    v=upArrow;
			    break;
			case 'desc':
			    v=downArrow;
			    break;
			}

			th.innerHTML=v;
		    }else{
			th.innerHTML=noArrow;
		    }
		}
	    }
	}
    }
}

function tableBody(tbodyElm, records){
    let disp=document.getElementById('disp');
    disp.innerHTML='';
    let start= new Date().getTime();
    //document.getElementById('count').innerHTML=records.length+' Speierlinge';
    //let count=7;
    
    tbodyElm.innerHTML='';
    for(let i=0;i<records.length;i++){
	let record=records[i];
	let row=document.createElement('tr')
	//let cont='';
	let item;
	for(const col of columns){
	    if(!col.hidden){
		let key=col.field;
		if(record[key]){
		    item=record[key]
		}else{
		    item=''
		}
		let td=document.createElement('td');
		td.innerHTML=item
		if(col.styleFunc)col.styleFunc(td,item);
		row.appendChild(td);
	    
	        //row.innerHTML=cont;
	        tbodyElm.appendChild(row);
	    }
	}
    }
    
    let stop= new Date().getTime();
    if(devMode)disp.innerHTML='&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+(stop-start)+' ms '+JSON.stringify(options);
}




function downloadCSV(){
    download(aspect,columns);
}


function  download(records,columns){
    
    let filename='speierling';
    for(let value of Object.values(options.filter)){
	filename += '-'+value;
    }
    filename += '.csv'

    let text=toCSV(records,columns)

    downloadText(filename,text)
}



function toCSV(records,colums){
    let csv='';

    for(let i=0;i<columns.length;i++){
	let title=columns[i].title;
	if(i>0)csv += ',';
	csv += '"'+title+'"';
    }
    csv += '\n';
    
    
    for(let i=0;i<records.length;i++){
	let record=records[i];
	    for(let i=0;i<columns.length;i++){
		if(i>0)csv += ',';

		let key=columns[i].field;
		let value;
		if(record[key]){
		    value=record[key]
		}else{
		    value=''
		}
		csv += '"'+value+'"';
	    }
	    csv += '\n';
    }
    return csv;
}

function downloadText(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
//oder ?
/*
function appendDownloadableText(filename, string) {
    const data = new Blob([string]);
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.textContent = filename;
    document.body.appendChild(a);
}
*/
