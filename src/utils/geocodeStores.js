import fs from 'fs';
import path from 'path';

/**
 * Run this script using:
 * node src/utils/geocodeStores.js
 */

const DATA_FILE_PATH = path.resolve('./src/data/stores-data.json');
const API_KEY = process.env.PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: PUBLIC_GOOGLE_MAPS_API_KEY is not defined in .env");
    process.exit(1);
}

// Function to call Google Geocoding API
async function geocodeAddress(address) {
    // We add "South Africa" to ensure Google confines the search correctly
    const query = encodeURIComponent(`${address}, South Africa`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            
            // If the API failed to find the street/city and just gave us the dead-center of "South Africa"
            if (result.types.includes('country') || result.formatted_address === 'South Africa') {
                console.warn(`🛑 Rejected: Google could only find the country center for "${address}".`);
                return null;
            }
            
            const location = result.geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        } else {
            console.warn(`⚠️  Warning: Geocoding failed for "${address}". Status: ${data.status}`);
            if (data.error_message) {
                console.warn(`🛑 Google API Error Message: ${data.error_message}`);
            }
            return null;
        }
    } catch (error) {
        console.error(`❌ Network Error geocoding "${address}":`, error.message);
        return null;
    }
}

// Main execution function
async function run() {
    console.log("📍 Starting batch geocoding of stores...");
    
    // Read the current data
    const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const storeData = JSON.parse(rawData);
    
    let updatedCount = 0;
    
    // Iterate through each province and its stores
    for (const [province, stores] of Object.entries(storeData)) {
        console.log(`\nProcessing ${province}...`);
        
        for (let i = 0; i < stores.length; i++) {
            const store = stores[i];
            
            console.log(`   Geocoding ${store['Store Name']}...`);
            const precisionQuery = `${store['Store Name']} ${store.Address}, ${store.Region}, ${store.Province}`;
            const coords = await geocodeAddress(precisionQuery);
            
            if (coords) {
                store.latitude = coords.lat;
                store.longitude = coords.lng;
                updatedCount++;
            } else {
                // If the dynamic query fails, we nullify the bad coordinates so you know which ones need manual fixes
                delete store.latitude;
                delete store.longitude;
            }
            
            // Wait 50ms between requests tightly packing the loop 
            // Avoids overwhelming local networks, though Google API can handle up to 50 QPS
            await new Promise(resolve => setTimeout(resolve, 50)); 
        }
    }
    
    if (updatedCount > 0) {
        // Write the data back to the file formatting with 4 spaces matching original
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(storeData, null, 4));
        console.log(`\n✅ Success! Appended coordinates to ${updatedCount} stores.`);
    } else {
        console.log(`\nℹ️  Finished! No new stores needed coordinates.`);
    }
}

// Auto-execute
run();
