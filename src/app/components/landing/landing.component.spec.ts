import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { WeatherService } from '../../services/weather.service';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

describe('LandingComponent - Search Functionality', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let weatherService: WeatherService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent, FormsModule, HttpClientTestingModule, RouterTestingModule], // Add LandingComponent to imports
      providers: [WeatherService]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    weatherService = TestBed.inject(WeatherService);
    fixture.detectChanges();
  });

  // Test case for empty input
  it('should display an error if no city is entered', () => {
    component.searchCity = ''; // Empty input
    component.searchWeather(); // Call the search function
    expect(component.errorMessage).toEqual('You should enter a city name!');
  });

  // Test case for invalid characters
  it('should display an error for invalid characters', () => {
    component.searchCity = 'Doha123'; // Invalid input
    component.searchWeather(); // Call the search function
    expect(component.errorMessage).toEqual('Invalid city name! Please use only letters.');
  });

  // Test case for valid city search
  it('should call WeatherService and navigate on valid search', () => {
    spyOn(weatherService, 'getWeather').and.returnValue(of({
      data: { current_condition: [{ temp_C: 22 }] }
    }));

    spyOn(component['router'], 'navigate'); // Spy on router navigation

    component.searchCity = 'Doha'; // Valid city name
    component.searchWeather();

    expect(weatherService.getWeather).toHaveBeenCalledWith('doha');
    expect(component['router'].navigate).toHaveBeenCalledWith(['/city', 'doha']);
  });

  // Test case for API error
  it('should display an error message if API returns error', () => {
    spyOn(weatherService, 'getWeather').and.returnValue(throwError('API error'));

    component.searchCity = 'Doha'; // Valid city name
    component.searchWeather();

    expect(component.errorMessage).toEqual('There was an error fetching the data. Please try again.');
  });

  // Test case for non-existent city
  it('should display an error if the city does not exist', () => {
    spyOn(weatherService, 'getWeather').and.returnValue(of({
      data: { current_condition: null }
    }));

    component.searchCity = 'UnknownCity';
    component.searchWeather();

    expect(component.errorMessage).toEqual('The city does not exist. Please check the city name.');
  });
});
