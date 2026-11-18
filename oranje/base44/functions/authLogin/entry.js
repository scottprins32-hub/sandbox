import { handle } from '../../shared/broker.js';
import { env } from '../../shared/env.js';

export default function authLogin(req) {
  return handle('login', req, env());
}
