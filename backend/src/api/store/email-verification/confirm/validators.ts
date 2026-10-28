import { z } from "@medusajs/framework/zod"

export const ConfirmEmailSchema = z.object({ token: z.string().min(10).max(100) }).strict()
export type ConfirmEmailType = z.infer<typeof ConfirmEmailSchema>
