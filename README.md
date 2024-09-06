
# Weather Forecast Application

This project is a single-page application (SPA) for weather forecasting, built using **Angular** and **D3.js**. The goal is to display current weather information and historical data for various cities, with an artistic yet simple interface, suitable for both desktop and mobile devices. The application also supports drag-and-drop features and provides an intuitive experience for users to explore weather data.

## Features

- **Landing Display**:
  - Detects user's geographical location to show the current weather for their country.
  - Displays key weather information (temperature, humidity, wind speed, etc.) with a clean and artistic design.
  - Allows navigation to different city dashboards.

- **City Weather Dashboard**:
  - Shows detailed weather information for the selected city.
  - Displays historical weather data using **D3.js** visualizations.
  - Provides interactive temperature unit toggling (Celsius/Fahrenheit).
  - Allows users to save cities as favorites, with drag-and-drop functionality for rearranging.

## Technologies Used

- **Angular** 
- **D3.js** for data visualization
- **WorldWeatherOnline API** for fetching weather data
- **Karma** and **Jasmine** for unit testing
- **Heroku** for deployment

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ahmed09ashraf/siemens-weather.git
   cd weather-app
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up the environment variables in `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     weatherApiKey: '****',
     weatherApiBaseUrl: 'https://api.worldweatheronline.com/premium/v1'
   };
   ```

4. Run the application locally:
   ```bash
   ng serve --o
   ```

5. To run unit tests:
   ```bash
   ng test
   ```

## Deployment

The application is deployed on **Heroku**. To deploy it, follow these steps:

1. Create a new Heroku app:
   ```bash
   heroku create
   ```

2. Push the code to Heroku:
   ```bash
   git push heroku main
   ```

3. The app will be live on the provided Heroku URL.

## API

We use the [WorldWeatherOnline API](https://developer.worldweatheronline.com/) to fetch weather data. You need to sign up for an API key and add it to your environment variables.
