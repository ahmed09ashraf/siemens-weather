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
  touchStartX: number = 0;
  touchStartY: number = 0;

  dayOfWeek: string = '';
  dayOfMonth: string = '';
  month: string = '';

  errorMessage: string | null = null;  // Holds validation error messages
  isLoading: boolean = false;  // To show a loading state if needed during API call

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
    this.dayOfWeek = today.format('dddd');
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

  onTouchStart(event: TouchEvent, index: number): void {
    this.dragging = true;
    this.draggedCityIndex = index;

    // Store the initial touch position
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    const element = event.target as HTMLElement;
    element.style.opacity = '0.3';
    element.classList.add('dragging-card');
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.dragging) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    const element = event.target as HTMLElement;
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Calculate which city is being hovered over based on touch movement
    const hoveredElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (hoveredElement) {
      const hoveredIndex = Array.from(hoveredElement.parentElement?.children || []).indexOf(hoveredElement);
      if (hoveredIndex !== -1) {
        this.placeholderIndex = hoveredIndex;
      }
    }
  }

  onTouchEnd(event: TouchEvent, index: number): void {
    this.dragging = false;

    const element = event.target as HTMLElement;
    element.style.opacity = '1';
    element.style.transform = 'none';
    element.classList.remove('dragging-card');
    element.blur();  // Remove the focus from the element

    // Reset any visual highlighting or background changes
    element.style.backgroundColor = '';  // Reset background color if modified

    if (this.draggedCityIndex !== null && this.placeholderIndex !== null && this.draggedCityIndex !== this.placeholderIndex) {
      const draggedCity = this.favoriteCities[this.draggedCityIndex];
      this.favoriteCities.splice(this.draggedCityIndex, 1);
      this.favoriteCities.splice(this.placeholderIndex, 0, draggedCity);

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
    this.errorMessage = null; // Clear any previous error messages

    // 1. Trim the input and check if it's empty
    const trimmedSearch = this.searchCity.trim();
    if (!trimmedSearch) {
      this.errorMessage = "You should enter a city name!";
      return;
    }

    // 2. Validate the input for invalid characters (allow only letters)
    const invalidCharsPattern = /[^a-zA-Z\s\u0600-\u06FF]/; // Allows Arabic and English alphabets
    if (invalidCharsPattern.test(trimmedSearch)) {
      this.errorMessage = "Invalid city name! Please use only letters.";
      return;
    }

    // 3. Call the API to check if the city exists
    this.isLoading = true;
    this.weatherService.getWeather(trimmedSearch.toLowerCase()).subscribe(
      (data) => {
        this.isLoading = false;
        if (data && data.data && data.data.current_condition) {
          // If the city is valid, navigate to the city route (lowercase)
          this.router.navigate(['/city', trimmedSearch.toLowerCase()]);
        } else {
          // If the API does not return valid data, show an error message
          this.errorMessage = "The city does not exist. Please check the city name.";
        }
      },
      (error) => {
        this.isLoading = false;
        this.errorMessage = "There was an error fetching the data. Please try again.";
        console.error("API Error:", error);
      }
    );
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

    const xAxis = d3.axisBottom(x)
      .ticks(data.length)  // Adjust the number of ticks to fit your data
      .tickFormat((domainValue, index) => {
        const date = domainValue instanceof Date ? domainValue : new Date(domainValue.valueOf());
        if (index === data.length - 1) {
          return d3.timeFormat('%b')(date); // Display month name only at the end
        }
        return d3.timeFormat('%d')(date); // Display day of the month for other ticks
      });

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

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
