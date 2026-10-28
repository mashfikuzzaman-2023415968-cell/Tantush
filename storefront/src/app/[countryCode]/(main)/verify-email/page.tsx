import { Metadata } from "next"
import VerifyEmail from "./verify-email"

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
  // Don't leak this URL to third parties
  referrer: "no-referrer",
}

export default function VerifyEmailPage() {
  return <VerifyEmail />
}
