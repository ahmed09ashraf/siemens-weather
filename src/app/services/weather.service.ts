import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey: string = environment.weatherApiKey;
  private baseUrl: string = environment.weatherApiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch city name from coordinates using OpenStreetMap's Nominatim API
   */
  getCityNameFromCoordinates(lat: number, lon: number): Observable<any> {
    const location = `${lat},${lon}`;
    const url = `https://nominatim.openstreetmap.org/reverse`;

    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('zoom', '10')  // Zoom level determines detail, 10 is usually city level
      .set('addressdetails', '1');

    // Add proper User-Agent header to comply with OpenStreetMap policies
    const headers = new HttpHeaders().set('User-Agent', 'siemens-weather-app/1.0 (https://siemens-weather-65e5edbf3cd5.herokuapp.com/)');

    return this.http.get(url, { params, headers }).pipe(
      map((response: any) => {
        console.log(`OpenStreetMap API response:`, response); // Log response for debugging
        return response.address.city || response.address.town || response.address.village || response.address.state || 'Unknown location';
      })
    );
  }

  /**
   * Fetch weather data for a specific city from the World Weather Online API
   */
  getWeather(cityName: string): Observable<any> {
    const url = `${this.baseUrl}/weather.ashx`;
    const params = new HttpParams()
      .set('q', cityName)
      .set('key', this.apiKey)
      .set('format', 'json')
      .set('num_of_days', '7');

    return this.http.get(url, { params }).pipe(
      map((response: any) => {
        console.log(`Weather API response:`, response); // Log response for debugging
        return response;
      })
    );
  }
}
