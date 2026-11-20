// Reads the broker's settings from Base44 secrets, inside the handler: Base44
// returns undefined for secrets read at module top level. Values are trimmed,
// because a secret pasted from a browser often carries a space or newline.
import { secrets } from 'base44:runtime';

const read = (name) => (secrets.get(name) || '').trim();

export const env = () => ({
  id: read('GOOGLE_CLIENT_ID'),
  secret: read('GOOGLE_CLIENT_SECRET'),
  key: read('ORANJE_SECRET'),
  appOrigin: read('APP_ORIGIN'),
});
