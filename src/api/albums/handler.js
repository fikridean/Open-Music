/* eslint-disable no-underscore-dangle */

const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this.service = albumsService;
    this.storageService = storageService;
    this.validator = validator;

    autoBind(this);
  }

  async addAlbumHandler(request, h) {
    this.validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this.service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const album = await this.service.getAlbumById(id);

    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });

    response.code(200);
    return response;
  }

  async editAlbumByIdHandler(request, h) {
    this.validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const { id } = request.params;

    await this.service.editAlbumById(id, { name, year });

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });

    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this.service.deleteAlbumById(id);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });

    response.code(200);
    return response;
  }

  async addAlbumCoverHandler(request, h) {
    const { cover } = request.payload;
    this.validator.validateAlbumCoverPayload(cover.hapi.headers);
    const { id } = request.params;
    let fileLocation;

    try {
      fileLocation = await this.storageService.writeFile(cover, cover.hapi);
    } catch (error) {
      const response = h.response({
        status: 'error',
        message: 'Gagal menambahkan sampul album. File terlalu besar',
      });

      response.code(413);
      return response;
    }

    await this.service.updateAlbumCoverById(fileLocation, id);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });

    response.code(201);
    return response;
  }

  async likeAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this.service.likeAlbumById(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil dilike',
    });

    response.code(201);
    return response;
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id } = request.params;
    const likes = await this.service.getAlbumLikesById(id);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });

    response.code(200);
    return response;
  }

  async unlikeAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this.service.unlikeAlbumById(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diunlike',
    });

    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
