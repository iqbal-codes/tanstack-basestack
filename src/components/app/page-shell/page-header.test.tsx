import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Orders" />)
    expect(screen.getByText('Orders')).toBeDefined()
  })

  it('renders an optional description', () => {
    render(<PageHeader title="Orders" description="Manage your orders" />)
    expect(screen.getByText('Manage your orders')).toBeDefined()
  })

  it('renders primary action when provided with onClick', () => {
    render(
      <PageHeader
        title="Orders"
        primaryAction={{ label: 'New Order', onClick: () => {} }}
      />,
    )
    expect(screen.getByText('New Order')).toBeDefined()
  })

  it('hides on mobile with hidden md:flex classes', () => {
    const { container } = render(<PageHeader title="Orders" />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('hidden')
    expect(root.className).toContain('md:flex')
  })
})
