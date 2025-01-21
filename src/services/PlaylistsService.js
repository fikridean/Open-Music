const { Pool } = require('pg');

const { nanoid } = require('nanoid');

const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');
const AuthorizationError = require('../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this.pool = new Pool();
  }

  async addPlaylist(name, owner) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `
        SELECT playlists.id, playlists.name, users.username
        FROM playlists
        INNER JOIN users
        ON playlists.owner = users.id
        WHERE playlists.owner = $1
      `,
      values: [owner],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal dihapus. Id tidak ditemukan');
    }

    return result.rows[0].id;
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist-${nanoid(16)}`;

    const queryCheckSongExist = {
      text: 'SELECT id FROM songs WHERE id = $1',
      values: [songId],
    };

    const resultCheckSongExist = await this.pool.query(queryCheckSongExist);

    if (!resultCheckSongExist.rows.length) {
      throw new NotFoundError('Lagu tidak dapat ditemukan');
    }

    const queryCheckSongInPlaylist = {
      text: 'SELECT song_id FROM playlist_songs WHERE song_id = $1 AND playlist_id = $2',
      values: [songId, playlistId],
    };

    const resultCheckSongInPlaylist = await this.pool.query(queryCheckSongInPlaylist);

    if (resultCheckSongInPlaylist.rows.length) {
      throw new InvariantError('Lagu sudah ditambahkan ke playlist');
    }

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  async getSongsInPlaylist(playlistId) {
    const query = {
      text: `
        SELECT playlists.id as playlist_id, playlists.name, users.username, songs.id as songs_id, songs.title, songs.performer FROM songs
        LEFT JOIN playlist_songs ON songs.id = playlist_songs.song_id
        LEFT JOIN playlists ON playlist_songs.playlist_id = playlists.id
        LEFT JOIN users ON playlists.owner = users.id
        WHERE playlist_songs.playlist_id = $1
      `,
      values: [playlistId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan atau lagu tidak ada dalam playlist');
    }

    const playlist = {
      id: result.rows[0].playlist_id,
      name: result.rows[0].name,
      username: result.rows[0].username,
      songs: result.rows.map((song) => ({
        id: song.songs_id,
        title: song.title,
        performer: song.performer,
      })),
    };

    return playlist;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari playlist. Id lagu tidak ditemukan atau lagu tidak ada dalam playlist');
    }

    return result.rows[0].id;
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }
}

module.exports = PlaylistsService;
