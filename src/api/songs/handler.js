/* eslint-disable no-underscore-dangle */

const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;

    autoBind(this);
  }

  async addSongHandler(request, h) {
    this.validator.validateSongPayload(request.payload);
    const {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    } = request.payload;

    const songId = await this.service.addSong({
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'Song berhasil ditambahkan',
      data: {
        songId,
      },
    });

    response.code(201);
    return response;
  }

  async getAllSongsHandler(request, h) {
    this.validator.validateSongSearchQuery(request.query);
    const { title = '', performer = '' } = request.query;

    const { result, cache } = await this.service.getAllSongs(title, performer);

    const response = h.response({
      status: 'success',
      data: {
        songs: result,
      },
    });

    response.code(200);

    if (cache) {
      response.header('X-Data-Source', 'cache');
    } else {
      response.header('X-Data-Source', 'db');
    }

    return response;
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;
    const { result, cache } = await this.service.getSongById(id);

    const response = h.response({
      status: 'success',
      data: {
        song: result,
      },
    });

    response.code(200);

    if (cache) {
      response.header('X-Data-Source', 'cache');
    } else {
      response.header('X-Data-Source', 'db');
    }

    return response;
  }

  async editSongByIdHandler(request, h) {
    this.validator.validateSongPayload(request.payload);
    const {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    } = request.payload;
    const { id } = request.params;

    await this.service.editSongById(id, {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      message: 'Song berhasil diperbarui',
    });

    response.code(200);
    return response;
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;
    await this.service.deleteSongById(id);

    const response = h.response({
      status: 'success',
      message: 'Song berhasil dihapus',
    });

    response.code(200);
    return response;
  }
}

module.exports = SongsHandler;
