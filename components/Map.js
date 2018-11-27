import React from 'react';
import PropTypes from 'prop-types';

// We can't import these server-side because they require "window"
const mapboxgl = process.browser ? require('mapbox-gl') : null;

const projects_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/FY2019_FY2023_Budget_Facilities_ADOPTED/FeatureServer/0';

const public_works_ramps_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/BudgetFacilitiesFY2019/FeatureServer/2';

const city_council_districts_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/City_Council_Districts_View/FeatureServer/0';

class Map extends React.Component {
  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      center: [-71.084578, 42.309578],
      zoom: 11,
      maxZoom: 19,
      style: {
        version: 8,
        // Despite mapbox enabling vector basemaps, we use our own tiled
        // basemap service to keep with city styling and branding
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

    this.map.on('load', () => {
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
    });

    // Add pop-ups to map
    this.map.on('click', e => {
      // Budget aggregates the data so there is only one project per
      // feature (no projects overlap eachother), so we only grab the
      // first feature clicked on.
      const feature = this.map.queryRenderedFeatures(e.point)[0];
      const dataset = feature.layer.id;
      // Feature properties can differ based on the data selected.
      const properties =
        dataset == 'budgetFacilities'
          ? [
              feature.properties.Project_Title,
              feature.properties.Project_Description,
              feature.properties.Publish_Status,
              feature.properties.Total_Budget,
              feature.properties.Department,
              feature.properties.Cabinet,
            ]
          : [
              // Set the properties for publicWorksRamps.
              feature.properties.Street,
              feature.properties.NAME,
              feature.properties.CITYCODE,
              feature.properties.CONDITION,
            ];

      new mapboxgl.Popup({ closeOnClick: true })
        .setLngLat(feature.geometry.coordinates)
        // We create HTML elements for the populated properties.
        .setHTML(
          `<div style="min-width: 200px; max-width: 250px">
        <div>
            <ul class="dl dl--sm">
              <li class="dl-i dl-i--b">
                <div class="dl-d">${properties[0]}</div>
              </li>        
              <li class="dl-i dl-i--b">
                <div class="dl-t">
                ${properties.map(property => `${property}`).join('<br/>')}
                </div>
              </li>
            </ul>
        </div>`
        )
        .addTo(this.map);
    });

    // When we scroll over a point, change the mouse to a pointer.
    this.map.on('mousemove', e => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['budgetFacilities', 'publicWorksRamps'],
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
        this.map.setFilter('budgetFacilities', ['all']);
        // The public works data is stored in a different layer, but is part of the
        // 'Streets' cabinet. When 'Streets' is selected, we make the public works
        // layer visible and turn it off when other cabinets are selected.
      } else if (this.props.cabinetSelection == 'Streets') {
        this.map.setLayoutProperty('publicWorksRamps', 'visibility', 'visible');
        this.map.setFilter('budgetFacilities', ['==', 'Cabinet', 'Streets']);
      } else {
        this.map.setLayoutProperty('publicWorksRamps', 'visibility', 'none');
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
