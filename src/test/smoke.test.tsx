import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('test infrastructure', () => {
  it('renders a simple element', () => {
    render(<div>hello</div>)
    expect(screen.getByText('hello')).toBeDefined()
  })
})
