/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { CivicIssue, IssueCategory } from '../types';
import { MapPin, Compass, Search, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
  issues: CivicIssue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  onSelectCoordinates: (lat: number, lng: number, address: string, neighborhood: string) => void;
  selectedNewCoords: { lat: number; lng: number } | null;
  activeCategoryFilter: string;
  activeStatusFilter: string;
}

// Center of Mumbai (between Bandra and Dadar)
const MUMBAI_LAT_CENTER = 19.0176;
const MUMBAI_LNG_CENTER = 72.8461;

// Reverse-geocode approximate coordinate to real Mumbai neighborhoods & streets
const getLocaleFromMumbaiCoords = (lat: number, lng: number) => {
  let neighborhood = 'Dadar West';
  let address = 'Shivaji Park Road 5, Dadar West, Mumbai';

  if (lat > 19.10) {
    neighborhood = 'Andheri West';
    address = lng > 72.84 ? 'S.V. Road, near Andheri Station, Andheri West, Mumbai' : 'Lokhandwala Back Road, near Market, Andheri West, Mumbai';
  } else if (lat > 19.07) {
    neighborhood = 'Juhu';
    address = lng > 72.825 ? 'Juhu Tara Road, near Juhu Hotel, Juhu, Mumbai' : 'Juhu Beach Promenade, near Chowpatty, Juhu, Mumbai';
  } else if (lat > 19.03) {
    neighborhood = 'Bandra West';
    address = lng > 72.83 ? 'Linking Road, near National College, Bandra West, Mumbai' : 'Hill Road, near Bandra Police Station, Bandra West, Mumbai';
  } else if (lat < 18.98) {
    neighborhood = 'Colaba';
    address = lng > 72.822 ? 'Colaba Causeway, near Gateway of India, Colaba, Mumbai' : 'Marine Drive Promenade, near Seafront Walkway, Colaba, Mumbai';
  } else {
    neighborhood = 'Dadar West';
    address = lng > 72.843 ? 'Gokhale Road, near Dadar Station, Dadar West, Mumbai' : 'Ranade Road, near Shivaji Park, Dadar West, Mumbai';
  }

  return { address, neighborhood };
};

