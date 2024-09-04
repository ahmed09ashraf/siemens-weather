import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
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

  getWeather(cityName: string): Observable<any> {
    const url = `${this.baseUrl}/weather.ashx`;
    const params = new HttpParams()
      .set('q', cityName)
      .set('key', this.apiKey)
      .set('format', 'json')
      .set('num_of_days', '7');

    return this.http.get(url, { params });
  }

  getCityNameFromCoordinates(lat: number, lon: number): Observable<any> {
    const location = `${lat},${lon}`;
    const url = `https://nominatim.openstreetmap.org/reverse`;
    const params = new HttpParams()
      .set('format', 'json')
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('zoom', '10')  // Zoom level determines detail, 10 is usually city level
      .set('addressdetails', '1');

    const headers = new HttpHeaders().set('User-Agent', 'siemens-weather-app/1.0 (https://siemens-weather-65e5edbf3cd5.herokuapp.com/)');


    return this.http.get(url, { params }).pipe(
      map((response: any) => {
        return response.address.city || response.address.town || response.address.village || response.address.state || 'Unknown location';
      })
    );
  }
}
