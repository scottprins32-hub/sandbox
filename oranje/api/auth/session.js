import { COOKIE, configured, cookies, json } from './_lib.js';

// Tells the page whether server-side sign-in is available and already linked.
export default function handler(req, res) {
  json(res, 200, { broker: true, configured: configured(), connected: configured() && !!cookies(req)[COOKIE] });
}
