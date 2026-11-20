// The team: shared per-day scores for friends on one Oranje link.
// All logic lives in shared/team.js; this only wires in Base44.
import { createClientFromRequest } from 'npm:@base44/sdk';
import { env } from '../../shared/env.js';
import { handleTeam, unavailable } from '../../shared/team.js';

export default async function team(req) {
  let db;
  try {
    // Service role: TeamMember and TeamDay deny the browser everything (RLS).
    db = createClientFromRequest(req).asServiceRole.entities;
  } catch (error) {
    console.error('team: Base44 client unavailable', error?.name || 'Error');
    return unavailable();
  }
  return handleTeam(req, env(), db);
}
