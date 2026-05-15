import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import DataDeletionPage from "./page";

vi.mock("@/components/public/legal-page", () => ({
  LegalPage: ({
    intro,
    summary,
    title
  }: {
    intro?: ReactNode;
    summary: string;
    title: string;
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{summary}</p>
      {intro}
    </main>
  )
}));

describe("Data Deletion Page (/data-deletion)", () => {
  it("mostra o status da solicitacao quando o codigo esta presente", async () => {
    const Page = await DataDeletionPage({
      searchParams: Promise.resolve({ code: "abc123", status: "received" })
    });

    render(Page);

    expect(screen.getByText(/Exclusão recebida pela Meta/i)).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByText(/foi recebida e a integração vinculada foi removida/i)).toBeInTheDocument();
  });

  it("mantem a pagina de instrucoes sem codigo", async () => {
    const Page = await DataDeletionPage({ searchParams: Promise.resolve({}) });

    render(Page);

    expect(screen.getByText(/Como revogar integrações Meta/i)).toBeInTheDocument();
  });
});
