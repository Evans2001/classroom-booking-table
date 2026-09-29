import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SemesterCalendarPage from "@/app/admin/calendar/page";
import type { BookingRequest } from "@/lib/types/request";

vi.mock("@/components/common/ToastProvider", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
const now = new Date();
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
const booking: BookingRequest = { id: "booking-1", roomId: "room-1", roomName: "Main Hall", requesterName: "Dr Silva", requesterEmail: "silva@gmail.com", department: "Engineering", purpose: "Extra lecture", date, startTime: "10:00", endTime: "11:00", attendees: 20, status: "APPROVED", submittedAt: "2026-01-01" };
let bookings: BookingRequest[];
let failRequests = false;
beforeEach(() => {
  bookings = [];
  failRequests = false;
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: !failRequests, status: failRequests ? 500 : 200, headers: new Headers(),
    json: async () => ({ entries: [], rooms: [{ id: "room-1", roomNumber: "R-001", name: "Main Hall", status: "ACTIVE" }], lecturers: [], bookings }),
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("semester calendar room bookings", () => {
  it("shows one dated card with a special tag, names and details, excluding cancelled bookings", async () => {
    bookings = [booking, { ...booking, id: "cancelled", status: "CANCELLED" }, { ...booking, id: "rejected", status: "REJECTED" }];
    render(<SemesterCalendarPage />);
    const card = (await screen.findAllByRole("button", { name: /^Room booking:/ }))[0];
    expect(screen.getAllByRole("button", { name: /^Room booking:/ })).toHaveLength(1);
    expect(within(card).getByText("Room booking")).toBeInTheDocument();
    expect(within(card).getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    expect(within(card).getByText("Approved")).toHaveClass("bg-emerald-700");
    expect(within(card).getByText("Main Hall ? Dr Silva")).toBeInTheDocument();
    expect(within(card.parentElement!.parentElement!).getByText("None")).toBeInTheDocument();
    fireEvent.click(card);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(date)).toBeInTheDocument();
    expect(within(dialog).getByText("Dr Silva")).toBeInTheDocument();
  });
  it("refreshes on focus, shows pending state, and removes cancelled bookings", async () => {
    render(<SemesterCalendarPage />);
    await screen.findAllByText("Main Hall");
    bookings = [{ ...booking, status: "PENDING" }];
    fireEvent(window, new Event("focus"));
    const card = await screen.findByRole("button", { name: /^Room booking:/ });
    expect(within(card).getByText("Pending approval")).toBeInTheDocument();
    expect(within(card.parentElement!.parentElement!).queryByText("None")).not.toBeInTheDocument();
    bookings = [{ ...booking, status: "CANCELLED" }];
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Room booking:/ })).not.toBeInTheDocument());
  });
  it("shows only four main divisions and groups department aliases when filtering", async () => {
    bookings = [{ ...booking, department: "electrical" }, { ...booking, id: "other", department: "Electrical and Information", requesterName: "Dr Perera" }];
    render(<SemesterCalendarPage />);
    await screen.findAllByRole("button", { name: /^Room booking:/ });
    const departmentSelect = screen.getAllByRole("combobox")[0];
    expect(within(departmentSelect).getAllByRole("option")).toHaveLength(5);
    expect(within(departmentSelect).queryByRole("option", { name: /^electrical$/ })).not.toBeInTheDocument();
    fireEvent.change(departmentSelect, { target: { value: "Electrical and Information Engineering" } });
    expect(screen.getAllByRole("button", { name: /^Room booking:/ })).toHaveLength(2);
    fireEvent.change(departmentSelect, { target: { value: "Civil Engineering" } });
    expect(screen.queryByRole("button", { name: /^Room booking:/ })).not.toBeInTheDocument();
  });
  it("skips hidden-tab polling and accepts an unchanged response without clearing cards", async () => {
    bookings = [booking];
    render(<SemesterCalendarPage />);
    await screen.findByRole("button", { name: /^Room booking:/ });
    const fetchMock = vi.mocked(fetch);
    const calls = fetchMock.mock.calls.length;
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(window, new Event("focus"));
    expect(fetchMock).toHaveBeenCalledTimes(calls);
    hidden.mockReturnValue(false);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 304 }));
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(calls + 1));
    expect(screen.getByRole("button", { name: /^Room booking:/ })).toBeInTheDocument();
    hidden.mockRestore();
  });
  it("reports refresh errors without silently clearing the calendar", async () => {
    bookings = [booking];
    render(<SemesterCalendarPage />);
    await screen.findByRole("button", { name: /^Room booking:/ });
    failRequests = true;
    fireEvent(window, new Event("focus"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to refresh");
    expect(screen.getByRole("button", { name: /^Room booking:/ })).toBeInTheDocument();
  });
});
