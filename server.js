const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the Angular app's 'browser' directory
app.use(express.static(path.join(__dirname, 'dist/siemens-weather/browser')));

app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'dist/siemens-weather/browser/index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);
