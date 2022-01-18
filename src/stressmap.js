
// lines (layers)
const legendSettings = [
  {color: '#4292C6', key: 'LS', title: 'Low Stress', checked: true},
  {color: '#F16913', key: 'HS', title: 'High Stress', checked: true},
  {color: '#31a354', key: 'P_LS', title: 'Proposed Low Stress', checked: true},
  {color: '#f03b20', key: 'P_HS', title: 'Proposed High Stress', checked: true},
  {key: 'desig', title: 'Bike Designated Only', checked: true},
  {key: 'amenity', title: 'Amenities', checked: true}]

const layerSettings = [
  {key: 'LSdesig', color: '#4292C6', dashed: false, url: 'data/design_low_stress.json'},
  {key: 'HSdesig', color: '#F16913', dashed: false, url: 'data/design_high_stress.json'},
  {key: 'LSother', color: '#4292C6', dashed: false, url: 'data/low_stress.json'},
  {key: 'HSother', color: '#F16913', dashed: false, url: 'data/high_stress.json'},

  {key: 'P_LSdesig', color: '#31a354', dashed: false, url: 'data/proposed_design_low_stress_existing.json'},
  {key: 'P_HSdesig', color: '#f03b20', dashed: false, url: 'data/proposed_design_high_stress_existing.json'},
  {key: 'P_LSother', color: '#31a354', dashed: false, url: 'data/proposed_low_stress_existing.json'},
  {key: 'P_HSother', color: '#f03b20', dashed: false, url: 'data/proposed_high_stress_existing.json'},

  {key: 'P_LSdesig_new', color: '#31a354', dashed: true, url: 'data/proposed_design_low_stress_new.json'},
  {key: 'P_HSdesig_new', color: '#f03b20', dashed: true, url: 'data/proposed_design_high_stress_new.json'},
  {key: 'P_LSother_new', color: '#31a354', dashed: true, url: 'data/proposed_low_stress_new.json'},
  {key: 'P_HSother_new', color: '#f03b20', dashed: true, url: 'data/proposed_high_stress_new.json'},

  {key: 'park', color: '#f03b20', dashed: false, polygon: true, url: 'data/amenity_park.json'},
  {key: 'pool', color: '#f03b20', dashed: false, point:true, url: 'data/amenity_pool.json'},
  {key: 'school', color: '#f03b20', dashed: false, point:true, url: 'data/amenity_school.json'}]

var lineWeight = 2
if (!L.Browser.mobile) {
  lineWeight = lineWeight + 1
}
var lineOpacity = 0.6
var lineHighOpacity = 0.9 //highligh opacity

var layerGroup = new L.LayerGroup();
var legendChecks = {}; //dictionary of legend checkbox ids(keys) and their states
var layers = {};  //dictionary of layers with keys from settings

// Create variable to hold map element, give initial settings to map
var centerCoord = [49.266787, -122.887519] 
if (L.Browser.mobile) {
  // increase tolerance for tapping (it was hard to tap on line exactly), zoom out a bit, and remove zoom control
  var myRenderer = L.canvas({ padding: 0.1, tolerance: 5 });
  var map = L.map("map", { center: centerCoord, zoom: 14, renderer: myRenderer, zoomControl: false });
} else {
  var map = L.map("map", { center: centerCoord, zoom: 15 });
}
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}
).addTo(map);
// Add BikeOttawa attribution
map.attributionControl.addAttribution('<a href="https://github.com/BikeOttawa">BikeOttawa</a>');

// add geolocation on mobile
if (L.Browser.mobile) {
  L.control.locate({
      position: "bottomright",
      icon: "fa fa-location-arrow",
      showPopup: false
  }).addTo(map);
}

