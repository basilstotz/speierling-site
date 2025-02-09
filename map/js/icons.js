
// make colored icon array
let colors= [ "black","blue","gold","green","grey","orange","red","violet","yellow" ];
var Icon={};
for (let i=0;i<colors.length;i++){
    Icon[colors[i]] = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-'+colors[i]+'.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
}

//https://stackoverflow.com/questions/42415032/how-to-set-color-of-leaflet-marker-from-geojson
/*
function style(feature){
  var mag = feature.properties.mag;
  if (mag >= 4.0) {
    return { color: "red" }; 
  } 
  else if (mag >= 3.0) {
    return { color: "orange" };
  } 
  else if (mag >= 2.0) {
    return { color: "yellow" };
  } 
  else {
    return { color: "green" };
  }
}
*/
