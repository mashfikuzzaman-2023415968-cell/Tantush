import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type InjectedDependencies = { logger: Logger }

const mask = (to: string) =>
  to.includes("@")
    ? to.replace(/^(.).*?(@.*)$/, "$1***$2")
    : to.length > 4
      ? `${"*".repeat(to.length - 4)}${to.slice(-4)}`
      : "****"

/**
 * Default notification provider until a real SMS / email service is added.
 * In production it logs only channel, template and a masked recipient —
 * never customer data or one-time links/tokens. In development it also logs
 * the payload so links can be clicked locally.
 */
export class RedactingLogNotificationService extends AbstractNotificationProviderService {
  static identifier = "log"
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies) {
    super()
    this.logger_ = logger
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const base = `[notification] channel=${notification.channel} template=${notification.template} to=${mask(String(notification.to))}`
    if (process.env.NODE_ENV === "production") {
      this.logger_.info(base)
    } else {
      this.logger_.info(`${base} data=${JSON.stringify(notification.data ?? {})}`)
    }
    return {}
  }
}
