import { Component, OnInit, Inject } from '@angular/core';
import { WeatherService } from '../../services/weather.service';
import { Router } from '@angular/router';
import {isPlatformBrowser, NgClass, NgIf} from '@angular/common';
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
    NgIf,
    NgClass
  ],
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  currentCity: string = 'Unknown';
  currentWeather: any = {};
  searchCity: string = '';
  weatherStats: any[] = [];
  temperatureUnit: string = 'C';

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
          this.currentCity = `Lat ${lat.toFixed(2)} and Lon ${lon.toFixed(2)}`; // Fallback to coordinates if API fails
          this.currentWeather = null;
        }
      );
    });
  }

  searchWeather(): void {
    this.router.navigate(['/city', this.searchCity]);
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
}
