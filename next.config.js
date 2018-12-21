require('dotenv').config();

module.exports = {
  assetPrefix: '.',
  publicRuntimeConfig: {
    MapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
  },
  exportPathMap: function() {
    return {
      '/': { page: '/' },
      '/about': { page: '/about' },
    };
  },
};
