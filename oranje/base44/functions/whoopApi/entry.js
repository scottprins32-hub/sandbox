// The site's address is worked out exactly as for Google sign-in (broker.js
// origin()), so both always agree after the app moves to another address.
import { origin } from '../../shared/broker.js';
import { env } from '../../shared/env.js';
import { handleWhoop } from '../../shared/whoop-broker.js';
import { whoopEnv } from '../../shared/whoop-env.js';

export default function whoopApi(req) {
  return handleWhoop(req, { ...whoopEnv(), appOrigin: origin(req, env()) });
}
