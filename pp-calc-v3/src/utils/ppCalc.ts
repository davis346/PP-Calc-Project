import { AIRPORTS, ROUTES } from '../data/masterData';

const DOM_REGIONS = ["関東","関西","北海道","沖縄","九州","中部","東北","中国","四国","北陸"];
const INTL_CODES = AIRPORTS.filter(a => !DOM_REGIONS.includes(a.region)).map(a => a.code);
const ASIA_OCEANIA = ["ICN","GMP","PVG","HKG","TPE","BKK","SIN","KUL","HAN","SGN","MNL","CGK","DEL","RGN","PNH","SYD","PER","VVO"];

export function getBaseMileage(dep: string, arr: string): number | null {
  return ROUTES[`${dep}-${arr}`] || ROUTES[`${arr}-${dep}`] || null;
}

export function isDomestic(dep: string, arr: string): boolean {
  return !INTL_CODES.includes(dep) && !INTL_CODES.includes(arr);
}

export function getRouteMultiplier(dep: string, arr: string): number {
  if (isDomestic(dep, arr)) return 2;
  if (ASIA_OCEANIA.some(c => c === dep || c === arr)) return 1.5;
  return 1;
}

export function calcPP(bm: number, rate: number, mult: number, bp: number) {
  const fm = Math.floor(bm * rate);
  return { flightMile: fm, pp: Math.floor(fm * mult) + bp };
}

export function getAirportName(code: string): string {
  return AIRPORTS.find(a => a.code === code)?.name || code;
}

export function getDomesticAirports() {
  return AIRPORTS.filter(a => DOM_REGIONS.includes(a.region));
}

export function getInternationalRegions(): string[] {
  return [...new Set(AIRPORTS.filter(a => !DOM_REGIONS.includes(a.region)).map(a => a.region))];
}

export function getAirportsByRegion(region: string) {
  return AIRPORTS.filter(a => a.region === region);
}
