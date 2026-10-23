// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/lecturer/auth/login/route";
import { POST as logout } from "@/app/api/lecturer/auth/logout/route";
import {
  assertLecturerSession,
  authenticateLecturerAccount,
  changeLecturerPassword,
  getDatabase,
} from "@/lib/server/database";

afterEach(() => {
  globalThis.__roomBookingDatabase__?.close();
  globalThis.__roomBookingDatabase__ = undefined;
});

const credentials = { identifier: "lecturer@eng.ruh.ac.lk", password: "Lecturer@123" };

describe("persistent mobile sessions", () => {
  it("migrates existing sessions without changing their expiry and preserves persistent sessions on reinitialization", async () => {
    const legacy = authenticateLecturerAccount(credentials.identifier, credentials.password);
    const db = getDatabase();
    const before = db.prepare("SELECT expires_at FROM lecturer_sessions WHERE token = ?").get(legacy.sessionToken!);
    db.exec("ALTER TABLE lecturer_sessions DROP COLUMN is_persistent");
    vi.resetModules();
    const migrated = await import("@/lib/server/database");
    expect(() => migrated.assertLecturerSession(legacy)).not.toThrow();
    expect(db.prepare("SELECT expires_at FROM lecturer_sessions WHERE token = ?").get(legacy.sessionToken!)).toEqual(before);
    expect(db.prepare("SELECT is_persistent FROM lecturer_sessions WHERE token = ?").get(legacy.sessionToken!)).toEqual({ is_persistent: 0 });
    const mobile = migrated.authenticateLecturerAccount(credentials.identifier, credentials.password, { persistentSession: true });
    db.prepare("UPDATE lecturer_sessions SET expires_at = '2020-01-01T00:00:00.000Z' WHERE token = ?").run(mobile.sessionToken!);
    vi.resetModules();
    const restarted = await import("@/lib/server/database");
    expect(() => restarted.assertLecturerSession(mobile)).not.toThrow();
  });

  it("accepts a mobile login after the normal expiry and revokes it on explicit logout", async () => {
    const response = await login(new Request("http://localhost/api/lecturer/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...credentials, persistentSession: true }),
    }));
    expect(response.status).toBe(200);
    const { sessionToken } = await response.json();
    const db = getDatabase();
    db.prepare("UPDATE lecturer_sessions SET created_at = ?, expires_at = ? WHERE token = ?")
      .run("2020-01-01T00:00:00.000Z", "2020-01-31T00:00:00.000Z", sessionToken);
    expect(() => assertLecturerSession({ sessionToken })).not.toThrow();

    const signedOut = await logout(new Request("http://localhost/api/lecturer/auth/logout", {
      method: "POST",
      headers: { authorization: `Bearer ${sessionToken}` },
    }));
    expect(signedOut.status).toBe(200);
    expect(() => assertLecturerSession({ sessionToken })).toThrow("Invalid lecturer session");
  });

  it.each([undefined, false, "true"])("keeps timed sessions when persistentSession is %s", async (persistentSession) => {
    const response = await login(new Request("http://localhost/api/lecturer/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...credentials, persistentSession }),
    }));
    expect(response.status).toBe(200);
    const { sessionToken } = await response.json();
    getDatabase().prepare("UPDATE lecturer_sessions SET expires_at = ? WHERE token = ?")
      .run("2020-01-01T00:00:00.000Z", sessionToken);
    expect(() => assertLecturerSession({ sessionToken })).toThrow("Invalid lecturer session");
  });

  it("does not create persistent sessions with invalid credentials", async () => {
    const response = await login(new Request("http://localhost/api/lecturer/auth/login", {
      method: "POST",
      body: JSON.stringify({ ...credentials, password: "wrong", persistentSession: true }),
    }));
    expect(response.status).toBe(401);
    expect(getDatabase().prepare("SELECT * FROM lecturer_sessions").all()).toHaveLength(0);
  });

  it("preserves the current login on password change and still rejects revoked or deleted accounts", () => {
    const account = authenticateLecturerAccount(credentials.identifier, credentials.password, { persistentSession: true });
    const other = authenticateLecturerAccount(credentials.identifier, credentials.password, { persistentSession: true });
    changeLecturerPassword(credentials.password, "UpdatedPassword123", account);
    expect(() => assertLecturerSession(account)).not.toThrow();
    expect(() => assertLecturerSession(other)).toThrow("Invalid lecturer session");
    getDatabase().prepare("DELETE FROM lecturer_accounts WHERE id = ?").run(account.id);
    expect(() => assertLecturerSession(account)).toThrow("Invalid lecturer session");
  });
});
