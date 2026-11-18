import { whoopCallback as callback } from '../../shared/whoop-broker.js';
import { whoopEnv } from '../../shared/whoop-env.js';

export default function whoopCallback(req) {
  return callback(req, whoopEnv());
}
