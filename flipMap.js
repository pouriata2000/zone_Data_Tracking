// Script to flip coordinates horizontally
// Run with: node flip-coordinates.js

const originalZones = {
    "Mark's Office": {"x_min": 300, "x_max": 550, "y_min": -1070, "y_max": -770},
    "Sy's Office": {"x_min": 550, "x_max": 775, "y_min": -1070, "y_max": -775},
    "Dietrik's Office": {"x_min": 775, "x_max": 1000, "y_min": -1070, "y_max": -775},
    "SM Conf Room": {"x_min": 1000, "x_max": 1220, "y_min": -1070, "y_max": -775},
    "Customer Service": {"x_min": 1220, "x_max": 1600, "y_min": -1070, "y_max": -775},
    "Entrance": {"x_min": 465, "x_max": 610, "y_min": -650, "y_max": -405},
    "Supply1": {"x_min": 610, "x_max": 775, "y_min": -490, "y_max": -405},
    "Reception": {"x_min": 610, "x_max": 775, "y_min": -650, "y_max": -490},
    "Mark's Hallway": {"x_min": 465, "x_max": 555, "y_min": -770, "y_max": -650},
    "Sy's Hallway": {"x_min": 555, "x_max": 790, "y_min": -770, "y_max": -650},
    "Supply2": {"x_min": 775, "x_max": 1000, "y_min": -490, "y_max": -405},
    "Supply3": {"x_min": 775, "x_max": 1000, "y_min": -650, "y_max": -490},
    "Dietrik's Hallway": {"x_min": 790, "x_max": 1000, "y_min": -770, "y_max": -650},
    "Test": {"x_min": 995, "x_max": 1350, "y_min": -650, "y_max": -405},
    "Conf Hallway": {"x_min": 1000, "x_max": 1225, "y_min": -770, "y_max": -650},
    "Dev": {"x_min": 1350, "x_max": 1650, "y_min": -650, "y_max": -405},
    "Customer Service Hallway": {"x_min": 1225, "x_max": 1655, "y_min": -770, "y_max": -650},
    "99": {"x_min": 300, "x_max": 450, "y_min": -770, "y_max": -405}
  };
  
  function flipCoordinatesHorizontally(zones) {
    // Find the bounds of the entire map
    let minX = Infinity;
    let maxX = -Infinity;
    
    Object.values(zones).forEach(zone => {
      minX = Math.min(minX, zone.x_min);
      maxX = Math.max(maxX, zone.x_max);
    });
    
    console.log(`Map bounds: ${minX} to ${maxX} (width: ${maxX - minX})`);
    
    const flippedZones = {};
    
    Object.entries(zones).forEach(([zoneName, zone]) => {
      // Apply horizontal flip formula
      const newXMin = (maxX + minX) - zone.x_max;
      const newXMax = (maxX + minX) - zone.x_min;
      
      flippedZones[zoneName] = {
        x_min: newXMin,
        x_max: newXMax,
        y_min: zone.y_min, // Y coordinates unchanged
        y_max: zone.y_max
      };
      
      console.log(`${zoneName}:`);
      console.log(`  Original: x_min: ${zone.x_min}, x_max: ${zone.x_max}`);
      console.log(`  Flipped:  x_min: ${newXMin}, x_max: ${newXMax}`);
      console.log('');
    });
    
    return flippedZones;
  }
  
  // Flip the coordinates
  const flippedZones = flipCoordinatesHorizontally(originalZones);
  
  // Output the result in a format you can copy-paste
  console.log('=== FLIPPED COORDINATES ===');
  console.log('const zoneBounds = {');
  Object.entries(flippedZones).forEach(([zoneName, zone]) => {
    console.log(`  "${zoneName}": {"x_min": ${zone.x_min}, "x_max": ${zone.x_max}, "y_min": ${zone.y_min}, "y_max": ${zone.y_max}},`);
  });
  console.log('};');