/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable('album_user_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint('album_user_likes', 'unique_album_id_and_user_id', 'UNIQUE(album_id, user_id)');
  pgm.addConstraint('album_user_likes', 'fk_album_id', 'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE');
  pgm.addConstraint('album_user_likes', 'fk_user_id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_users');
};
