import { AirQualityFileAccessory, filterReadings } from '../src/index'
import '../src/types.d'

global.AirQuality = {
  UNKNOWN: 0,
  EXCELLENT: 1,
  GOOD: 2,
  FAIR: 3,
  INFERIOR: 4,
  POOR: 5
}

const fileAccessory = new AirQualityFileAccessory(console.log, {})
const now = new Date()

test('filter readings based on time', () => {
  const timeHourAgo = new Date().getTime() - 3600000
  const hourAgo = new Date(timeHourAgo)
  const readings = filterReadings([
    { pm25: '111', pm10: '180', time: hourAgo.toString() },
    { pm25: '111', pm10: '180', time: hourAgo.toString() },
    { pm25: '10', pm10: '20', time: now.toString() }
  ])
  expect(readings.length).toBe(1)
  expect(readings[0].pm25).toBe('10')
})

test('calculate excellent air quality index', () => {
  const readings = [
    { pm25: '10', pm10: '20', time: now.toString() },
    { pm25: '15', pm10: '25', time: now.toString() },
    { pm25: '20', pm10: '30', time: now.toString() }
  ]
  const aiq = fileAccessory.getAirQuality(readings)
  expect(aiq).toBe(1)
})

test('calculate poor air quality index', () => {
  const readings = [
    { pm25: '111', pm10: '180', time: now.toString() },
    { pm25: '111', pm10: '180', time: now.toString() },
    { pm25: '111', pm10: '180', time: now.toString() }
  ]
  const aiq = fileAccessory.getAirQuality(readings)
  expect(aiq).toBe(5)
})