addLegend()
// show/hide legend
document.getElementById('legendbtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };
document.getElementById('closebtn').onclick = function () { toggleDisplay(['legendbtn', 'legend']) };

// layers
layerGroup.addTo(map);
createLayers();
addLayers();

///// Functions ////

// ------ Legend
function addLegend() {
  const legend = L.control({ position: 'topright' })
  legend.onAdd = function (map) {
    const div = L.DomUtil.create('div')

    // hide legend on mobile, show on desktop
    closeButtonDisplay = "block"
    legendDisplay = "none"
    if (L.Browser.mobile) {
      closeButtonDisplay = "none"
      legendDisplay = "block"
    }

    let legendHtml = '<div id="legendbtn" class="fill-darken2 pad1 icon menu button fr" style="display: ' + legendDisplay +'"></div>' +
      '<div id="legend" class="fill-darken1 round" style="display: ' + closeButtonDisplay +'">' +
      '<div id="closebtn" class="fill-darken2 pad1 icon close button fr"></div>' +
      '<div class="clearfix"></div>' +
      '<form><fieldset class="checkbox-pill clearfix">'

    legendHtml += '<div class="button quiet col12">Tri-Cities Cycling Traffic Stress</div>'
    for (let setting of legendSettings) {
      legendHtml += addLegendLine(setting)
    }
    var mapAction = "Click on"
    if (L.Browser.mobile) {
      mapAction = "Tap"
    }
    legendHtml += '<div class="button quiet col12">' + mapAction + ' map item for more info</div>'

    legendHtml += '</fieldset></form></div>'
    div.innerHTML = legendHtml

    // disable map zoom when double clicking anywhere on legend (checkboxes included)
    div.addEventListener('mouseover', function () { map.doubleClickZoom.disable(); });
    div.addEventListener('mouseout', function () { map.doubleClickZoom.enable(); });
    return div
  }
  legend.addTo(map)
}

function addLegendLine(setting) {
  var spanHtml
  if (setting.color){
    // add span element
    spanHtml = '<span style="display:inline-block; width:50px; height:8px; background-color:' + setting.color + '"></span>' +
    '&nbsp;' + setting.title
  }else{
    // just title
    spanHtml = setting.title
  }

  checkedHtml = ""
  if (setting.checked) {
    checkedHtml = 'checked'
  }
  // add item to dictionary of legend checkbox ids(keys) and their states
  legendChecks[setting.key] = setting.checked

  var lineHtml = '<input type="checkbox" id="' + setting.key + '" onclick="toggleLayer(this)" ' + checkedHtml + ' >' +
    '<label for="' + setting.key + '" id="' + setting.key + '-label" class="button icon check quiet col12">' +
    '&nbsp;' + spanHtml + ' </label>'

  return lineHtml
}

function toggleDisplay(elementIds) {
  elementIds.forEach(function (elementId) {
    var x = document.getElementById(elementId);
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  });
}

function toggleLayer(checkbox) { 
  if (checkbox.checked){
      legendChecks[checkbox.id] = true
  }else{
      legendChecks[checkbox.id] = false 
  }

  layerGroup.clearLayers()
  addLayers();
}

// ------ Layers
function createLayers() {
  var newLayer
  for (let setting of layerSettings) {
    if (setting.polygon){
      var newLayer = new L.GeoJSON.AJAX(setting.url, {
        style: {color: "#006d2c", weight: lineWeight, opacity: lineOpacity},
        onEachFeature: onEachFeature,
      });
    }
    else if (setting.point){
      var geojsonMarkerOptions = {
        radius: 7,
        fillColor: "#74c476",
        color: "#006d2c",
        weight: lineWeight,
        opacity: lineOpacity,
        fillOpacity: 0.8
      };
      var newLayer = new L.GeoJSON.AJAX(setting.url, {
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: onEachFeature,
      });
    }else{
      // linestring
      var newLayer = new L.GeoJSON.AJAX(setting.url, {
        style: getLineStyle(setting.color, setting.dashed),
        onEachFeature: onEachFeature,
      });
    }
    newLayer.layerID = setting.key;
    // add to global layers dictionary
    layers[setting.key] = newLayer
  }
}

function addLayers() {
  if (legendChecks['LS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add low stress designated
      layerGroup.addLayer(layers['LSdesig'])
    }else{
      // add low stress other
      layerGroup.addLayer(layers['LSother'])
    }
  }
  if (legendChecks['HS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add high stress designated
      layerGroup.addLayer(layers['HSdesig'])
    }else{
      layerGroup.addLayer(layers['HSother'])
    }
  }

  // proposed
  if (legendChecks['P_LS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add low stress designated
      layerGroup.addLayer(layers['P_LSdesig'])
      layerGroup.addLayer(layers['P_LSdesig_new'])
    }else{
      // add low stress other
      layerGroup.addLayer(layers['P_LSother'])
      layerGroup.addLayer(layers['P_LSother_new'])
    }
  }
  if (legendChecks['P_HS'] == true)
  {
    if (legendChecks['desig'] == true){
      // add low stress designated
      layerGroup.addLayer(layers['P_HSdesig'])
      layerGroup.addLayer(layers['P_HSdesig_new'])
    }else{
      // add low stress other
      layerGroup.addLayer(layers['P_HSother'])
      layerGroup.addLayer(layers['P_HSother_new'])
    }
  }

  // amenities
  if (legendChecks['amenity'] == true){
    layerGroup.addLayer(layers['park'])
    layerGroup.addLayer(layers['pool'])
    layerGroup.addLayer(layers['school'])
  }
}

// lines style
function getLineStyle(color, dashed) {
  var lineStyle;
  if (dashed){
    lineStyle = {
      "color": color,
      "weight": lineWeight,
      "opacity": lineOpacity,
      "dashArray": "10"
    };
  }else{
    lineStyle = {
      "color": color,
      "weight": lineWeight,
      "opacity": lineOpacity,
    };
  }
  return lineStyle
}
function getHighlightStyle(color, dashed) {
  var highlighStyle
  if (dashed){
    highlighStyle = {
    "color": color,
    "weight": lineWeight + 1,
    "opacity": lineHighOpacity,
    "dashArray": "10"
    };
  }else{
    highlighStyle = {
      "color": color,
      "weight": lineWeight + 1,
      "opacity": lineHighOpacity
      };
  }
  return highlighStyle
}

function highlightFeature(e) {
  var layer = e.target;
  var highlightStyle = getHighlightStyle(layer.options.color, layer.options.dashArray)
  layer.setStyle(highlightStyle);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  var layer = e.target;
  var lineStyle = getLineStyle(layer.options.color, layer.options.dashArray)
  layer.setStyle(lineStyle);
}

// add popup and highlight
function onEachFeature(feature, layer) {
  var popupContent = ""
  if (feature.properties) {
    // for this mobile version don't show link and id
    // if (feature.properties.id) {
    //   popupContent +='<b><a href="https://www.openstreetmap.org/' + feature.properties.id + '" target="_blank">' + feature.properties.id + '</a></b><hr>'
    //   //popupContent += "<b>Id: </b>";
    //   //popupContent += feature.properties.id;
    // }

    // for debug
    // if (feature.properties.id == 'way/35198494'){
    //   console.log('Dragana:: tag ' + JSON.stringify(feature.properties))
    // }

    // customize value for category (road category) tag
    // options based on analysis of Sept 2021 designated data (StressDataExploration.R)
    let highwayValueToShow = null
    let categoryValueToShow = null
    if (feature.properties.highway) {
      let highwayValue = feature.properties.highway

      if (highwayValue == "path" || highwayValue == "cycleway" || highwayValue == "footway"){
        // separated bike infrastructure
        let footValue = feature.properties.foot
        if (footValue == "designated" ||  footValue == "yes" || footValue == "permissive" || footValue == "yes;permissive"){
          footValue = "yes"
        }else{
          footValue = "no"
        }
        let bicycleValue = feature.properties.bicycle
        if (bicycleValue == "designated" ||  bicycleValue == "yes" || bicycleValue == "permissive" || bicycleValue == "yes;permissive"){
          bicycleValue = "yes"
        }else{
          bicycleValue = "no"
        }
        // path
        if (highwayValue == "path"){
          if (footValue == "yes" && bicycleValue == "yes"){
            if (feature.properties.segregated && feature.properties.segregated == "yes"){
              categoryValueToShow = "bike path"
            }else{
              categoryValueToShow = "shared path"
            }
          }else{
            categoryValueToShow = "path"
          }
        // cycleway
        }else if (highwayValue == "cycleway"){
          if (footValue == "yes"){
            categoryValueToShow = "shared"
          }else{
            categoryValueToShow = "bike"
          }
          // cycleway crossings
          let cyclewayValue = feature.properties.cycleway
          if (cyclewayValue == "crossing"){
            categoryValueToShow += " crossing"
          }else{
            categoryValueToShow += " path"
          }
          // footway
        }else if (highwayValue == "footway"){
          if (bicycleValue == "yes"){
            categoryValueToShow = "shared"
          }else{
            categoryValueToShow = "foot"
          }
          // footway crossings
          let footwayValue = feature.properties.footway
          if (footwayValue == "crossing"){
            categoryValueToShow += " crossing"
          }else{
            categoryValueToShow += " path"
          }
        }
      }else if (highwayValue == "motorway" || highwayValue == "trunk" || highwayValue == "primary" || 
          highwayValue == "secondary" || highwayValue == "tertiary" || highwayValue == "service" ||
          highwayValue == "unclassified" || highwayValue == "residential" || 
          highwayValue == "motorway_link" || highwayValue == "trunk_link" || highwayValue == "primary_link" ||
          highwayValue == "secondary_link" || highwayValue == "tertiary_link"){
            // roads  
            if (highwayValue != "unclassified" && highwayValue != "residential" && highwayValue != "service"){
              highwayValueToShow = "highway"
            }
            if (highwayValue == "tertiary" || highwayValue == "tertiary_link"){
              highwayValueToShow = "collector"
            }
            if (highwayValue == "secondary" || highwayValue == "secondary_link"){
              highwayValueToShow = "arterial"
            }
            if (highwayValueToShow == null){
              highwayValueToShow = highwayValue
            }
            // if "service" then add what kind of service
            if (highwayValue == "service"){
              if (feature.properties.service) {
                let serviceValue = feature.properties.service
                if (serviceValue == "parking_aisle"){
                  serviceValue = "parking aisle"
                }
                highwayValueToShow += "<br><b>service: </b>";
                highwayValueToShow += serviceValue;
              }
            }
            // figure out bike infra categories ("cycleway" tag)
            let cyclewayValue = null
            if (feature.properties.cycleway) {
              cyclewayValue = feature.properties.cycleway
              // check if there's cycleway.both, cycleway.right, cycleway.left
            }else if(feature.properties["cycleway.both"]){
              cyclewayValue = feature.properties["cycleway.both"]
            }else if(feature.properties["cycleway.right"]){
              cyclewayValue = feature.properties["cycleway.right"]
            }else if(feature.properties["cycleway.left"]){
              cyclewayValue = feature.properties["cycleway.left"]
            }
            if (cyclewayValue){
              if (cyclewayValue == "shared_lane"  || cyclewayValue == "shared" || cyclewayValue == "share_busway"){
                categoryValueToShow = "shared lane"
              }
              if (cyclewayValue == "lane"){
                categoryValueToShow = "painted lane"
              }              
              if (cyclewayValue == "track"){
                categoryValueToShow = "protected lane"
              }
              if (cyclewayValue == "crossing"){
                categoryValueToShow = "crossing"
              }
            }
      }else{
        // everything else
        categoryValueToShow = highwayValue
      }
    }
    // add bike category first
    if (categoryValueToShow){
      popupContent += "<b>category: </b>";
      popupContent += categoryValueToShow;
    }
    // add name second
    if (feature.properties.name){
      // add new line if there's something in front of it
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>name: </b>";
      popupContent += feature.properties.name;
    }
    // then road category
    if (highwayValueToShow){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>road category: </b>";
      popupContent += highwayValueToShow;
    }
    // add surface and maxspeed
    if (feature.properties.surface){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>surface: </b>";
      let surfaceValue = feature.properties.surface
      if (surfaceValue == "paving_stones"){
        surfaceValue = "paving stones"
      }else if (surfaceValue == "fine_gravel"){
        surfaceValue = "fine gravel"
      }else if (surfaceValue == "unhewn_cobblestone"){
        surfaceValue = "unhewn cobblestone"
      }else if (surfaceValue == "grass_paver"){
        surfaceValue = "grass paver"
      }
      popupContent += surfaceValue;
    }
    if (feature.properties.maxspeed){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>max speed: </b>";
      popupContent += feature.properties.maxspeed;
    }
    // add lit and incline
    if (feature.properties.lit){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>lit: </b>";
      popupContent += feature.properties.lit;
    }
    if (feature.properties.incline){
      if (popupContent != ""){
        popupContent += "<br>"
      }
      popupContent += "<b>incline: </b>";
      popupContent += feature.properties.incline;
    }

    // FOR TEST
  // popupContent += "<br>=================";
  //   for (let property in feature.properties) {
  //       //console.log('Dragana:: tag ' + JSON.stringify(tag) +', value: '+ way.tags[tag])
  //     //if ((property != "id") && (property != "decisionMsg") && (property != "access")
  //     //  (property != "highway") && (feature.properties[property] != null)){
        
  //         popupContent += "<br><b>" + property + ": </b>";
  //       popupContent += feature.properties[property];
  //     //}
  //  }
    // for this mobile version don't show decision message
    // if (feature.properties.decisionMsg) {
    //   popupContent += "<br><br><b>Decision Msg: </b>";
    //   popupContent += feature.properties.decisionMsg;
    // }
  }
  layer.bindPopup(popupContent);

  // for mobile, use popup functions
  if (L.Browser.mobile) {
    layer.on({
      popupopen: highlightFeature,
      popupclose: resetHighlight,
    });
  } else {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
    });
  }
}
