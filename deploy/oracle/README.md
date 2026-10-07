# Oracle deployment runbook

Status: Ubuntu 24.04 server created at 161.118.220.77 (E2.1.Micro).
SSH verified; 2 GB swap, Caddy, SQLite tools and Node.js 22.23.3 installed.
Admin source uploaded without local data. Production webpack build passed;
room-booking systemd service is enabled and responding locally (HTTP 307).
Private configuration installed at /etc/room-booking.env (root-only, mode 0600).
Gmail SMTP authentication verified without sending email. Hosted database starts
fresh. Caddy hostname: booking.161.118.220.77.sslip.io. Ubuntu firewall permits
80/443; Oracle ingress rules saved. Let's Encrypt certificate obtained and
trusted HTTPS verified: root redirects to /login, which responds HTTP 200.
Android 1.0.0+2 signed release built for lk.ac.ruh.eng.roombooking.lecturer,
using Firebase project room-booking-f8bc3 and the hosted HTTPS API.
APK signatures verified; 32-bit APK installed and launched on SM_A136W.
HTTPS downloads published under /downloads/room-booking-android32.apk and
/downloads/room-booking-android64.apk. Download response and admin login both
verified HTTP 200. New Firebase server credentials, end-to-end phone testing,
and off-server backups remain pending. Keep signing files privately backed up.
Firebase server credentials for room-booking-f8bc3 installed on 2026-10-07;
service-account authentication verified without sending notifications and backend
restarted. Actual notification delivery still requires an end-to-end device test.

## 1. Account and VM (user)

Create/sign in to https://www.oracle.com/cloud/free/ and complete verification.
In your home region create an Always Free eligible Ubuntu 24.04 instance.
Prefer VM.Standard.A1.Flex, 1 OCPU, 6 GB RAM, default approximately 50 GB boot
volume. Account-wide resource totals must remain within the current free limits.
Use a public subnet with a public IPv4 address and internet gateway route.
Save the SSH private key locally; do not paste it into chat or commit it.
Allow inbound TCP 22 from your public IP only, and TCP 80/443 from the internet.
Do not expose port 3000. Check both OCI network rules and the Ubuntu firewall.
If capacity is unavailable, try another availability domain in your home region;
do not select a paid shape as a substitute for the free plan.

Provide the VM public IP and the local SSH key file path for the next stage.

## 2. Server preparation

Connect as Ubuntu's `ubuntu` user. Install Node.js 22 LTS (at least 22.13), Git,
sqlite3, and Caddy using their official installation instructions.
The service expects Node at /usr/local/bin/node; adjust ExecStart if installed elsewhere.
Create a dedicated account and directories:

```bash
sudo useradd --system --user-group --home-dir /opt/room-booking --shell /usr/sbin/nologin room-booking
sudo install -d -o room-booking -g room-booking -m 0750 /opt/room-booking
sudo install -d -o room-booking -g room-booking -m 0700 /var/lib/room-booking
```

Upload a clean source archive into /opt/room-booking. Include package-lock.json,
the admin portal and these deployment files. Exclude node_modules, .next,
Flutter build outputs, local environment files, SQLite files, keys and .git.
Do not copy Windows node_modules to Linux. Keep source ownership room-booking.

Copy production.env.example to /etc/room-booking.env; replace ALL CHANGE_ME values
and set root ownership and mode 0600. Generate the session secret on the server
with `openssl rand -hex 32`. Configure a real SMTP sender and verify delivery;
production lecturer approval requires credential emails. Never prefix secrets
with NEXT_PUBLIC_. No cloud secrets are stored in this repository.

## 3. Build and start

Run as room-booking in /opt/room-booking/room-booking-admin:

```bash
npm ci
npm run check
npm run build
```

The build needs the public campus timezone setting if changed from Asia/Colombo.
Production runtime loads /etc/room-booking.env through systemd. Do not place a
local development .env file in the uploaded source. The initial database is
created at the persistent runtime path on first use. If migrating local data,
use SQLite's backup command and transfer that backup before first start; do
not copy a live database file while WAL writes are in progress.

Install room-booking.service into /etc/systemd/system, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now room-booking
sudo systemctl status room-booking
curl -I http://127.0.0.1:3000
```

## 4. HTTPS

Choose a university subdomain, an owned domain, or a free DNS hostname before
building the production APK. Configure DNS to point at the VM public IP.
Replace booking.example.edu in Caddyfile.example, install it as
/etc/caddy/Caddyfile, validate with `sudo caddy validate --config /etc/caddy/Caddyfile`,
then reload Caddy. Verify trusted HTTPS from a separate device.
Do not publish the APK with the example domain, localhost, or an HTTP address.

## 5. Backups and updates

Create consistent backups using `sqlite3 DATABASE '.backup BACKUP_PATH'`.
Store them with restricted permissions outside the uploaded source tree.
Schedule daily backups and copy them to another machine or storage service;
verify restoration. A copy on the VM alone will not protect against VM loss.

Before an update back up the database, stop room-booking, upload the new source,
install dependencies, run checks, build, then restart and verify the portal/API.
Preserve /var/lib/room-booking and /etc/room-booking.env. Keep the previous source
and build for rollback. If a database migration changes its schema, rollback
may also need a matching database backup, losing writes made after that backup.

## 6. Android release

Decide the final Android application ID before registration and distribution.
Register that ID in Firebase and replace android/app/google-services.json.
Create a signing keystore outside version control and configure
android/key.properties. Preserve the keystore and passwords for future updates.
Increase pubspec.yaml's version/build number for each distributed update.

```powershell
flutter build apk --release --split-per-abi --dart-define=API_BASE_URL=https://YOUR_HOSTNAME
```

Distribute the signed APK matching each phone's CPU architecture. The connected
SM_A136W needs armeabi-v7a. Replacing the current development-signed install with
a release-signed install may require uninstalling first (clears local app data).
Test without USB: signup, credential email, login, room listing, booking,
admin approval, issue reporting, and push notifications. Test persistence after
a server restart before inviting users.

## References

- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- https://nodejs.org/en/download
- https://caddyserver.com/docs/install
- https://caddyserver.com/docs/quick-starts/https
- https://docs.flutter.dev/deployment/android
