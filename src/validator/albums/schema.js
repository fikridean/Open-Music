const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

const AlbumCoverPayloadSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
  'content-length': Joi.number().max(520000).optional(),
}).unknown();

module.exports = { AlbumPayloadSchema, AlbumCoverPayloadSchema };
