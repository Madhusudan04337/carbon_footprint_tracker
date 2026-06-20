import { 
  calculateTransportEmissions, 
  calculateDietEmissions, 
  calculateEnergyEmissions 
} from '../index';

describe('Carbon Footprint Calculation Formulas', () => {
  describe('Transportation Emissions', () => {
    test('should calculate correct emissions for gasoline car', () => {
      // 100km * 0.170 kg/km = 17.0 kg CO2e
      const emissions = calculateTransportEmissions(100, 'gasoline_car');
      expect(emissions).toBe(17.00);
    });

    test('should calculate correct emissions for electric car', () => {
      // 100km * 0.047 kg/km = 4.7 kg CO2e
      const emissions = calculateTransportEmissions(100, 'electric_car');
      expect(emissions).toBe(4.70);
    });

    test('should fallback to gasoline car on invalid transport mode', () => {
      const emissions = calculateTransportEmissions(100, 'invalid_mode' as any);
      expect(emissions).toBe(17.00);
    });
  });

  describe('Diet Emissions', () => {
    test('should calculate correct emissions for vegan diet', () => {
      // 7 days * 2.9 kg/day = 20.3 kg CO2e
      const emissions = calculateDietEmissions('vegan', 7);
      expect(emissions).toBe(20.30);
    });

    test('should fallback to low_meat diet for invalid diet profile', () => {
      // 1 day * 5.6 kg/day = 5.6 kg CO2e
      const emissions = calculateDietEmissions('unknown_profile' as any, 1);
      expect(emissions).toBe(5.60);
    });
  });

  describe('Energy Emissions', () => {
    test('should calculate emissions based on US average grid intensity', () => {
      // 200 kWh * 0.371 kg/kWh = 74.2 kg CO2e
      const emissions = calculateEnergyEmissions(200);
      expect(emissions).toBe(74.20);
    });

    test('should support clean energy grid mix override', () => {
      // 200 kWh * 0.050 kg/kWh = 10.0 kg CO2e
      const emissions = calculateEnergyEmissions(200, 0.050);
      expect(emissions).toBe(10.00);
    });
  });
});
