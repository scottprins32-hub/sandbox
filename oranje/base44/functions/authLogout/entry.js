import { handle } from '../../shared/broker.js';
import { env } from '../../shared/env.js';

export default function authLogout(req) {
  return handle('logout', req, env());
}
