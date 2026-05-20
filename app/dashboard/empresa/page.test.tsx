import { describe, expect, it, vi } from "vitest";
import EmpresaPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  })
}));

describe("Empresa alias (/dashboard/empresa)", () => {
  it("redireciona para a pagina Meta resumida", async () => {
    await expect(EmpresaPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "redirect:/dashboard/perfil/meta"
    );
  });
});

