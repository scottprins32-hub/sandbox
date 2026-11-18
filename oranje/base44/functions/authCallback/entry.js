import { handle } from '../../shared/broker.js';
import { env } from '../../shared/env.js';

export default function authCallback(req) {
  return handle('callback', req, env());
}
