var data,fields,loc,editableLayers, makersList, makersObs, makersSpe

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

	L.MakiMarkers.accessToken = token.mapbox;

	L.easyButton( 'fa-upload', function(){
		jQuery('#ModalUpload').modal("toggle")
	}).addTo(map);


	jQuery("#uploadMyEBirdData").change(function(evt) {
		processFile( evt.target.files[0], evt.target.files[0].size )
	});


	// Open my data if me in url
	jQuery('#ModalUpload').modal("toggle")
	if ( window.location.search.substring(1).indexOf('me') !== -1 ){
		jQuery.get("https://zoziologie.raphaelnussbaumer.com/wp-content/plugins/SeeYourObservations/MyEBirdData.csv", function(data){
			processFile(data, data.length) 
		})
		//processFile( "https://zoziologie.raphaelnussbaumer.com/wp-content/plugins/SeeYourObservations/MyEBirdData.csv", true )
	}

	// Drawing
	editableLayers = new L.FeatureGroup();
	map.addLayer(editableLayers);

	var drawControl = new L.Control.Draw({
		position: 'topright',
		draw: {
			polyline: false,
			circlemarker: false,
			circle: false,
			marker: false,
		},
		edit: {
			featureGroup: editableLayers, //REQUIRED!!
			remove: false
		}
	});
	map.addControl(drawControl);
	
	map.on(L.Draw.Event.CREATED, function (e) {
		
		var type = e.layerType,
		layer = e.layer;
		txt='';
		cl=0;
		makersList.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(layer.toGeoJSON())).length>0){
				cl+=1;
			}
		});
		txt += numberWithCommas(cl) +' lists<br>'
		cl=0;
		makersObs.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(layer.toGeoJSON())).length>0){
				cl += m.count;
			}
		});
		txt += numberWithCommas(cl) +' observations<br>'
		var sp= new Set()
		makersSpe.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(layer.toGeoJSON())).length>0){
				m.spe.forEach(s => sp.add(s) );
			}
		});
		txt += numberWithCommas(sp.size) +' species<br>'
		layer.bindPopup(txt);
		editableLayers.clearLayers();
		editableLayers.addLayer(layer);
		layer.openPopup();
	});
	
})



