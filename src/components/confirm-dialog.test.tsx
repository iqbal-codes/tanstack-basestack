import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfirmDialog } from './confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Delete order?"
        description="This action cannot be undone."
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Delete order?')).toBeDefined()
    expect(screen.getByText('This action cannot be undone.')).toBeDefined()
  })

  it('renders cancel button with default label', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Delete"
        description="Sure?"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('renders custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        open
        onOpenChange={() => {}}
        title="Delete"
        description="Sure?"
        confirmLabel="Yes, delete"
        cancelLabel="No, keep it"
        onConfirm={() => {}}
      />,
    )
    expect(screen.getByText('Yes, delete')).toBeDefined()
    expect(screen.getByText('No, keep it')).toBeDefined()
  })
})
