import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HighlightCarousel } from "./highlight-carousel";

describe("HighlightCarousel", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn()
    });
  });

  it("avanca e habilita a navegacao anterior ao clicar na proxima seta", () => {
    render(<HighlightCarousel />);

    const previousButton = screen.getByRole("button", { name: /Destaque anterior/i });
    const nextButton = screen.getByRole("button", { name: /Próximo destaque/i });

    expect(previousButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    expect(previousButton).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Ir para destaque 2/i })).toHaveClass("w-6");
  });

  it("permite ir direto para um destaque especifico pelos indicadores", () => {
    render(<HighlightCarousel />);

    fireEvent.click(screen.getByRole("button", { name: /Ir para destaque 4/i }));

    expect(screen.getByRole("button", { name: /Ir para destaque 4/i })).toHaveClass("w-6");
    expect(screen.getByRole("button", { name: /Destaque anterior/i })).not.toBeDisabled();
  });
});
