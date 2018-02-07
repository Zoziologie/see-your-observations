var data,fields,loc

jQuery(document).ready(function() {

		//Create map   
	map = new L.Map('map1');

	// Initiate the map
	//map.setView(L.latLng(46.57591, 7.84956), 8);
	map.fitWorld();

	// Add tileLayer:
	baseLayers = {
		'MapBox': L.tileLayer.provider('MapBox', {id: 'rafnuss.npl3amec',accessToken: token.mapbox}).addTo(map),
		'OpenStreetMap': L.tileLayer.provider('OpenStreetMap.Mapnik'),
	};

	control = L.control.layers(baseLayers, null, { collapsed: false	}).addTo(map);

	//L.MakiMarkers.accessToken = token.mapbox;


	L.easyButton( 'fa-upload', function(){
		jQuery('#ModalUpload').modal("toggle")
	}).addTo(map);

	jQuery("#uploadMyEBirdData").change(function(evt) {

		jQuery('#ModalUpload').modal("hide");
		map.spin(true);

		var file = evt.target.files[0];
		Papa.parse(file, {
			header:true,
			complete: function(results) {

				data = results.data;
				fields = results.meta.fields;

				//var obj = jQuery.grep(data, function(obj){return obj.id === 3;})[0];

				var loc_all = data.map(function(d_tmp){
					d={};
					d.Location = d_tmp.Location;
					d.Latitude = d_tmp.Latitude;
					d.Longitude = d_tmp.Longitude;
					return d
				})

				loc = loc_all.filter((loc_tmp, index, self) => self.findIndex(d => d.Location === loc_tmp.Location && (typeof d.Location != 'undefined') ) === index)

				//var tmp3 = data.map(val => val.Location)

				loc = loc.map(function(loc_tmp){
					d_loc = data.filter(d => d.Location==loc_tmp.Location);
					loc_tmp.countObs = d_loc.length;
					loc_tmp.countSpe = d_loc.filter((loc_tmp, index, self) => self.findIndex(d => d['Common Name'] === loc_tmp['Common Name'] ) === index).length;
					loc_tmp.countList = d_loc.filter((loc_tmp, index, self) => self.findIndex(d => d['Submission ID'] === loc_tmp['Submission ID'] ) === index).length;
					return loc_tmp
				})

				control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countObs]),{
					max: Math.max.apply(Math, loc.map(l =>  l.countObs))/30,
				}).addTo(map))
				control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countSpe]),{
					max: Math.max.apply(Math, loc.map(l =>  l.countSpe))/2,
				}).addTo(map))
				control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countList]),{
					max: Math.max.apply(Math, loc.map(l =>  l.countList))/2,
				}).addTo(map))

				map.spin(false);

			},
		});
	});

	/*


*/
})
