<?php

if(isset($_POST["submit"])){
$empfaenger = "basil.stotz@gmail.com";
$betreff = "Message: ".date("d M Y");
$from = "From: Backup <form@speierling.arglos.ch>";


//$text=$_POST["text"];
$text="dfgdsfgsdfgsdfgsdf";

mail($empfaenger, $betreff, $text, $from);
echo "<script>window.location.href=window.location.href;</script>"
}

?>
