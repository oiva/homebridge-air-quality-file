declare module NodeJS {
  interface Global {
    AirQuality: Record<string, number>
  }
}

interface Reading {
  pm25: string
  pm10: string
  time: string
}