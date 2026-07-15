import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'

interface GeoSelectProps<T extends { name?: string; zoneName?: string }> {
  label: string
  placeholder: string
  value: string
  options: T[]
  disabled?: boolean
  getOptionLabel: (item: T) => string
  onChange: (item: T) => void
  searchable?: boolean
}

interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

export function GeoSelect<T extends { name?: string; zoneName?: string }>({
  label,
  placeholder,
  value,
  options,
  disabled,
  getOptionLabel,
  onChange,
  searchable = true,
}: GeoSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      close()
    },
    [close],
  )

  useOnClickOutside(rootRef, handleOutside)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const gap = 6
    const viewportPad = 12
    const preferredMax = Math.min(280, window.innerHeight * 0.45)
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad
    const spaceAbove = rect.top - gap - viewportPad
    const placeAbove = spaceBelow < 160 && spaceAbove > spaceBelow
    const available = placeAbove ? spaceAbove : spaceBelow
    const maxHeight = Math.max(120, Math.min(preferredMax, available))
    const left = Math.min(
      Math.max(viewportPad, rect.left),
      Math.max(viewportPad, window.innerWidth - rect.width - viewportPad),
    )

    setMenuPos(
      placeAbove
        ? {
            bottom: window.innerHeight - rect.top + gap,
            left,
            width: rect.width,
            maxHeight,
          }
        : {
            top: rect.bottom + gap,
            left,
            width: rect.width,
            maxHeight,
          },
    )
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(frame)
  }, [open, updatePosition, options.length, query])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        triggerRef.current?.focus()
      }
    }

    const onReposition = () => updatePosition()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, close, updatePosition])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      if (searchable) searchRef.current?.focus()
      else menuRef.current?.querySelector<HTMLButtonElement>('.geo-select-option')?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, searchable])

  const filtered = query.trim()
    ? options.filter((item) => getOptionLabel(item).toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const selectOption = (item: T) => {
    onChange(item)
    close()
    triggerRef.current?.focus()
  }

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="geo-select-menu"
            style={{
              top: menuPos.top,
              bottom: menuPos.bottom,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
            }}
          >
            {searchable ? (
              <div className="geo-select-search">
                <Search size={14} aria-hidden className="geo-select-search-icon" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="geo-select-search-input"
                  autoComplete="off"
                  aria-autocomplete="list"
                />
              </div>
            ) : null}
            <div className="geo-select-options">
              {filtered.length === 0 ? (
                <p className="geo-select-empty">No matches</p>
              ) : (
                filtered.map((item, index) => {
                  const optionLabel = getOptionLabel(item)
                  const selected = optionLabel === value
                  return (
                    <button
                      key={`${optionLabel}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`geo-select-option${selected ? ' is-selected' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectOption(item)}
                    >
                      <span className="geo-select-option-label">{optionLabel}</span>
                      {selected ? <Check size={14} className="geo-select-option-check" aria-hidden /> : null}
                    </button>
                  )
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={`geo-select${disabled ? ' is-disabled' : ''}${open ? ' is-open' : ''}`}>
      <span className="geo-select-label" id={`${listId}-label`}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="geo-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${listId}-label`}
        onClick={() => {
          if (disabled) return
          setOpen((current) => {
            if (current) {
              setQuery('')
              return false
            }
            return true
          })
        }}
      >
        <span className={`geo-select-value${value ? '' : ' is-placeholder'}`}>{value || placeholder}</span>
        <ChevronDown size={16} className={`geo-select-chevron${open ? ' is-open' : ''}`} aria-hidden />
      </button>
      {menu}
    </div>
  )
}
