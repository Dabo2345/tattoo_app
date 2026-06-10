// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { LoginForm } from "@/app/admin/login/login-form"

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

vi.mock("@/lib/auth/client", () => ({
  signIn: {
    email: vi.fn(),
  },
  useSession: vi.fn(),
}))

import { signIn, useSession } from "@/lib/auth/client"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderWithNoSession() {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    isPending: false,
    error: null,
  } as ReturnType<typeof useSession>)
  return render(<LoginForm />)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renderiza email, contraseña y botón de submit", () => {
    renderWithNoSession()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument()
  })

  it("no renderiza el formulario mientras la sesión está pendiente", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as ReturnType<typeof useSession>)

    render(<LoginForm />)

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it("redirige a /admin si ya existe sesión activa", () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: "1", email: "admin@test.com", name: "Admin" } },
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>)

    render(<LoginForm />)

    expect(mockReplace).toHaveBeenCalledWith("/admin")
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it("submit llama a signIn.email con email y password correctos", async () => {
    vi.mocked(signIn.email).mockResolvedValue({ data: {}, error: null } as ReturnType<
      typeof signIn.email
    >)
    renderWithNoSession()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@studio.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "secret123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => {
      expect(signIn.email).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "admin@studio.com",
          password: "secret123",
        })
      )
    })
  })

  it("login exitoso redirige a /admin", async () => {
    vi.mocked(signIn.email).mockResolvedValue({ data: {}, error: null } as ReturnType<
      typeof signIn.email
    >)
    renderWithNoSession()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@studio.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "secret123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin")
    })
  })

  it("error genérico muestra mensaje de credenciales incorrectas", async () => {
    vi.mocked(signIn.email).mockResolvedValue({
      data: null,
      error: { status: 401, message: "Invalid credentials" },
    } as ReturnType<typeof signIn.email>)
    renderWithNoSession()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@studio.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/credenciales incorrectas/i)
    })
  })

  it("error 429 muestra mensaje de cuenta bloqueada", async () => {
    vi.mocked(signIn.email).mockResolvedValue({
      data: null,
      error: { status: 429, message: "Too many requests" },
    } as ReturnType<typeof signIn.email>)
    renderWithNoSession()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@studio.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/demasiados intentos/i)
      expect(screen.getByRole("alert")).toHaveTextContent(/15 minutos/i)
    })
  })

  it("inputs y botón quedan deshabilitados durante el submit", async () => {
    // Keep the promise pending to inspect mid-flight state
    let resolve!: (v: unknown) => void
    vi.mocked(signIn.email).mockReturnValue(
      new Promise((r) => (resolve = r)) as ReturnType<typeof signIn.email>
    )
    renderWithNoSession()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@studio.com" },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "secret123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeDisabled()
      expect(screen.getByLabelText(/contraseña/i)).toBeDisabled()
      expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled()
    })

    // Cleanup
    resolve({ data: {}, error: null })
  })
})
