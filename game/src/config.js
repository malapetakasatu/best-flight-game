// AeroStrike X-35 Valkyrie - Configuration & Flight Physics Parameters

export const WORLD = {
  gravity: 9.81,           // m/s^2
  airDensitySeaLevel: 1.225, // kg/m^3
  airDensityScaleHeight: 8500, // meters
  islandRadius: 6000,      // meters
  seaLevel: 0,
};

export const AIRCRAFT = {
  name: 'AeroStrike X-35 Valkyrie',
  mass: 14500,             // kg dry mass
  wingArea: 46.0,          // m^2
  wingspan: 11.5,          // meters
  chord: 4.0,              // mean aerodynamic chord (m)
  
  // Aerodynamic coefficients
  cl0: 0.18,               // Zero-alpha lift coefficient
  clAlpha: 4.8,            // Lift slope per radian
  clMax: 1.55,             // Stall lift ceiling
  stallAngleDeg: 17.5,     // Critical stall AoA
  
  cd0: 0.016,              // Parasitic zero-lift drag
  inducedDragK: 0.048,     // Induced drag factor k = 1 / (pi * e * AR)
  cdGear: 0.035,           // Extra drag when landing gear extended
  cdFlaps: 0.045,          // Extra drag when flaps extended
  cdAirbrake: 0.075,       // Extra drag when airbrake deployed
  
  // Propulsion
  maxThrustMil: 145000,    // Newtons (dry military power)
  maxThrustAB: 220000,     // Newtons (full afterburner)
  fuelMaxKg: 6500,         // kg fuel capacity
  fuelRateMil: 1.8,        // kg/s fuel burn at military power
  fuelRateAB: 5.5,         // kg/s fuel burn at full afterburner
  
  // Control surface moment effectiveness
  pitchRateMax: 1.25,      // rad/s elevator authority
  rollRateMax: 3.20,       // rad/s aileron authority
  yawRateMax: 0.45,        // rad/s rudder authority
  
  // Structural limits
  gLimitPositive: 9.0,     // +9G maximum structural limit
  gLimitNegative: -3.0,    // -3G inverted limit
};

export const MISSIONS = [
  {
    id: 1,
    name: 'Top Gun Canyon Run',
    tag: 'SORTIE 01',
    description: 'Fly low through Devil\'s Gorge mountain pass, navigating 10 supersonic rings.',
    ringCount: 10,
    timeLimit: 150, // seconds
    startPos: { x: -3200, y: 350, z: 2800 },
    startHeading: 35, // degrees
    startSpeed: 180, // m/s (~350 kts)
  },
  {
    id: 2,
    name: 'Archipelago Recon Patrol',
    tag: 'SORTIE 02',
    description: 'Intercept 4 reconnaissance radar waypoints guarding the offshore archipelago.',
    ringCount: 8,
    timeLimit: 180,
    startPos: { x: -1000, y: 1200, z: 4000 },
    startHeading: 320,
    startSpeed: 240, // m/s (~460 kts)
  },
  {
    id: 3,
    name: 'Airbase Runway 09 Recovery',
    tag: 'SORTIE 03',
    description: 'Execute final approach onto Airbase Runway 09. Extend gear, maintain glide slope, touchdown softly.',
    ringCount: 4,
    timeLimit: 120,
    startPos: { x: -3800, y: 320, z: -100 },
    startHeading: 90, // Straight alignment with Runway 09
    startSpeed: 110, // m/s (~210 kts)
  },
];

export const CONTROLS = {
  pitchUp: ['KeyS', 'ArrowDown'],
  pitchDown: ['KeyW', 'ArrowUp'],
  rollLeft: ['KeyA', 'ArrowLeft'],
  rollRight: ['KeyD', 'ArrowRight'],
  yawLeft: ['KeyQ'],
  yawRight: ['KeyE'],
  throttleUp: ['ShiftLeft', 'ShiftRight'],
  throttleDown: ['ControlLeft', 'ControlRight'],
  afterburner: ['Space'],
  toggleGear: ['KeyG'],
  toggleFlaps: ['KeyF'],
  toggleAirbrake: ['KeyB'],
  toggleCamera: ['KeyC'],
  restart: ['KeyR'],
};
