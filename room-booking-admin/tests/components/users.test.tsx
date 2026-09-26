import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UsersPage from "@/app/admin/users/page";
import { deleteUser, listUsers } from "@/lib/services/users.service";

vi.mock("@/lib/services/users.service", () => ({ listUsers: vi.fn(), deleteUser: vi.fn() }));
vi.mock("@/components/common/ToastProvider", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
const user = { id: "u1", name: "Test Lecturer", gmail: "test@gmail.com", department: "Engineering", position: "Lecturer", idNumber: "L001", username: "test.user", createdAt: "2026-01-01T00:00:00Z" };
beforeEach(() => {
  vi.mocked(listUsers).mockResolvedValue([user]);
  vi.mocked(deleteUser).mockResolvedValue({ success: true });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Users page", () => {
  it("filters users and requires confirmation before deleting", async () => {
    render(<UsersPage />);
    await screen.findByText("Test Lecturer");
    fireEvent.change(screen.getByRole("textbox", { name: "Search users" }), { target: { value: "missing" } });
    expect(screen.getByText("No users found")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search users" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete account for Test Lecturer" }));
    expect(deleteUser).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(deleteUser).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete account for Test Lecturer" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith("u1"));
    await screen.findByText("No users found");
  });
  it("keeps the account visible when deletion fails", async () => {
    vi.mocked(deleteUser).mockRejectedValue(new Error("Server unavailable"));
    render(<UsersPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete account for Test Lecturer" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete account" })).not.toBeDisabled());
    expect(screen.getByText("Test Lecturer")).toBeInTheDocument();
  });
});
