import { createHmac } from 'node:crypto';

const publicOrigin = process.env.ADMIN_PUBLIC_ORIGIN;
const payload = `v1.${Math.floor(Date.now() / 1000) + 60}`;
const token = `${payload}.${createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex')}`;
// Invalid decision payload stops before account updates or email delivery.
for (const [origin, expected] of [[publicOrigin, 400], ['https://attacker.example', 403]]) {
  const response = await fetch(`${publicOrigin}/api/admin/account-requests/origin-verification/decision`, {
    method: 'POST',
    headers: { origin, cookie: `rb_admin_session=${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await response.json();
  const expectedMessage = expected === 400 ? 'Choose approve or reject.' : 'Cross-origin admin requests are not allowed.';
  if (response.status !== expected || body.error !== expectedMessage) {
    throw new Error(`Origin verification failed: expected ${expected}, got ${response.status}`);
  }
}
console.log('Public HTTPS admin origin accepted; foreign origin rejected. No account changed or email sent.');
