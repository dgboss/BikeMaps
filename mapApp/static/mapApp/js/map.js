var DISABLE_GEOFENCES = false;

/* GLOBAL VARIABLES */
var map;

// Layer datasets
// Cluster group for all accident data
var incidentData = new L.MarkerClusterGroup({
    maxClusterRadius: 70,
    polygonOptions: {
        color: '#2c3e50',
        weight: 3
    },
    iconCreateFunction: createPieCluster
}).on('click', function(e){
  var layer = e.layer;
  layer.bindPopup(getPopup(layer)).openPopup();
}),

    alertAreas = new L.FeatureGroup([]),

    // Heatmap layer corresponding to all accident data
    heatMap = L.heatLayer([], {
        radius: 40,
        blur: 20,
    }),

    locationGroup,

    // Tile layers
    MapQuestOpen_OSM = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg', {
      attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: '1234'
    }),

    stravaHM = L.tileLayer('https://d2z9m7k9h4f0yp.cloudfront.net/tiles/cycling/color5/{z}/{x}/{y}.png', {
      minZoom: 3,
      maxZoom: 17,
      opacity: 0.8,
      attribution: '<a href=http://labs.strava.com/heatmap/>http://labs.strava.com/heatmap/</a>'
    }),

    infrastructure = L.tileLayer.wms("https://bikemaps.org/WMS", {
      layers: 'bikemaps_infrastructure',
      format: 'image/png',
      transparent: true,
      version: '1.3.0'
    }),
    officialData = [];

// Purpose: Create the map with a tile layer and set the map global variable. Mobile parameter allows for rendering items differently for mobile users.
function initialize(scrollZoom) {
  // Map init and default layers
  map = L.map('map', {
    center: [48, -100],
    zoom: 4,
    layers: [MapQuestOpen_OSM, stravaHM, incidentData, alertAreas],
    worldCopyJump: true,
    scrollWheelZoom: scrollZoom
  });
};

// Add geocoder control
function addGeocoderControl(){
  var geocoder = L.Control.geocoder({
    position: "topleft"
  }).addTo(map);
  var geocodeMarker;
  geocoder.markGeocode = function(result) {
    map.fitBounds(result.bbox);
    geocodeMarker && map.removeLayer(geocodeMarker); //remove old marker if it exists

    geocodeMarker = new L.Marker(result.center, {
      icon: icons["geocodeIcon"]
    })
    .bindPopup(result.name)
    .addTo(map)
    .openPopup();
  };
};

// Add scalebar
function addScaleControl(){
  L.control.scale({
    position: 'bottomright'
  }).addTo(map);
}

// Add leaflet control panels and functions to control their behavior
function addControls(mobile) {
    addGeocoderControl();
    addScaleControl();
};

// Purpose: Locate the user and add their location to the map.
// 		Given lat, lng, and zoom, go to that point, else to user location
function setView(lat, lng, zoom) {
  var marker;

  map.on("locationfound", function(location) {
    if (!marker)
      marker = L.userMarker(location.latlng, {smallIcon:true, circleOpts:{weight: 1, opacity: 0.3, fillOpacity: 0.05}}).addTo(map);
      marker.setLatLng(location.latlng);
      marker.setAccuracy(location.accuracy);
  });

  if (zoom) {
      this.map.setView(L.latLng(lat, lng), zoom);
      locateUser(setView = false, watch = false);
  } else {
      locateUser(setView = true, watch = false);
  }
};

// Purpose: Find the user via GPS or internet connection.
//      Parameters to determine if the maps view should be set to that location and if the position should be polled and updated
function locateUser(setView, watch) {
    this.map.locate({
        setView: setView,
        maxZoom: 16,
        watch: watch,
        enableHighAccuracy: true
    });
};

// Purpose: Add a given latlng list to the map as a polygon. Add pk attribute so polygon can be deleted by user.
function getPolygon(latlng, pk) {
    alertAreas.addLayer(L.polygon(latlng, {
        color: '#3b9972',
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.1,
        pk: pk,
        /*Mark the polygon with it's database id*/
        objType: 'polygon'
    }));
};


// Purpose: Initializes the Pie chart cluster icons by getting the needed attributes from each cluster
//		and passing them to the pieChart function
function createPieCluster(cluster) {
    var children = cluster.getAllChildMarkers(),
        n = children.length,
        colorRef = {};

    for (var icon in icons) {
        // Add a counting field to the icons objects
        icons[icon]["count"] = 0;
        // construct colorRef object for efficiency of bin sort
        colorRef[icons[icon].options.color] = icon;
    };

    //Count the number of markers in each cluster
    children.forEach(function(child) {
        // Match childColor to icon in icons
        var icon = colorRef[child.options.icon.options.color];
        icons[icon].count++;
    });

    // Make array of icons data
    data = $.map(icons, function(v) {
      return v;
    })

    // Build the svg layer
    return pieChart(data, n);

    // pieChart
    // 	Purpose: Builds the svg DivIcons
    // 	inputs: data as list of objects containing "type", "count", "color", outer chart radius, inner chart radius, and total points for cluster
    // 	output: L.DivIcon donut chart where each "type" is mapped to the corresponding "color" with a proportional section corresponding to "count"
    function pieChart(data, total) {
        outerR = (total >= 10 ? (total < 50 ? 20 : 25) : 15),
        innerR = (total >= 10 ? (total < 50 ? 10 : 13) : 7);

        var arc = d3.svg.arc()
            .outerRadius(outerR)
            .innerRadius(innerR);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) {
                return d.count;
            });

        // Define the svg layer
        var width = 50,
            height = 50;
        var svg = document.createElementNS(d3.ns.prefix.svg, 'svg');
        var vis = d3.select(svg)
            .data(data)
            .attr('class', 'marker-cluster-pie')
            .attr('width', width)
            .attr('height', height)
            .append("g")
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        var g = vis.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
            .attr('class', 'arc');

        g.append('path')
            .attr("d", arc)
            .style("fill", function(d) {
                return d.data.options.color;
            });

        // Add center fill
        vis.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", innerR)
            .attr('class', 'center')
            .attr("fill", "#f1f1f1");

        // Add count text
        vis.append('text')
            .attr('class', 'pieLabel')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .text(total)

        var html = serializeXmlNode(svg);

        return new L.DivIcon({
            html: html,
            className: 'marker-cluster',
            iconSize: new L.Point(40, 40)
        });


        // Purpose: Helper function to convert xmlNode to a string
        function serializeXmlNode(xmlNode) {
            if (typeof window.XMLSerializer != "undefined") {
                return (new window.XMLSerializer()).serializeToString(xmlNode);
            } else if (typeof xmlNode.xml != "undefined") {
                return xmlNode.xml;
            }
            return "";
        };
    };
};


