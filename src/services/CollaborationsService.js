const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');

class CollaborationsService {
  constructor() {
    this.pool = new Pool();
  }

  async addCollaboration(credentialId, playlistId, userId) {
    const queryCheckUserExist = {
      text: 'SELECT id FROM users WHERE id = $1',
      values: [userId],
    };

    const resultCheckUserExist = await this.pool.query(queryCheckUserExist);

    if (!resultCheckUserExist.rows.length) {
      throw new NotFoundError('Kolaborasi gagal ditambahkan. User tidak dapat ditemukan');
    }

    if (userId === credentialId) {
      throw new InvariantError('Kolaborasi gagal ditambahkan. User tidak dapat menambahkan diri sendiri');
    }

    const queryCheckPlaylistExist = {
      text: 'SELECT id FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const resultCheckPlaylistExist = await this.pool.query(queryCheckPlaylistExist);

    if (!resultCheckPlaylistExist.rows.length) {
      throw new NotFoundError('Kolaborasi gagal ditambahkan. Playlist tidak dapat ditemukan');
    }

    const id = `collab-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_users VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM playlist_users WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      values: [playlistId, userId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal dihapus');
    }

    return result.rows[0].id;
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlist_users WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Kolaborasi gagal diverifikasi');
    }

    return result.rows;
  }
}

module.exports = CollaborationsService;
