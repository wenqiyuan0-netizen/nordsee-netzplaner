
// utils/energySimulation.ts

export interface EnergyDataPoint {
  time: number; // 0.0 to 24.0
  timeLabel: string; // "00:00", "00:10", etc.
  load: number;
  pv: number;
  wind: number;
  wave: number;
  totalGen: number;
  netPower: number; // totalGen - load. Positive = Surplus, Negative = Deficit
  pskPower: number; // If surplus: -pumpPower (consuming). If deficit: +turbinePower (generating).
  waterLevel: number; // 0-100%
  flowRate: number; // m³/s
  efficiency: number; // %
  temperature: number; // °C
}

export const generateDayData = (): EnergyDataPoint[] => {
  const data: EnergyDataPoint[] = [];
  const steps = 24 * 6; // Every 10 minutes
  
  // Simulation Parameters
  const MAX_PV = 20;
  const MAX_WIND = 40;
  const MAX_WAVE = 40;
  const MAX_PSK = 20; // Max power for pump/turbine
  
  // Physical Parameters from Datasheet
  const MAX_FLOW = 4.86; // m³/s at 20MW
  const DESIGN_EFFICIENCY = 93.1; // % at design flow
  
  // Reservoir Capacity (in MW*steps units roughly)
  // Let's say 100% level represents X MWh. 
  // We just integrate power to get level.
  // Level[t] = Level[t-1] + (NetPower[t] * dt) * K
  let currentLevel = 30; // Start at 30% at midnight
  
  for (let i = 0; i <= steps; i++) {
    const time = i * (24 / steps);
    const hour = Math.floor(time);
    const minute = Math.floor((time - hour) * 60);
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // 1. Load Profile (Denmark Winter)
    // Base load ~50MW. Morning peak 07-09 (+20). Evening peak 17-20 (+30).
    let load = 50;
    // Morning peak bell curve center 8.0
    load += 25 * Math.exp(-Math.pow(time - 8, 2) / 2);
    // Evening peak bell curve center 18.0
    load += 35 * Math.exp(-Math.pow(time - 18, 2) / 4);
    // Random noise
    load += Math.sin(time * 5) * 2;

    // 2. PV Profile (Winter: 08:30 - 15:30)
    let pv = 0;
    if (time > 8.5 && time < 15.5) {
      // Parabola or Sine
      const sunPhase = (time - 8.5) / (15.5 - 8.5) * Math.PI;
      pv = MAX_PV * Math.sin(sunPhase);
    }

    // 3. Wind Profile (High in winter, fluctuating)
    // Superposition of sine waves to look random but smooth
    let wind = MAX_WIND * 0.8; // Base 80%
    wind += 5 * Math.sin(time * 0.5);
    wind += 3 * Math.sin(time * 2.3);
    wind += 2 * Math.cos(time * 5.1);

    // 4. Wave Profile (More regular than wind)
    let wave = MAX_WAVE * 0.7;
    wave += 5 * Math.sin(time * 1.5 + 2);

    // 5. Total Generation
    const totalGen = pv + wind + wave;

    // 6. Net Power (Surplus/Deficit)
    const net = totalGen - load;

    // 7. PSK Operation
    // If net > 0 (Surplus): Pump water (Store energy). Power is consumed (negative in grid view, but let's store flow).
    // Let's define pskPower: Positive = Generating (Water down), Negative = Pumping (Water up).
    // But capacity is limited to 20MW.
    
    let pskPower = 0;
    if (net > 0) {
        // Surplus: Pump
        pskPower = -Math.min(net, MAX_PSK);
    } else {
        // Deficit: Generate
        pskPower = Math.min(-net, MAX_PSK);
    }

    // Calculate physical parameters based on pskPower
    const powerRatio = Math.abs(pskPower) / MAX_PSK;
    let flowRate = 0;
    let efficiency = 0;
    
    if (powerRatio > 0.01) {
        // Flow is roughly proportional to power (simplified)
        // Correct physics: Power = rho * g * h * Q * eff
        // Since h is constant (508m), Q ~ Power / eff
        // We assume eff drops slightly at partial load
        efficiency = DESIGN_EFFICIENCY * (1 - Math.pow(1 - powerRatio, 2) * 0.1); 
        flowRate = (Math.abs(pskPower) / 20) * MAX_FLOW;
    }

    // Temperature simulation (Winter day: -5 to +2)
    // Min at 04:00, Max at 14:00
    const tempBase = -3.4; // Average Jan temp from datasheet
    const tempSwing = 2.5; 
    const temperature = tempBase + tempSwing * Math.sin((time - 9) / 24 * 2 * Math.PI);


    // 8. Water Level Integration
    // dt = 10 min = 1/6 hour.
    // Energy (MWh) = Power (MW) * Time (h).
    // Let's say Total Capacity is 100 MWh.
    // Change % = (Power * dt / Capacity) * 100
    // Note: pskPower < 0 means Pumping (Level goes UP)
    //       pskPower > 0 means Generating (Level goes DOWN)
    // Wait, user said: "水泵的功率开启，水向上运...水位显示上涨" -> Pumping increases level.
    // So if pskPower is negative (consumption), Level increases.
    // Let's flip the sign for integration: LevelChange ~ -pskPower
    
    const dt = 24 / steps;
    const capacityMWh = 150; // Tuned to make it hit 90%
    const levelChange = (-pskPower * dt / capacityMWh) * 100;
    
    currentLevel += levelChange;
    // Clamp level
    if (currentLevel > 100) currentLevel = 100;
    if (currentLevel < 0) currentLevel = 0;

    // Force Trigger Condition: We want Level to hit > 90% around 13:00-14:00
    // If it's too low, artificial boost (just for demo tuning)
    // currentLevel is what it is. I'll adjust start level or capacity above.

    data.push({
      time,
      timeLabel,
      load: parseFloat(load.toFixed(1)),
      pv: parseFloat(pv.toFixed(1)),
      wind: parseFloat(wind.toFixed(1)),
      wave: parseFloat(wave.toFixed(1)),
      totalGen: parseFloat(totalGen.toFixed(1)),
      netPower: parseFloat(net.toFixed(1)),
      pskPower: parseFloat(pskPower.toFixed(1)),
      waterLevel: parseFloat(currentLevel.toFixed(1)),
      flowRate: parseFloat(flowRate.toFixed(2)),
      efficiency: parseFloat(efficiency.toFixed(1)),
      temperature: parseFloat(temperature.toFixed(1))
    });
  }

  return data;
};
