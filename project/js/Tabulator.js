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
