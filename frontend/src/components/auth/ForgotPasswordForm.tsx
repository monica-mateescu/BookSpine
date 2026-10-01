import { BASE_APP_URL } from "@/config";
import { authClient } from "@/utils";
import { useState } from "react";

import { ErrorAlert, SuccessAlert } from "../ui";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!email) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${BASE_APP_URL}/reset-password`,
    });

    if (error) {
      setError(
        error.message ||
          "Something went wrong. Failed to send password reset email.",
      );
    } else {
      setSuccess(
        "If an account exists for this email address, a password reset link has been sent. Please check your inbox.",
      );
      setEmail("");
    }

    setSubmitting(false);
  };

  const disabled = !email || submitting;

  const buttonClass = disabled
    ? "btn btn-disabled w-full"
    : "btn btn-primary btn-brand-primary w-full cursor-pointer";

  return (
    <>
      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message={success} />}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email*"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>

        <button type="submit" className={buttonClass} disabled={disabled}>
          {submitting ? "Reseting..." : "Reset password"}
        </button>
      </form>
    </>
  );
};

export default ForgotPasswordForm;
