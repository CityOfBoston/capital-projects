import React from 'react';
import PropTypes from 'prop-types';
import Table from './Table';
import getConfig from 'next/config';
import getPopupHTML from './Popup';

// We can't import these server-side because they require "window"
const mapboxgl = process.browser ? require('mapbox-gl') : null;
const MapboxGeocoder = process.browser
  ? require('@mapbox/mapbox-gl-geocoder')
  : null;

const CITY_COUNCIL_DISTRICTS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/City_Council_Districts_View/FeatureServer/0';

const BUDGET_FACILITIES_URL = `https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_budget_facilities/FeatureServer/0`;

const PEDESTRIAN_RAMPS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_pedestrian_ramps/FeatureServer/0';

const STREET_RECONSTRUCTION_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_street_reconstruction/FeatureServer/0';

// TODO: ADD TO MAP
const INTERSECTION_RECONSTRUCTION_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_resconstruction_intersections/FeatureServer/0';

// TODO: ADD TO MAP
const STREET_PROJECTS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_street_capital_projects/FeatureServer/0';

// TODO: ADD TO MAP
const ARP_STREETS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_arp_streets/FeatureServer/0';

// TODO: ADD TO MAP
const SOUTHWEST_CORRIDOR_URLS =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_south_west_corridor_crossings/FeatureServer/0';

const WALKABLE_STREETS_SIDEWALKS_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_walkable_streets_sidewalk_reconstruction/FeatureServer/0';

// TODO: add to map
const SLOW_STREETS_LINES_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/fy20_btd_corridors_slow_streets/FeatureServer/0';

// Separate out the colors for each status so we can more easily use them across
// datasets.
const STATUS_PLANNING_COLOR = '#F18821';
const STATUS_DESIGN_COLOR = '#7D65AC';
const STATUS_CONSTRUCTION_COLOR = '#58B652';
const STATUS_ANNUAL_PROGRAM_COLOR = '#288BE4';

