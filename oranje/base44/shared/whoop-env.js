import { secrets } from 'base44:runtime';

export const whoopEnv = () => ({
  id: (secrets.get('WHOOP_CLIENT_ID') || '').trim(),
  secret: (secrets.get('WHOOP_CLIENT_SECRET') || '').trim(),
  appOrigin: 'https://oranje-962c1581.base44.app',
});
