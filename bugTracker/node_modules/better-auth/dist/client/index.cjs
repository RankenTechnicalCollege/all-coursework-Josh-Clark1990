'use strict';

const vanilla = require('../shared/better-auth.FYyZpvCP.cjs');
const query = require('../shared/better-auth.D9AYOecd.cjs');
require('../shared/better-auth.DrhZ3jDS.cjs');
require('@better-fetch/fetch');
require('../shared/better-auth.DBTqCDAW.cjs');
require('@better-auth/core/env');
require('@better-auth/core/error');
require('nanostores');
require('../shared/better-auth.DUNU0obG.cjs');
require('../shared/better-auth.BLDOwz3i.cjs');

const InferPlugin = () => {
  return {
    id: "infer-server-plugin",
    $InferServerPlugin: {}
  };
};
function InferAuth() {
  return {};
}

exports.createAuthClient = vanilla.createAuthClient;
exports.useAuthQuery = query.useAuthQuery;
exports.InferAuth = InferAuth;
exports.InferPlugin = InferPlugin;
