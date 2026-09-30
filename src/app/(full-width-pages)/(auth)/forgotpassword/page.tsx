import ForgotPassword from "@/components/auth/ForgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Fydaa",
  description: "Reset your Fydaa Partner Dashboard password",
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
