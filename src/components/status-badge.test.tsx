import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'use-intl'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './status-badge'

const testMessages = {
  status: {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    production: 'In Production',
    in_delivery: 'In Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    paid: 'Paid',
    overdue: 'Overdue',
    failed: 'Failed',
  },
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <IntlProvider locale="en" messages={testMessages}>
      {children}
    </IntlProvider>
  )
}

describe('StatusBadge', () => {
  it('renders the status label for a known status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="draft" />
      </TestWrapper>,
    )
    expect(screen.getByText('Draft')).toBeDefined()
  })

  it('renders fallback label for an unknown status', () => {
    render(
      <TestWrapper>
        <StatusBadge status="unknown" />
      </TestWrapper>,
    )
    expect(screen.getByText('unknown')).toBeDefined()
  })

  it('covers the full Pabriq order lifecycle statuses', () => {
    const statuses = [
      'draft',
      'pending',
      'approved',
      'production',
      'in_delivery',
      'completed',
      'cancelled',
    ]
    for (const s of statuses) {
      render(
        <TestWrapper>
          <StatusBadge status={s} />
        </TestWrapper>,
      )
    }
    expect(screen.getByText('Draft')).toBeDefined()
    expect(screen.getByText('Pending')).toBeDefined()
    expect(screen.getByText('Approved')).toBeDefined()
    expect(screen.getByText('In Production')).toBeDefined()
    expect(screen.getByText('In Delivery')).toBeDefined()
    expect(screen.getByText('Completed')).toBeDefined()
    expect(screen.getByText('Cancelled')).toBeDefined()
  })
})
