import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import Counter from "./Counter";

describe("Counter", () => {
  it("increments when clicked", () => {
    render(() => <Counter />);
    const button = screen.getByRole("button", { name: /clicks:/i });
    expect(button).toHaveTextContent("Clicks: 0");
    fireEvent.click(button);
    expect(button).toHaveTextContent("Clicks: 1");
  });
});
