'use strict';
//App libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// App setup
const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());

//route definitions
server.get('/test', testhandeler);
server.get('/location', locaHandeler);
server.get('/weather', weatherHandeler);
server.use('*', notfound);

// functions decleration
function testhandeler(req, res) {
    res.send('test');
};

function locaHandeler(req, res) {
    const locdata = require('./data/location.json');
    const locObj = new Sitelocation(locdata);
    res.send(locObj);
    // console.log(locdata);
};

function weatherHandeler(req, res) {
    const locWether = require('./data/weather.json');
    let newA = locWether.data.map(elem => new SiteWeather(elem));
    res.send(newA);
    // console.log(newA);
};

function notfound(req, res) {
    const error = {
        status: 500,
        responseText: "Sorry, something went wrong"
    }
    res.status(500).send(error)
};

//constructors
function SiteWeather(weatherdata) {

    this.forecast = weatherdata.weather.description;
    this.time = weatherdata.datetime;
}
function Sitelocation(sitedata) {
    this.search_query = 'Lynnwood';
    this.formatted_query = sitedata[0].display_name;
    this.latitude = sitedata[0].lat;
    this.longitude = sitedata[0].lon;
}
// lisitening
server.listen(PORT, () => {
    console.log(`its port is ${PORT}`)
})