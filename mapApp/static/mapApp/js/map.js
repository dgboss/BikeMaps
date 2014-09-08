var DISABLE_GEOFENCES = false;

/* GLOBAL VARIABLES */
var map;

// Icon definitions
var icons = {
    "bikeRedIcon": L.MakiMarkers.icon({
        icon: "bicycle",
        color: "#d9534f",
        size: "m"
    }),
    "bikeYellowIcon": L.MakiMarkers.icon({
        icon: "bicycle",
        color: "#f0ad4e",
        size: "m"
    }),
    "bikeGreyIcon": L.MakiMarkers.icon({
        icon: "bicycle",
        color: "#999999",
        size: "m"
    }),
    "hazardIcon": L.MakiMarkers.icon({
        icon: "triangle-stroked",
        color: "#3eab45",
        size: "m"
    }),
    "theftIcon": L.MakiMarkers.icon({
        icon: "bicycle",
        color: "#000000",
        size: "m"
    }),
    "officialIcon": L.MakiMarkers.icon({
        icon: "police",
        color: "#000044",
        size: "m"
    }),
    "geocodeIcon": L.MakiMarkers.icon({
        icon: "embassy",
        color: "#CC2A01",
        size: "l"
    }),
    "locationIcon": L.MakiMarkers.icon({
        icon: "star",
        color: "#CC2A01",
        size: "s"
    })
};

// Layer datasets
// Cluster group for all accident data
var incidentData = new L.MarkerClusterGroup({
    maxClusterRadius: 70,
    polygonOptions: {
        color: '#2c3e50',
        weight: 3
    },
    iconCreateFunction: createPieCluster
}),

    alertAreas = new L.FeatureGroup([]),

    // Heatmap layer corresponding to all accident data
    // heatMap = L.heatLayer([], {
    //     radius: 40,
    //     blur: 20,
    // }),
    heatMap = new L.TileLayer.WebGLHeatMap({ 
        size: 300,
        opacity: 0.4
        // alphaRange: 0.5
    }),

    locationGroup,

    // Tile layers
    // Skobbler settings flag reference at http://developer.skobbler.com/getting-started/web#sec0
    skobbler = L.tileLayer('https://tiles1-b586b1453a9d82677351c34485e59108.skobblermaps.com/TileService/tiles/2.0/0111113120/10/{z}/{x}/{y}.png@2x', {
        minZoom: 2,
        attribution: '© Tiles: <a href="http://maps.skobbler.com/">skobbler</a>, Map data: <a href=http://openstreetmap.org>OpenStreetMap</a> contributors, CC-BY-SA'
    }),

    // skobblerNight = L.tileLayer('https://tiles1-b586b1453a9d82677351c34485e59108.skobblermaps.com/TileService/tiles/2.0/0111113120/2/{z}/{x}/{y}.png@2x', {
    //     minZoom: 2,
    //     attribution: '© Tiles: <a href="http://maps.skobbler.com/">skobbler</a>, Map data: <a href=http://openstreetmap.org>OpenStreetMap</a> contributors, CC-BY-SA'
    // }),

    stravaHM = L.tileLayer('http://gometry.strava.com/tiles/cycling/color5/{z}/{x}/{y}.png', {
        minZoom: 3,
        maxZoom: 17,
        opacity: 0.8,
        attribution: 'Ridership data &copy <a href=http://labs.strava.com/heatmap/>Strava labs</a>'
    }),

    infrastructure = L.tileLayer.wms("https://bikemaps.org/WMS", {
        layers: 'bikemaps_infrastructure',
        format: 'image/png',
        transparent: true,
        version: '1.3.0'
    }),
    openPopup;


