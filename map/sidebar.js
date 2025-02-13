
function sidebar_open(){
    let d=document.getElementById("mySidebar").style; d.right="0px";
    let b=document.getElementById("button").style; b.display="none";
}

function sidebar_close(){
    let d=document.getElementById("mySidebar").style; d.right="-300px";
    let b=document.getElementById("button").style; b.display="block";
}

function sidebar_content(){

    fetch(url)
	    .then((resp) => resp.text())
	    .then(function(data) {
		document.getElementById("mySidebar").innerHTML(data);  
	    })
	    .catch(function(error) {
		console.log(error);	    
	    });

}
    

    
    


