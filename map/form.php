<!DOCTYPE html>
<html>
<head>
<title>Speierling</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<meta name="referrer" content="no-referrer">

<!---
<meta http-equiv="Content-Security-Policy" content="script-src 'self'">
--->

<!---
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway">
--->
<link rel="stylesheet" href="css/w3.css">
<link rel="stylesheet" href="css/raleway.css">

<style>
.loader {
  width: 60px;
  height: 60px;
  display: block;
  margin: 20px auto;
  position: relative;
  background: radial-gradient(ellipse at center, #FFF 69%, rgba(0, 0, 0, 0) 70%), linear-gradient(to right, rgba(0, 0, 0, 0) 47%, #FFF 48%, #FFF 52%, rgba(0, 0, 0, 0) 53%);
  background-size: 20px 20px , 20px auto;
  background-repeat: repeat-x;
  background-position: center bottom, center -5px;
  box-sizing: border-box;
}
.loader::before,
.loader::after {
  content: '';  
  box-sizing: border-box;
  position: absolute;
  left: -20px;
  top: 0;
  width: 20px;
  height: 60px;
  background: radial-gradient(ellipse at center, #FFF 69%, rgba(0, 0, 0, 0) 70%), linear-gradient(to right, rgba(0, 0, 0, 0) 47%, #FFF 48%, #FFF 52%, rgba(0, 0, 0, 0) 53%);
  background-size: 20px 20px , 20px auto;
  background-repeat: no-repeat;
  background-position: center bottom, center -5px;
  transform: rotate(0deg);
  transform-origin: 50% 0%;
  animation: animPend 1s linear infinite alternate;
}
.loader::after {
  animation: animPend2 1s linear infinite alternate;
  left: 100%;
}

@keyframes animPend {
  0% {
    transform: rotate(22deg);
  }
  50% {
    transform: rotate(0deg);
  }
}

@keyframes animPend2 {
  0%, 55% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-22deg);
  }
}
</style>

<style>
body,h1 {font-family: "Raleway", sans-serif}
body, html {height: 100%}
.bgimg {
  background-image: url('images/background.jpg');
  min-height: 100%;
  background-position: center;
  background-size: cover;
}
button {
  background-color: #666666;
  opacity: 0.8; 
  border: none;
  color: white;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius:12px;
}
</style>


<script>
function httpGet(theUrl, callback)                                                                                                                    
{                                                                                                                                                     
    var xmlHttp = new XMLHttpRequest();                                                                                                               
    xmlHttp.onreadystatechange = function() {                                                                                                         
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)                                                                                         
            callback(xmlHttp.responseText);                                                                                                           
    }                                                                                                                                                 
    xmlHttp.open("GET", theUrl, true); // true for asynchronous                                                                                       
    xmlHttp.send(null);                                                                                                                               
}
</script>


</head>

<body>




<div class="bgimg w3-display-container w3-animate-opacity w3-text-white">


  <div class="w3-display-middle w3-center">

    <p class="w3-xlarge w3-center"></p>

    <!--- <h1 class="w3-jumbo w3-animate-top"><b>Projekt Speierling</b></h1> --->


    <p class="w3-xlarge w3-center" style="margin-bottom:14px"><br/>Hier kannst du deine Mitteilung schreiben</p>


    <form action="" method="post">

<!---
      <label for="fname">First name:</label><br>
      <input type="text" id="fname" name="fname"><br>

      <label for="lname">Last name:</label><br>
      <input type="text" id="lname" name="lname"><br>
--->

  <label for="lname"></label><br>
  <textarea id="ltext" name="ltext" rows="15" cols="40"></textarea></br>

  <label for="lmail">Mail:</label><br>
  <input type="text" id="lmail" name="lmail"><br>

  <br>  <input type="submit" name="submit" value="Versenden">

    </form>

    <p class="w3-xlarge w3-center" id="statsB" style="margin-top:14px;margin-bottom:32px"><br/><br/></p>

<!---
    <a id="link" class="w3-center w3-animate-top"><button><b>Zur Karte gehen</b></button></a>
--->

  </div>

  <div class="w3-display-topmiddle w3-padding-large">
    <a id="link2" href="index.html" class="w3-center w3-animate-top"><button style="font-size:14px;padding:8px 8px;">Startseite</button></a>
  </div>


 <a href="https://speierling.arglos.ch/gis/site/index.html" ><img src="images/home.png" style="opacity:0.7;width:30px;position:absolute;left:10;top:10"></a>

<!--
  <div class="w3-display-topleft w3-padding-large">
    <a href="https://speierling.arglos.ch/daten.php">Datenablage</a>
  </div>


  <div class="w3-display-topright w3-padding-large">
     <a href="https://de.wikipedia.org/wiki/Speierling">Speierling auf Wikipedia</a>
  </div>


  <div class="w3-display-bottomleft w3-padding-large">
     Projektleitung: Martin Dick &amp; Christian Erdin
  </div>


  <div class="w3-display-bottomright w3-padding-large">
     <a href="https://www.anhbl.ch">Arbeitsgemeinschaft für Natur- und Heimatschutz Baselland</a>
  </div>


-->

<!---
.button {
  background-color: #04AA6D; /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
}
--->


  <div class="w3-display-bottommiddle w3-padding-large w3-xlarge">
    <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.de"><img src="images/CC-BY-SA_icon.png" alt="" width="100px" style="opacity:0.5"></a>
  </div>

</div>


<script>
</script>

<?php
//print_r($_POST);
if( isset($_POST["submit"]) ){
   if(strlen($_POST["ltext"])>0){
	$empfaenger = "basil.stotz@gmail.com";
	$betreff = "Speierlingsmeldung vom: ".date("d M Y");
	$from = "From: Speierlingsmeldung <form@speierling.arglos.ch>";


	$text=$_POST["ltext"]." ".$_POST["lmail"];

	mail($empfaenger, $betreff, $text, $from);
	mail("martindick56@gmail.com", $betreff, $text, $from);

        echo '<script>alert("Die Mitteilung wurde verschickt");</script>';
    }else{
        echo '<script>alert("Die Mitteilung ist leer. Bitte trage deine Mitteilung ein.");</script>';
    }
}
?>



</body>
</html>

