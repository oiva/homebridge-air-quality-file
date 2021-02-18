# homebridge-air-quality-file
This is a plugin for [Homebridge](https://github.com/nfarina/homebridge) which shows up as an air quality sensor. The values are read from a file. Based on [homebridge-temperature-file](https://github.com/bahlo/homebridge-temperature-file).

## File format
The plugin expects to get a list of readings in JSON form:
```
[
  {"pm25": 1.3, "pm10": 2.9, "time": "12.03.2020 21:23:32"},
  {"pm10": 2.1, "pm25": 1.1, "time": "12.03.2020 22:47:28"}
]
```
You can use [this guide](https://hackernoon.com/how-to-measure-particulate-matter-with-a-raspberry-pi-75faa470ec35) to setup a Python script to read values from a SDS011 sensor to a file.

Make sure to change line 137 (`jsonrow`) of aqi.py from the guide above. The
date format shoud be changed from `%d.%m.%Y` to `%Y-%d-%m` for the plugin to
work reliably.

## Installation and configuration
Run `npm install homebridge-air-quality-file`

Add an accessory configuration into your Homebridge config.json:
```
{
  "accessory": "AirQualityFile",
  "name": "Air-quality-sensor",
  "description": "Air quality sensor",
  "file_path": "/home/pi/air-quality/aqi.json"
}
```

Point the `file_path` to a file containing the readings.

## Tests

Run tests with Jest
```
npm run test
```