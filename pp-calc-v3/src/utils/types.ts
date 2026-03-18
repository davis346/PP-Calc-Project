export interface HistoryItem {
  id: number;
  date: string;
  route: string;
  pp: number;
  price: number;
  ppUnit: number;
}

export interface BookmarkItem {
  dep: string;
  arr: string;
  fareId: string;
  route: string;
  fare: string;
  pp: number;
  ppRound: number;
  trips: number;
  ppUnit: number | null;
}

export interface CalcResult {
  bm: number;
  fare: { id: string; name: string; rate: number; boarding: number };
  mult: number;
  flightMile: number;
  pp: number;
  totalPP: number;
  ppUnit: number | null;
  trips: number;
  isRound: boolean;
}
