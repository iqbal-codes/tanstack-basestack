import { z } from 'zod'

export const emailSchema = z.email()
export const phoneNumberSchema = z.string().regex(/^\d{8,16}$/)
