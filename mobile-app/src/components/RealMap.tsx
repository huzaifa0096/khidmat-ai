/**
 * Real interactive map for web — uses Google Maps JS API when an API key is set,
 * otherwise falls back to Leaflet + CARTO dark-style tiles (no key needed).
 *
 * Both give a real interactive map (pan, zoom, markers, popups). The component
 * silently no-ops on native platforms — the parent should show a fallback there.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import { radii } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';

declare global {
  interface Window {
    google?: any;
    L?: any;
    __KHIDMAT_MAP_GOOGLE_LOADING__?: Promise<void>;
    __KHIDMAT_MAP_LEAFLET_LOADING__?: Promise<void>;
  }
}

const GOOGLE_KEY =
  (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) || '';

const loadScript = (src: string, attrs: Record<string, string> = {}) =>
  new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') return resolve();
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

const loadStylesheet = (href: string) => {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const loadGoogleMaps = () => {
  if (window.__KHIDMAT_MAP_GOOGLE_LOADING__) return window.__KHIDMAT_MAP_GOOGLE_LOADING__;
  if (window.google?.maps) return Promise.resolve();
  const p = loadScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly`);
  window.__KHIDMAT_MAP_GOOGLE_LOADING__ = p;
  return p;
};

const loadLeaflet = async () => {
  if (window.__KHIDMAT_MAP_LEAFLET_LOADING__) return window.__KHIDMAT_MAP_LEAFLET_LOADING__;
  if (window.L) return;
  loadStylesheet('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  const p = loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  window.__KHIDMAT_MAP_LEAFLET_LOADING__ = p;
  return p;
};

type MarkerData = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  subtitle?: string;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers: MarkerData[];
  userLocation?: { lat: number; lng: number } | null;
  onMarkerPress?: (id: string) => void;
  height?: number | string;
};

export const RealMap = ({ center, zoom = 12, markers, userLocation, onMarkerPress, height }: Props) => {
  const { colors, isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const [provider, setProvider] = useState<'google' | 'leaflet' | 'loading' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Initialize map once
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        if (GOOGLE_KEY) {
          await loadGoogleMaps();
          if (cancelled || !containerRef.current) return;
          mapRef.current = new window.google.maps.Map(containerRef.current, {
            center,
            zoom,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: GOOGLE_DARK_STYLE,
          });
          setProvider('google');
        } else {
          await loadLeaflet();
          if (cancelled || !containerRef.current) return;
          mapRef.current = window.L.map(containerRef.current, {
            zoomControl: true,
            attributionControl: false,
          }).setView([center.lat, center.lng], zoom);
          const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
          tileLayerRef.current = window.L.tileLayer(tileUrl, {
            attribution: '© OpenStreetMap, © CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
          }).addTo(mapRef.current);
          setProvider('leaflet');
        }
      } catch (e: any) {
        setError(e?.message || 'Map failed to load');
        setProvider('error');
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center when center changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (provider === 'google' && window.google) {
      mapRef.current.setCenter(center);
    } else if (provider === 'leaflet' && window.L) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom, provider]);

  // Swap tile layer when theme flips
  useEffect(() => {
    if (provider !== 'leaflet' || !mapRef.current || !window.L) return;
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    if (tileLayerRef.current) {
      try {
        mapRef.current.removeLayer(tileLayerRef.current);
      } catch {}
    }
    tileLayerRef.current = window.L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap, © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, [isDark, provider]);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous markers
    if (provider === 'google' && window.google) {
      markersRef.current.forEach((m) => m.setMap?.(null));
    } else if (provider === 'leaflet' && window.L) {
      markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    }
    markersRef.current = [];

    if (provider === 'google' && window.google) {
      markers.forEach((m) => {
        const marker = new window.google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map: mapRef.current,
          title: m.label,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: m.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2,
            scale: 8,
          },
        });
        const info = new window.google.maps.InfoWindow({
          content: `<div style="color:#111;font-family:system-ui,sans-serif;padding:4px 8px;"><strong>${m.label}</strong>${m.subtitle ? `<br/><small>${m.subtitle}</small>` : ''}</div>`,
        });
        marker.addListener('click', () => {
          info.open(mapRef.current, marker);
          onMarkerPress?.(m.id);
        });
        markersRef.current.push(marker);
      });
      if (userLocation) {
        const userMarker = new window.google.maps.Marker({
          position: userLocation,
          map: mapRef.current,
          title: 'You',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: colors.brand.primary,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
            scale: 10,
          },
          zIndex: 999,
        });
        markersRef.current.push(userMarker);
      }
    } else if (provider === 'leaflet' && window.L) {
      const L = window.L;
      markers.forEach((m) => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: 14px; height: 14px;
            background: ${m.color};
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(mapRef.current);
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;"><strong>${m.label}</strong>${m.subtitle ? `<br/><small>${m.subtitle}</small>` : ''}</div>`
        );
        marker.on('click', () => onMarkerPress?.(m.id));
        markersRef.current.push(marker);
      });
      if (userLocation) {
        const userIcon = L.divIcon({
          className: '',
          html: `<div style="
            width: 20px; height: 20px;
            background: ${colors.brand.primary};
            border-radius: 50%;
            border: 3px solid #fff;
            box-shadow: 0 0 0 4px ${colors.brand.primary}55, 0 4px 12px rgba(0,0,0,0.5);
          "></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 999 }).addTo(mapRef.current);
        userMarker.bindPopup('<strong>You are here</strong>');
        markersRef.current.push(userMarker);
      }
    }
  }, [markers, userLocation, provider, onMarkerPress]);

  if (Platform.OS !== 'web') {
    return (
      <NativeLeafletMap
        center={center}
        zoom={zoom}
        markers={markers}
        userLocation={userLocation}
        onMarkerPress={onMarkerPress}
        height={height}
        isDark={isDark}
        colors={colors}
      />
    );
  }

  return (
    <View
      style={{
        height: height || 360,
        borderRadius: radii.lg,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isDark ? '#0A0A0F' : '#F2F2F7',
      }}
    >
      {/* @ts-ignore — DOM ref works on web */}
      <div
        ref={(el: any) => (containerRef.current = el)}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: typeof radii.lg === 'number' ? radii.lg : 16,
          overflow: 'hidden',
        }}
      />
      {provider === 'loading' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(6,7,13,0.85)' : 'rgba(255,255,255,0.85)',
          }}
        >
          <ActivityIndicator color={colors.brand.primary} />
          <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 6, fontWeight: '600' }}>
            Loading map…
          </Text>
        </View>
      )}
      {provider === 'error' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: isDark ? 'rgba(6,7,13,0.85)' : 'rgba(255,255,255,0.92)',
          }}
        >
          <Text style={{ color: colors.semantic.danger, fontSize: 13, textAlign: 'center' }}>
            {error || 'Map failed to load'}
          </Text>
        </View>
      )}
      {/* Provider attribution badge — bottom right */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: colors.border.default,
        }}
      >
        <Text
          style={{
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 0.3,
          }}
        >
          {provider === 'google' ? 'GOOGLE MAPS' : provider === 'leaflet' ? 'OSM · CARTO' : ''}
        </Text>
      </View>
    </View>
  );
};

