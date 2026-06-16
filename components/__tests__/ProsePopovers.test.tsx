import { fireEvent, render, screen, within } from '@testing-library/react'
import ProsePopovers, {
  extractFootnotes,
  isExternal,
  isFootnoteRef,
} from '@/components/ProsePopovers'

const anchor = (attrs: Record<string, string>) => {
  const a = document.createElement('a')
  Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v))
  return a
}

const Body = () => (
  <>
    <p>
      claim
      <sup>
        <a data-footnote-ref href="#user-content-fn-1" id="user-content-fnref-1">
          1
        </a>
      </sup>{' '}
      and <a href="https://example.com/x">ext</a> and <a href="/blog">internal</a>
    </p>
    <section data-footnotes>
      <ol>
        <li id="user-content-fn-1">
          <p>
            the note{' '}
            <a href="#user-content-fnref-1" data-footnote-backref>
              ↩
            </a>
          </p>
        </li>
      </ol>
    </section>
  </>
)

describe('classification helpers', () => {
  it('detects external links', () => {
    expect(isExternal(anchor({ href: 'https://example.com' }))).toBe(true)
    expect(isExternal(anchor({ href: '/blog' }))).toBe(false)
    expect(isExternal(anchor({ href: '#x' }))).toBe(false)
  })

  it('detects footnote refs by attribute or href', () => {
    expect(isFootnoteRef(anchor({ href: '#user-content-fn-1' }))).toBe(true)
    expect(isFootnoteRef(anchor({ 'data-footnote-ref': '', href: '#x' }))).toBe(true)
    expect(isFootnoteRef(anchor({ href: '#section' }))).toBe(false)
  })
})

describe('extractFootnotes', () => {
  it('maps footnote id to note HTML and strips the backref', () => {
    const c = document.createElement('div')
    c.innerHTML =
      '<section data-footnotes><ol><li id="user-content-fn-1"><p>note one <a href="#" data-footnote-backref>back</a></p></li></ol></section>'
    const m = extractFootnotes(c)
    expect(m.get('user-content-fn-1')).toContain('note one')
    expect(m.get('user-content-fn-1')).not.toContain('back')
  })
})

describe('<ProsePopovers> interaction', () => {
  it('opens a text popover with the note on footnote click', () => {
    render(
      <ProsePopovers>
        <Body />
      </ProsePopovers>
    )
    fireEvent.click(screen.getByText('1'))
    expect(within(screen.getByRole('dialog')).getByText(/the note/)).toBeInTheDocument()
  })

  it('opens a link popover with Visit and Copy on external link click', () => {
    render(
      <ProsePopovers>
        <Body />
      </ProsePopovers>
    )
    fireEvent.click(screen.getByText('ext'))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Visit')).toBeInTheDocument()
    expect(within(dialog).getByText('Copy')).toBeInTheDocument()
  })

  it('copies the url to the clipboard on Copy click', () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(
      <ProsePopovers>
        <Body />
      </ProsePopovers>
    )
    fireEvent.click(screen.getByText('ext'))
    fireEvent.click(screen.getByText('Copy'))
    expect(writeText).toHaveBeenCalledWith('https://example.com/x')
  })

  it('does not open a popover for internal links', () => {
    render(
      <ProsePopovers>
        <Body />
      </ProsePopovers>
    )
    fireEvent.click(screen.getByText('internal'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the popover on Escape', () => {
    render(
      <ProsePopovers>
        <Body />
      </ProsePopovers>
    )
    fireEvent.click(screen.getByText('1'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
