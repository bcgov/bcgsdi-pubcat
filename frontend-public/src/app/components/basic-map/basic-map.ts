import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import type { Geometry } from 'geojson';
import * as L from 'leaflet';

/**
 * Usage example:
 *   <pubcat-basic-map [geometry]="publication()?.geometry" class="w-full h-96!"></pubcat-basic-map>
 * Tip: Be sure to define the width and height of the <pubcat-basic-map> element
 */

@Component({
  imports: [],
  selector: 'pubcat-basic-map',
  styleUrl: './basic-map.css',
  templateUrl: './basic-map.html',
})
export class BasicMap implements AfterViewInit, OnChanges, OnDestroy {
  readonly geometry = input<Geometry | null | undefined>(null);
  readonly maxZoomLevel = input<number>(7);

  private readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map?: L.Map;
  private geometryLayer?: L.GeoJSON;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer().nativeElement);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).addTo(this.map);

    // Hide the Leaflet attribution prefix, not the OSM copyright attribution.
    this.map.attributionControl.setPrefix('');

    this.map.setView([54.5, -125], this.maxZoomLevel());

    // Render the initial geometry, if supplied.
    this.updateGeometry(this.geometry());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['geometry'] && this.map) {
      this.updateGeometry(this.geometry());
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
    this.geometryLayer = undefined;
  }

  private updateGeometry(geometry: Geometry | null | undefined): void {
    if (!this.map) {
      return;
    }

    this.geometryLayer?.remove();
    this.geometryLayer = undefined;

    if (!geometry) {
      return;
    }

    this.geometryLayer = L.geoJSON(geometry, {
      style: {
        color: '#0066cc',
        weight: 3,
        fillColor: '#3399ff',
        fillOpacity: 0.25,
      },
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          color: '#0066cc',
          fillColor: '#3399ff',
          fillOpacity: 0.8,
        }),
    }).addTo(this.map);

    const bounds = this.geometryLayer.getBounds();

    if (!bounds.isValid()) {
      return;
    }

    const maxZoom = this.getMaxZoom(bounds);
    if (bounds.getSouthWest().equals(bounds.getNorthEast())) {
      this.map.setView(bounds.getCenter(), maxZoom);
    } else {
      this.map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: maxZoom,
      });
    }
  }

  /*
   Use bounds x or y difference as a rough approximation of the shape area.  
   Choose a lower max zoom (more zoomed out) for larger shapes.
   */
  private getMaxZoom(bounds: L.LatLngBounds): number {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    const latDiff = northEast.lat - southWest.lat;
    const lngDiff = northEast.lng - southWest.lng;

    // Use the larger dimension to estimate the geographic extent.
    const extent = Math.max(latDiff, lngDiff);

    if (extent < 0.01) {
      return 9;
    }

    if (extent < 0.1) {
      return 8;
    }

    if (extent < 1) {
      return 7;
    }

    if (extent < 5) {
      return 5;
    }

    return 5;
  }
}
