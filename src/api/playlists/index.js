const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const playlistsHandler = new AlbumsHandler(service, validator);
    server.route(routes(playlistsHandler));
  },
};
