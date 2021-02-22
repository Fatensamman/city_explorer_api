'use strict';
//App libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');

// App setup
const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());

//route definitions
server.get('/test', testhandeler);
server.get('/location', locaHandeler);
server.get('/weather', weatherHandeler);
server.get('/parks', parkhandeler)
server.get('*', notfound);
server.use(errorhandler);

// functions decleration
function testhandeler(req, res) {
    res.send('test');
};


// https://city-explorer-backend.herokuapp.com/location?city=amman
function locaHandeler(req, res) {
    const cityName = req.query.city
    const key = process.env.GEOCODE_API_KEY;
    const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
    superagent.get(url)
        .then(citydata => {
            const locObj = new Sitelocation(cityName, citydata.body[0]);
            res.status(200).json(locObj);
        });
    // .catch(()=>{
    //     notfound(req,res);
    // });
};

//://city-explorer-backend.herokuapp.com/weather?id=700&search_query=amman&formatted_query=Amman%2C%2011181%2C%20Jordan&latitude=31.951569&longitude=35.923963&created_at=&page=1
function weatherHandeler(req, res) {
    const cityName = req.query.search_query;
    const lat = req.query.latitude;
    const lon = req.query.longitude;

    const key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=${key}&lat=${lat}&lon=${lon}`
    superagent.get(url)
        .then(dataW => {
            // console.log(data1.body)
            const weatherData = dataW.body.data.map(elem => new SiteWeather(elem));
            res.status(200).json(weatherData);
        })
};

// https://city-explorer-backend.herokuapp.com/parks?id=700&search_query=amman&formatted_query=Amman%2C%2011181%2C%20Jordan&latitude=31.951569&longitude=35.923963&created_at=&page=1

function parkhandeler(req, res) {
    let parkCode = req.query.parkCode;
    const key = process.env.PARKS_API_KEY;
    const url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${key}`;
    superagent.get(url)
        .then(dataP => {
            console.log(dataP.body)
            // res.send('heloooo')
            const parkData = dataP.body.data.map(elem => new SitePark(elem));
            res.status(200).json(parkData);
        })
}

function errorhandler(error,req,res){
    res.status(500).send(error)
}
function notfound(req, res) {
    res.status(404).send(' Sorry ! page not found')
};

//constructors
function SiteWeather(wdata) {

    this.forecast = wdata.weather.description;
    this.time = wdata.datetime;

}
function Sitelocation(city, sitedata) {
    this.search_query = city;
    this.formatted_query = sitedata.display_name;
    this.latitude = sitedata.lat;
    this.longitude = sitedata.lon;
}
function SitePark(dataa) {
    this.name = dataa.fullName;
    this.address = dataa.addresses.map(item=>`${item.line1}. ${item.city} ${item.stateCode} ${item.postalCode},`)[0];
    this.fee = '0.00';
    this.description = dataa.description;
    this.url = dataa.url;
}
// lisitening
server.listen(PORT, () => {
    console.log(`its port is ${PORT}`)
})