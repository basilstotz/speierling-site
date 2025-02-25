
// https://gis.stackexchange.com/questions/330608/leaflet-marker-popup-link-from-outside-of-map-dynamically

class Tabulator {
    constructor(parent){
        this.parent = parent;
        this.tabulator = document.createElement('div');
        this.tabulator.setAttribute('class','tab');
        this.tabcontent = [];
        this.tablink = [];
        parent.appendChild(this.tabulator);
    }

    addTab(content,text){
        if(content){
            let tab = document.createElement('div');
            tab.className="tabcontent";
            tab.setAttribute("style","display:none");

            tab.appendChild(content);
            
            this.tabcontent.push(tab);
            this.parent.appendChild(tab);

            let index = this.tabcontent.length-1;
            let button = document.createElement('button');
            button.className = 'tablinks';
            button.innerHTML=text;
            button.addEventListener('click', (event) => { this.openTab(event,index)});

            this.tablink.push(button);
            this.tabulator.appendChild(button);
            return tab
        }else{
            return false
        }
    }

    openFirstTab(){
        if(this.tablink[0])this.tablink[0].click();
    }
    
    openTab(evt,index){
        for (let i = 0; i < this.tabcontent.length; i++) {
            if(index==i){
                this.tabcontent[i].style.display = "block";
                this.tablink[i].className += " active"
                //evt.currentTarget.className += " active";
            }else{
                this.tabcontent[i].style.display = "none";
                this.tablink[i].className = this.tablink[i].className.replace(" active", "");
            }
        }
    }
        
    
} // end class


///////////////////////////////////////popup////////////////////////////////////////

function dateNowISO(){
   return new Date().toISOString(); 
}

function decimalYear(dateString){
    let date = new Date(dateString);
    let zeit=date.getFullYear()+(1.0/12.0)*date.getMonth()+(1.0/365.0)*date.getDate();
    return Math.round(zeit*1000)/1000.0
}

function year(dateString){
    return dateString.slice(0,4)
}

function dateToString(dateString){

    let monthName = [ "Januar", "Februar", "März", "April","Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember" ];

    let date = new Date(dateString);
    let year= date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();

    return monthName[month]+' '+year;
}

////////////////////////////////////////////////////////////////////////////////////

class DiffHistory {

    constructor(){
	this.diffs = [];
	this.feature = {};
    }

    setFromHistory(feature,history){

        this.feature = feature;
	
        // fill in diffhistory here
	
	this.filterOutdated();
	this.prependHistoric();
	
	return this.diffs
    }

    setFromDiffHistory(feature,diffs){

	this.feature = feature;
        this.diffs = diffs;
	this.diffs = this.filterOutdated(this.feature);
	this.diffs = this.prependHistoric(this.feature);
	
	return this.diffs
    }


    get(list=[]){

	let diffs=[];

	// do it here
	
	return diffs
    }

    
    //privat
    prependHistoric(feature){
	
    }

    //privat
    filterOutdated(feature){

    }

}


function diffHistory(history){

    let id=history[0].id;

    function clean(text){
	let trimmed=text.toString();
	let cleaned=trimmed.replace(/ /g, "");
	return cleaned;
    }
    
    //set  all oldValues to ''
    let diffs=[];                                 
    let oldValues={};
    for(let i=0;i<history.length;i++){
        //console.log(history[i]);
        let tags=history[i].tags;
        if(tags){
            Object.entries(tags).forEach( ([key,value]) => {
                oldValues[key]="";
            });
        }
    }
    
    //get diffs
    for(let i=0;i<history.length;i++){
        
        let tags=history[i].tags;
        let timestamp=history[i].timestamp
        let version=history[i].version;
        
        
        let diffValues={};
        diffValues["timestamp"]=timestamp;
        diffValues["version"]=version;
        // tag loop
        let changed=false;
        if(tags){
            Object.entries(tags).forEach( ([key,newVal]) => {
                if(clean(newVal)!=clean(oldValues[key])){
                    changed=true;
                    oldValues[key]=newVal;
                    diffValues[key]=newVal;
                }
            })
        }
        if(changed){
            //line[timestamp]=diffValues
            diffs.push(diffValues)
        }
    }
    return diffs;
}


function addHistoricToDiffHistory(feature,diffHistory){
    //get historic circumference to tmp
    let tmp = [];

    let tags=feature.properties.tags
    Object.entries(tags).forEach( ([key,value]) => {
	if(key.startsWith('circumference:historic:')){
	    let timestamp = key.split(':')[2]+'-01-01T00:00:00Z';
	    tmp.push(  {timestamp: timestamp, circumference: value.toString()}   );
	}
    })

    //merge data
    let b; //der letzte recors von historic
    if(tmp.length>0)b = tmp[tmp.length-1];

    //dim = getChanges(diffHistory,['circumference']);
    
    for(let i=0;i<diffHistory.length;i++){
	let d=diffHistory[i];

	if(i==0){
	    if(b && b.circumference){
		if(d.circumference){
		    // should probably allmost never happen!
		    if( b.circumference == d.circumference  ){ delete d.circumference }
		}
	    }
	}
	tmp.push(d)
    };
    return tmp
}


