import { Component, Input, OnChanges, AfterViewInit, ElementRef, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  imageUrl?: string;
  type: 'perdido' | 'avistamento';
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container" [style.height]="height"></div>
      <div class="map-legend" *ngIf="showLegend">
        <span class="legend-item"><span class="legend-dot perdido"></span> Localização perdido</span>
        <span class="legend-item"><span class="legend-dot avistamento"></span> Avistamento (Match)</span>
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper { position: relative; border-radius: 12px; overflow: hidden; border: 2px solid #e0e0e0; }
    .map-container { width: 100%; min-height: 300px; z-index: 0; }
    .map-legend {
      position: absolute; bottom: 10px; left: 10px; z-index: 1000;
      background: white; padding: 0.5rem 0.75rem; border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: flex; gap: 1rem;
      font-size: 0.8rem;
    }
    .legend-item { display: flex; align-items: center; gap: 0.3rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-dot.perdido { background: #e74c3c; }
    .legend-dot.avistamento { background: #27ae60; }
  `]
})
export class MapComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() markers: MapMarker[] = [];
  @Input() centerLat = -23.55;
  @Input() centerLng = -46.63;
  @Input() zoom = 13;
  @Input() height = '400px';
  @Input() showLegend = true;
  @Input() showRadius = false;
  @Input() radiusMeters = 2000;

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private initialized = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.initialized = true;
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && this.map) {
      this.updateMarkers();
    }
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    // Fix Leaflet render bug when container size changes
    setTimeout(() => this.map?.invalidateSize(), 300);

    this.updateMarkers();
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const bounds: L.LatLng[] = [];

    this.markers.forEach(m => {
      const isPerdido = m.type === 'perdido';
      const color = isPerdido ? '#e74c3c' : '#27ae60';
      const emoji = isPerdido ? '&#128054;' : '&#128994;';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="position:relative">
            <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${isPerdido ? 'rgba(231,76,60,0.2)' : 'rgba(39,174,96,0.25)'};top:-4px;left:-4px;animation:ping ${isPerdido ? '2s' : '1.5s'} ease-out infinite"></div>
            <div style="
              width:32px;height:32px;border-radius:50%;
              background:${color};border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              color:white;font-size:14px;font-weight:bold;
              position:relative;z-index:1;
            ">${emoji}</div>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([m.lat, m.lng], { icon }).addTo(this.markersLayer!);

      let popupContent = `<strong>${m.label}</strong>`;
      if (m.imageUrl) {
        popupContent = `<div style="text-align:center">
          <img src="${m.imageUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:4px"
               onerror="this.style.display='none'"><br>
          <strong>${m.label}</strong>
        </div>`;
      }
      marker.bindPopup(popupContent);

      bounds.push(L.latLng(m.lat, m.lng));

      if (isPerdido && this.showRadius) {
        L.circle([m.lat, m.lng], {
          radius: this.radiusMeters,
          color: '#e74c3c',
          fillColor: '#e74c3c',
          fillOpacity: 0.06,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(this.markersLayer!);
      }
    });

    if (bounds.length > 0) {
      const group = L.latLngBounds(bounds);
      this.map.fitBounds(group, { padding: [50, 50], maxZoom: 15 });
    }

    // Inject ping animation CSS
    if (!document.getElementById('map-ping-css')) {
      const style = document.createElement('style');
      style.id = 'map-ping-css';
      style.textContent = `
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
