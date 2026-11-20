import { secrets } from 'base44:runtime';

// The site's own address comes from the APP_ORIGIN secret, like Google sign-in,
// so moving the app to another address is one secret, not a code change.
export const whoopEnv = () => ({
  id: (secrets.get('WHOOP_CLIENT_ID') || '').trim(),
  secret: (secrets.get('WHOOP_CLIENT_SECRET') || '').trim(),
  appOrigin: ((secrets.get('APP_ORIGIN') || '').trim() || 'https://health-oranje.base44.app').replace(/\/+$/, ''),
});
