"use client"

import { useI18n } from "@lib/i18n/context"
import Login from "@modules/account/components/login"
import Register from "@modules/account/components/register"
import { LogoMark } from "@modules/common/components/brand/logo"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const { t } = useI18n()
  const [view, setView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)

  return (
    <div className="grid w-full grid-cols-1 small:grid-cols-2 gap-10 items-stretch py-6 small:py-10">
      <div className="hidden small:flex relative overflow-hidden rounded-[32px] bg-espresso text-ivory grain p-12 flex-col justify-end min-h-[560px]">
        <LogoMark className="absolute -right-10 -top-6 h-[480px] w-auto text-ivory/[0.06]" />
        <p className="font-bangla text-tan-300 text-xl">সুতোয় গল্প, বুননে ঐতিহ্য</p>
        <h2 className="font-display text-4xl mt-3 leading-tight">{view === LOGIN_VIEW.SIGN_IN ? t.account.signInBody : t.account.registerBody}</h2>
      </div>
      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm"
          >
            {view === LOGIN_VIEW.SIGN_IN ? <Login setCurrentView={setView} /> : <Register setCurrentView={setView} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LoginTemplate
