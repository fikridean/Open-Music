const fs = require('fs');
const EntityError = require('../../exceptions/EntityError');

class StorageService {
  constructor(folder) {
    this.folder = folder;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const filePath = `${this.folder}/${filename}`;
    const maxFileSize = 512000;

    return new Promise((resolve, reject) => {
      let totalSize = 0;
      const fileStream = fs.createWriteStream(filePath);

      file.on('data', (chunk) => {
        totalSize += chunk.length;
        if (totalSize > maxFileSize) {
          const error = new EntityError('Ukuran file melebihi batas maksimum', 413);
          fileStream.destroy();

          fs.unlink(filePath, (err) => {
            if (err) {
              reject(err);
            }
          });

          reject(error);
        }
      });

      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }
}

module.exports = StorageService;
