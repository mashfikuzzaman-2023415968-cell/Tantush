import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { RedactingLogNotificationService } from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [RedactingLogNotificationService],
})
