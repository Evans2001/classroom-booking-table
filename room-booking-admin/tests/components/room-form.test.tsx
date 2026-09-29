import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoomForm } from "@/components/forms/RoomForm";

describe("RoomForm", () => {
  it("renders core fields", () => {
    render(<RoomForm onSubmit={vi.fn()} />);
    expect(screen.queryByLabelText("Room Code")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Room Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Building")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Floor")).not.toBeInTheDocument();
  });
});
