import { handleWhoop } from '../../shared/whoop-broker.js';
import { whoopEnv } from '../../shared/whoop-env.js';

export default function whoop(req) {
  return handleWhoop(req, whoopEnv());
}
