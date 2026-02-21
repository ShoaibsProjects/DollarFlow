import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Clock, Filter, Search, ChevronDown, Globe, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.DivIcon({
  className: 'custom-spot-marker',
  html: '<div style="width:14px;height:14px;background:#0052FF;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,82,255,0.4);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const cities = [
  { name: "All Cities", lat: 0, lng: 0 },
  { name: "Manila", lat: 14.5995, lng: 120.9842 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
];

function FlyToCity({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

function SpotCard({ spot, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected ? 'border-[#0052FF] bg-[#0052FF]/5' : 'border-border hover:border-[#0052FF]/30'
      }`}
      data-testid={`spot-card-${spot.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{spot.name}</h4>
          <p className="text-xs text-muted-foreground">{spot.city}, {spot.country}</p>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          spot.is_open ? 'bg-[#00D395]/10 text-[#00D395]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
        }`}>
          {spot.is_open ? 'Open' : 'Closed'}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-[#FFB800] text-[#FFB800]" /> {spot.rating}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {spot.hours}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> 1 USDC = {spot.exchange_rate} {spot.currencies[0]}
        </span>
      </div>
    </button>
  );
}

export default function Spots() {
  const [spots, setSpots] = useState([]);
  const [selectedCity, setSelectedCity] = useState(cities[1]); // Manila default
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSpots = useCallback(async () => {
    try {
      const params = {};
      if (selectedCity.name !== "All Cities") params.city = selectedCity.name;
      if (showOpenOnly) params.open_now = true;
      const res = await axios.get(`${API}/spots`, { params });
      setSpots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, showOpenOnly]);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);

  const filteredSpots = spots.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col lg:flex-row" data-testid="spots-page">
      {/* Map */}
      <div className="flex-1 relative min-h-[300px] lg:min-h-0">
        <MapContainer
          center={[selectedCity.lat || 14.5995, selectedCity.lng || 120.9842]}
          zoom={12}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <FlyToCity lat={selectedCity.lat || 14.5995} lng={selectedCity.lng || 120.9842} zoom={12} />
          {filteredSpots.map(spot => (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={customIcon}
              eventHandlers={{ click: () => setSelectedSpot(spot) }}
            >
              <Popup className="dark-popup">
                <div className="p-1 min-w-[180px]">
                  <h4 className="font-semibold text-sm">{spot.name}</h4>
                  <p className="text-xs text-gray-500">{spot.city} | Rating: {spot.rating}</p>
                  <p className="text-xs text-gray-500">1 USDC = {spot.exchange_rate} {spot.currencies[0]}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* City Filters on Map */}
        <div className="absolute top-4 left-4 right-4 z-[500] flex gap-2 flex-wrap">
          {cities.map(city => (
            <button
              key={city.name}
              onClick={() => setSelectedCity(city)}
              data-testid={`city-filter-${city.name.toLowerCase().replace(' ', '-')}`}
              className={`px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
                selectedCity.name === city.name
                  ? 'bg-[#0052FF] text-white shadow-lg'
                  : 'bg-black/50 text-white/80 hover:bg-black/70'
              }`}
            >
              {city.name}
            </button>
          ))}
          <button
            onClick={() => setShowOpenOnly(!showOpenOnly)}
            data-testid="open-now-filter"
            className={`px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md transition-all ${
              showOpenOnly
                ? 'bg-[#00D395] text-white'
                : 'bg-black/50 text-white/80 hover:bg-black/70'
            }`}
          >
            Open Now
          </button>
        </div>
      </div>

      {/* Sidebar List */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-background overflow-y-auto max-h-[40vh] lg:max-h-full">
        <div className="p-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-heading text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0052FF]" />
            DollarFlow Spots
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="spots-search"
              className="pl-9 rounded-xl"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filteredSpots.length} agents found</p>
        </div>

        <div className="p-4 space-y-2">
          {filteredSpots.map(spot => (
            <SpotCard
              key={spot.id}
              spot={spot}
              selected={selectedSpot?.id === spot.id}
              onClick={() => {
                setSelectedSpot(spot);
                setSelectedCity({ name: spot.city, lat: spot.lat, lng: spot.lng });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
