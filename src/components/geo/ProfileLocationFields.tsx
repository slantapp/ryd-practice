import { useEffect, useMemo, useState } from 'react'
import countriesData from '../../data/countries.json'
import type { GeoCountry } from '../../types/geo'
import { GeoSelect } from './GeoSelect'

const countries = countriesData as GeoCountry[]

export interface LocationValues {
  country: string
  state: string
  timezone: string
}

interface ProfileLocationFieldsProps {
  values: LocationValues
  onChange: (values: LocationValues) => void
}

function findCountryByName(name: string) {
  return countries.find((c) => c.name === name) ?? null
}

export function ProfileLocationFields({ values, onChange }: ProfileLocationFieldsProps) {
  const [selectedCountry, setSelectedCountry] = useState<GeoCountry | null>(() =>
    values.country ? findCountryByName(values.country) : null,
  )

  useEffect(() => {
    if (values.country) {
      setSelectedCountry(findCountryByName(values.country))
    }
  }, [values.country])

  const states = useMemo(() => selectedCountry?.states ?? [], [selectedCountry])
  const timezones = useMemo(() => selectedCountry?.timezones ?? [], [selectedCountry])

  const handleCountryChange = (country: GeoCountry) => {
    setSelectedCountry(country)
    onChange({
      country: country.name,
      state: '',
      timezone: '',
    })
  }

  const handleStateChange = (state: { name: string }) => {
    onChange({ ...values, state: state.name })
  }

  const handleTimezoneChange = (tz: { zoneName: string }) => {
    onChange({ ...values, timezone: tz.zoneName })
  }

  return (
    <div className="space-y-4">
      <GeoSelect
        label="Country"
        placeholder="Select country"
        value={values.country}
        options={countries}
        getOptionLabel={(c) => c.name}
        onChange={handleCountryChange}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GeoSelect
          label="Province / State"
          placeholder={selectedCountry ? '-- select state --' : 'Select country first'}
          value={values.state}
          options={states}
          disabled={!selectedCountry}
          getOptionLabel={(s) => s.name}
          onChange={handleStateChange}
        />
        <GeoSelect
          label="Study timezone"
          placeholder={selectedCountry ? '-- select timezone --' : 'Select country first'}
          value={values.timezone}
          options={timezones}
          disabled={!selectedCountry}
          searchable={false}
          getOptionLabel={(t) => t.zoneName}
          onChange={handleTimezoneChange}
        />
      </div>
    </div>
  )
}
