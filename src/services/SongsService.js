const { Pool } = require('pg');

const { nanoid } = require('nanoid');

const NotFoundError = require('../exceptions/NotFoundError');
const InvariantError = require('../exceptions/InvariantError');

class SongsService {
  constructor(cacheService) {
    this.pool = new Pool();
    this.cacheService = cacheService;
  }

  async addSong(
    {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    },
  ) {
    const id = `song-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Song gagal ditambahkan');
    }

    await this.cacheService.del('songs:all');

    return result.rows[0].id;
  }

  async getAllSongs(title, performer) {
    let result;

    if (!title && !performer) {
      try {
        result = await this.cacheService.get('songs:all');
        return {
          result: JSON.parse(result),
          cache: true,
        };
      } catch (error) {
        result = await this.pool.query('SELECT id, title, performer FROM songs');
        await this.cacheService.set('songs:all', JSON.stringify(result.rows));
      }
    } else if (title && !performer) {
      result = await this.pool.query({
        text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1',
        values: [`%${title}%`],
      });
    } else if (!title && performer) {
      result = await this.pool.query({
        text: 'SELECT id, title, performer FROM songs WHERE performer ILIKE $1',
        values: [`%${performer}%`],
      });
    } else {
      result = await this.pool.query({
        text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 AND performer ILIKE $2',
        values: [`%${title}%`, `%${performer}%`],
      });
    }

    return {
      result: result.rows,
      cache: false,
    };
  }

  async getSongById(id) {
    try {
      const result = await this.cacheService.get(`song:${id}`);
      return {
        result: JSON.parse(result),
        cache: true,
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM songs WHERE id = $1',
        values: [id],
      };

      const result = await this.pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Song tidak ditemukan');
      }

      await this.cacheService.set(`song:${id}`, JSON.stringify(result.rows[0]));

      return {
        result: result.rows[0],
        cache: false,
      };
    }
  }

  async editSongById(id, {
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui song. Id tidak ditemukan');
    }

    await this.cacheService.del('songs:all');
    await this.cacheService.del(`song:${id}`);

    return result.rows[0].id;
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal menghapus song. Id tidak ditemukan');
    }

    await this.cacheService.del('songs:all');
    await this.cacheService.del(`song:${id}`);

    return result.rows[0].id;
  }
}

module.exports = SongsService;
