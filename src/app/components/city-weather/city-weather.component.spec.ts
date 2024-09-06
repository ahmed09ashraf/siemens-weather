import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CityWeatherComponent } from './city-weather.component';
import { WeatherService } from '../../services/weather.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('CityWeatherComponent', () => {
  let component: CityWeatherComponent;
  let fixture: ComponentFixture<CityWeatherComponent>;
  let weatherService: WeatherService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityWeatherComponent, HttpClientTestingModule],
      providers: [
        WeatherService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'alexandria',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CityWeatherComponent);
    component = fixture.componentInstance;
    weatherService = TestBed.inject(WeatherService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch weather data for the city on init', () => {
    const mockWeatherData = {
      data: { current_condition: [{ temp_C: 25 }], weather: [] },
    };
    spyOn(weatherService, 'getWeather').and.returnValue(of(mockWeatherData));

    component.ngOnInit();

    expect(weatherService.getWeather).toHaveBeenCalledWith('alexandria');
    expect(component.currentWeather.temp_C).toBe(25);
  });

  it('should toggle temperature unit between Celsius and Fahrenheit', () => {
    component.setTemperatureUnit('F');
    expect(component.temperatureUnit).toBe('F');

    component.setTemperatureUnit('C');
    expect(component.temperatureUnit).toBe('C');
  });

  it('should add city to favorites', () => {
    localStorage.clear();
    spyOn(localStorage, 'setItem').and.callThrough();

    component.currentWeather = { temp_C: 25, temp_F: 77 };
    component.addToFavorites();

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    expect(favorites.length).toBe(1);
    expect(favorites[0].name).toBe('alexandria');
  });
});
