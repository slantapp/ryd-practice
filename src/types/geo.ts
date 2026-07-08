export interface GeoState {
  name: string
}

export interface GeoTimezone {
  zoneName: string
}

export interface GeoCountry {
  name: string
  states: GeoState[]
  timezones: GeoTimezone[]
}
