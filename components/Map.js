import React from 'react';
import PropTypes from 'prop-types';
import Table from './Table';
import getConfig from 'next/config';

// We can't import these server-side because they require "window"
const mapboxgl = process.browser ? require('mapbox-gl') : null;
const MapboxGeocoder = process.browser
  ? require('@mapbox/mapbox-gl-geocoder')
  : null;

const projects_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/FY2019_FY2023_Budget_Facilities_ADOPTED/FeatureServer/0';

const public_works_ramps_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/BudgetFacilitiesFY2019/FeatureServer/2';

const public_works_streets_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/ArcGIS/rest/services/pwd_capitalProjects_test/FeatureServer/0';

const city_council_districts_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/City_Council_Districts_View/FeatureServer/0';

class Map extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clickedFeatureDataset: '',
      clickedFeatureProperties: [],
      showTable: false,
    };
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      center: [-71.066834, 42.315642],
      zoom: 11,
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
    // We've stored that using environment variables inside out nextjs config file.
    const { publicRuntimeConfig } = getConfig();
    const accessToken = publicRuntimeConfig.MapboxAccessToken;

    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      flyTo: true,
      placeholder: 'Show projects near...',
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
      // Next is City Council Districts as that is a contextual layer. The
      // public works street projects, public works ramps, budget
      // facilities, and highlight layers are loaded next in that order.

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
        data: `${city_council_districts_url}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'cityCouncilDistricts',
        type: 'line',
        source: 'cityCounilDistricts-polygon',
        paint: {
          'line-color': '#091F2F',
        },
      });

      // Add street work as a layer.
      this.map.addSource('publicWorksStreets-line', {
        type: 'geojson',
        data: `${public_works_streets_url}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'publicWorksStreets',
        type: 'line',
        source: 'publicWorksStreets-line',
        paint: {
          'line-color': '#091F2F',
          // Make line width larger as we zoom in.
          'line-width': { stops: [[10, 1], [11, 2], [20, 6]] },
        },
        layout: {
          'line-cap': 'round',
        },
      });

      // Add the public works ramps as a layer.
      this.map.addSource('publicWorksRamps-point', {
        type: 'geojson',
        data: `${public_works_ramps_url}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'publicWorksRamps',
        type: 'circle',
        source: 'publicWorksRamps-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          'circle-color': '#c1c1c1',
          // Make circles larger as the user zooms from 12 to 22.
          'circle-radius': {
            base: 3,
            stops: [[12, 3], [17, 10]],
          },
        },
      });

      // Add the budget facilities as a layer.
      this.map.addSource('budgetFacilities-point', {
        type: 'geojson',
        data: `${projects_url}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'budgetFacilities',
        type: 'circle',
        source: 'budgetFacilities-point',
        paint: {
          'circle-stroke-width': 1,
          'circle-stroke-color': '#091F2F',
          'circle-color': '#288BE4',
          // Make circles larger as the user zooms from 12 to 22.
          'circle-radius': {
            base: 4,
            stops: [[12, 4], [17, 10]],
          },
        },
      });

      // Since we've got points and lines on the map and we want features
      // of both geometries to get highlighted when a user clicks on them,
      // we add two more layers: a highlight-point layer and a highlight-line
      // layer.

      // Both layers stary out as empty, we style them here then add
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

      // We don't want the red waypoint icon to highlight if a user clicks
      // on it, so we first check to make sure the user clicked on a feature
      // then we check to make sure that feature isn't the geocoding result.
      if (feature && feature.layer.id != 'geocoding-result') {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];
        const highlightLayer =
          feature.layer.id == 'publicWorksStreets'
            ? 'highlight-line'
            : 'highlight-point';
        this.map.setLayoutProperty(highlightLayer, 'visibility', 'visible');
        this.map.getSource(highlightLayer).setData(feature.geometry);

        // We want the map to center on the clicked point. Because we have
        // the pop-up display as a div in the bottom section of the map, we
        // do a little math on the latitude to adjust the map's "center".
        this.map.flyTo({
          center: [
            coordinates[0],
            coordinates[1] +
              0.5 *
                0.33 *
                (this.map.getBounds().getSouth() -
                  this.map.getBounds().getNorth()),
          ],
        });

        this.setState({
          clickedFeatureDataset: feature.layer.id,
          clickedFeatureProperties: feature.properties,
          showTable: true,
        });
      } else {
        this.setState({ showTable: false });
      }
    });

    // When we scroll over a clickable feature, change the mouse to a pointer.
    this.map.on('mousemove', e => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['budgetFacilities', 'publicWorksRamps', 'publicWorksStreets'],
      });

      features.length > 0
        ? (this.map.getCanvas().style.cursor = 'pointer')
        : (this.map.getCanvas().style.cursor = '');
    });
  }

  // When the cabinet selection changes, we update the map accordingly.
  componentDidUpdate(prevProps) {
    if (prevProps.cabinetSelection !== this.props.cabinetSelection) {
      if (this.props.cabinetSelection == 'All') {
        this.map.setLayoutProperty('publicWorksRamps', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'publicWorksStreets',
          'visibility',
          'visible'
        );
        this.map.setFilter('budgetFacilities', ['all']);
        // The public works data is stored in two different layers, but is part of the
        // 'Streets' cabinet. When 'Streets' is selected, we make the public works
        // layer visible and turn it off when other cabinets are selected.
      } else if (this.props.cabinetSelection == 'Streets') {
        this.map.setLayoutProperty('publicWorksRamps', 'visibility', 'visible');
        this.map.setLayoutProperty(
          'publicWorksStreets',
          'visibility',
          'visible'
        );
        this.map.setFilter('budgetFacilities', ['==', 'Cabinet', 'Streets']);
      } else {
        this.map.setLayoutProperty('publicWorksRamps', 'visibility', 'none');
        this.map.setLayoutProperty('publicWorksStreets', 'visibility', 'none');
        this.map.setFilter('budgetFacilities', [
          '==',
          'Cabinet',
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
