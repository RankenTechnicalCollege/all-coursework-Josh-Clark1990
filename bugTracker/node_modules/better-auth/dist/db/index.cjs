'use strict';

const db = require('@better-auth/core/db');
const getMigration = require('../shared/better-auth.DjmHNq_0.cjs');
const getTables = require('../shared/better-auth.S3hDEI-1.cjs');
const toZod = require('../shared/better-auth.CsC4FSOQ.cjs');
const schema = require('../shared/better-auth.DhDRLI4w.cjs');
require('../shared/better-auth.C1hdVENX.cjs');
require('../shared/better-auth.DqMG57f7.cjs');
require('@better-auth/core/env');
require('zod');
require('../shared/better-auth.C7Ar55gj.cjs');
require('../shared/better-auth.Bg6iw3ig.cjs');
require('@better-auth/utils/random');
require('better-call');
require('@better-auth/utils/hash');
require('@noble/ciphers/chacha.js');
require('@noble/ciphers/utils.js');
require('@better-auth/utils/base64');
require('jose');
require('@noble/hashes/scrypt.js');
require('@better-auth/utils/hex');
require('@noble/hashes/utils.js');
require('@better-auth/core/error');
require('../shared/better-auth.CYeOI8C-.cjs');
require('../shared/better-auth.GM3xRXA6.cjs');
require('kysely');
require('../shared/better-auth.D_Z5w0Ho.cjs');
require('../shared/better-auth.CEiSk3dW.cjs');

const createFieldAttribute = (type, config) => {
  return {
    type,
    ...config
  };
};

exports.convertFromDB = getMigration.convertFromDB;
exports.convertToDB = getMigration.convertToDB;
exports.createInternalAdapter = getMigration.createInternalAdapter;
exports.getAdapter = getMigration.getAdapter;
exports.getMigrations = getMigration.getMigrations;
exports.getSchema = getMigration.getSchema;
exports.getWithHooks = getMigration.getWithHooks;
exports.matchType = getMigration.matchType;
exports.getAuthTables = getTables.getAuthTables;
exports.toZodSchema = toZod.toZodSchema;
exports.mergeSchema = schema.mergeSchema;
exports.parseAccountInput = schema.parseAccountInput;
exports.parseAccountOutput = schema.parseAccountOutput;
exports.parseAdditionalUserInput = schema.parseAdditionalUserInput;
exports.parseInputData = schema.parseInputData;
exports.parseSessionInput = schema.parseSessionInput;
exports.parseSessionOutput = schema.parseSessionOutput;
exports.parseUserInput = schema.parseUserInput;
exports.parseUserOutput = schema.parseUserOutput;
exports.createFieldAttribute = createFieldAttribute;
Object.prototype.hasOwnProperty.call(db, '__proto__') &&
	!Object.prototype.hasOwnProperty.call(exports, '__proto__') &&
	Object.defineProperty(exports, '__proto__', {
		enumerable: true,
		value: db['__proto__']
	});

Object.keys(db).forEach(function (k) {
	if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = db[k];
});
