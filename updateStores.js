const fs = require('fs');
const path = require('path');

// Read the old data
const oldData = JSON.parse(fs.readFileSync('src/data/stores-data.json', 'utf-8'));

// Read the new data text
const newText = fs.readFileSync('current_stores_21-09-2026', 'utf-8');
const code = newText + '\nmodule.exports = storesData;';
const tmpPath = 'temp_current_stores.js';
fs.writeFileSync(tmpPath, code);

const newData = require('./' + tmpPath);
fs.unlinkSync(tmpPath);

// Function to find a store in a list of stores by Store Name
function findStore(stores, storeName) {
    if (!stores) return null;
    return stores.find(s => s['Store Name'] === storeName);
}

const mergedData = {};

// Iterate through the new data provinces
for (const province in newData) {
    mergedData[province] = [];
    const newStores = newData[province];
    
    for (const newStore of newStores) {
        // Try to find it in oldData
        const oldStore = findStore(oldData[province], newStore['Store Name']);
        
        if (oldStore) {
            // Keep the old store's lat/lng
            if (oldStore.latitude !== undefined) {
                newStore.latitude = oldStore.latitude;
            }
            if (oldStore.longitude !== undefined) {
                newStore.longitude = oldStore.longitude;
            }
        }
        mergedData[province].push(newStore);
    }
}

fs.writeFileSync('src/data/stores-data.json', JSON.stringify(mergedData, null, 4));

let totalStores = 0;
let storesOpened = 0;
let storesClosed = 0;

const newStoreList = [];
for (const province in newData) {
    for (const newStore of newData[province]) {
        newStoreList.push(newStore['Store Name']);
    }
}
const oldStoreList = [];
for (const province in oldData) {
    for (const oldStore of oldData[province]) {
        oldStoreList.push(oldStore['Store Name']);
    }
}

totalStores = newStoreList.length;
storesOpened = newStoreList.filter(name => !oldStoreList.includes(name)).length;
storesClosed = oldStoreList.filter(name => !newStoreList.includes(name)).length;

console.log(`Stores Closed = ${storesClosed}`);
console.log(`Stores Opened = ${storesOpened}`);
console.log(`Total Stores = ${totalStores}`);
console.log("Updated stores-data.json");