function processFile( file, size ){
	var percent = 0;
	var progress = 0;
	const data = [];
	jQuery('#MyPg').show()
	jQuery('#loadingtitle').html('Reading the file...')
	var pgbar = document.getElementById("MyPgBar");
	//map.spin(true);
	Papa.parse(file, {
		header:true,
		step: function(row,handler) {
			data.push(row.data[0]);
			progress = progress + Object.values(row.data[0]).join(',').length;

			var newPercent = Math.round(progress / size * 100);
			if (newPercent === percent) return;
			percent = newPercent;
			handler.pause();

			pgbar.style.width = percent + '%'; 
			pgbar.innerHTML = percent * 1  + '%';
			setTimeout(function(){handler.resume()},0)
		},
		complete: function() {
			//data = results.data;
			//fields = results.meta.fields;
			jQuery('#ModalUpload').modal("hide");
			map.spin(true);
			setTimeout(function(){
				loc_all = data.map(function(d_tmp){
					d={};
					d.Location = d_tmp.Location;
					d.Latitude = d_tmp.Latitude;
					d.Longitude = d_tmp.Longitude;
					return d
				})

				loc = loc_all.filter((loc_tmp, index, self) => self.findIndex(d => d.Location === loc_tmp.Location && (typeof d.Location != 'undefined') ) === index)


				loc = loc.map(function(loc_tmp){
					d_loc = data.filter(d => d.Location==loc_tmp.Location);
					loc_tmp.countObs = d_loc.length;
					loc_tmp.Spe = d_loc.reduce( (acc, cur) =>  acc.indexOf(cur['Common Name'])<0 ? acc.concat(cur['Common Name']) : acc , [] )
					loc_tmp.List = d_loc.reduce( (acc, cur) =>  acc.indexOf(cur['Submission ID'])<0 ? acc.concat(cur['Submission ID']) : acc , [] )
					loc_tmp.countSpe = loc_tmp.Spe.length;
					loc_tmp.countList = loc_tmp.List.length;
					return loc_tmp
				})


				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countObs]))).addTo(map)
				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countSpe])).addTo(map))
				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countList])).addTo(map))


				makersList = L.markerClusterGroup({
					showCoverageOnHover:0,
					iconCreateFunction: function(e){
						var t=e.getAllChildMarkers().reduce( (c,m) => c+m.count,0)
						var i=" marker-cluster-"
						i+=10>t?"small":100>t?"medium":"large"
						t = t<1000 ? t : Math.round(t/1000)+'K'
						var divi = L.divIcon({
							html:"<div><span>"+t+"</span></div>",
							className:"marker-cluster"+i,
							iconSize: L.Point(40,40),
						})
						return divi
					}
				});
				makersObs = L.markerClusterGroup({
					showCoverageOnHover:0,
					iconCreateFunction: function(e){
						var t=e.getAllChildMarkers().reduce( (c,m) => c+m.count,0)
						var i=" marker-cluster-"
						i+=100>t?"small":1000>t?"medium":"large"
						t = t<1000 ? t : Math.round(t/1000)+'K'
						var divi = L.divIcon({
							html:"<div><span>"+t+"</span></div>",
							className:"marker-cluster"+i,
							iconSize: L.Point(40,40),
						})
						return divi
					}
				});
				makersSpe = L.markerClusterGroup({
					showCoverageOnHover:0,
					iconCreateFunction: function(e){
						var sp= new Set()
						e.getAllChildMarkers().forEach( m => m.spe.forEach(s => sp.add(s) ) )
						var t =sp.size;
						var i=" marker-cluster-"
						i+=100>t?"small":500>t?"medium":"large"
						t = t<1000 ? t : Math.round(t/1000)+'K'
						var divi = L.divIcon({
							html:"<div><span>"+t+"</span></div>",
							className:"marker-cluster"+i,
							iconSize: L.Point(40,40),
						})
						return divi
					}
				});

				loc.forEach(function(l){
					pop = '<b>'+l.Location +'</b><br><b>Species:</b> '+ l.Spe.join(', ')+'<br><b>Checklists:</b> '+l.List.map( id => '<a href="https://ebird.org/view/checklist/'+id+'" target="_blank">'+id+'</a>' ).join(", ");
					var mList = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countList < 100  ? l.countList : (l.countList < 1000 ? 'c' : 'k' ),
						})
					}).bindPopup(pop)
					mList.count = l.countList;
					mList.location = l.Location
					makersList.addLayer(mList);
					var mObs = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countObs < 100  ? l.countObs : (l.countObs < 1000 ? 'c' : 'k' )
						})
					}).bindPopup(pop)
					mObs.count = l.countObs;
					mObs.location = l.Location
					makersObs.addLayer(mObs);
					var mSpe = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countSpe < 100  ? l.countSpe : (l.countSpe < 1000 ? 'c' : 'k' )
						})
					}).bindPopup(pop)
					mSpe.count = l.countSpe;
					mSpe.spe = l.Spe;
					mSpe.location = l.Location
					makersSpe.addLayer(mSpe);
				})

				/*makersSpe.on('popupopen', ppp(e) )
				makersObs.on('popupopen', ppp(e) )
				makersList.on('popupopen', ppp(e) )
				<a href="#" target="_blank">
				*/

				control.addOverlay(makersList,'Your Lists')
				control.addOverlay(makersObs,'Your Observations')
				control.addOverlay(makersSpe.addTo(map),'Your Species')
				map.fitBounds(makersSpe.getBounds());
				map.spin(false);
			},0)
			},
		});
}


const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

ppp = function(e) {
	var latLng = e.popup._source.getLatLng();
	jQuery.get('https://ebird.org/ws1.1/ref/hotspot/geo?lng='+latLng.lng+'&lat='+latLng.lat+'&dist=1&fmt=xml',function(data){
		dd=JSON.parse(xml2json(data).replace('undefined',''))

		var locID='';
		if (dd.response.result != null ){
			var pop = e.popup.getContent();
			if (dd.response.result.location.length>0){
				ddd = dd.response.result.location.filter( val => val['loc-name'] == e.popup._source.location );
				if (ddd.length>0) {
					pop = pop.replace('#','https://ebird.org/hotspot/'+ddd[0]['loc-id'])
					e.popup.setContent(pop)
				}
			} else if ( dd.response.result.location['loc-name'] == e.popup._source.location ) {
				pop = pop.replace('#','https://ebird.org/hotspot/'+dd.response.result.location['loc-id']);
				e.popup.setContent(pop)
			}
		}
	})
}