function filterOutdatedDiffHistory(feature, diffHistory){       
    // filter line older than start_date of (the dead) tree
    let tmp =[];

    let startDate;
    if(feature.properties.tags.start_date){
	startDate = feature.properties.tags.start_date
    }else{
	startDate = "1000-01-01"
    }
    //dim = [];
    let oldLine = {};
    let firstLine = true;
    for(let i=0;i<diffHistory.length;i++){
	let line = diffHistory[i];
	if(line.timestamp.slice(0,4)>=startDate.slice(0,4)){
	    // fix existing values, which did not change, with the latest value from the filtered lines
	    if(firstLine){
		if(!line.circumference && oldLine.circumference){
		    line.circumference = oldLine.circumference;
		}
		if(!line.height && oldLine.height){
		    line.height = oldLine.height;
		}
		firstLine = false
	    }
	    tmp.push(line)
	}else{
	    if(line.circumference)oldLine.circumference = line.circumference;
	    if(line.height)oldLine.height = line.height;
	}
    } // end filter
    return tmp
}

function processDiffHistory(feature,diffs){
    if(diffs){
	if(feature.properties.historynew){
	    return diffs
	}else{
	    let stageone= filterOutdatedDiffHistory(feature, diffs);
	    return addHistoricToDiffHistory(feature,stageone)
	}
    }   
}

function getChanges(distory,keys){
    let out=[];
    for(let i=0;i<distory.length;i++){

        let line={};
        let dasda=distory[i];

        let first=true;
        for(let j=0;j<keys.length;j++){
            let key=keys[j];
            if(dasda[key]){
               if(first){
                   first=false;
                   line["timestamp"]=dasda["timestamp"];
               }
               line[key]=dasda[key];
            }
        }
        if(!first)out.push(line)
    }
    return out;
}


function calcGroth(feature){

    let tags=feature.properties.tags;
    let startDate;
    
    if(feature.properties.history){
	let history = feature.properties.history;
	let diffs = processDiffHistory(feature,history);
	
	dim = getChanges(diffs, ["circumference"]);
	if(dim.length>=2){
	    let erster = dim[0];
	    let letzter = dim[dim.length-1];
	    let dauer = decimalYear(letzter.timestamp)-decimalYear(erster.timestamp);
	    let zuwachs = letzter.circumference - erster.circumference;
	    let relativeZuwachs= zuwachs / letzter.circumference;
	    if( relativeZuwachs>0.1 || dauer > 5.0 ){
		let estimatedGroth=Math.round( (1000.0*zuwachs)/dauer )/10.0;
		let estimatedAge = 100.0*letzter.circumference / estimatedGroth;
		let estimatedStartDate = Math.round( decimalYear(letzter.timestamp)-estimatedAge)+'-01-01';
		tags['start_date:estimated']=estimatedStartDate;
		if(estimatedGroth<5.0&&estimatedGroth>0.0)tags['circumference:groth']=estimatedGroth;
	    }
	}

	if(tags.start_date && dim.length>=1){
	    let letzter = dim[dim.length-1];
	    let dauer = ( decimalYear(letzter.timestamp)-decimalYear(tags.start_date) ) +2.0;
	    let zuwachs = letzter.circumference;
	    let groth= zuwachs/dauer;
	    if(groth<0.05)tags['circumference:groth']=Math.round( (1000.0*groth ))/10.0;
	}

	
	dim = getChanges(diffs, ["height"]);
	if(dim.length>=2){
	    let erster = dim[0];
	    let letzter = dim[dim.length-1];
	    startDate=erster.timestamp;
	    let dauer = decimalYear(letzter.timestamp)-decimalYear(erster.timestamp);
	    let zuwachs = letzter.height - erster.height;
	    let relativeZuwachs= zuwachs / letzter.height;
	    if( relativeZuwachs>0.1 || dauer > 1.0 ){
		let estimatedGroth=Math.round( (10.0*zuwachs)/dauer )/10.0;
		if(estimatedGroth<2.0&&estimatedGroth>0.0)tags['height:groth']=estimatedGroth;
	    }
	}else if(tags.start_date && dim.length>=1){
	    let letzter = dim[dim.length-1];
	    let dauer = ( decimalYear(letzter.timestamp)-decimalYear(tags.start_date) ) +2.0;
	    let zuwachs = letzter.height;
	    let groth= zuwachs/dauer;
	    tags['height:groth']=Math.round( (10.0*groth ))/10.0;
	}


    }

}
