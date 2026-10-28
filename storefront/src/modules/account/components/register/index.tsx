"use client"

import { signup } from "@lib/data/customer"
import { useI18n } from "@lib/i18n/context"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import BotGuard from "@modules/common/components/bot-guard"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const { t } = useI18n()
  const [message, formAction] = useActionState(signup, null)

  return (
    <div className="w-full" data-testid="register-page">
      <h1 className="heading-md mb-2">{t.account.register}</h1>
      <p className="text-espresso/60 mb-8">{t.account.registerBody}</p>
      <form className="w-full flex flex-col" action={formAction}>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t.account.firstName} name="first_name" required autoComplete="given-name" maxLength={60} data-testid="first-name-input" />
          <Input label={t.account.lastName} name="last_name" required autoComplete="family-name" maxLength={60} data-testid="last-name-input" />
          <div className="col-span-2">
            <Input label={t.account.email} name="email" required type="email" autoComplete="email" maxLength={254} data-testid="email-input" />
          </div>
          <div className="col-span-2">
            <Input label={t.account.phone} name="phone" type="tel" autoComplete="tel" maxLength={16} pattern="(\+?88)?01[3-9][0-9]{8}" data-testid="phone-input" />
          </div>
          <div className="col-span-2">
            <Input
              label={t.account.password}
              name="password"
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              data-testid="password-input"
            />
          </div>
        </div>
        <BotGuard resetKey={message} />
        <ErrorMessage error={message} data-testid="register-error" />
        <SubmitButton className="w-full mt-6 h-12 rounded-full" data-testid="register-button">
          {t.account.register}
        </SubmitButton>
      </form>
      <p className="text-sm text-espresso/70 mt-6">
        {t.account.haveAccount}{" "}
        <button onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)} className="link-underline text-espresso">
          {t.account.signIn}
        </button>
      </p>
    </div>
  )
}

export default Register
