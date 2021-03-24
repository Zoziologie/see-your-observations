var loc

jQuery(document).ready(function() {

	//Create map   
	map = new L.Map('map1');
	//map.setView(L.latLng(46.57591, 7.84956), 8);
	map.fitWorld().zoomIn();
	baseLayers = {
		'MapBox': L.tileLayer.provider('MapBox', {id: 'mapbox/light-v10',accessToken: token.mapbox}).addTo(map),
		'OpenStreetMap': L.tileLayer.provider('OpenStreetMap.Mapnik'),
	};
	control = L.control.layers(baseLayers, null, { collapsed: false	}).addTo(map);
	L.MakiMarkers.accessToken = token.mapbox;


	jQuery('#ModalUpload').modal("toggle") //open modal as entrance page.

	jQuery("#uploadMyEBirdData").change(function(evt) {
		processFile( evt.target.files[0], evt.target.files[0].size )
	});

	// Open my data if me in url
	if ( window.location.search.substring(1).indexOf('me') !== -1 ){
		map.spin(true);
		//console.log('loading personal file')
		jQuery.get("/assets/MyEBirdData.csv", function(data){
			map.spin(false);
			processFile(data, data.length) 
		})
	}



	// Drawing
	editableLayers = new L.FeatureGroup();
	map.addLayer(editableLayers);
	var drawControl = new L.Control.Draw({
		position: 'topright',
		draw: {
			polygon: {
				shapeOptions: {
					color: '#92E9FE',
					clickable: false
				}
			},
			rectangle: {
				shapeOptions: {
					color: '#92E9FE',
					clickable: false
				}
			},
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

		jQuery('#stattitle').html('<span id="stattitle-name">CUSTOM SHAPE</span>')

		list=[];
		makersList.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(e.layer.toGeoJSON())).length>0){
				list = list.concat(m.List);
			}
		});
		jQuery('#chCount').html(numberWithCommas(list.length))
		jQuery('#count-ch').attr('data-content', list.map( id => '<a href="https://ebird.org/view/checklist/'+id+'" target="_blank">'+id+'</a>' ).join(", "))

		cl=0;
		makersObs.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(e.layer.toGeoJSON())).length>0){
				cl += m.count;
			}
		});
		jQuery('#obsCount').html(numberWithCommas(cl))

		var sp= new Set()
		makersSpe.eachLayer(function(m){
			if (leafletPip.pointInLayer(m.getLatLng(), L.geoJSON(e.layer.toGeoJSON())).length>0){
				m.spe.forEach(s => sp.add(s) );
			}
		});
		jQuery('#spCount').html(numberWithCommas(sp.size))
		let spa = Array.from(sp);
		jQuery('#count-sp').attr('data-content', spa.join(', '))

		editableLayers.clearLayers();
		editableLayers.addLayer(e.layer);
	});
})



