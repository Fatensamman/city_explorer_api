'use strict';
//App libraries
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// App setup
const server = express();
server.use(cors());
const PORT = process.env.PORT || 3030;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,ssl: { rejectUnauthorized: false } });
// const client = new pg.Client( process.env.DATABASE_URL);

//route definitions
server.get('/test', testhandeler);
server.get('/location', locaHandeler);
server.get('/weather', weatherHandeler);
server.get('/parks', parkhandeler);
server.get('/movies', movieshandeler);
server.get('/yelp', yelphandeler)
server.use(errorhandler);

server.get('*', notfound);

// functions decleration
function testhandeler(req, res) {
    res.send('test');
};

function locaHandeler(req, res) {
    let city = req.query.city;

    //data from API
    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

    //data from database
    let SQL = `SELECT * FROM locations;`;

    client.query(SQL)
        .then((results) => {
            if (!city) {
                client.query(SQL).then((results) => {
                    res.send(results.rows);
                });
            } else if (results.rows.find((row) => row.search_query === city)) {
                res.json(results.rows.find((row) => row.search_query === city));
            } else {
                superagent.get(url).then((data) => {
                    const locationData = new Sitelocation(city, data.body[0]);

                    let SQL = `INSERT INTO locations VALUES ($1,$2,$3,$4) RETURNING *;`;

                    let safeValues = [
                        city,
                        locationData.formatted_query,
                        locationData.latitude,
                        locationData.longitude,
                    ];
                    client
                        .query(SQL, safeValues)
                        .then((results) => {
                            res.json(results.rows);
                        })
                        .catch((error) => {
                            res.json(error.message);
                        });
                });
            }
        })
        .catch((error) => {
            res.json(error.message);
        });
}

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
        .catch((error) => {
            res.json(error.message);
        });
};

function parkhandeler(req, res) {
    let city = req.query.search_query;
    const key = process.env.PARKS_API_KEY;
    const url = `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${key}`;
    superagent.get(url)
        .then(dataP => {
            console.log(dataP.body)
            // res.send('heloooo')
            const parkData = dataP.body.data.map(elem => new SitePark(elem));
            res.status(200).json(parkData);
        })
        .catch((error) => {
            res.json(error.message);
        });
}

function movieshandeler(req, res) {
    let cityCode = req.query.country_code;
    const key = process.env.MOVIE_API_KEY;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=whiplash&language=de-DE&region=${cityCode}`;
    superagent.get(url)
        .then(dataM => {
            // console.log(dataM.body)
            const movieData = dataM.body.results.map(elem => new SiteMovie(elem));
            res.status(200).json(movieData);
        })
        .catch((error) => {
            res.json(error.message);
        });
}

function yelphandeler(req, res) {
    let city = req.query.search_query;
    let page = req.query.page;
    const key = process.env.YELP_API_KEY;
    let dataPerPage = 5;
    let offset = ((page - 1) * dataPerPage + 1);
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=${city}&limit=${dataPerPage}&offset=${offset}`;
  //  const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=seattle&limit=1&offset=5`;
    superagent.get(url)
        .set('Authorization', `Bearer ${key}`)
        .then(dataY => {
            const yelpData = dataY.body.businesses.map(elem => new SiteYelp(elem));
            res.status(200).json(yelpData);
        })
        .catch((error) => {
            res.json(JSON.parse(error.response.text));
        });
}

function errorhandler(error, req, res) {
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
    this.address = dataa.addresses.map(item => `${item.line1}. ${item.city} ${item.stateCode} ${item.postalCode},`)[0];
    this.fee = dataa.entranceFees[0].cost || '0.00';
    this.description = dataa.description;
    this.url = dataa.url;
}
function SiteMovie(dataa) {
    this.title = dataa.title;
    this.overview = dataa.overview;
    this.average_votes = dataa.vote_average;
    this.total_votes = dataa.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500${dataa.backdrop_path}`;
    this.popularity = dataa.popularity;
    this.released_on = dataa.release_date;
}

function SiteYelp(dataa) {
    this.name = dataa.name;
    this.image_url = dataa.image_url;
    this.price = dataa.price;
    this.rating = dataa.rating;
    this.url = dataa.url;

}
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            
            console.log(`http://localhost:${PORT}`)
            console.log(`http://localhost:${PORT}/location?city=seattle`)
        });
    });