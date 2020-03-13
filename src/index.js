"use strict";
exports.__esModule = true;
require('@babel/polyfill');
var fs = require("fs");
var hap_nodejs_1 = require("hap-nodejs");
var HomeKit_1 = require("hap-nodejs/dist/lib/gen/HomeKit");
var service;
var characteristic;
module.exports = function (homebridge) {
    service = homebridge.hap.Service;
    characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-air-quality-file', 'AirQualityFile', AirQualityFileAccessory);
};
function readFile(filePath, callback) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
            return callback(err);
        }
        var readings = JSON.parse(data);
        if (readings.length == 0) {
            return callback(null, null);
        }
        var latest = readings[readings.length - 1];
        return callback(null, latest);
    });
}
var AirQualityFileAccessory = /** @class */ (function () {
    function AirQualityFileAccessory(log, config) {
        this.log = log;
        this.name = config['name'];
        this.filePath = config['file_path'];
        var airQualityIndexName = config.airQualityIndexName || 'Air Quality';
        this.sensor = new service.AirQualitySensor(airQualityIndexName);
    }
    AirQualityFileAccessory.prototype.getAirQuality = function (density) {
        if (density === null) {
            return HomeKit_1.AirQuality.UNKNOWN;
        }
        if (density <= 25) {
            return HomeKit_1.AirQuality.EXCELLENT;
        }
        if (density <= 50) {
            return HomeKit_1.AirQuality.GOOD;
        }
        if (density <= 100) {
            return HomeKit_1.AirQuality.FAIR;
        }
        if (density <= 150) {
            return HomeKit_1.AirQuality.INFERIOR;
        }
        return HomeKit_1.AirQuality.POOR;
    };
    AirQualityFileAccessory.prototype.updateAirQualityIndex = function (callback) {
        readFile(this.filePath, function (err, data) {
            if (err || data === null) {
                this.sensor.setCharacteristic(hap_nodejs_1.Characteristic.StatusFault, 1);
                callback(err);
                return;
            }
            var pm25 = parseFloat(data.pm25);
            var pm10 = parseFloat(data.pm10);
            var aiq = this.getAirQuality(pm10);
            this.sensor.setCharacteristic(hap_nodejs_1.Characteristic.PM2_5Density, pm25);
            this.sensor.setCharacteristic(hap_nodejs_1.Characteristic.PM10Density, pm10);
            this.sensor.setCharacteristic(hap_nodejs_1.Characteristic.AirQuality, aiq);
            callback(null, aiq);
        }.bind(this));
    };
    AirQualityFileAccessory.prototype.getServices = function () {
        this.sensor
            .getCharacteristic(hap_nodejs_1.Characteristic.AirQuality)
            .on('get', this.updateAirQualityIndex.bind(this));
        return [this.sensor];
    };
    return AirQualityFileAccessory;
}());
