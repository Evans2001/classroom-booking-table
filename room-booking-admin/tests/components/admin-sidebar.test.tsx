import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AdminSidebar } from "@/components/layout/AdminSidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminSidebar", () => {
  it("renders navigation items", () => {
    render(<AdminSidebar mobileOpen />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Rooms")).toBeInTheDocument();
  });
});
