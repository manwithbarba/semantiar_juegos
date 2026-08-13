import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EDUCATIONAL_REFERENCES } from '../references';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgFor],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly references = EDUCATIONAL_REFERENCES;
}
