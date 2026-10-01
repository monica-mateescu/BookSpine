import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authClient } from "@utils";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignInForm from "./SignInForm";

/* Mock the module that provides authClient. */
vi.mock("@utils", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
  consumeRedirectTo: vi.fn(() => "/"),
}));

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("react-router");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("SignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* Test 1: Ensure that all required form fields and the submit button are rendered. */
  it("Test 1: Ensure that all required form fields and the submit button are rendered.", () => {
    render(
      <BrowserRouter>
        <SignInForm />
      </BrowserRouter>,
    );

    expect(screen.getByPlaceholderText(/Email\*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password\*/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign in/i }),
    ).toBeInTheDocument();
  });

  /* Test 2: Ensure that the submit button stays disabled while required inputs are empty. */
  it("Test 2: Ensure that the submit button stays disabled while required inputs are empty.", () => {
    render(
      <BrowserRouter>
        <SignInForm />
      </BrowserRouter>,
    );
    const submitBtn = screen.getByRole("button", { name: /Sign in/i });
    expect(submitBtn).toBeDisabled();
  });

  /* Test 3: Check a success message is shown after a successful login. */
  it("Test 3: Check a success message is shown after a successful login.", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: {
        token: "1pl4usCY0QngZPUr4FArHLqEfpPi9IjV",
        user: {
          id: "69cd54822ce2bd0266907c81",
          name: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          emailVerified: true,
          role: "user",
          createdAt: new Date("2026-04-01T17:23:14.173Z"),
          updatedAt: new Date("2026-04-01T17:23:14.173Z"),
        },
      },
      error: null,
    } as ReturnType<typeof authClient.signIn.email>);

    render(
      <BrowserRouter>
        <SignInForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: /Sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(mockedNavigate).toHaveBeenCalledWith("/");
      },
      { timeout: 2000 },
    );
  });

  /* Test 4: Validate that invalid credentials trigger the expected API error message. */
  it("Test 4: Validate that invalid credentials trigger the expected API error message.", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: {
        status: 401,
        statusText: "Unauthorized",
        message: "Invalid email or password",
      },
    } as ReturnType<typeof authClient.signIn.email>);

    render(
      <BrowserRouter>
        <SignInForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    const errorMsg = await screen.findByText(/Invalid email or password/i);
    expect(errorMsg).toBeInTheDocument();
  });

  /* Test 5: Validate the loading state during the login process. */
  it("Test 5: Validate the loading state during the login process.", async () => {
    // Mock with a delay to capture the "Signing in..." state
    vi.mocked(authClient.signIn.email).mockReturnValue(
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: {
                token: "1pl4usCY0QngZPUr4FArHLqEfpPi9IjV",
                user: {
                  id: "69cd54822ce2bd0266907c81",
                  name: "Alice",
                  email: "alice@example.com",
                  emailVerified: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
              error: null,
            } as ReturnType<typeof authClient.signIn.email>),
          100,
        ),
      ),
    );

    render(
      <BrowserRouter>
        <SignInForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    // Check if button changes text and is disabled during submission
    expect(screen.getByText(/Signing in\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
