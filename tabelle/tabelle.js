
class Tabelle {

    constructor(parentId,records,columns,header){

        this.parentId = parentId;
	this.records = records;

	if(columns){
	    this.columns=columns
	}else{
	    let cols=[];
	    let cList=[];
	    for(const record of records){
		for(const key of Object.keys(record)){
                    if(!cList.includes(key)){
			cList.push(key);
			let title = key.toLowerCase();
			//title[0]=title[0].toUpperCase();
			cols.push(
			    { field: key,
			      title: title,
			      sorter: false,
			      headerFilter: false
			    });
		    }
		}
	    }
	    this.columns=cols	    
	};

	if(header){
	    this.status=header
	}else{
	    this.status={}
	};
	
	this.options = { filters: {}, sorter: {} };
	this.aspect = records;
	
	this.noArrow = '&#x2B1A;';
	this.upArrow = '&#x1F845;';
	this.downArrow = '&#x1F847;';

	this.headRows = [];
	
	this.thead;
	this.tbody;
	this.tfoot;

	this.timeout;

	this.tableMain(this.parentId,this.records,this.columns)

    };

    tableMain(parentId,records,columns){

	let tabelle=document.createElement('table');
	//tabelle.setAttribute("style","margin:auto;background-color:lightgrey");

	this.thead=document.createElement('thead');
	tabelle.appendChild(this.thead);
	
	//this.tableHeader(this.thead,columns);

	if(!this.status.noTable){
	    this.tbody=document.createElement('tbody');
	    tabelle.appendChild(this.tbody)
	}
	//this.tableBody(this.tbody,this.aspect);

	let parentElm=document.getElementById(parentId);
	parentElm.appendChild(tabelle);

	this.updateTable();
    };

    updateTable(){
	this.doFilter(this.records,this.options.filters);
	this.sort(this.aspect,this.options.sorter);
	if(!this.status.noTable)this.tableBody(this.tbody,this.aspect)
	this.tableHeader(this.thead,this.columns);
    }
        
    //only called by getAspect()
    sort(records,sorter){

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
    };


    //only called by getAspect()
    doFilter(records,filters){

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
	this.aspect = out;
	return out;
    };

    
    updateFilter(event,key){

	let options=this.options;
	let v=event.target.value.toLowerCase();
	if(options.filters[key] && v==''){
	    delete options.filters[key]
	}else{
	    options.filters[key]=v;
	}
	if(this.timeout)clearTimeout(this.timeout);
	this.timeout = setTimeout( () => { this.updateTable() } , 1000 )
    };


    keyInfo(key){
	for(const col of this.columns){
	    if(col.field==key){ return col; }
	}
    }


    updateSorter(event,key){

	let sortType=this.keyInfo(key).sorter;

	let sorter=this.options.sorter;

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

	this.updateTable();
    }


    tableHeader(theadElm,columns){

	let hasMembers;
	let tr;

	let status = this.status;

	//status
        hasMembers=false;
	if(!this.headRows.includes('status')){
	    tr=document.createElement('tr')
	    let count=0;
	    for(const item of columns){
		if(!item.hidden){
		    count++
		}
	    }
	    let th=document.createElement('th');
	    th.setAttribute("colspan",count);
	    tr.appendChild(th);

	    if(status.status.counter){
		hasMembers=true;
		let counter = document.createElement('div');
		counter.setAttribute('style','float:left');
		let span = document.createElement('span');
		span.setAttribute('id','counter');
		span.innerHTML=this.aspect.length+' '+status.status.counter
		counter.appendChild(span);
                th.appendChild(counter);
	    }

	    if(status.status.title){
		hasMembers=true;
		let title =document.createElement('span');
		title.setAttribute('id','title');
		title.innerHTML=status.title;
		th.appendChild(title);
	    }

	    if(status.status.download){
		hasMembers=true;
		let download = document.createElement('div');
		download.setAttribute('style','float:right');
		let button = document.createElement('button');
		button.setAttribute('id','button');
		button.addEventListener('click', (event) => { this.downloadCSV() });
		button.innerHTML=status.status.download;
		download.appendChild(button);
		th.appendChild(download);
	    }

	    if(hasMembers)theadElm.appendChild(tr);
	    this.headRows.push('status');
	}else{
	    let count = document.getElementById('counter');
	    if(count)count.innerHTML=this.aspect.length+' '+status.status.counter;
	}


	//titel
	if(!this.headRows.includes('title') && !this.status.noNames ){
	    tr=document.createElement('tr')
	    for(const item of columns){
		if(!item.hidden){
		    let th=document.createElement('th');
		    th.innerHTML=item.title
		    tr.appendChild(th);
		}
	    }
	    this.headRows.push('title');
	    theadElm.appendChild(tr);
	};

	//search
	if(!this.headRows.includes('search')){
	    tr=document.createElement('tr')
	    hasMembers=false;
	    for(const item of columns){
		if(!item.hidden){
		     let th=document.createElement('th');
		     if(item.headerFilter){
			 hasMembers=true;
			 let input=document.createElement('input');
			 input.addEventListener( 'input', (event) => { this.updateFilter(event,item.field) });
			 th.appendChild(input);
		     }
		    tr.appendChild(th);
		}
	    }
	    if(hasMembers){
		this.headRows.push('search');
		theadElm.appendChild(tr);
	    }
	};

	//sort
	if(!this.headRows.includes('sort')){
	    tr=document.createElement('tr');
	    hasMembers=false;
	    for(const item of columns){
		if(!item.hidden){
		    let th=document.createElement('th');
		    if(item.sorter!=''){
			hasMembers=true;
			th.setAttribute('id',item.field);
			th.addEventListener( 'click', (event) => { this.updateSorter(event,item.field) });
			th.innerHTML=this.noArrow;
		    }
		    tr.appendChild(th);
		}
	    }
	    if(hasMembers){
		this.headRows.push('sort');
		theadElm.appendChild(tr);
	    }
	}else{
	    for(const item of columns){
		if(!item.hidden){
		    let th=document.getElementById(item.field);

		    let sorter=this.options.sorter;
		    if(th){
			if(sorter['key'] && sorter['key']==item.field){
			    let v;
			    switch(sorter['order']){
			    case 'null':
				v=this.noArrow
				break;
			    case 'asc':
				v=this.upArrow;
				break;
			    case 'desc':
				v=this.downArrow;
				break;
			    }

			    th.innerHTML=v;
			}else{
			    th.innerHTML=this.noArrow;
			}
		    }
		}
	    }
	}
    };


    tableBody(tbodyElm, records){

	tbodyElm.innerHTML='';
	for(let i=0;i<records.length;i++){
	    let record=records[i];
	    let tr = document.createElement('tr')

	    let item;
	    for(const col of this.columns){
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
		    tr.appendChild(td);

		    tbodyElm.appendChild(tr);
		}
	    }
	}
    }


    downloadCSV(){
	let filename='speierling';
	for(let value of Object.values(this.options.filters)){
	    filename += '-'+value;
	}
	filename += '.csv'
	let text=this.toCSV(this.aspect,this.columns)
	this.downloadText(filename, text, 'text/csv')
    }


    toCSV(records,columns){
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


    downloadText(filename, text, mime) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:'+mime+';charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
    }
    
}
