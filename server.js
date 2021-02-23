'use strict';
//App libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

// App setup
const server = express();
const PORT = process.env.PORT || 3030;
server.use(cors());
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, });
// ssl: { rejectUnauthorized: false }

//route definitions
server.get('/test', testhandeler);
server.get('/location', locaHandeler);
server.get('/weather', weatherHandeler);
server.get('/parks', parkhandeler)
// server.get('*', notfound);
// server.use(errorhandler);
server.get('/hi', ((req, res) => {
    res.send('hhhhhhhhhhh');
}))
// testing
// server.get('/locations', (req, res) => {
//     let SQL = `SELECT * FROM locations;`;
//     client.query(SQL)
//         .then(results => {
//             // res.send(results.rows);
//             res.send('results.rows');
//         })
//         .catch((error) => {
//             res.send('Error:', error.massage);
//         });
// });
// localhost:4040/addcountry?city=amman
server.get('/addCountry', (req, res) => {
    let city = req.query.city;
    console.log(req.query)
    let SQL = `INSERT INTO locations VALUES ($1) RETURNING *;`;
    let safeValues = [city];
    client.query(SQL, safeValues)
        .then((result) => {
            res.send(result.rows);

        })
        .catch((error) => {
            res.send('Error:', error.massage);
        });
})
// functions decleration
function testhandeler(req, res) {
    res.send('test');
};


// https://city-explorer-backend.herokuapp.com/location?city=amman
// function locaHandeler(req, res) {
//     const cityName = req.query.city;
//     const key = process.env.GEOCODE_API_KEY;
//     const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
//     let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
//     let safeValues = [cityName];
//     client.query(SQL, safeValues)
//         .then((result) => {
//             if (result.rowCount > 0) {
//                 res.send(result.rows[0]);
//             } else {
//                 superagent.get(url)
//                     .then(citydata => {
//                         const locObj = new Sitelocation(cityName, citydata.body[0]);

//                         res.status(200).json(locObj);
//                     });
//             }


//         })
// };


function locaHandeler(req, res) {
	let city = req.query.city;

	//data from API
	let key = process.env.GEOCODE_API_KEY;
	let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

	//data from database
	let SQL = `SELECT * FROM locations;`;

	client
		.query(SQL)
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
							locationData;
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
    this.fee = dataa.entranceFees[0].cost ||'0.00';
    this.description = dataa.description;
    this.url = dataa.url;
}
client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`its port is ${PORT}`)
        });
    });