// HELPER FUNCTIONS
function getMonthFromInt(num) {
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    return months[num - 1];
};

function toTitleCase(s) {
    return s.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

function getPopup(layer) {
    var feature = layer.feature,
        type = layer.options.ftype,
        popup;

    if (type === "collision" || type === "nearmiss") {
        popup = '<strong>Type:</strong> ' + feature.properties.incident + '<br><strong>';
        if (feature.properties.incident_type != "Fall")
            popup += 'Incident with';
        else
            popup += 'Due to';
        popup += ':</strong> ' + feature.properties.incident_with + '<br><strong>Date:</strong> ' + makeNiceDate(feature.properties.incident_date);

    } else if (type === "hazard") {
        popup = '<strong>Hazard type:</strong> ' + feature.properties.hazard + '<br><strong>Date:</strong> ' + makeNiceDate(feature.properties.hazard_date);

    } else if (type === "theft") {
        popup = '<strong>Theft type:</strong> ' + feature.properties.theft + '<br><strong>Date:</strong> ' + makeNiceDate(feature.properties.theft_date);

    } else if (type === "icbc") {
        var date = toTitleCase(feature.properties.Month).substring(0, 3) + ". " + feature.properties.Year;
        popup = '<strong>Data source: </strong>ICBC ' + '<a href="#" data-toggle="collapse" data-target="#icbc-metadata"><small>(metadata)</small></a><br>' + '<div id="icbc-metadata" class="metadata collapse">' + '<strong>Metadata: </strong><small>Data available for British Columbia from 2009 to 2013. Incident characteristics not provided.</small>' + '</div>' + '<strong>Date: </strong>' + date

    }else if (type == "police") {
        var time = feature.properties.ACC_TIME;
        if (time) {
          hours = parseInt(time.substring(0, 2));
          time = ", " + hours % 12 + ":" + time.substring(2) + (Math.floor(hours / 12) ? " p.m." : " a.m.")
        } else {
          time = '';
        };
        var date = feature.properties.ACC_DATE.split("/");
        date = getMonthFromInt(parseInt(date[1])).substring(0, 3) + '. ' + parseInt(date[2]) + ', ' + date[0] + time; // Month dd, YYYY, hh:mm a.m.

        popup = '<strong>Type: </strong>Vehicle collision (' + feature.properties.ACC_TYPE.toLowerCase() + ')<br>' + '<strong>Data source: </strong>Victoria Police Dept. ' + '<a href="#" data-toggle="collapse" data-target="#police-metadata"><small>(metadata)</small></a><br>' + '<div id="police-metadata" class="metadata collapse">' + '<strong>Metadata: </strong><small>Data available for the City of Victoria from 2008 to 2012.</small>' + '</div>' + '<strong>Date: </strong>' + date

    } else return "error";

    return popup;
};

function makeNiceDate(d) {
    // "2014-10-28T10:00:00"

    d = d.split("T");
    time = d[1].split(":");
    date = d[0].split("-");

    pm = parseInt(time[0]) / 12; // > 1 if true
    time[0] = parseInt(time[0]) % 12;
    if(time[0] === 0) time[0] = 12;

    return getMonthFromInt(date[1]).slice(0, 3) + ". " + date[2] + ", " + date[0] + ", " + time[0] + ":" + time[1] + (pm >= 1 ? "pm" : "am");
};


// Purpose: Convert a given geojson dataset to a MakiMarker point layer
//  and add all latlngs to the heatmap and bind appropriate popups to markers
function geojsonMarker(data, type) {
    return L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
            heatMap.addLatLng(latlng);
            return L.marker(latlng, {
                icon: getIcon(type),
                ftype: type,
                objType: feature.properties.model
            })
        },
    });
};


// Purpose: A function for adding official report data efficiently and asynchronously.
//    Accepts the geojson feature and the datatype (unused but added for potential future requirements) and initiates the spinner while data is loading
function loadGeojsonAjax(src, type){
  // start spinner
  incidentData.fire("data:loading");
  L.Util.ajax(src).then(function(data){
    // stop spinner
    incidentData.fire("data:loaded");
    // set marker styles
    geojsonMarker(data, type).addTo(incidentData);
  });
};
