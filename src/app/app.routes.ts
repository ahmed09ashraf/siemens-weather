import { Routes } from '@angular/router';
import {CityWeatherComponent} from "./components/city-weather/city-weather.component";
import {LandingComponent} from "./components/landing/landing.component";

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'city/:cityName', component: CityWeatherComponent }
];
