import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
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
  const ref = useRef<HTMLDivElement>(null)

  useOnClickOutside(ref, () => {
    setOpen(false)
    setQuery('')
  })

  const filtered = query.trim()
    ? options.filter((item) => getOptionLabel(item).toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const display = value || placeholder

  return (
    <label className="block text-sm premium-text-muted">
      {label}
      <div ref={ref} className={`relative mt-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="premium-field flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm"
        >
          <span className={value ? '' : 'premium-text-soft'}>{display}</span>
          <ChevronDown size={14} className="premium-text-soft shrink-0" />
        </button>
        {open ? (
          <div
            className="absolute left-0 right-0 z-50 mt-1 max-h-52 overflow-hidden rounded-xl border shadow-lg"
            style={{ borderColor: 'var(--premium-card-border)', background: 'var(--premium-menu-bg)' }}
          >
            {searchable ? (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="premium-input w-full border-0 border-b px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--premium-card-border)' }}
              />
            ) : null}
            <div className="max-h-40 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="premium-text-soft px-3 py-4 text-center text-xs">No options found</p>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={`${getOptionLabel(item)}-${index}`}
                    type="button"
                    className="geo-select-option block w-full px-3 py-2 text-left text-sm"
                    onClick={() => {
                      onChange(item)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    {getOptionLabel(item)}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  )
}
