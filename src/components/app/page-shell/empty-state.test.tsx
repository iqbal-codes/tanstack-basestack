import { render, screen } from '@testing-library/react'
import { ShoppingCart } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders the provided title', () => {
    render(<EmptyState title="No orders" description="" />)
    expect(screen.getByText('No orders')).toBeDefined()
  })

  it('renders the provided description', () => {
    render(<EmptyState title="" description="Nothing to show yet" />)
    expect(screen.getByText('Nothing to show yet')).toBeDefined()
  })

  it('renders the default icon when none is provided', () => {
    const { container } = render(<EmptyState title="T" description="D" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders a custom icon when provided', () => {
    const { container } = render(
      <EmptyState icon={ShoppingCart} title="T" description="D" />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders an action button when action is provided', () => {
    render(
      <EmptyState
        title="T"
        description="D"
        action={{ label: 'Create order' }}
      />,
    )
    expect(screen.getByText('Create order')).toBeDefined()
  })

  it('does not render an action when no action is provided', () => {
    render(<EmptyState title="T" description="D" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