// When a user clicks on a feature, we have to highlight it according to
// the data type. We use this function below to determine which highlight
// layer should be used based on what layer a user clicked on.
const getHighlightLayer = layer => {
  if (
    layer == 'slowStreetsLines' ||
    layer == 'streetsCapitalProjects' ||
    layer == 'arpStreets' ||
    layer == 'streetReconstruction' ||
    layer == 'slowStreetsAreas-outline'
  ) {
    return 'highlight-line';
  } else if (
    layer == 'walkableStreetsSidewalks' ||
    layer == 'slowStreetsAreas'
  ) {
    return 'highlight-polygon';
  } else {
    return 'highlight-point';
  }
};

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clickedFeatureDataset: '',
      clickedFeatureProperties: [],
      clickedFeature: '',
      showTable: false,
    };
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      center: [-71.068, 42.34],
      zoom: 13,
      maxZoom: 19,
      style: {
        version: 8,
        // Despite mapbox enabling vector basemaps, we use our own tiled
        // basemap service to keep with city styling and branding.
        sources: {
          'esri-grey': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
          },
          'cob-basemap': {
            type: 'raster',
            tiles: [
              'https://awsgeo.boston.gov/arcgis/rest/services/Basemaps/BostonCityBasemap_WM/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'esri-grey',
            type: 'raster',
            source: 'esri-grey',
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'cob-basemap',
            type: 'raster',
            source: 'cob-basemap',
            minzoom: 0,
            maxzoom: 20,
          },
        ],
      },
    });

    // In order to add a geocoder to our map, we need a mapbox access token.
    // We've stored that using environment variables inside our nextjs config file.
    const { publicRuntimeConfig } = getConfig();
    const accessToken = publicRuntimeConfig.MapboxAccessToken;

    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      flyTo: true,
      placeholder: 'Show projects near…',
      country: 'us',
      // We set a bounding box so that the geocoder only looks for
      // matches in and around Boston, MA.
      // We need the minX, minY, maxX, maxY in that order.
      bbox: [-71.216812, 42.226992, -70.986099, 42.395573],
      zoom: 14,
    });

    // We want the geocoder div to show up in the Filters component so we've added
    // a div there with the id "geocoder". Here we're appending the mapbox
    // geocoder we just set up to that div.
    document.getElementById('geocoder').appendChild(geocoder.onAdd(this.map));

    this.map.on('load', () => {
      // When the map loads, we load up the icon we're using for showing
      // geocoder results.
      this.map.loadImage(
        '/capital-projects/static/red-waypoint.png',
        (error, image) => {
          if (error)
            // eslint-disable-next-line no-console
            console.error(
              'Could not load red waypoint icon. Error message:',
              error
            );
          this.map.addImage('red-waypoint', image);
        }
      );

      // The order in which the layers are loaded informs the order in which
      // they are drawn. Layers loaded first are drawn first meaning they
      // sit below the other layers.
      // As a result, we load the geocoding point first, as we want that
      // to sit under the other layers to keep it from interfering with click
      // events on the other layers.

      // We add an empty geojson source and layer that we'll populate
      // with the results of the geocoding search when appropriate.
      this.map.addSource('geocoding-result-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: 'geocoding-result',
        source: 'geocoding-result-point',
        type: 'symbol',
        layout: {
          'icon-image': 'red-waypoint',
          'icon-size': 0.25,
        },
      });

      geocoder.on('result', function(ev) {
        geocoder._map
          .getSource('geocoding-result-point')
          .setData(ev.result.geometry);
      });

      // Add city council districts as a contextual layer.
      this.map.addSource('cityCounilDistricts-polygon', {
        type: 'geojson',
        data: `${CITY_COUNCIL_DISTRICTS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      // this.map.addLayer({
      //   id: 'cityCouncilDistricts',
      //   type: 'line',
      //   source: 'cityCounilDistricts-polygon',
      //   paint: {
      //     'line-color': '#091F2F',
      //   },
      // });

      // Add walkable streets as a layer.
      this.map.addSource('walkableStreetsSidewalks-polygon', {
        type: 'geojson',
        data: `${WALKABLE_STREETS_SIDEWALKS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'walkableStreetsSidewalks',
        type: 'fill',
        source: 'walkableStreetsSidewalks-polygon',
        paint: {
          'fill-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
          'fill-outline-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
        },
      });
      
      // Add walkable streets as a layer.
      this.map.addSource('walkableStreetsSidewalks-polygon', {
        type: 'geojson',
        data: `${WALKABLE_STREETS_SIDEWALKS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'walkableStreetsSidewalks',
        type: 'fill',
        source: 'walkableStreetsSidewalks-polygon',
        paint: {
          'fill-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
          'fill-outline-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
        },
      });

      // Add the individual streets in each neighborhood slow street as a layer.
      this.map.addSource('slowStreetsLines-line', {
        type: 'geojson',
        data: `${SLOW_STREETS_LINES_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'slowStreetsLines',
        type: 'line',
        source: 'slowStreetsLines-line',
        paint: {
          'line-color': [
            'match',
            ['get', 'FY20_Statu'],
            'Planning',
            `${STATUS_PLANNING_COLOR}`,
            'Design',
            `${STATUS_DESIGN_COLOR}`,
            'Construction',
            `${STATUS_CONSTRUCTION_COLOR}`,
            /* other */ '#ccc',
          ],
          'line-width': { stops: [[10, 1], [11, 1.5], [20, 6]] },
        },
      });

      // Add streets capital projects
      this.map.addSource('streetsCapitalProjects-line', {
        type: 'geojson',
        data: `${STREET_PROJECTS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'streetsCapitalProjects',
        type: 'line',
        source: 'streetsCapitalProjects-line',
        paint: {
          'line-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
          'line-width': { stops: [[10, 1], [11, 1.5], [20, 6]] },
        },
      });

      // Add ARP Streets
      this.map.addSource('arpStreets-line', {
        type: 'geojson',
        data: `${ARP_STREETS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'arpStreets',
        type: 'line',
        source: 'arpStreets-line',
        paint: {
          'line-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
          'line-width': { stops: [[10, 1], [11, 1.5], [20, 6]] },
        },
      });

      // Add street and sidewalk reconstruction as a layer.
      this.map.addSource('streetReconstruction-line', {
        type: 'geojson',
        data: `${STREET_RECONSTRUCTION_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'streetReconstruction',
        type: 'line',
        source: 'streetReconstruction-line',
        paint: {
          'line-color': [
            'match',
            ['get', 'Status'],
            'Start 2019',
            `${STATUS_PLANNING_COLOR}`,
            'In Construction',
            `${STATUS_CONSTRUCTION_COLOR}`,
            /* other */ '#ccc',
          ],
          // Make line width larger as we zoom in.
          'line-width': { stops: [[10, 1], [11, 2], [20, 6]] },
        },
        layout: {
          'line-cap': 'round',
        },
      });

      // Add southwest corridor points
      this.map.addSource('southwestCorridor-point', {
        type: 'geojson',
        data: `${SOUTHWEST_CORRIDOR_URLS}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'southwestCorridor',
        type: 'circle',
        source: 'southwestCorridor-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          'circle-color': [
            'match',
            ['get', 'FY20_Statu'],
            'Design',
            `${STATUS_PLANNING_COLOR}`,
            /* other */ '#ccc',
          ],
          // Make circles larger as the user zooms from 12 to 17.
          'circle-radius': {
            base: 3,
            stops: [[12, 4], [17, 10]],
          },
        },
      });

      // Add intersection reconstruction work as a layer.
      this.map.addSource('intersectionReconstruction-point', {
        type: 'geojson',
        data: `${INTERSECTION_RECONSTRUCTION_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'intersectionReconstruction',
        type: 'circle',
        source: 'intersectionReconstruction-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          'circle-color': [
            'match',
            ['get', 'Status'],
            'Start 2019',
            `${STATUS_PLANNING_COLOR}`,
            'In Construction',
            `${STATUS_CONSTRUCTION_COLOR}`,
            /* other */ '#ccc',
          ],
          // Make circles larger as the user zooms from 12 to 17.
          'circle-radius': {
            base: 3,
            stops: [[12, 4], [17, 10]],
          },
        },
      });

      // Add the public works ramps as a layer.
      this.map.addSource('pedestrianRamps-point', {
        type: 'geojson',
        data: `${PEDESTRIAN_RAMPS_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'pedestrianRamps',
        type: 'circle',
        source: 'pedestrianRamps-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          'circle-color': `${STATUS_ANNUAL_PROGRAM_COLOR}`,
          // Make circles larger as the user zooms from 12 to 17.
          'circle-radius': {
            base: 3,
            stops: [[12, 4], [17, 10]],
          },
        },
      });

      // Add the budget facilities as a layer.
      this.map.addSource('budgetFacilities-point', {
        type: 'geojson',
        data: `${BUDGET_FACILITIES_URL}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'budgetFacilities',
        type: 'circle',
        source: 'budgetFacilities-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          // We color the circles by project status.
          'circle-color': [
            'match',
            ['get', 'publish_status'],
            'Annual Program',
            `${STATUS_ANNUAL_PROGRAM_COLOR}`,
            'Ongoing Program',
            `${STATUS_ANNUAL_PROGRAM_COLOR}`,
            'In Construction',
            `${STATUS_CONSTRUCTION_COLOR}`,
            'Implementation Underway',
            `${STATUS_CONSTRUCTION_COLOR}`,
            'In Design',
            `${STATUS_DESIGN_COLOR}`,
            'New Project',
            `${STATUS_PLANNING_COLOR}`,
            'Study Underway',
            `${STATUS_PLANNING_COLOR}`,
            'To Be Scheduled',
            `${STATUS_PLANNING_COLOR}`,
            /* other */ '#ccc',
          ],
          // Make circles larger as the user zooms from 12 to 17.
          'circle-radius': {
            base: 4,
            stops: [[12, 5.5], [17, 10]],
          },
        },
      });

      // Since we've got points, lines, and polygons on the map and we want features
      // of all geometries to get highlighted when a user clicks on them,
      // we add three more layers: a highlight-point layer, a highlight-line
      // layer, and a highlight-polygon layer.

      // All layers stary out as empty, we style them here then add
      // data to them when a user clicks on a feature.
      this.map.addSource('highlight-point', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: 'highlight-point',
        source: 'highlight-point',
        type: 'circle',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FB4D42',
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
        },
      });

      this.map.addSource('highlight-line', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: 'highlight-line',
        source: 'highlight-line',
        type: 'line',
        paint: {
          'line-width': 6,
          'line-color': '#FB4D42',
        },
        layout: {
          'line-cap': 'round',
        },
      });

      this.map.addSource('highlight-polygon', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addLayer({
        id: 'highlight-polygon',
        source: 'highlight-polygon',
        type: 'fill',
        paint: {
          'fill-color': '#FB4D42',
          'fill-outline-color': '#091F2F',
          'fill-opacity': 0.7,
        },
      });
    });

    // We do a few things when a user clicks:
    // 1. Unhighlight anything that was previously highlighted.
    // 2. Highlight the feature the user clicked on and center the
    //    map on it.
    // 3. Update state so we can show a table populated with information
    //    about the clicked feautre.

    this.map.on('click', e => {
      // Budget aggregates the data so there is only one project per
      // feature (no projects overlap eachother), so we only grab the
      // first feature clicked on.
      const feature = this.map.queryRenderedFeatures(e.point)[0];

      this.map.setLayoutProperty('highlight-point', 'visibility', 'none');
      this.map.setLayoutProperty('highlight-line', 'visibility', 'none');
      this.map.setLayoutProperty('highlight-polygon', 'visibility', 'none');

      // We don't want the red waypoint icon to highlight if a user clicks
      // on it, so we first check to make sure the user clicked on a feature
      // then we check to make sure that feature isn't the geocoding result.
      // The same goes for the City Council Layer and the slow streets layer.
      if (
        feature &&
        feature.layer.id != 'geocoding-result' &&
        feature.layer.id != 'cityCouncilDistricts' &&
        feature.layer.id != 'slowStreetsAreas-outline' &&
        feature.layer.id != 'slowStreetsAreas' &&
        feature.layer.id != 'highlight-point' &&
        feature.layer.id != 'highlight-line' &&
        feature.layer.id != 'highlight-polygon'
      ) {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];
        const highlightLayer = getHighlightLayer(feature.layer.id);
        this.map.setLayoutProperty(highlightLayer, 'visibility', 'visible');
        this.map.getSource(highlightLayer).setData(feature.geometry);
        
        this.setState({
          clickedFeatureDataset: feature.layer.id,
          clickedFeatureProperties: feature.properties,
          clickedFeature: feature,
          showTable: true,
        });

        new mapboxgl.Popup({ closeOnClick: true })
          .setLngLat(coordinates)
          .setHTML(
            `<div style="min-width: 400px; max-width: 500px;">
            ${getPopupHTML(feature)}
            </div>`
          )
          .addTo(this.map);
      } else {
        this.setState({ showTable: false });
      }
    });

    // When we scroll over a clickable feature, change the mouse to a pointer.
    this.map.on('mousemove', e => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: [
          'walkableStreetsSidewalks',
          'slowStreetsLines',
          'streetsCapitalProjects',
          'arpStreets',
          'streetReconstruction',
          'southwestCorridor',
          'intersectionReconstruction',
          'pedestrianRamps',
          'budgetFacilities',
        ],
      });

      features.length > 0
        ? (this.map.getCanvas().style.cursor = 'pointer')
        : (this.map.getCanvas().style.cursor = '');
    });
  }

  // When the cabinet selection changes, we update the map accordingly.
  // The public works data is stored in two different layers, but is part of the
  // 'Streets' cabinet. Same goes for the transportation data (walkable streets
  // and slow streets). When 'Streets' is selected, we make the public works
  // and transportation layers visible and turn them off when other cabinets
  // are selected.
  componentDidUpdate(prevProps) {
    if (prevProps.cabinetSelection !== this.props.cabinetSelection) {
      if (this.props.cabinetSelection == 'All') {
        this.map.setLayoutProperty(
          'walkableStreetsSidewalks',
          'visibility',
          'visible'
        );
        'slowStreetsAreas-outline',
          this.map.setLayoutProperty(
            'slowStreetsAreas',
            'visibility',
            'visible'
          );
        this.map.setLayoutProperty(
          'streetsCapitalProjects',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('arpStreets', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'streetReconstruction',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty(
          'southwestCorridor',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty(
          'intersectionReconstruction',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('pedestrianRamps', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'slowStreetsAreas-outline',
          'visibility',
          'visible'
        );
        this.map.setFilter('budgetFacilities', ['all']);
      } else if (this.props.cabinetSelection == 'Streets') {
        this.map.setLayoutProperty(
          'walkableStreetsSidewalks',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('slowStreetsAreas', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'slowStreetsAreas-outline',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('slowStreetsLines', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'streetsCapitalProjects',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('arpStreets', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'streetReconstruction',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty(
          'southwestCorridor',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty(
          'intersectionReconstruction',
          'visibility',
          'visible'
        );
        this.map.setLayoutProperty('pedestrianRamps', 'visibility', 'visible');
        this.map.setFilter('budgetFacilities', ['==', 'cabinet', 'Streets']);
      } else {
        this.map.setLayoutProperty(
          'walkableStreetsSidewalks',
          'visibility',
          'none'
        );
        this.map.setLayoutProperty('slowStreetsAreas', 'visibility', 'none');
        this.map.setLayoutProperty(
          'slowStreetsAreas-outline',
          'visibility',
          'none'
        );
        this.map.setLayoutProperty('slowStreetsLines', 'visibility', 'none');
        this.map.setLayoutProperty(
          'streetsCapitalProjects',
          'visibility',
          'none'
        );
        this.map.setLayoutProperty('arpStreets', 'visibility', 'none');
        this.map.setLayoutProperty(
          'streetReconstruction',
          'visibility',
          'none'
        );
        this.map.setLayoutProperty('southwestCorridor', 'visibility', 'none');
        this.map.setLayoutProperty(
          'intersectionReconstruction',
          'visibility',
          'none'
        );
        this.map.setLayoutProperty('pedestrianRamps', 'visibility', 'none');
        this.map.setFilter('budgetFacilities', [
          '==',
          'cabinet',
          this.props.cabinetSelection,
        ]);
      }
    }
  }

  componentWillUnmount() {
    this.map.remove();
  }

  render() {
    return (
      <div>
        {/* make map take up entire viewport with room for the navbars */}
        <Table
          dataset={this.state.clickedFeatureDataset}
          properties={this.state.clickedFeatureProperties}
          feature={this.state.clickedFeature}
          visible={this.state.showTable}
        />
        <div
          style={{ height: 'calc(100vh - 125px)' }}
          ref={el => (this.mapContainer = el)}
        />
      </div>
    );
  }
}

export default Map;

Map.propTypes = {
  cabinetSelection: PropTypes.string,
};
