import React, { useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import StoreMap from './StoreMap';
import storeData from '../../data/stores-data.json';

// Automatically parse out all the province names directly from the JSON keys
const provinces = Object.keys(storeData);

export default function StoreFinderApp({ apiKey }: { apiKey: string }) {
  // If Gauteng exists in the data, default to it (highest density of stores), otherwise grab the first one
  const [selectedProvince, setSelectedProvince] = useState<string>(
    provinces.includes('Gauteng') ? 'Gauteng' : provinces[0]
  );
  
  // Mobile standard: Toggle between List and Map view
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // Track the globally selected store for the map popups
  const [selectedStore, setSelectedStore] = useState<any>(null);

  const stores = (storeData as any)[selectedProvince] || [];

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative flex md:flex-row gap-0 md:gap-8 w-full max-w-[1200px] mx-auto h-[75vh] md:h-[calc(100vh-400px)] md:min-h-[500px] overflow-hidden md:overflow-visible overflow-x-hidden pt-4 md:pt-0">
        <div className={`absolute inset-0 w-full md:static md:w-[400px] flex flex-col h-full bg-[#EBEBEB] md:bg-transparent transition-transform duration-300 z-10 md:z-auto md:translate-x-0 ${mobileView === 'list' ? 'translate-x-0' : '-translate-x-[120%]'}`}>
          
          {/* Header & Dropdown Area */}
          <div className="mb-4 shrink-0">
            <h3 className="text-brand-darkGray font-bold text-[13px] tracking-widest uppercase mb-2">
              Select Your Province
            </h3>
            <div className="relative">
              <select 
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full text-xl font-bold px-4 py-3 bg-[#E5E5E5] text-gray-800 appearance-none focus:outline-none cursor-pointer"
              >
                {provinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5 text-gray-500">
                <svg className="fill-current w-6 h-6 font-bold" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>

          <div
            className="overflow-y-auto flex-1 space-y-3 pb-24 md:pb-0 pr-2"
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
          >
            {stores.map((store: any, index: number) => {
              // ALL stores are butcheries, so we hardcode it as the baseline offering
              const offeredServices = ['Butchery'];
              if (store['Bakery'] === 'Yes') offeredServices.push('Bakery');
              if (store['Hot Foods'] === 'Yes') offeredServices.push('Hot Foods');
              if (store['Fruit & Veg'] === 'Yes') offeredServices.push('Fruit & Veg');
              if (store['Liquor'] === 'Yes') offeredServices.push('Liquor');
              
              const isSelected = selectedStore && selectedStore['Store Name'] === store['Store Name'];
              
              return (
                <div 
                  key={index} 
                  className={`bg-white p-5 cursor-pointer hover:bg-gray-50 transition-all shadow-sm border-l-4 ${isSelected ? 'border-brand-primary bg-orange-50/30' : 'border-transparent'}`}
                  onClick={() => {
                    setSelectedStore(store);
                    if (mobileView === 'list') {
                      setMobileView('map');
                    }
                  }}
                >
                  <h3 className="font-bold text-lg text-black leading-none mb-2">{store['Store Name']}</h3>
                  
                  {store['Phone Number'] && (
                    <div className="font-bold text-[13px] text-black mb-1">
                      {store['Phone Number']}
                    </div>
                  )}

                  <div className="text-[13px] text-black mb-4 pr-2">
                    {store['Address']}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-[13px] text-black leading-snug font-medium" dangerouslySetInnerHTML={{ __html: store['Trading Hours'] }} />
                  </div>
                  
                  {offeredServices.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {offeredServices.map((service) => (
                        <span key={service} className="text-[11px] font-bold text-brand-dark font-sans">
                          {service}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {stores.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center bg-white">
                 <span className="text-gray-500 font-medium">No stores found in this province.</span>
              </div>
            )}
          </div>
        </div>

        {/* NOTE: translate slide used instead of display:none — Google Maps breaks inside hidden elements */}
        <div
          className={`absolute inset-0 w-full md:static md:flex-1 bg-gray-200 h-full transition-transform duration-300 md:translate-x-0 ${mobileView === 'map' ? 'translate-x-0 z-10' : 'translate-x-[120%] z-0'}`}
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
        >
          <StoreMap 
            stores={stores} 
            selectedProvince={selectedProvince} 
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
          />
        </div>
      </div>

      {/* Floating View Toggle for Mobile Only */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-xl rounded-full bg-white border border-gray-100 flex p-1 overflow-hidden">
        <button 
          onClick={() => setMobileView('list')}
          className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${mobileView === 'list' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-600'}`}
        >
          List View
        </button>
        <button 
          onClick={() => setMobileView('map')}
          className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${mobileView === 'map' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-600'}`}
        >
          Map View
        </button>
      </div>
    </APIProvider>
  );
}
