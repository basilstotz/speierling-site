
function unique(eingang) {
    
    eingang.sort();
    let ausgang=[];
    let last='';
    for(let i=0;i<eingang.length;i++){
	if(last!=eingang[i]){
	    last=eingang[i];
	    ausgang.push(last);
	}
    }
    return ausgang;
}

// https://www.w3schools.com/howto/howto_js_autocomplete.asp    
function autocomplete(globalGeo, inp, arr) {
    
      /*the autocomplete function takes two arguments,
      the text field element and an array of possible autocompleted values:*/
      var currentFocus;
      /*execute a function when someone writes in the text field:*/
      inp.addEventListener("input", function(e) {
	  var a, b, i, val = this.value;
	  /*close any already open lists of autocompleted values*/
	  closeAllLists();
	  if (!val) { return false;}
	  currentFocus = -1;
	  /*create a DIV element that will contain the items (values):*/
	  a = document.createElement("DIV");
	  a.setAttribute("id", this.id + "autocomplete-list");
	  a.setAttribute("class", "autocomplete-items");
	  /*append the DIV element as a child of the autocomplete container:*/
	  this.parentNode.appendChild(a);
	  /*for each item in the array...*/
          //let array=[];
	  let search=val.toUpperCase();

	  let carry=false;
	  //filter gemeinde
	  let gemeinde=[];
	  for(let i=0;i<arr.length;i++){
	      let items=arr[i].split(',')
	      if( items[0].trim()==items[1].trim() )
		  carry=true;
	      let item=items[0].toUpperCase();
	      if(item.includes(search))gemeinde.push(arr[i]);
	  }
	  //filter kanton
	  let kanton=[];
          if( (gemeinde.length==0) || carry){
	      for(let i=0;i<arr.length;i++){
		 let items=arr[i].split(',')
		  let item=items[1].toUpperCase();
		  let newItem=items.toSpliced(0,1).join(', ');
		 if(item.includes(search))kanton.push(newItem);
	      }
	  }
          kanton=unique(kanton)
	  //filter land
	  let land=[];
          if(kanton.length==0){
	      for(let i=0;i<arr.length;i++){
		 let items=arr[i].split(',')
		 let item=items[2].toUpperCase();
		  let newItem=items.toSpliced(0,2).join(', ');
		 if(item.includes(search))land.push(newItem);
	      }
	  }
	  land=unique(land);
	  
	  let array=gemeinde.concat(kanton,land)
	  
	  for(let i=0;i<array.length;i++){
	      let item=array[i].toUpperCase();
	      //if(item.includes(search)){
	    //if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
	      /*create a DIV element for each matching element:*/
	      b = document.createElement("DIV");

		  /*make the matching letters bold:*/
		  let start=item.indexOf(search);
		  let stop=start+search.length;
		  b.innerHTML=array[i].substr(0,start);
		  b.innerHTML += "<strong>" + array[i].substr(start,search.length) + "</strong>";
	      b.innerHTML += array[i].substr(stop);
		  //b.innerHTML=arr[i];
		/*insert a input field that will hold the current array item's value:*/
	      b.innerHTML += "<input type='hidden' value='" + array[i] + "'>";
	      /*execute a function when someone clicks on the item value (DIV element):*/
		  b.addEventListener("click", function(e) {
		      /*insert the value for the autocomplete text field:*/
		      inp.value = this.getElementsByTagName("input")[0].value;
		      searchDisplay(globalGeo);
		  /*close the list of autocompleted values,
		  (or any other open lists of autocompleted values:*/
		  closeAllLists();
	      });
	      a.appendChild(b);
	    //}
	  }
      });
      /*execute a function presses a key on the keyboard:*/
      inp.addEventListener("keydown", function(e) {
	  var x = document.getElementById(this.id + "autocomplete-list");
	  if (x) x = x.getElementsByTagName("div");
	  if (e.keyCode == 40) {
	    /*If the arrow DOWN key is pressed,
	    increase the currentFocus variable:*/
	    currentFocus++;
	    /*and and make the current item more visible:*/
	    addActive(x);
	  } else if (e.keyCode == 38) { //up
	    /*If the arrow UP key is pressed,
	    decrease the currentFocus variable:*/
	    currentFocus--;
	    /*and and make the current item more visible:*/
	    addActive(x);
	  } else if (e.keyCode == 13) {
	    /*If the ENTER key is pressed, prevent the form from being submitted,*/
	    e.preventDefault();
	    if (currentFocus > -1) {
	      /*and simulate a click on the "active" item:*/
	      if (x) x[currentFocus].click();
	    }
	  }
      });
      function addActive(x) {
	/*a function to classify an item as "active":*/
	if (!x) return false;
	/*start by removing the "active" class on all items:*/
	removeActive(x);
	if (currentFocus >= x.length) currentFocus = 0;
	if (currentFocus < 0) currentFocus = (x.length - 1);
	/*add class "autocomplete-active":*/
	x[currentFocus].classList.add("autocomplete-active");
      }
      function removeActive(x) {
	/*a function to remove the "active" class from all autocomplete items:*/
	for (var i = 0; i < x.length; i++) {
	  x[i].classList.remove("autocomplete-active");
	}
      }
      function closeAllLists(elmnt) {
	/*close all autocomplete lists in the document,
	  except the one passed as an argument:*/
	  //inp.blur();
	var x = document.getElementsByClassName("autocomplete-items");
	for (var i = 0; i < x.length; i++) {
	  if (elmnt != x[i] && elmnt != inp) {
	  x[i].parentNode.removeChild(x[i]);
	}
      }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
	closeAllLists(e.target);
    });
}

