/* eslint-disable */

export const showMap = (locations) => {
	mapboxgl.accessToken =
		'pk.eyJ1Ijoic2lkbWlyemE0IiwiYSI6ImNrZzlqejlqdTByeTAycXFucHVraDE3dXYifQ.kZ-JoXQk3zw13hJtNWgxqQ';

	const map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/sidmirza4/ckghjhu3g0bst19nxmhi41k1l',
		scrollZoom: false,
	});

	const nav = new mapboxgl.NavigationControl();
	map.addControl(nav, 'top-right');

	const bounds = new mapboxgl.LngLatBounds();

	locations.forEach((loc) => {
		// Create Marker
		const el = document.createElement('div');
		el.className = 'marker';

		// add marker
		new mapboxgl.Marker({
			element: el,
			anchor: 'bottom',
		})
			.setLngLat(loc.coordinates)
			.addTo(map);

		// add popup
		new mapboxgl.Popup({
			offset: 30,
		})
			.setLngLat(loc.coordinates)
			.setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
			.addTo(map);

		// extends the map bounds to include the current location
		bounds.extend(loc.coordinates);
	});

	map.fitBounds(bounds, {
		padding: {
			top: 200,
			bottom: 150,
			left: 100,
			right: 100,
		},
	});
};
