import { TestBed } from '@angular/core/testing';
import { WeatherService } from './weather.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeatherService],
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch weather data for a city', () => {
    const mockData = { data: { current_condition: [{ temp_C: 25 }] } };
    service.getWeather('Alexandria').subscribe((data) => {
      expect(data.data.current_condition[0].temp_C).toBe(25);
    });

    const req = httpMock.expectOne(
      `${environment.weatherApiBaseUrl}/weather.ashx?q=Alexandria&key=${environment.weatherApiKey}&format=json&num_of_days=7`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get city name from coordinates', () => {
    const mockCityName = 'Alexandria';
    service.getCityNameFromCoordinates(25.276987, 51.520008).subscribe((cityName) => {
      expect(cityName).toBe(mockCityName);
    });

    const req = httpMock.expectOne((r) => r.url.includes('nominatim.openstreetmap.org/reverse'));
    expect(req.request.method).toBe('GET');
    req.flush({ address: { city: mockCityName } });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