// Purpose: Create the map with a tile layer and set the map global variable. Initialize geojson datasets, 
//      add controls, and legend items. Mobile parameter allows for rendering items differently for mobile users.
function initialize(mobile) {
    mobile = (typeof mobile !== 'undefined' ? mobile : false); //default value of mobile is false

    // Static vector definitions 
    initializeGeoJSON();

    // Map init and default layers 
    map = L.map('map', {
        center: [48, -100],
        zoom: 4,
        layers: [skobbler, stravaHM, incidentData, alertAreas],
    });

    // Add all controls to the map
    addControls(mobile);

    $(document).ready(mapListen);

    function initializeGeoJSON() {
        // Police data
        L.geoJson(policeData, {
            pointToLayer: function(feature, latlng) {
                // heatMap.addLatLng(latlng)
                heatMap.addDataPoint(latlng.lat, latlng.lng, 50);

                return L.marker(latlng, {
                    icon: icons["officialIcon"]
                });
            },
            onEachFeature: function(feature, layer) {
                var time = feature.properties.ACC_TIME;
                if (time) {
                    hours = parseInt(time.substring(0, 2));
                    time = ", " + hours % 12 + ":" + time.substring(2) + (Math.floor(hours / 12) ? " p.m." : " a.m.")
                } else {
                    time = '';
                };
                var date = feature.properties.ACC_DATE.split("/");
                date = getMonthFromInt(parseInt(date[1])).substring(0, 3) + '. ' + parseInt(date[2]) + ', ' + date[0] + time; // Month dd, YYYY, hh:mm a.m.

                layer.bindPopup('<strong>Type: </strong>Vehicle collision (' + feature.properties.ACC_TYPE.toLowerCase() + ')<br>' + '<strong>Data source: </strong>Victoria Police Dept. ' + '<a href="#" data-toggle="collapse" data-target="#police-metadata"><small>(metadata)</small></a><br>' + '<div id="police-metadata" class="metadata collapse">' + '<strong>Metadata: </strong><small>Data available for the City of Victoria from 2008 to 2012.</small>' + '</div>' + '<strong>Date: </strong>' + date);
            }
        }).addTo(incidentData);

        // ICBC Data
        L.geoJson(icbcData, {
            pointToLayer: function(feature, latlng) {
                // heatMap.addLatLng(latlng)
                heatMap.addDataPoint(latlng.lat, latlng.lng, 50);

                return L.marker(latlng, {
                    icon: icons["officialIcon"]
                });
            },
            onEachFeature: function(feature, layer) {
                var date = toTitleCase(feature.properties.Month).substring(0, 3) + ". " + feature.properties.Year;
                layer.bindPopup('<strong>Data source: </strong>ICBC ' + '<a href="#" data-toggle="collapse" data-target="#icbc-metadata"><small>(metadata)</small></a><br>' + '<div id="icbc-metadata" class="metadata collapse">' + '<strong>Metadata: </strong><small>Data available for British Columbia from 2009 to 2013. Incident characteristics not provided.</small>' + '</div>' + '<strong>Date: </strong>' + date);
            }
        }).addTo(incidentData);
    };

    function addControls(mobile) {
        /* LAYER CONTROL */
        layerControl = L.control.layers([], [], {
            collapsed: mobile
        });
        addLegend();
        layerControl.addTo(map);

        /* GEOCODING SEARCH BAR CONTROL */
        var geocoder = L.Control.geocoder({
            position: "topleft"
        }).addTo(map);

        var geocodeMarker;
        geocoder.markGeocode = function(result) {
            map.fitBounds(result.bbox);

            if (geocodeMarker) {
                map.removeLayer(geocodeMarker);
            }

            geocodeMarker = new L.Marker(result.center, {
                icon: icons["geocodeIcon"]
            })
                .bindPopup(result.name)
                .addTo(map)
                .openPopup();
        };

        /* ADD SCALE BAR */
        L.control.scale({
            position: 'bottomright'
        }).addTo(map);

        /* ADD CUSTOM HELP BUTTON */
        L.easyButton('bottomright', 'fa-question-circle',
            function() {
                toggleTooltips("show")
            },
            'Get Help'
        );

        function addLegend() {
            // Add layers
            // Basemaps
            // layerControl.addBaseLayer(skobbler, '<i class="fa fa-sun-o"></i> Light map');
            // layerControl.addBaseLayer(skobblerNight, '<i class="fa fa-moon-o"></i> Dark map');

            layerControl.addOverlay(stravaHM, 'Rider volume<br>' +
                '<div id=strava-legend class="legend-subtext collapse in">' +
                '<small class="strava-gradient gradient-bar">less <div class="pull-right">more</div></small>' +
                '</div>');

            layerControl.addOverlay(incidentData,
                'Incident points<br>'

                + '<div id=incident-legend class="marker-group legend-subtext collapse in">' + '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s' + '-' + icons["bikeRedIcon"].options.icon + '+' + icons["bikeRedIcon"].options.color + '.png">' + ' <small>Citizen incident report</small><br>'

                + '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s-' + icons["bikeYellowIcon"].options.icon + '+' + icons["bikeYellowIcon"].options.color + '.png"> <small>Citizen near miss report</small><br>'

                + '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s-' + icons["hazardIcon"].options.icon + '+' + icons["hazardIcon"].options.color + '.png"> <small>Cyclist hazard</small><br>'

                + '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s-' + icons["officialIcon"].options.icon + '+' + icons["officialIcon"].options.color + '.png"> <small>Official collision report</small><br>'

                + '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s-' + icons["theftIcon"].options.icon + '+' + icons["theftIcon"].options.color + '.png"> <small>Bike Theft</small>' + '</div>'
            );

            if (!DISABLE_GEOFENCES) {
                layerControl.addOverlay(alertAreas, 'Alert Areas' +
                    '   <a data-target="#about-alert-areas" data-toggle="modal" href="#"><i class="fa fa-question-circle fa-1x"></i></a><br>' +
                    '<div id="alert-areas-legend" class="legend-subtext collapse in">' +
                    '<small class="alert-area-box"></small>' +
                    '</div>'
                );
            }

            infrastructureLegendHTML = "Infrastructure<br>" +
                '<div id="infrastructure-legend" class="legend-subtext collapse">' +
                '<div class="bikerack"></div><small> Bike rack</small><br>' +
                '<div class="bikelane solidlane"></div><small> Separated bike lane</small><br>' +
                '<div class="bikelane dotlane"></div><small> Other cycling route</small></div>';

            layerControl.addOverlay(infrastructure, infrastructureLegendHTML);

            layerControl.addOverlay(heatMap, 'Incident heatmap<br>' +
                '<div id="hm-legend" class="legend-subtext collapse">' +
                '<small class="rainbow-gradient gradient-bar">less <div class="pull-right">more</div></small>' +
                '</div>');
        }
    };

    function mapListen() {
        map.on('popupopen', function(e) {
            openPopup = e.popup;
        });

        // Listener events for locating the user
        map.on('locationfound', onLocationFound);

        function onLocationFound(e) {
            var radius = Math.round((((e.accuracy / 2) + 0.00001) * 100) / 100); //Round accuracy to two decimal places

            if (locationGroup) {
                /*Update the coordinates of the marker*/
                locationGroup.eachLayer(function(layer) {
                    layer.setLatLng(e.latlng);
                    if (layer._mRadius) {
                        layer.setRadius(radius);
                    } else {
                        layer.getPopup().setContent("You are within " + radius + " meters of this point");
                    }
                });
            } else {
                /*Location not previously found, create marker and legend item*/
                var marker = L.marker(e.latlng, {
                    icon: icons["locationIcon"]
                })
                    .bindPopup("You are within " + radius + " meters of this point"),

                    circle = L.circle(e.latlng, radius, {
                        color: "#" + icons["locationIcon"].options.color,
                        weight: 1,
                        opacity: 0.3,
                        clickable: false,
                        fillOpacity: 0.05
                    });

                locationGroup = L.layerGroup([marker, circle]);
                layerControl.addOverlay(locationGroup, 'Detected location<br>' +
                    '<div id="location-legend" class="marker-group legend-subtext collapse">' +
                    '<img src="https://api.tiles.mapbox.com/v3/marker/pin-s' + '-' + icons["locationIcon"].options.icon + '+' + icons["locationIcon"].options.color + '.png"> <small>You are here</small></div>' +
                    '</div>');
                locationGroup.addTo(map);

                // Watch location of user without resetting viewpane
                locateUser(setView = false, watch = true);
            }
        };

        //Listener events for toggling legend items
        map.on('overlayremove', collapseLegendItem);
        map.on('overlayadd', showLegendItem);

        function collapseLegendItem(e) {
            if (e.name.match('Incident points.')) {
                $('#incident-legend').collapse('hide');
            } else if (e.name.match('Rider volume.')) {
                $('#strava-legend').collapse('hide');
            } else if (e.name.match('Infrastructure.')) {
                $('#infrastructure-legend').collapse('hide');
            } else if (e.name.match('Incident heatmap.')) {
                $('#hm-legend').collapse('hide');
            } else if (e.name.match('Detected location.')) {
                $('#location-legend').collapse('hide');
            } else if (e.name.match('Alert Areas.')) {
                $('#alert-areas-legend').collapse('hide');
            }
        };

        function showLegendItem(e) {
            if (e.name.match('Incident points.')) {
                $('#incident-legend').collapse('show');
            } else if (e.name.match('Rider volume.')) {
                $('#strava-legend').collapse('show');
            } else if (e.name.match('Infrastructure.')) {
                $('#infrastructure-legend').collapse('show');
            } else if (e.name.match('Incident heatmap.')) {
                $('#hm-legend').collapse('show');
            } else if (e.name.match('Detected location.')) {
                $('#location-legend').collapse('show');
            } else if (e.name.match('Alert Areas.')) {
                $('#alert-areas-legend').collapse('show');
            }
        };
    };
};

// Purpose: Locate the user and add their location to the map. 
// 		Given lat, lng, and zoom, go to that point, else to user location
function setView(lat, lng, zoom) {
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

// Purpose: Add a given latlng poing with the given information to the map. 
// 		Add pk for easy lookup of marker for admin tasks
function getPoint(latlng, type, pk, popupText) {
    // heatMap.addLatLng(latlng)
    heatMap.addDataPoint(latlng[0], latlng[1], 50);

    var icon, dataset;
    if (type === "Collision" || type === "Fall") {
        icon = icons["bikeRedIcon"];
        dataset = "incident"
    } else if (type === "Near miss") {
        icon = icons["bikeYellowIcon"];
        dataset = "incident"
    } else if (type === "Hazard") {
        icon = icons["hazardIcon"];
        dataset = "hazard"
    } else if (type === "Theft") {
        icon = icons["theftIcon"];
        dataset = "theft"
    } else {
        return;
    }

    marker = L.marker(latlng, {
        icon: icon,
        pk: pk,
        objType: dataset
    });

    marker.bindPopup(popupText);
    incidentData.addLayer(marker);
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
                return '#' + d.data.options.color;
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