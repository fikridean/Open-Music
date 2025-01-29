const { Pool } = require('pg');
const { nanoid } = require('nanoid');

const NotFoundError = require('../exceptions/NotFoundError');
const InvariantError = require('../exceptions/InvariantError');
const ClientError = require('../exceptions/ClientError');

class AlbumsService {
  constructor(cacheService) {
    this.cacheService = cacheService;
    this.pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    try {
      const result = await this.cacheService.get(`album:${id}`);
      return {
        result: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [id],
      };

      const querySongs = {
        text: 'SELECT * FROM songs WHERE album_id = $1',
        values: [id],
      };

      const album = await this.pool.query(queryAlbum);

      if (!album.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      if (album.rows[0].cover) {
        const coverUrl = `http://${process.env.HOST}:${process.env.PORT}/albums/${id}/covers/${album.rows[0].cover}`;
        album.rows[0].coverUrl = coverUrl;
      } else {
        album.rows[0].coverUrl = null;
      }

      delete album.rows[0].cover;

      if (!album.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const songs = await this.pool.query(querySongs);

      const result = {
        ...album.rows[0],
        songs: songs.rows,
      };

      await this.cacheService.set(`album:${id}`, JSON.stringify(result));

      return {
        result,
        cache: false,
      };
    }
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    await this.cacheService.del(`album:${id}`);

    return result.rows[0].id;
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus album. Id tidak ditemukan');
    }

    await this.cacheService.del(`album:${id}`);
    await this.cacheService.del(`album_likes:${id}`);

    return result.rows[0].id;
  }

  async updateAlbumCoverById(fileLocation, id) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [fileLocation, id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui cover album. Id tidak ditemukan');
    }

    await this.cacheService.del(`album:${id}`);

    return result.rows[0].id;
  }

  async likeAlbumById(albumId, credentialId) {
    const queryCheckAlbumExist = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const checkAlbum = await this.pool.query(queryCheckAlbumExist);

    if (!checkAlbum.rows.length) {
      throw new NotFoundError('Gagal menambahkan like. Album tidak ditemukan');
    }

    const queryCheckAlreadyLike = {
      text: 'SELECT * FROM album_user_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, credentialId],
    };

    const checkLike = await this.pool.query(queryCheckAlreadyLike);

    if (checkLike.rows.length) {
      throw new ClientError('Gagal menambahkan like. Like sudah diberikan sebelumnya');
    }

    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO album_user_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, albumId, credentialId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan like');
    }

    await this.cacheService.del(`album_likes:${albumId}`);

    return result.rows[0].id;
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this.cacheService.get(`album_likes:${albumId}`);
      return {
        result: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const queryCheckAlbumExist = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [albumId],
      };

      const checkAlbum = await this.pool.query(queryCheckAlbumExist);

      if (!checkAlbum.rows.length) {
        throw new NotFoundError('Gagal menampilkan like. Album tidak ditemukan');
      }

      const query = {
        text: 'SELECT * FROM album_user_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this.pool.query(query);
      await this.cacheService.set(`album_likes:${albumId}`, JSON.stringify(result.rows.length));

      return {
        result: result.rows.length,
        cache: false,
      };
    }
  }

  async unlikeAlbumById(albumId, credentialId) {
    const queryCheckAlbumExist = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const checkAlbum = await this.pool.query(queryCheckAlbumExist);

    if (!checkAlbum.rows.length) {
      throw new NotFoundError('Gagal menghapus like. Album tidak ditemukan');
    }

    const queryCheckAlreadyLike = {
      text: 'SELECT * FROM album_user_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, credentialId],
    };

    const checkLike = await this.pool.query(queryCheckAlreadyLike);

    if (!checkLike.rows.length) {
      throw new ClientError('Gagal menghapus like. Saat ini user tidak memberikan like pada album ini');
    }

    const query = {
      text: 'DELETE FROM album_user_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, credentialId],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like');
    }

    await this.cacheService.del(`album_likes:${albumId}`);

    return result.rows[0].id;
  }
}

module.exports = AlbumsService;
