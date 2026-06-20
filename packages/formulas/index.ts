/**
 * EcoTrace Shared Emissions Calculator Formulas
 * All calculations return value in Kilograms of CO2 equivalent (kg CO2e).
 */

export type TransportMode = 'gasoline_car' | 'diesel_car' | 'hybrid_car' | 'electric_car' | 'bus' | 'train' | 'flight_short' | 'flight_long';
export type DietType = 'vegan' | 'vegetarian' | 'low_meat' | 'high_meat' | 'pescatarian';

// Emission factors (kg CO2e per unit)
export const EMISSION_FACTORS = {
  // Transport: kg CO2e per kilometer per passenger
  transport: {
    gasoline_car: 0.170, // Average medium car
    diesel_car: 0.171,
    hybrid_car: 0.109,
    electric_car: 0.047, // Depends on electrical grid mix, assumed US average
    bus: 0.096,
    train: 0.035,
    flight_short: 0.245, // Domestic/short haul (< 1500km)
    flight_long: 0.147,  // Long haul (> 1500km)
  },
  // Diet: kg CO2e per person per day
  diet: {
    vegan: 2.9,
    vegetarian: 3.8,
    pescatarian: 4.6,
    low_meat: 5.6,
    high_meat: 7.2,
  },
  // Energy: kg CO2e per kWh of electricity
  energy: {
    us_average: 0.371, // EPA eGRID average US grid mix
    clean_mix: 0.050,  // Wind/Solar heavy mix
    coal_heavy: 0.850,  // Coal-dominated grid
  }
};

/**
 * Calculates emissions for transportation in kg CO2e.
 * @param distanceKm Distance traveled in kilometers
 * @param mode Transportation mode
 */
export function calculateTransportEmissions(distanceKm: number, mode: TransportMode): number {
  const factor = EMISSION_FACTORS.transport[mode] || EMISSION_FACTORS.transport.gasoline_car;
  return Number((distanceKm * factor).toFixed(2));
}

/**
 * Calculates diet emissions in kg CO2e for a given duration.
 * @param type Diet profile type
 * @param days Number of days tracked (default: 1)
 */
export function calculateDietEmissions(type: DietType, days: number = 1): number {
  const factor = EMISSION_FACTORS.diet[type] || EMISSION_FACTORS.diet.low_meat;
  return Number((factor * days).toFixed(2));
}

/**
 * Calculates home energy emissions in kg CO2e.
 * @param kwh Electricity consumed in kilowatt-hours
 * @param gridMix Option for the regional electric grid intensity (kg CO2e per kWh)
 */
export function calculateEnergyEmissions(kwh: number, gridMix: number = EMISSION_FACTORS.energy.us_average): number {
  return Number((kwh * gridMix).toFixed(2));
}
