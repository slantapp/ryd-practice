import { useRef } from 'react'

interface OtpInputProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function OtpInput({ value, onChange }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const updateDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && refs.current[index + 1]) refs.current[index + 1]?.focus()
  }

  return (
    <div className="otp-row">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el }}
          className="otp-box"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => updateDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[index] && refs.current[index - 1]) {
              refs.current[index - 1]?.focus()
            }
          }}
        />
      ))}
    </div>
  )
}
