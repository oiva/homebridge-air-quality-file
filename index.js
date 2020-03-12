var fs = require('fs');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-air-quality-file", "AirQualityFile", AirQualityFileAccessory);
}

function AirQualityFileAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.filePath = config["file_path"];

  this.service = new Service.AirQualitySensor(this.name);

  this.service
    .getCharacteristic(Characteristic.AirQuality)
    .on('get', this.getState.bind(this));
}

AirQualityFileAccessory.prototype.getState = function(callback) {
  fs.readFile(this.filePath, 'utf8', function(err, data) {
    if (err) {
      callback(err);
      return
    }

    callback(null, parseFloat(data))
  })
}

TemperatureFileAccessory.prototype.getServices = function() {
  return [this.service];
}
