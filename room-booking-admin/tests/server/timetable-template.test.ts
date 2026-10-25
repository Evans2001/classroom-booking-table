// @vitest-environment node
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/timetable/template/route";
import { createAdminSession } from "@/lib/server/admin-auth";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

describe("timetable template download", () => {
  it("requires an admin session", () => {
    expect(GET(new Request("http://localhost/api/timetable/template")).status).toBe(401);
  });

  it("downloads an Excel attachment for authenticated admins", async () => {
    const response = GET(new Request("http://localhost/api/timetable/template", {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${createAdminSession()}` },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/vnd.ms-excel");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="timetable-template.xls"');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
});