export default function InteractiveMap({
  issues,
  selectedIssueId,
  onSelectIssue,
  onSelectCoordinates,
  selectedNewCoords,
  activeCategoryFilter,
  activeStatusFilter
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const newMarkerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getCategoryColor = (category: IssueCategory) => {
    switch (category) {
      case 'Roads & Potholes': return '#1a1a1a'; // Dark graphite
      case 'Water Leakage': return '#4a4a4a'; // Slate
      case 'Electrical/Streetlights': return '#666666'; // Ash
      case 'Waste Management': return '#888888'; // Mist
      case 'Public Safety/Infrastructure': return '#ff4c24'; // Ember
      default: return '#555555';
    }
  };

  // Custom marker generator using L.divIcon
  const createMarkerIcon = (category: IssueCategory, isSelected: boolean) => {
    const color = isSelected ? '#ff4c24' : getCategoryColor(category);
    const pulseHtml = isSelected 
      ? `<span class="absolute inline-flex h-8 w-8 rounded-full animate-ping opacity-70 bg-[#ff4c24]/40"></span>`
      : '';
    const borderStyle = isSelected ? 'border border-black scale-110' : 'border border-[#ffffff]';

    return L.divIcon({
      className: 'custom-mumbai-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          ${pulseHtml}
          <div class="relative flex items-center justify-center w-6 h-6 rounded-full text-white transition-all ${borderStyle}" style="background-color: ${color};">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  const createNewPinIcon = () => {
    return L.divIcon({
      className: 'custom-mumbai-new-pin',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 animate-bounce">
          <span class="absolute inline-flex h-8 w-8 rounded-full animate-pulse opacity-40 bg-[#ff4c24]"></span>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border border-black bg-[#ff4c24] text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
              <circle cx="12" cy="10" r="2.5"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 36],
    });
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered on Dadar, Mumbai
    const map = L.map(mapContainerRef.current, {
      center: [MUMBAI_LAT_CENTER, MUMBAI_LNG_CENTER],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // High-Contrast Light Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18
    }).addTo(map);

    mapRef.current = map;

    // Click handler to drop a new pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const { address, neighborhood } = getLocaleFromMumbaiCoords(lat, lng);
      onSelectCoordinates(lat, lng, address, neighborhood);
    });

    // Force map size recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Filter Issues
  const filteredIssues = issues.filter(issue => {
    const matchesCategory = activeCategoryFilter === 'All' || issue.category === activeCategoryFilter;
    const matchesStatus = activeStatusFilter === 'All' || issue.status === activeStatusFilter;
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // 3. Update Existing Issue Pins on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    filteredIssues.forEach(issue => {
      const isSelected = selectedIssueId === issue.id;
      const marker = L.marker([issue.location.lat, issue.location.lng], {
        icon: createMarkerIcon(issue.category, isSelected)
      });

      marker.bindTooltip(`
        <div class="px-3 py-2 font-sans bg-[#ffffff] border border-[#e5e5e5] text-[#161616] rounded-[12px] shadow-2xl text-xs leading-normal max-w-[200px]">
          <div class="font-bold text-[#161616] truncate mb-0.5">${issue.title}</div>
          <div class="text-[#555555] text-[10px] font-medium">${issue.category} • ${issue.location.neighborhood}</div>
          <div class="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#e5e5e5]">
            <span class="text-[9px] font-mono text-[#555555] uppercase">${issue.severity}</span>
            <span class="text-[9px] font-mono text-[#ff4c24] uppercase">★ ${issue.status}</span>
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        className: 'custom-mumbai-tooltip'
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectIssue(issue.id);
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [filteredIssues, selectedIssueId]);

  // 4. Update the Reporting Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (newMarkerRef.current) {
      newMarkerRef.current.remove();
      newMarkerRef.current = null;
    }

    if (selectedNewCoords) {
      const marker = L.marker([selectedNewCoords.lat, selectedNewCoords.lng], {
        icon: createNewPinIcon()
      });

      marker.bindTooltip(`
        <div class="px-2.5 py-1 font-sans font-medium bg-amber-500 text-amber-950 rounded-full text-[9px] uppercase tracking-wider shadow-md">
          NEW REPORT LOCATION
        </div>
      `, {
        direction: 'top',
        permanent: true,
        offset: [0, -10]
      });

      marker.addTo(map);
      newMarkerRef.current = marker;

      // Pan to reporting location
      map.setView([selectedNewCoords.lat, selectedNewCoords.lng], 14, { animate: true });
    }
  }, [selectedNewCoords]);

  // 5. Center on Selected Card Issue
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;

    const issue = issues.find(i => i.id === selectedIssueId);
    if (issue) {
      map.setView([issue.location.lat, issue.location.lng], 14, { animate: true });
    }
  }, [selectedIssueId]);

  const resetMap = () => {
    const map = mapRef.current;
    if (map) {
      map.setView([MUMBAI_LAT_CENTER, MUMBAI_LNG_CENTER], 12, { animate: true });
    }
  };

  return (
    <div id="interactive-map-container" className="flex flex-col bg-[#ffffff] rounded-[14.4px] border border-[#e5e5e5] shadow-sm overflow-hidden h-[540px] transition-all duration-300 ease-in-out hover:shadow-md hover:border-neutral-400 hover:scale-[1.002]">
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#ffffff] border-b border-[#e5e5e5] px-4 py-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#161616] shrink-0" />
          <span className="font-mono text-[10px] text-[#161616] tracking-widest uppercase">MUMBAI HIGH-PRECISION MAP</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar inside map */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search local pin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-52 pl-8 pr-3 py-1.5 text-xs border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] text-[#161616] placeholder-[#7b7a7c] focus:outline-none focus:border-[#ff4c24] font-grotesk transition"
            />
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#7b7a7c]" />
          </div>

          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] hover:border-[#ff4c24] text-[#161616] transition cursor-pointer text-xs font-mono"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded-[14.4px] bg-[#ffffff] hover:border-[#ff4c24] text-[#161616] transition cursor-pointer text-xs font-mono"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={resetMap}
            className="px-3 py-1.5 font-mono text-[10px] uppercase rounded-[14.4px] border border-[#e5e5e5] bg-transparent hover:border-[#ff4c24] text-[#161616] transition cursor-pointer"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Map Division */}
      <div className="relative flex-1 bg-[#ffffff] overflow-hidden">
        {/* Leaflet Map Hook */}
        <div ref={mapContainerRef} className="w-full h-full z-10" id="leaflet-map-element" />

        {/* Floating Quick Instructions Card */}
        <div className="absolute bottom-3 left-3 max-w-[280px] bg-[#ffffff]/95 text-[#161616] border border-[#e5e5e5] rounded-[14.4px] p-3 shadow-2xl pointer-events-none z-20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#ff4c24] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-grotesk leading-relaxed text-[#555555]">
                <span className="font-mono text-[#ff4c24] block mb-0.5 uppercase tracking-wider">REPORT INCIDENT:</span> Click anywhere on the map to drop a pin on Mumbai's streets. Address geolocator will trigger instantly!
              </p>
            </div>
          </div>
        </div>

        {/* Filter Indicator */}
        {filteredIssues.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ffffff]/85 pointer-events-none z-20">
            <div className="bg-[#ffffff] border border-[#e5e5e5] p-5 rounded-[14.4px] max-w-xs text-center shadow-2xl">
              <MapPin className="w-8 h-8 text-[#7b7a7c] mx-auto mb-2" />
              <p className="font-grotesk text-[#161616] text-xs uppercase tracking-wider">NO REPORTS FOUND</p>
              <p className="text-xs text-[#555555] mt-1 leading-relaxed">Adjust your filters or drop a pin on Mumbai's map to report a community concern.</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 bg-[#ffffff]/90 border-t border-[#e5e5e5] px-4 py-2.5 text-[9px] font-mono text-[#555555] uppercase">
        <span className="font-grotesk text-[#161616] mr-1.5">LEGEND:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCategoryColor('Roads & Potholes') }}></span>
          <span>Roads</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCategoryColor('Water Leakage') }}></span>
          <span>Water Leakage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCategoryColor('Electrical/Streetlights') }}></span>
          <span>Streetlights</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCategoryColor('Waste Management') }}></span>
          <span>Waste</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCategoryColor('Public Safety/Infrastructure') }}></span>
          <span>Public Safety</span>
        </div>
      </div>
    </div>
  );
}
