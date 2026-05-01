import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'use-intl'
import { describe, expect, it } from 'vitest'
import { ConfirmDialog } from './confirm-dialog'

const testMessages = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <IntlProvider locale="en" messages={testMessages}>
      {children}
    </IntlProvider>
  )
}

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <TestWrapper>
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Delete order?"
          description="This action cannot be undone."
          onConfirm={() => {}}
        />
      </TestWrapper>,
    )
    expect(screen.getByText('Delete order?')).toBeDefined()
    expect(screen.getByText('This action cannot be undone.')).toBeDefined()
  })

  it('renders cancel button with default label', () => {
    render(
      <TestWrapper>
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Delete"
          description="Sure?"
          onConfirm={() => {}}
        />
      </TestWrapper>,
    )
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('renders custom confirm and cancel labels', () => {
    render(
      <TestWrapper>
        <ConfirmDialog
          open
          onOpenChange={() => {}}
          title="Delete"
          description="Sure?"
          confirmLabel="Yes, delete"
          cancelLabel="No, keep it"
          onConfirm={() => {}}
        />
      </TestWrapper>,
    )
    expect(screen.getByText('Yes, delete')).toBeDefined()
    expect(screen.getByText('No, keep it')).toBeDefined()
  })
})
