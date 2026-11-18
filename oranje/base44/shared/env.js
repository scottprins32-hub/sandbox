// Reads the broker's settings from Base44 secrets, inside the handler: Base44
// returns undefined for secrets read at module top level.
import { secrets } from 'base44:runtime';

export const env = () => ({
  id: secrets.get('GOOGLE_CLIENT_ID') || '',
  secret: secrets.get('GOOGLE_CLIENT_SECRET') || '',
  key: secrets.get('ORANJE_SECRET') || '',
  appOrigin: secrets.get('APP_ORIGIN') || '',
});
