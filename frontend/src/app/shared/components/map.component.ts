import { Component, Input, OnChanges, AfterViewInit, ElementRef, ViewChild, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  label: string;
  imageUrl?: string;
  type: 'perdido' | 'avistamento' | 'encontrado';
  dismissible?: boolean;
  /** Para avistamento: liga com linha tracejada até o cão perdido */
  conectarCom?: { lat: number; lng: number };
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div #mapContainer class="map-container" [style.height]="height"></div>
      <div class="map-legend" *ngIf="showLegend">
        <span class="legend-item"><span class="legend-dot perdido"></span> Perdido</span>
        <span class="legend-item"><span class="legend-dot avistamento"></span> Avistamento</span>
        <span class="legend-item"><span class="legend-dot encontrado"></span> Encontrado</span>
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
      font-size: 0.8rem; flex-wrap: wrap;
    }
    .legend-item { display: flex; align-items: center; gap: 0.3rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-dot.perdido { background: #e74c3c; }
    .legend-dot.avistamento { background: #f39c12; }
    .legend-dot.encontrado { background: #27ae60; opacity: 0.5; }
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
  @Output() markerDismissed = new EventEmitter<string>();

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private initialized = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
      this.initialized = true;
      this.attachDismissHandler();
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

    setTimeout(() => this.map?.invalidateSize(), 300);

    this.updateMarkers();
  }

  private styleFor(type: MapMarker['type']) {
    switch (type) {
      case 'perdido':
        return { color: '#e74c3c', ring: 'rgba(231,76,60,0.25)', pulse: '2s', opacity: 1, icon: '&#128308;' };
      case 'avistamento':
        return { color: '#f39c12', ring: 'rgba(243,156,18,0.3)', pulse: '1.2s', opacity: 1, icon: '&#9888;' };
      case 'encontrado':
        return { color: '#27ae60', ring: 'rgba(39,174,96,0.15)', pulse: '3s', opacity: 0.35, icon: '&#10003;' };
    }
  }

  private updateMarkers(): void {
    if (!this.map || !this.markersLayer) return;
    this.markersLayer.clearLayers();
    this.injectAnimationCSS();

    const bounds: L.LatLng[] = [];

    this.markers.forEach(m => {
      if (m.type === 'avistamento') {
        this.addAvistamentoMarker(m, bounds);
      } else {
        this.addCaoMarker(m, bounds);
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
    }
  }

  /** Pin circular com foto para cão perdido/encontrado */
  private addCaoMarker(m: MapMarker, bounds: L.LatLng[]): void {
    const style = this.styleFor(m.type);
    const hasPhoto = !!m.imageUrl;

    const pinContent = hasPhoto
      ? `<img src="${m.imageUrl}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:3px solid white" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><span style="display:none;color:white;font-size:16px;font-weight:bold;width:34px;height:34px;align-items:center;justify-content:center">${style.icon}</span>`
      : `<span style="color:white;font-size:16px;font-weight:bold">${style.icon}</span>`;

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position:relative;opacity:${style.opacity}">
          <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:${style.ring};top:-4px;left:-4px;animation:ping ${style.pulse} ease-out infinite"></div>
          <div style="
            width:40px;height:40px;border-radius:50%;
            background:${style.color};border:3px solid white;
            box-shadow:0 2px 10px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            position:relative;z-index:1;overflow:hidden;
          ">${pinContent}</div>
        </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([m.lat, m.lng], { icon }).addTo(this.markersLayer!);

    const dismissBtn = m.dismissible && m.id
      ? `<br><button data-dismiss-id="${m.id}" style="margin-top:6px;padding:4px 10px;background:#e74c3c;color:white;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer">Remover do mapa</button>`
      : '';

    const photoHtml = m.imageUrl
      ? `<img src="${m.imageUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:4px" onerror="this.style.display='none'"><br>`
      : '';

    marker.bindPopup(`<div style="text-align:center;min-width:120px">${photoHtml}<strong>${m.label}</strong>${dismissBtn}</div>`);
    bounds.push(L.latLng(m.lat, m.lng));

    if (m.type === 'perdido' && this.showRadius) {
      L.circle([m.lat, m.lng], {
        radius: this.radiusMeters,
        color: '#e74c3c', fillColor: '#e74c3c',
        fillOpacity: 0.05, weight: 2, dashArray: '6, 6'
      }).addTo(this.markersLayer!);
    }
  }

  /** Quadrado pequeno de alerta para avistamento — só ícone, foto aparece no popup */
  private addAvistamentoMarker(m: MapMarker, bounds: L.LatLng[]): void {
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width:32px;height:32px;border-radius:50%;
          background:white;border:2px solid #f39c12;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="font-size:16px;line-height:1">⚠️</span>
        </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([m.lat, m.lng], { icon }).addTo(this.markersLayer!);

    const photoHtml = m.imageUrl
      ? `<img src="${m.imageUrl}" style="width:110px;height:110px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 6px" onerror="this.style.display='none'">`
      : '';

    marker.bindPopup(`<div style="text-align:center;min-width:140px;padding:4px">
      ${photoHtml}
      <strong style="font-size:0.85rem">${m.label}</strong>
    </div>`);

    bounds.push(L.latLng(m.lat, m.lng));

    if (m.conectarCom) {
      L.polyline(
        [[m.lat, m.lng], [m.conectarCom.lat, m.conectarCom.lng]],
        {
          color: '#e74c3c',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '8, 7',
          lineCap: 'round'
        }
      ).addTo(this.markersLayer!);
    }
  }

  private injectAnimationCSS(): void {
    if (document.getElementById('map-ping-css')) return;
    const style = document.createElement('style');
    style.id = 'map-ping-css';
    style.textContent = `
      @keyframes ping {
        0% { transform: scale(1); opacity: 0.6; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes ping-rect {
        0% { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.5, 2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  private attachDismissHandler(): void {
    if (!this.map) return;
    this.map.on('popupopen', (e: any) => {
      const node: HTMLElement | null = e.popup?.getElement?.() || null;
      if (!node) return;
      const btn = node.querySelector<HTMLButtonElement>('button[data-dismiss-id]');
      if (!btn) return;
      btn.onclick = () => {
        const id = btn.getAttribute('data-dismiss-id');
        if (id) {
          this.markerDismissed.emit(id);
          this.map?.closePopup();
        }
      };
    });
  }
}
