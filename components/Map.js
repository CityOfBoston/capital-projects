import React from 'react';

// We can't import these server-side because they require "window"
const mapboxgl = process.browser ? require('mapbox-gl') : null;

const projects_url =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/FY2019_FY2023_Budget_Facilities_ADOPTED/FeatureServer/0';

class Map extends React.Component {
  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      center: [-71.067449, 42.352568],
      zoom: 13,
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
      // We add the capital projects as geojson
      this.map.addSource('projects', {
        type: 'geojson',
        data: `${projects_url}/query?where=1%3D1&outFields=*&outSR=4326&returnExceededLimitFeatures=true&f=pgeojson`,
      });

      this.map.addLayer({
        id: 'projects-point',
        type: 'circle',
        source: 'projects',
        paint: {
          'circle-stroke-width': 1,
        },
      });
    });
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