const GOOGLE_DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];


// ============================================================================
// Native WebView Leaflet map — runs on Android/iOS
// ============================================================================
import { WebView } from 'react-native-webview';

const NativeLeafletMap = ({
  center,
  zoom,
  markers,
  userLocation,
  onMarkerPress,
  height,
  isDark,
  colors,
}: any) => {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: ${isDark ? '#000' : '#f5f5f5'}; }
  #map { width: 100vw; height: 100vh; }
  .leaflet-control-attribution { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView([${center.lat}, ${center.lng}], ${zoom});
  L.tileLayer('${tileUrl}', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);

  const markers = ${JSON.stringify(markers || [])};
  markers.forEach(function (m) {
    const icon = L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;background:' + m.color + ';border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
    marker.bindPopup('<strong>' + m.label + '</strong>' + (m.subtitle ? '<br/><small>' + m.subtitle + '</small>' : ''));
    marker.on('click', function () {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker', id: m.id }));
    });
  });

  ${userLocation ? `
    const userIcon = L.divIcon({
      className: '',
      html: '<div style="width:20px;height:20px;background:${colors.brand.primary};border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 6px ${colors.brand.primary}55, 0 4px 12px rgba(0,0,0,0.5);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker([${userLocation.lat}, ${userLocation.lng}], { icon: userIcon, zIndexOffset: 999 })
      .addTo(map)
      .bindPopup('<strong>You are here</strong>');
  ` : ''}
</script>
</body>
</html>`;

  return (
    <View
      style={{
        height: height || 360,
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: isDark ? '#000' : '#f5f5f5',
      }}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        mixedContentMode="always"
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'marker' && data.id) onMarkerPress?.(data.id);
          } catch {}
        }}
      />
    </View>
  );
};
