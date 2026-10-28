import { z } from "@medusajs/framework/zod"

export const AdminPosOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          variant_id: z.string().regex(/^variant_[A-Za-z0-9]+$/),
          quantity: z.number().int().min(1).max(100),
        })
      )
      .min(1)
      .max(50),
    customer_name: z.string().trim().max(80).optional(),
    customer_phone: z
      .string()
      .trim()
      .regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number")
      .optional()
      .or(z.literal("")),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    note: z.string().trim().max(500).optional(),
  })
  .strict()

export type AdminPosOrderType = z.infer<typeof AdminPosOrderSchema>
