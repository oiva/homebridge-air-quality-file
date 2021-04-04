import * as fs from 'fs'
import * as https from 'https'

let Service: any
let Characteristic: any
let AirQuality: any

export default (homebridge: any): void => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  AirQuality = Characteristic.AirQuality

  homebridge.registerAccessory(
    'homebridge-air-quality-file',
    'AirQualityFile',
    AirQualityFileAccessory
  )
}

const readFile = (filePath: string, callback: Function): void => {
  function parseData(data: string) {
    const readings: Reading[] = JSON.parse(data)
    if (readings.length == 0) {
      return callback(null, null)
    }
    const hourly = filterReadings(readings)
    return callback(null, hourly)
  }

  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    https.get(filePath, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        return parseData(data);
      });

    }).on("error", (err) => {
      return callback(err)
    });

    return;
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err)
    }

    return parseData(data);
  })
}

const filterReadings = (readings: Reading[], durationToAverage: number): Reading[] => {
  if (readings.length < 2) {
    return readings;
  }

  const now = new Date().getTime()
  return readings.filter(reading => {
    const time = Date.parse(reading.time)
    return now - time < durationToAverage
  })
}

class AirQualityFileAccessory {
  // configuration
  log: Function
  name: string = ''
  filePath?: string
  durationToAverage?: number
  sensor: any
  limits10: number[]
  limits25: number[]

  constructor(log: Function, config: Record<string, string | number[]>) {
    this.log = log
    if (typeof config.name === 'string') {
      this.name = config['name']
    }
    if (typeof config.file_path === 'string') {
      this.filePath = config['file_path']
    }
    if (typeof config.limits_25 === 'object') {
      this.limits25 = config.limits_25
    } else {
      this.limits25 = [15, 30, 55, 110]
    }
    if (typeof config.limits_10 === 'object') {
      this.limits10 = this.limits10 = config['limits_10']
    } else {
      this.limits10 = [25, 50, 90, 180]
    }
    if (typeof config.duration_to_average === 'number') {
      this.durationToAverage = config.duration_to_average
    } else {
      this.durationToAverage = 3600000
    }
    const airQualityIndexName = config.airQualityIndexName || 'Air Quality'

    // not defined in tests
    if (typeof Service !== 'undefined') {
      this.sensor = new Service.AirQualitySensor(airQualityIndexName)
    }
    // defined in tests
    if (typeof global.AirQuality !== 'undefined') {
      AirQuality = global.AirQuality
    }
  }

  getAirQuality(readings: Reading[]): number {
    const totalPM25 = readings.reduce(
      (prev, reading): number => prev + parseFloat(reading.pm25),
      0
    )
    const totalPM10 = readings.reduce(
      (prev, reading): number => prev + parseFloat(reading.pm10),
      0
    )

    const averagePM25 = totalPM25 / readings.length
    const averagePM10 = totalPM10 / readings.length

    if (averagePM25 === 0 && averagePM10 === 0) {
      return AirQuality.UNKNOWN
    }
    if (averagePM25 <= this.limits25[0] && averagePM10 <= this.limits10[0]) {
      return AirQuality.EXCELLENT
    }
    if (averagePM25 <= this.limits25[1] && averagePM10 <= this.limits10[1]) {
      return AirQuality.GOOD
    }
    if (averagePM25 <= this.limits25[2] && averagePM10 <= this.limits10[2]) {
      return AirQuality.FAIR
    }
    if (averagePM25 <= this.limits25[3] && averagePM10 <= this.limits10[3]) {
      return AirQuality.INFERIOR
    }
    return AirQuality.POOR
  }

  updateAirQualityIndex(callback: Function): void {
    if (typeof this.filePath === 'undefined') {
      return this.sensor.setCharacteristic(Characteristic.StatusFault, 1)
    }
    readFile(
      this.filePath,
      (err: NodeJS.ErrnoException, data: Reading[]): void => {
        if (err || data === null || data.length == 0) {
          this.sensor.setCharacteristic(Characteristic.StatusFault, 1)
          callback(err)
          return
        }
        const latest = data[data.length - 1]
        const pm25 = parseFloat(latest.pm25)
        const pm10 = parseFloat(latest.pm10)
        const aiq = this.getAirQuality(data)
        this.sensor.setCharacteristic(Characteristic.PM2_5Density, pm25)
        this.sensor.setCharacteristic(Characteristic.PM10Density, pm10)
        this.sensor.setCharacteristic(Characteristic.AirQuality, aiq)
        callback(null, aiq)
      }
    )
  }

  getServices() {
    this.sensor
      .getCharacteristic(Characteristic.AirQuality)
      .on('get', this.updateAirQualityIndex.bind(this))
    return [this.sensor]
  }
}

export { AirQualityFileAccessory, filterReadings }
