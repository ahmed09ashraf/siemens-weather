import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WeatherService } from '../../services/weather.service';
import * as d3 from 'd3';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import moment from "moment/moment";


@Component({
  selector: 'app-city-weather',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-weather.component.html',
  styleUrls: ['./city-weather.component.css']
})
export class CityWeatherComponent implements OnInit {
  cityName!: string;
  currentWeather: any = {};
  weatherStats: any[] = [];
  temperatureUnit: string = 'C';
  isFavorite: boolean = false; // To track the favorite status


  dayOfWeek: string = '';
  dayOfMonth: string = '';
  month: string = '';

  constructor(
    private route: ActivatedRoute,
    private weatherService: WeatherService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cityName = (this.route.snapshot.paramMap.get('cityName') || '').toLowerCase(); // Force lowercase
    this.getWeatherData(this.cityName);
    this.initializeDate();
    this.checkIfFavorite();  // Check if the city is already a favorite
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  initializeDate(): void {
    const today = moment();
    this.dayOfWeek =today.format('ddd');
    this.dayOfMonth = today.format('D');
    this.month = today.format('MMM');
  }

  setTemperatureUnit(unit: string): void {
    this.temperatureUnit = unit;
  }

  addToFavorites(): void {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const normalizedCityName = this.cityName.toLowerCase();  // Normalize city name

    // Check if the city is already in the favorites
    const isAlreadyFavorite = favorites.some((city: any) => city.name === normalizedCityName);

    if (isAlreadyFavorite) {
      // Remove from favorites if it's already there
      favorites = favorites.filter((city: any) => city.name !== normalizedCityName);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.isFavorite = false;
    } else {
      // Add to favorites
      favorites.push({
        name: normalizedCityName,  // Use lowercase city name
        temperatureC: this.currentWeather?.temp_C,
        temperatureF: this.currentWeather?.temp_F,
        weatherDesc: this.currentWeather?.weatherDesc?.[0]?.value
      });
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.isFavorite = true;
    }
  }



// Check if the current city is already a favorite on component load
  checkIfFavorite(): void {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const normalizedCityName = this.cityName.toLowerCase();
    this.isFavorite = favorites.some((city: any) => city.name === normalizedCityName);
  }




  getWeatherData(cityName: string): void {
    this.weatherService.getWeather(cityName).subscribe(
      (data) => {
        if (data && data.data && data.data.current_condition && data.data.weather) {
          this.currentWeather = data.data.current_condition[0];
          this.weatherStats = data.data.weather.map((d: any) => ({
            date: new Date(d.date),
            avgTemp: +d.avgtempC,
          }));

          // Ensure the DOM has been updated before creating the chart
          this.cdr.detectChanges();
          this.createChart();
        } else {
          console.error('Unexpected API response structure', data);
        }
      },
      (error: any) => {
        console.error('Error fetching weather data', error);
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
}
