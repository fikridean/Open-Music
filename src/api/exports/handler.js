class ExportsHandler {
  constructor(ExportsService, playlistsService, validator) {
    this.exportsService = ExportsService;
    this.playlistsService = playlistsService;
    this.validator = validator;

    this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this.validator.validateExportPlaylistsPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { targetEmail } = request.payload;
    const { id } = request.params;

    await this.playlistsService.verifyPlaylistAccess(id, credentialId);

    const message = {
      playlistId: id,
      targetEmail,
    };

    await this.exportsService.sendMessage('export:playlists', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });

    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
