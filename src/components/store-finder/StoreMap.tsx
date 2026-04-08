import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap, Pin } from '@vis.gl/react-google-maps';

export default function StoreMap({
  stores,
  selectedProvince,
  selectedStore,
  setSelectedStore
}: {
  stores: any[],
  selectedProvince: string,
  selectedStore: any,
  setSelectedStore: (store: any) => void
}) {
  const map = useMap();
  const [geoJsonLoaded, setGeoJsonLoaded] = useState(false);

  useEffect(() => {
    if (!map || !stores || stores.length === 0) return;

    // @ts-ignore — `google` is injected at runtime by APIProvider, not importable
    const bounds = new google.maps.LatLngBounds();

    stores.forEach((store: any) => {
      if (store.latitude && store.longitude) {
        bounds.extend({ lat: store.latitude, lng: store.longitude });
      }
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }

    setSelectedStore(null);
  }, [map, stores, setSelectedStore]);

  useEffect(() => {
    if (map && selectedStore && selectedStore.latitude && selectedStore.longitude) {
      map.panTo({ lat: selectedStore.latitude, lng: selectedStore.longitude });
    }
  }, [map, selectedStore]);

  useEffect(() => {
    if (!map || geoJsonLoaded) return;

    // GeoJSON for SA Borders
    map.data.loadGeoJson('https://raw.githubusercontent.com/RyzorBent/za-geojson/master/provinces.json', null, () => {
      setGeoJsonLoaded(true);
    });
  }, [map, geoJsonLoaded]);

  useEffect(() => {
    if (!map || !geoJsonLoaded) return;

    map.data.setStyle((feature: any) => {
      const isSelected = feature.getProperty('ADM1_EN') === selectedProvince;

      return {
        strokeColor: '#F18020',
        strokeWeight: isSelected ? 4 : 2,
        fillColor: isSelected ? '#F18020' : '#000000',
        fillOpacity: isSelected ? 0.15 : 0.05,
        visible: true,
        zIndex: isSelected ? 2 : 1
      };
    });
  }, [map, geoJsonLoaded, selectedProvince]);

  return (
    <>
      <Map
        mapId="b8dd7cc679134d256387d898"
        defaultZoom={6}
        defaultCenter={{ lat: -29.0, lng: 24.0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
      >
        {stores.map((store: any, index: number) => {
          if (!store.latitude || !store.longitude) return null;

          const position = { lat: store.latitude, lng: store.longitude };

          return (
            <AdvancedMarker
              key={`${store['Store Name']}-${index}`}
              position={position}
              onClick={() => setSelectedStore(store)}
            >
              <Pin background={'#F18020'} borderColor={'#000000'} glyphColor={'transparent'}>
              </Pin>
            </AdvancedMarker>
          );
        })}

        {/* The Popup Window that appears when you click a pin or select from the list */}
        {selectedStore && (
          <InfoWindow
            position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
            onCloseClick={() => setSelectedStore(null)}
          >
            <div className="p-3 min-w-[220px]">
              <h3 className="font-bold text-brand-primary text-lg mb-1">{selectedStore['Store Name']}</h3>
              <p className="text-sm text-gray-700 mb-3 leading-snug">{selectedStore['Address']}</p>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline inline-flex items-center justify-center bg-brand-primary text-brand-light font-bold text-sm px-4 py-2 mt-2 rounded-full hover:bg-brand-primary border-brand-primary transition-colors tracking-widest uppercase"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Get Directions
              </a>
            </div>
          </InfoWindow>
        )}
      </Map>
    </>
  );
}
