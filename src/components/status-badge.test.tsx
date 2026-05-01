import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders the status label for a known status', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText('Draft')).toBeDefined()
  })

  it('renders fallback label for an unknown status', () => {
    render(<StatusBadge status="unknown" />)
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
      render(<StatusBadge status={s} />)
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
