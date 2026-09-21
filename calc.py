import json

with open('src/data/stores-data.json', 'r') as f:
    old_data = json.load(f)

# The new data is a JS file, so we need to parse it.
with open('current_stores_21-09-2026', 'r') as f:
    content = f.read()

# Extract the JSON object from the JS file
start_idx = content.find('{')
new_data_str = content[start_idx:]
# It might have a trailing semicolon or module.exports
end_idx = new_data_str.rfind('}') + 1
new_data_str = new_data_str[:end_idx]

import ast
# Use json.loads but fix keys if necessary, actually it's valid JSON format in the JS file!
try:
    new_data = json.loads(new_data_str)
except Exception as e:
    print("Error parsing:", e)
    # basic cleanup if needed, but it looks like standard JSON keys are quoted.
    pass

old_stores = []
for p, stores in old_data.items():
    for s in stores:
        old_stores.append(s['Store Name'])

new_stores = []
for p, stores in new_data.items():
    for s in stores:
        new_stores.append(s['Store Name'])

opened = [s for s in new_stores if s not in old_stores]
closed = [s for s in old_stores if s not in new_stores]

print("Stores Closed =", len(closed))
print("Stores Opened =", len(opened))
print("Total Stores =", len(new_stores))

# Now update the json file as per requirements
merged_data = {}
for p in new_data:
    merged_data[p] = []
    for new_s in new_data[p]:
        old_s = next((s for s in old_data.get(p, []) if s['Store Name'] == new_s['Store Name']), None)
        if old_s:
            if 'latitude' in old_s:
                new_s['latitude'] = old_s['latitude']
            if 'longitude' in old_s:
                new_s['longitude'] = old_s['longitude']
        merged_data[p].append(new_s)

with open('src/data/stores-data.json', 'w') as f:
    json.dump(merged_data, f, indent=4)
print("Updated stores-data.json successfully")
