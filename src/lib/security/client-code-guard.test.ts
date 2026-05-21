import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  findClientCodeSecurityViolations,
  isUseClientModule
} from "./client-code-guard";

function listSourceFiles(rootDir: string): string[] {
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".tmp") {
      continue;
    }

    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && statSync(fullPath).isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("client code guard", () => {
  it("detecta modulos client", () => {
    expect(isUseClientModule('"use client";\nexport const value = 1;\n')).toBe(true);
    expect(isUseClientModule("const value = 1;\n")).toBe(false);
  });

  it("bloqueia env server-only e imports sensiveis em client modules", () => {
    const violations = findClientCodeSecurityViolations([
      '"use client";',
      'import { createSupabaseAdminClient } from "@/lib/supabase/admin";',
      "const token = process.env.SUPABASE_SERVICE_ROLE_KEY;",
      "const publicUrl = process.env.NEXT_PUBLIC_APP_URL;"
    ].join("\n"));

    expect(violations).toEqual([
      {
        line: 2,
        message: "Cliente nao pode importar o client admin do Supabase."
      },
      {
        line: 3,
        message: "Cliente nao pode referenciar SUPABASE_SERVICE_ROLE_KEY."
      },
      {
        line: 3,
        message: "Cliente nao pode acessar process.env.SUPABASE_SERVICE_ROLE_KEY."
      }
    ]);
  });

  it("mantem app e src livres de secrets em arquivos use client", () => {
    const workspaceRoot = process.cwd();
    const roots = ["app", "src"].map((segment) => path.join(workspaceRoot, segment));
    const failures: string[] = [];

    for (const rootDir of roots) {
      for (const filePath of listSourceFiles(rootDir)) {
        const content = readFileSync(filePath, "utf8");
        const violations = findClientCodeSecurityViolations(content);

        if (violations.length === 0) {
          continue;
        }

        failures.push(
          `${path.relative(workspaceRoot, filePath)} -> ${violations
            .map((violation) => `L${violation.line}: ${violation.message}`)
            .join(" | ")}`
        );
      }
    }

    expect(failures).toEqual([]);
  });
});
