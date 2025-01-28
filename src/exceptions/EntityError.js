class EntityError extends Error {
  constructor(message, statusCode = 413) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'EntityError';
  }
}

module.exports = EntityError;
