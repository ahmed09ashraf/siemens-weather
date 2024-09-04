import { Component, OnInit, Inject } from '@angular/core';
import { WeatherService } from '../../services/weather.service';
import { Router } from '@angular/router';
import {isPlatformBrowser, NgClass, NgForOf, NgIf} from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from "@angular/forms";
import * as d3 from 'd3';
import moment from 'moment';

@Component({
  selector: 'app-landing',
  standalone: true,
  templateUrl: './landing.component.html',
  imports: [
    FormsModule,
    NgClass,
    NgForOf,
    NgIf
  ],
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  currentCity: string = 'Unknown';
  currentWeather: any = {};
  searchCity: string = '';
  weatherStats: any[] = [];
  temperatureUnit: string = 'C';
  favoriteCities: any[] = [];
  draggedCityIndex: number | null = null;
  placeholderIndex: number | null = null;
  dragging: boolean = false;

  dayOfWeek: string = '';
  dayOfMonth: string = '';
  month: string = '';

  constructor(
    private weatherService: WeatherService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.getUserLocation();
    }
    this.initializeDate();
    this.loadFavorites();
  }

  initializeDate(): void {
    const today = moment();
    this.dayOfWeek = today.format('ddd');
    this.dayOfMonth = today.format('D');
    this.month = today.format('MMM');
  }

  setTemperatureUnit(unit: string): void {
    this.temperatureUnit = unit;
  }

  // Load favorite cities from localStorage
  loadFavorites(): void {
    this.favoriteCities = JSON.parse(localStorage.getItem('favorites') || '[]');
  }

  // Add or remove a city from favorites (this works similarly to CityWeatherComponent)
  toggleFavorite(cityName: string): void {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.some((city: any) => city.name === cityName);

    if (isFavorite) {
      // Remove from favorites
      const updatedFavorites = favorites.filter((city: any) => city.name !== cityName);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      this.favoriteCities = updatedFavorites;
    } else {
      // Add to favorites
      this.weatherService.getWeather(cityName).subscribe((data) => {
        const currentWeather = data?.data?.current_condition?.[0];
        favorites.push({
          name: cityName,
          temperatureC: currentWeather?.temp_C,
          temperatureF: currentWeather?.temp_F,
        });
        localStorage.setItem('favorites', JSON.stringify(favorites));
        this.favoriteCities = favorites;
      });
    }
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragging = true;
    this.draggedCityIndex = index;
    const element = (event.target as HTMLElement);
    element.style.opacity = '0.3';
    element.classList.add('dragging-card');
  }

  onDragEnd(event: DragEvent): void {
    this.dragging = false;
    const element = event.target as HTMLElement;
    element.style.opacity = '1';
    element.classList.remove('dragging-card');
    this.draggedCityIndex = null;
    this.placeholderIndex = null;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.placeholderIndex = index;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    const draggedIndex = this.draggedCityIndex;
    if (draggedIndex !== null) {
      const draggedCity = this.favoriteCities[draggedIndex];
      this.favoriteCities.splice(draggedIndex, 1);
      this.favoriteCities.splice(dropIndex, 0, draggedCity);
      localStorage.setItem('favorites', JSON.stringify(this.favoriteCities));
    }
    this.draggedCityIndex = null;
    this.placeholderIndex = null;
  }

  // Remove a city from favorites
  removeFromFavorites(cityName: string): void {
    const updatedFavorites = this.favoriteCities.filter((city: any) => city.name !== cityName);
    this.favoriteCities = updatedFavorites;
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  }

  getUserLocation(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      this.weatherService.getCityNameFromCoordinates(lat, lon).subscribe(
        (cityName) => {
          this.currentCity = cityName;
          this.weatherService.getWeather(this.currentCity).subscribe(
            (data) => {
              if (data && data.data && data.data.current_condition && data.data.weather) {
                this.currentWeather = data.data.current_condition[0];
                this.weatherStats = data.data.weather.map((d: any) => ({
                  date: new Date(d.date),
                  avgTemp: +d.avgtempC,
                }));
                this.createChart();
              } else {
                console.error('Unexpected API response structure', data);
                this.currentWeather = null;
              }
            },
            (error: any) => {
              console.error('Error fetching weather data', error);
              this.currentWeather = null;
            }
          );
        },
        (error: any) => {
          console.error('Error fetching city name', error);
          this.currentCity = `Lat ${lat.toFixed(2)} and Lon ${lon.toFixed(2)}`;
          this.currentWeather = null;
        }
      );
    });
  }

  searchWeather(): void {
    this.router.navigate(['/city', this.searchCity.toLowerCase()]);
  }


  private createChart(): void {
    if (!this.weatherStats || this.weatherStats.length === 0) {
      return; // Exit if there's no data to plot
    }

    const data = this.weatherStats.map((d: any) => ({
      date: d.date,
      value: +d.avgTemp,
    }));

    const svg = d3.select('figure#chart svg');
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = parseInt(svg.style('width')) - margin.left - margin.right;
    const height = parseInt(svg.style('height')) - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.value)! - 5, d3.max(data, d => d.value)! + 5])
      .range([height, 0]);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .call(d3.axisLeft(y));

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ffcc00')
      .attr('stroke-width', 2)
      .attr('d', d3.line<any>()
        .x(d => x(d.date)!)
        .y(d => y(d.value))
      );

    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date)!)
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', '#ffcc00');
  }

  // Navigate to city from favorite card (only on click, not on drag)
  onCityClick(cityName: string): void {
    if (!this.dragging) {  // If not dragging, navigate to the city
      this.router.navigate(['/city', cityName.toLowerCase()]);  // Force lowercase in the URL
    }
  }
}
