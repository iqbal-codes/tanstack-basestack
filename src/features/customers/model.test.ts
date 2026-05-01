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
      businessName: 'Maju Jaya Corp',
      email: 'maju@jaya.com',
      phone: '081234567890',
      address: 'Jl. Sudirman No. 123',
      notes: 'Prefers morning delivery',
      active: true,
    }
    expect(validateCustomerInput(input)).toBeNull()
  })

  it('allows null optional fields', () => {
    const input: CustomerInput = {
      name: 'Test',
      businessName: null,
      email: null,
      phone: null,
      address: null,
      notes: null,
    }
    expect(validateCustomerInput(input)).toBeNull()
  })
})
