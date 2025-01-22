/* eslint-disable max-len */

const autoBind = require('auto-bind');

class CollaborationsHandler {
  constructor(collaborationsService, playlistService, validator) {
    this.collaborationsService = collaborationsService;
    this.playlistService = playlistService;
    this.validator = validator;

    autoBind(this);
  }

  async addCollaborationHandler(request, h) {
    this.validator.validateCollaborationPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this.playlistService.verifyPlaylistOwner(playlistId, credentialId);

    const collaborationId = await this.collaborationsService.addCollaboration(credentialId, playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil ditambahkan',
      data: {
        collaborationId,
      },
    });

    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request, h) {
    this.validator.validateCollaborationPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { playlistId, userId } = request.payload;

    await this.playlistService.verifyPlaylistOwner(playlistId, credentialId);
    await this.collaborationsService.deleteCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    });

    response.code(200);
    return response;
  }
}

module.exports = CollaborationsHandler;
