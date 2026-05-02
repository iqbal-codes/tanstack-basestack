import { describe, expect, it } from 'vitest'
import { type CustomerInput, validateCustomerInput } from './model'

describe('validateCustomerInput', () => {
  it('returns null for valid input', () => {
    const input: CustomerInput = { name: 'Acme Corp' }
    expect(validateCustomerInput(input)).toBeNull()
  })

  it('returns error for empty name', () => {
    const input: CustomerInput = { name: '' }
    expect(validateCustomerInput(input)).toBe('nameRequired')
  })

  it('returns error for whitespace-only name', () => {
    const input: CustomerInput = { name: '   ' }
    expect(validateCustomerInput(input)).toBe('nameRequired')
  })

  it('returns null for valid input with all optional fields', () => {
    const input: CustomerInput = {
      name: 'PT Maju Jaya',
      email: 'maju@jaya.com',
      phone: '081234567890',
      notes: 'Prefers morning delivery',
      active: true,
    }
    expect(validateCustomerInput(input)).toBeNull()
  })

  it('allows null optional fields', () => {
    const input: CustomerInput = {
      name: 'Test',
      email: null,
      phone: null,
      notes: null,
    }
    expect(validateCustomerInput(input)).toBeNull()
  })
})
