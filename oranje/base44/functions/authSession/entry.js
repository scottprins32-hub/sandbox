import { handle } from '../../shared/broker.js';
import { env } from '../../shared/env.js';

export default function authSession(req) {
  return handle('session', req, env());
}
