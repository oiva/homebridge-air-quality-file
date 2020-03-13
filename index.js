var fs = require('fs');
var Service, Characteristic, AirQuality;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  AirQuality = Characteristic.AirQuality;

  homebridge.registerAccessory("homebridge-air-quality-file", "AirQualityFile", AirQualityFileAccessory);
}

function AirQualityFileAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.filePath = config["file_path"];

  var airQualityIndexName = config.airQualityIndexName || 'Air Quality';
  this.sensor = new Service.AirQualitySensor(airQualityIndexName);
}

function readFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      return callback(err)
    }
    var readings = JSON.parse(data)
    if (readings.length == 0) {
        return callback(null, null)
    }
    var latest = readings[readings.length - 1]
    return callback(null, latest)
  })
}

AirQualityFileAccessory.prototype = {
  getAirQuality: function(density) {
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
  },

  updateAirQualityIndex: function (callback) {
    readFile(this.filePath, function(err, data) {
      if (err || data === null) {
        this.sensor.setCharacteristic(Characteristic.StatusFault, 1);
        callback(err);
        return
      }
      var pm25 = parseFloat(data.pm25)
      var pm10 = parseFloat(data.pm10)
      var aiq = this.getAirQuality(pm10)
      this.sensor.setCharacteristic(Characteristic.PM2_5Density, pm25)
      this.sensor.setCharacteristic(Characteristic.PM10Density, pm10)
      this.sensor.setCharacteristic(Characteristic.AirQuality, aiq)
      callback(null, aiq)
    }.bind(this))
  },

  getServices: function() {
    this.sensor.getCharacteristic(Characteristic.AirQuality).on('get', this.updateAirQualityIndex.bind(this))
    return [this.sensor]
  }
}