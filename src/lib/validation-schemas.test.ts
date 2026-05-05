import { describe, expect, it } from 'vitest'
import { emailSchema, phoneNumberSchema } from './validation-schemas'

describe('emailSchema', () => {
  it('accepts valid email', () => {
    const result = emailSchema.safeParse('test@example.com')
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = emailSchema.safeParse('not-an-email')
    expect(result.success).toBe(false)
  })
})

describe('phoneNumberSchema', () => {
  it('accepts valid phone number', () => {
    const result = phoneNumberSchema.safeParse('0812345678')
    expect(result.success).toBe(true)
  })

  it('rejects too short phone number', () => {
    const result = phoneNumberSchema.safeParse('123')
    expect(result.success).toBe(false)
  })
})
