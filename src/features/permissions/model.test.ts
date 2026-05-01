import { describe, expect, it } from 'vitest'
import {
  canAdvanceProductionTask,
  canApproveOrders,
  canCreateOrders,
  canManageInvoices,
  canManageMembers,
  canManageProducts,
  canViewProduction,
  type Role,
} from './model'

const roles: Role[] = ['owner', 'admin', 'member']

function expectPermissions(fn: (role: Role) => boolean, allowed: Role[]) {
  for (const role of roles) {
    const expected = allowed.includes(role)
    expect(fn(role), `role=${role}`).toBe(expected)
  }
}

describe('canManageMembers', () => {
  it('allows only owner', () => {
    expectPermissions(canManageMembers, ['owner'])
  })
})

describe('canManageProducts', () => {
  it('allows owner and admin', () => {
    expectPermissions(canManageProducts, ['owner', 'admin'])
  })
})

describe('canCreateOrders', () => {
  it('allows owner, admin, and member', () => {
    expectPermissions(canCreateOrders, ['owner', 'admin', 'member'])
  })
})

describe('canApproveOrders', () => {
  it('allows owner and admin', () => {
    expectPermissions(canApproveOrders, ['owner', 'admin'])
  })
})

describe('canManageInvoices', () => {
  it('allows owner and admin', () => {
    expectPermissions(canManageInvoices, ['owner', 'admin'])
  })
})

describe('canAdvanceProductionTask', () => {
  it('allows owner and admin', () => {
    expectPermissions(canAdvanceProductionTask, ['owner', 'admin'])
  })
})

describe('canViewProduction', () => {
  it('allows owner and admin', () => {
    expectPermissions(canViewProduction, ['owner', 'admin'])
  })
})
