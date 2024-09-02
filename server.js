const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist/siemens-weather')));

// Send all requests to index.html
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist/siemens-weather/index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);
