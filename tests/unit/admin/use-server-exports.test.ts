import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"

// Next.js solo permite exportar funciones async desde archivos "use server".
// El error solo aparece en `next build`, así que lo comprobamos aquí para cazarlo en CI (#172).

const SRC_DIR = path.resolve(process.cwd(), "src")

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return collectFiles(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

const useServerFiles = collectFiles(SRC_DIR).filter((file) =>
  /^\s*["']use server["']/.test(readFileSync(file, "utf-8"))
)

describe('archivos "use server"', () => {
  it("existen archivos de server actions que comprobar", () => {
    expect(useServerFiles.length).toBeGreaterThan(0)
  })

  it.each(useServerFiles.map((f) => [path.relative(SRC_DIR, f), f]))(
    "%s solo exporta funciones async o tipos",
    (_name, file) => {
      const source = readFileSync(file, "utf-8")
      const invalidExports = source
        .split("\n")
        .filter((line) => /^export\s+(const|let|var|class|enum|default\s+(?!async))/.test(line))
      expect(invalidExports).toEqual([])
    }
  )
})
