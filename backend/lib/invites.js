// Invite-only access. Valid codes live in the INVITE_CODES env var (comma-separated UUIDs).
// A user who redeems a valid code is marked as activated; only activated users can use the API.
// If INVITE_CODES is empty, nobody can sign up: it fails closed.
import crypto from 'node:crypto';
import { isActivated } from './storage.js';

const digest = (s) => crypto.createHash('sha256').update(s).digest();

export function isValidInviteCode(code) {
  if (typeof code !== 'string') return false;
  const given = digest(code.trim().toLowerCase());
  const codes = (process.env.INVITE_CODES || '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
  // Compare against every code (constant time each) instead of stopping at the first match.
  return codes.reduce((found, c) => crypto.timingSafeEqual(digest(c), given) || found, false);
}

// Express middleware: run after requireAuth. Blocks signed-in users who haven't redeemed a code.
export async function requireInvite(req, res, next) {
  try {
    if (await isActivated(req.uid)) return next();
    res.status(403).json({ error: 'An invite code is required.', code: 'invite_required' });
  } catch (err) {
    next(err);
  }
}
