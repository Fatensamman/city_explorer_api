'use strict';
const express = require('express');
require('dotenv').config();
const cors = require('cors')
const server = express();

const PORT = process.env.PORT || 3030;

server.use(cors());
server.get('/location', (req,res)=> {
    const locdata = require('./data/location.json');
    const locObj = new Sitelocation(locdata);
res.send(locObj);
    console.log(locdata);
});

function Sitelocation (sitedata){
this.search_query = 'Lynnwood';
this.formatted_query= sitedata[0].display_name;
this.latitude = sitedata[0].lat;
this.longitude = sitedata[0].lon;
}

server.listen(PORT, () => {
    console.log(`its port is ${PORT}`)
})