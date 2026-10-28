"use client"

import { login } from "@lib/data/customer"
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

const Login = ({ setCurrentView }: Props) => {
  const { t } = useI18n()
  const [message, formAction] = useActionState(login, null)

  return (
    <div className="w-full" data-testid="login-page">
      <h1 className="heading-md mb-2">{t.account.welcomeBack}</h1>
      <p className="text-espresso/60 mb-8">{t.account.signInBody}</p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-3">
          <Input label={t.account.email} name="email" type="email" autoComplete="email" required maxLength={254} data-testid="email-input" />
          <Input label={t.account.password} name="password" type="password" autoComplete="current-password" required maxLength={128} data-testid="password-input" />
        </div>
        <BotGuard resetKey={message} />
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6 h-12 rounded-full">
          {t.account.signIn}
        </SubmitButton>
      </form>
      <p className="text-sm text-espresso/70 mt-6">
        {t.account.noAccount}{" "}
        <button onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)} className="link-underline text-espresso" data-testid="register-button">
          {t.account.joinUs}
        </button>
      </p>
    </div>
  )
}

export default Login
