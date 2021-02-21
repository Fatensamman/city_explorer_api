'use strict';
const express = require('express');
require('dotenv').config();
const cors = require('cors')
const server = express();

const PORT = process.env.PORT || 3030;

server.use(cors());

server.get('/test', (req, res) => {
    res.send('test');
})

server.get('/location', (req, res) => {
    const locdata = require('./data/location.json');
    const locObj = new Sitelocation(locdata);
    res.send(locObj);
    // console.log(locdata);
});
let newA = [];
server.get('/weather', (req, res) => {
    const locWether = require('./data/weather.json');
    locWether.data.forEach(elem =>{
        const weatherObjs = new SiteWeather(elem);
    })
    res.send(newA);
    console.log(newA);
})
// [
//     {
//       "forecast": "Partly cloudy until afternoon.",
//       "time": "Mon Jan 01 2001"
//     },
//     {
//       "forecast": "Mostly cloudy in the morning.",
//       "time": "Tue Jan 02 2001"
//     },
//     ...
//   ]

function SiteWeather(weatherdata) {
   
        this.forecast = weatherdata.weather.description;
        this.time = weatherdata.datetime;
        newA.push(this);
}
function Sitelocation(sitedata) {
    this.search_query = 'Lynnwood';
    this.formatted_query = sitedata[0].display_name;
    this.latitude = sitedata[0].lat;
    this.longitude = sitedata[0].lon;
}

server.listen(PORT, () => {
    console.log(`its port is ${PORT}`)
})