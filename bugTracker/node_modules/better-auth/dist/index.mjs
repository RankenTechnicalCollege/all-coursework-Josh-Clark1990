export * from '@better-auth/core/env';
export * from '@better-auth/core';
export * from '@better-auth/core/oauth2';
export * from '@better-auth/core/error';
export * from '@better-auth/core/utils';
import { getAsyncLocalStorage } from '@better-auth/core/async_hooks';
export { b as betterAuth } from './shared/better-auth.BLRq-uZX.mjs';
export { c as capitalizeFirstLetter } from './shared/better-auth.D-2CmEwz.mjs';
export { H as HIDE_METADATA, g as generateState, p as parseState } from './shared/better-auth.BOULxa5h.mjs';
export { g as generateId } from './shared/better-auth.BUPPRXfK.mjs';
export { createTelemetry, getTelemetryAuthConfig } from '@better-auth/telemetry';
export { APIError } from 'better-call';
import './shared/better-auth.DP-TUMaw.mjs';
import 'zod';
import '@better-auth/core/middleware';
import '@better-auth/utils/base64';
import '@better-auth/utils/hmac';
import '@better-auth/utils/binary';
import '@better-auth/core/db';
import 'kysely';
import './api/index.mjs';
import './shared/better-auth.CjNhg7P4.mjs';
import './shared/better-auth.CW6D9eSx.mjs';
import './shared/better-auth.BKEtEpt0.mjs';
import './shared/better-auth.NIVvsrVf.mjs';
import './shared/better-auth.Ih8C76Vo.mjs';
import './shared/better-auth.B5mlN66S.mjs';
import '@better-auth/utils/random';
import '@better-auth/utils/hash';
import '@noble/ciphers/chacha.js';
import '@noble/ciphers/utils.js';
import 'jose';
import '@noble/hashes/scrypt.js';
import '@better-auth/utils/hex';
import '@noble/hashes/utils.js';
import './shared/better-auth.B4Qoxdgc.mjs';
import './shared/better-auth.BXHrfawo.mjs';
import 'defu';
import './crypto/index.mjs';
import './shared/better-auth.CcjWq_Ob.mjs';
import './shared/better-auth.DhziC0ap.mjs';
import './shared/better-auth.D_t_N9Yo.mjs';
import './shared/better-auth.DCO8QZ1H.mjs';
import './shared/better-auth.15w1BFER.mjs';
import '@better-auth/core/social-providers';
import './shared/better-auth.YwDQhoPc.mjs';
import 'jose/errors';

let currentAdapterAsyncStorage = null;
const ensureAsyncStorage = async () => {
  if (!currentAdapterAsyncStorage) {
    const AsyncLocalStorage = await getAsyncLocalStorage();
    currentAdapterAsyncStorage = new AsyncLocalStorage();
  }
  return currentAdapterAsyncStorage;
};
const getCurrentAdapter = async (fallback) => {
  return ensureAsyncStorage().then((als) => {
    return als.getStore() || fallback;
  }).catch(() => {
    return fallback;
  });
};

export { getCurrentAdapter };