function processFile( file, size ){
	var percent = 0;
	var progress = 0;
	const data = [];
	jQuery('#MyPg').show()
	jQuery('#loadingtitle').html('Reading the file...')
	var pgbar = document.getElementById("MyPgBar");
	Papa.parse(file, {
		header:true,
		step: function(row,handler) {
			if ( row.data[0]['Common Name'] != undefined  && row.data[0]['Common Name'].indexOf('hybrid')<0 && row.data[0]['Common Name'].indexOf('/')<0 && row.data[0]['Common Name'].indexOf('sp.')<0 ){
				row.data[0]['Common Name'] = row.data[0]['Common Name'].replace(/ *\([^)]*\) */g, "");
				data.push(row.data[0]);
			} else{
				//console.log(row.data[0]['Common Name'])
			}
			progress = progress + Object.values(row.data[0]).join(',').length;

			var newPercent = Math.round(progress / size * 100);
			if (newPercent === percent) return;
			percent = newPercent;
			handler.pause();

			pgbar.style.width = percent + '%'; 
			//pgbar.innerHTML = percent * 1  + '%';
			setTimeout(function(){handler.resume()},0)
		},
		complete: function() {
			//data = results.data;
			//fields = results.meta.fields;

			var checklists = data.reduce( (acc, cur) =>  acc.indexOf(cur['Submission ID'])<0 ? acc.concat(cur['Submission ID']) : acc , [] )
			var species = data.reduce( (acc, cur) =>  acc.indexOf(cur['Common Name'])<0 ? acc.concat(cur['Common Name']) : acc , [] )
			jQuery('#spCount').html(numberWithCommas(species.length))
			jQuery('#obsCount').html(numberWithCommas(data.length))
			jQuery('#chCount').html(numberWithCommas(checklists.length))
			jQuery('#count-sp').attr('data-content', species.join(', '))
			jQuery('#count-ch').attr('data-content', checklists.map( id => '<a href="https://ebird.org/view/checklist/'+id+'" target="_blank">'+id+'</a>' ).join(", "))

			jQuery('#ModalUpload').modal("hide");
			map.spin(true);
			setTimeout(function(){
				loc_all = data.map(function(d_tmp){
					d={};
					d.Location = d_tmp.Location;
					d.Latitude = d_tmp.Latitude;
					d.Longitude = d_tmp.Longitude;
					d.region = d_tmp['State/Province'];
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

				//var region = loc.reduce( (acc, cur) =>  acc.indexOf(cur.region)<0 ? acc.concat(cur.region) : acc , [] )
				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countObs]))).addTo(map)
				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countSpe])).addTo(map))
				//control.addOverlay(L.heatLayer(	loc.map(l => [parseFloat(l.Latitude), parseFloat(l.Longitude), l.countList])).addTo(map))


				makersList = L.markerClusterGroup({
					//showCoverageOnHover:0,
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
					//showCoverageOnHover:0,
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
					//showCoverageOnHover:0,
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
					//pop = '<b>'+l.Location +'</b><br><b>Species:</b> '+ l.Spe.join(', ')+'<br><b>Checklists:</b> '+l.List.map( id => '<a href="https://ebird.org/view/checklist/'+id+'" target="_blank">'+id+'</a>' ).join(", ");
					var mList = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countList < 100  ? l.countList : (l.countList < 1000 ? 'c' : 'k' ),
						})
					}).on('click', function(e){footerfill(e, l)});
					mList.count = l.countList;
					mList.location = l.Location
					mList.List = l.List;
					makersList.addLayer(mList);
					var mObs = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countObs < 100  ? l.countObs : (l.countObs < 1000 ? 'c' : 'k' )
						})
					}).on('click', function(e){footerfill(e, l)});
					mObs.count = l.countObs;
					mObs.location = l.Location
					makersObs.addLayer(mObs);
					var mSpe = L.marker([parseFloat(l.Latitude), parseFloat(l.Longitude)],{
						icon:L.MakiMarkers.icon({
							icon: l.countSpe < 100  ? l.countSpe : (l.countSpe < 1000 ? 'c' : 'k' )
						})
					}).on('click', function(e){footerfill(e, l)});
					mSpe.count = l.countSpe;
					mSpe.spe = l.Spe;
					mSpe.location = l.Location
					makersSpe.addLayer(mSpe);
				})


				control.addOverlay(makersList,'Your Lists')
				control.addOverlay(makersObs,'Your Observations')
				control.addOverlay(makersSpe.addTo(map),'Your Species')
				map.fitBounds(makersSpe.getBounds());
				map.spin(false);
				jQuery('[data-toggle="popover"]').popover()
			},0)
},
});
}


const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

footerfill = function(e, l){
	if (e.target.hotspot == undefined){
		var latLng = e.target.getLatLng();
		jQuery.get('https://ebird.org/ws2.0/ref/hotspot/geo?lng='+latLng.lng+'&lat='+latLng.lat+'&dist=1&fmt=json&key='+token.ebird ,function(dd){
			e.target.hotspot='';
			if (dd.length>0){
				ddd = dd.filter( val => val.locName == e.target.location );
				if (ddd.length>0) {
					e.target.hotspot = ddd[0].locId;
				}
			}

			if (e.target.hotspot.length>0){
				//var txt ='<a href="https://ebird.org/hotspot/'+e.target.hotspot+'" target="_blank"><img class="img-hotspot" title="eBird hotspot page" src="https://zoziologie.raphaelnussbaumer.com/assets/SeeYourObservations/images/hotspot-icon-hotspot.png"></a>';
				var txt ='<a href="https://ebird.org/hotspot/'+e.target.hotspot+'" target="_blank" id="stattitle-name">'+l.Location.toUpperCase()+'</a>';
				txt += '<a href="https://ebird.org/targets?&r1='+e.target.hotspot+'" target="_blank" title="Your target list" class="stattitle-link"><i class="far fa-lg fa-dot-circle img-hotspot"></i> Target</a>'
				txt += '<a href="https://ebird.org/MyEBird?cmd=list&r='+e.target.hotspot+'" target="_blank" title="Your exact list" class="stattitle-link"><i class="fas fa-lg fa-list img-hotspot"></i> List</a>'
				jQuery('#stattitle').html(txt)
			}

		})
	} else {
		jQuery('#stattitle').html('<span id="stattitle-name">'+l.Location.toUpperCase()+'</span>')	
	}

	jQuery('#spCount').html(numberWithCommas(l.countSpe))
	jQuery('#chCount').html(numberWithCommas(l.countList))
	jQuery('#obsCount').html(numberWithCommas(l.countObs))

	jQuery('#count-sp').attr('data-content', l.Spe.join(', '))
	jQuery('#count-ch').attr('data-content', l.List.map( id => '<a href="https://ebird.org/view/checklist/'+id+'" target="_blank">'+id+'</a>' ).join(", "))
}