/* eslint-disable no-underscore-dangle */

const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;

    autoBind(this);
  }

  async addPlaylistHandler(request, h) {
    this.validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    const playlistId = await this.service.addPlaylist(name, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this.service.getPlaylists(credentialId);

    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });

    response.code(200);
    return response;
  }

  async deletePlaylistHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistOwner(id, credentialId);
    await this.service.deletePlaylistById(id);

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });

    response.code(200);
    return response;
  }

  async addSongToPlaylistHandler(request, h) {
    this.validator.validatePlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    await this.service.verifyPlaylistAccess(id, credentialId);
    await this.service.addSongToPlaylist(id, songId);
    await this.service.addActivity(id, songId, credentialId, 'add');

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });

    response.code(201);
    return response;
  }

  async getSongsInPlaylistHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    const playlist = await this.service.getSongsInPlaylist(id);

    const response = h.response({
      status: 'success',
      data: {
        playlist,
      },
    });

    response.code(200);
    return response;
  }

  async deleteSongFromPlaylistHandler(request, h) {
    this.validator.validatePlaylistSongPayload(request.payload);
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    await this.service.deleteSongFromPlaylist(id, songId);
    await this.service.addActivity(id, songId, credentialId, 'delete');
    console.log('deleteSongFromPlaylistHandler');

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    });

    response.code(200);
    return response;
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.verifyPlaylistAccess(id, credentialId);
    const activities = await this.service.getPlaylistActivities(id);

    const response = h.response({
      status: 'success',
      data: activities,
    });

    response.code(200);
    return response;
  }
}

module.exports = PlaylistsHandler;
