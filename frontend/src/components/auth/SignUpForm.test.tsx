import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authClient } from "@utils";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignUpForm from "./SignUpForm";

/* Mock the module that provides authClient. */
vi.mock("@utils", () => ({
  authClient: {
    signUp: {
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

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* Test 1: Ensure that all required form fields and the submit button are rendered. */
  it("Test 1: Ensure that all required form fields and the submit button are rendered.", () => {
    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );

    expect(screen.getByPlaceholderText(/First name\*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Last name\*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email\*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password\*/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign up/i }),
    ).toBeInTheDocument();
  });

  /* Test 2: Ensure that the submit button stays disabled while required inputs are empty. */
  it("Test 2: Ensure that the submit button stays disabled while required inputs are empty.", () => {
    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );
    const submitBtn = screen.getByRole("button", { name: /Sign up/i });
    expect(submitBtn).toBeDisabled();
  });

  /* Test 3: Check a success message is shown after a successful registration. */
  it("Test 3: Check a success message is shown after a successful registration.", async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: {
        token: "1pl4usCY0QngZPUr4FArHLqEfpPi9IjV",
        user: {
          id: "69cd54822ce2bd0266907c81",
          name: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          emailVerified: false,
          role: "user",
          createdAt: new Date("2026-04-01T17:23:14.173Z"),
          updatedAt: new Date("2026-04-01T17:23:14.173Z"),
        },
      },
      error: null,
    } as ReturnType<typeof authClient.signUp.email>);

    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First name\*/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last name\*/i), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Registration successful. Please check your email to verify your account./i,
        ),
      ).toBeInTheDocument();
    });
  });

  /* Test 4:Validate that an existing email triggers the expected API error message. */
  it("Test 4: Validate that an existing email triggers the expected API error message.", async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: {
        status: 422,
        statusText: "Unprocessable Entity",
        message: "User already exists. Use another email.",
      },
    } as ReturnType<typeof authClient.signUp.email>);

    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First name\*/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last name\*/i), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    const errorMsg = await screen.findByText(
      /User already exists. Use another email./i,
    );
    expect(errorMsg).toBeInTheDocument();
  });

  /* Test 5: Validate that a too-short password triggers the expected API error message. */
  it("Test 5: Validate that a too-short password triggers the expected API error message.", async () => {
    vi.mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: {
        status: 400,
        statusText: "Bad Request",
        message: "Password too short",
      },
    } as ReturnType<typeof authClient.signUp.email>);

    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First name\*/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last name\*/i), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    expect(await screen.findByText(/Password too short/i)).toBeInTheDocument();
  });

  /* Test 6: Validate the loading state during the registration process. */
  it("Test 6: Validate the loading state during the registration process.", async () => {
    // Mock with a delay to capture the "Signing up..." state
    vi.mocked(authClient.signUp.email).mockReturnValue(
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              data: {
                token: "1pl4usCY0QngZPUr4FArHLqEfpPi9IjV",
                user: {
                  id: "69cd54822ce2bd0266907c81",
                  name: "Alice",
                  lastName: "Smith",
                  email: "alice@example.com",
                  emailVerified: false,
                  role: ["user"],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              },
              error: null,
            } as ReturnType<typeof authClient.signUp.email>),
          100,
        ),
      ),
    );

    render(
      <BrowserRouter>
        <SignUpForm />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First name\*/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last name\*/i), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email\*/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password\*/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    // Check if button changes text and is disabled during submission
    expect(screen.getByText(/Signing up\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
