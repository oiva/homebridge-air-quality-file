import * as fs from 'fs'

let Service: any
let Characteristic: any
let AirQuality: any

module.exports = (homebridge: any): void => {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic;
  AirQuality = Characteristic.AirQuality

  homebridge.registerAccessory(
    'homebridge-air-quality-file',
    'AirQualityFile',
    AirQualityFileAccessory
  )
}

const readFile = (filePath: string, callback: Function): void => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err)
    }
    const readings = JSON.parse(data)
    if (readings.length == 0) {
      return callback(null, null)
    }
    const latest = readings[readings.length - 1]
    return callback(null, latest)
  })
}

class AirQualityFileAccessory {
  // configuration
  log: Function
  name: string
  filePath: string
  sensor: any

  constructor(log: Function, config: Record<string, string>) {
    this.log = log
    this.name = config['name']
    this.filePath = config['file_path']

    const airQualityIndexName = config.airQualityIndexName || 'Air Quality'
    this.sensor = new Service.AirQualitySensor(airQualityIndexName)
  }

  getAirQuality(density: number): number {
    if (density === null) {
      return AirQuality.UNKNOWN
    }
    if (density <= 25) {
      return AirQuality.EXCELLENT
    }
    if (density <= 50) {
      return AirQuality.GOOD
    }
    if (density <= 100) {
      return AirQuality.FAIR
    }
    if (density <= 150) {
      return AirQuality.INFERIOR
    }
    return AirQuality.POOR
  }

  updateAirQualityIndex(callback: Function): void {
    readFile(
      this.filePath,
      (
        err: NodeJS.ErrnoException,
        data: Record<string, string>
      ): void => {
        if (err || data === null) {
          this.sensor.setCharacteristic(Characteristic.StatusFault, 1)
          callback(err)
          return
        }
        var pm25 = parseFloat(data.pm25)
        var pm10 = parseFloat(data.pm10)
        var aiq = this.getAirQuality(pm10)
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
