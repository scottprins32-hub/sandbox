import { handle } from '../../shared/broker.js';
import { env } from '../../shared/env.js';

export default function authToken(req) {
  return handle('token', req, env());
}
