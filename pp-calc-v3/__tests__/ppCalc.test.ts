import { getBaseMileage, isDomestic, getRouteMultiplier, calcPP, getAirportName } from '../src/utils/ppCalc';
import { AIRPORTS, ROUTES } from '../src/data/masterData';

// ─── getBaseMileage ────────────────────────────────────────────────────────
describe('getBaseMileage', () => {
  test('HND→OKA は 984マイル', () => {
    expect(getBaseMileage('HND', 'OKA')).toBe(984);
  });

  test('OKA→HND も 984マイル（双方向）', () => {
    expect(getBaseMileage('OKA', 'HND')).toBe(984);
  });

  test('HND→CTS は 510マイル', () => {
    expect(getBaseMileage('HND', 'CTS')).toBe(510);
  });

  test('HND→KIX は 280マイル', () => {
    expect(getBaseMileage('HND', 'KIX')).toBe(280);
  });

  test('HND→SINの路線が存在する', () => {
    expect(getBaseMileage('HND', 'SIN')).not.toBeNull();
  });

  test('存在しない路線はnullを返す', () => {
    expect(getBaseMileage('ZZZ', 'YYY')).toBeNull();
  });
});

// ─── isDomestic ────────────────────────────────────────────────────────────
describe('isDomestic', () => {
  test('HND→OKA は国内線', () => {
    expect(isDomestic('HND', 'OKA')).toBe(true);
  });

  test('HND→ICN は国際線', () => {
    expect(isDomestic('HND', 'ICN')).toBe(false);
  });

  test('HND→SIN は国際線', () => {
    expect(isDomestic('HND', 'SIN')).toBe(false);
  });
});

// ─── getRouteMultiplier ────────────────────────────────────────────────────
describe('getRouteMultiplier', () => {
  test('国内線は×2', () => {
    expect(getRouteMultiplier('HND', 'OKA')).toBe(2);
  });

  test('アジア・オセアニアは×1.5', () => {
    expect(getRouteMultiplier('HND', 'SIN')).toBe(1.5);
  });

  test('その他国際線は×1', () => {
    expect(getRouteMultiplier('HND', 'LHR')).toBe(1);
  });
});

// ─── calcPP ────────────────────────────────────────────────────────────────
describe('calcPP', () => {
  test('HND→OKA スタンダード（80% 国内×2 +200PP）往復', () => {
    const bm = 984;
    const { pp } = calcPP(bm, 0.8, 2, 200);
    // fm = floor(984 * 0.8) = 787
    // pp = floor(787 * 2) + 200 = 1774
    expect(pp).toBe(1774);
    expect(pp * 2).toBe(3548);
  });

  test('HND→OKA フレックス（100% 国内×2 +400PP）片道', () => {
    const bm = 984;
    const { pp } = calcPP(bm, 1.0, 2, 400);
    // fm = 984, pp = 984*2 + 400 = 2368
    expect(pp).toBe(2368);
  });

  test('HND→OKA シンプル（70% 国内×2 +100PP）片道', () => {
    const bm = 984;
    const { pp } = calcPP(bm, 0.7, 2, 100);
    // fm = floor(984 * 0.7) = 688
    // pp = floor(688 * 2) + 100 = 1476
    expect(pp).toBe(1476);
  });

  test('HND→SIN Y/B/M（100% アジア×1.5 +400PP）片道', () => {
    const bm = getBaseMileage('HND', 'SIN')!;
    const { pp } = calcPP(bm, 1.0, 1.5, 400);
    const fm = Math.floor(bm * 1.0);
    const expected = Math.floor(fm * 1.5) + 400;
    expect(pp).toBe(expected);
  });

  test('積算率0%はPP=搭乗ポイントのみ', () => {
    const { pp } = calcPP(984, 0, 2, 200);
    expect(pp).toBe(200);
  });

  test('積算率150%のファーストクラス計算', () => {
    const { pp } = calcPP(984, 1.5, 2, 400);
    expect(pp).toBe(Math.floor(Math.floor(984 * 1.5) * 2) + 400);
  });
});

// ─── PP単価 ────────────────────────────────────────────────────────────────
describe('PP単価', () => {
  test('HND→OKA スタンダード往復のPP単価が正しく計算される', () => {
    const pp = 3548;
    const price = 25300;
    const ppUnit = Math.round((price / pp) * 100) / 100;
    expect(ppUnit).toBe(7.13);
  });
});

// ─── SFC達成往復数 ─────────────────────────────────────────────────────────
describe('SFC達成往復数', () => {
  test('HND→OKA スタンダードで50,000PP達成に必要な往復数は15回', () => {
    const { pp } = calcPP(984, 0.8, 2, 200);
    const trips = Math.ceil(50000 / (pp * 2));
    expect(trips).toBe(15);
  });
});

// ─── masterData整合性 ──────────────────────────────────────────────────────
describe('masterData整合性', () => {
  test('全ての路線のマイル数が正の整数', () => {
    Object.entries(ROUTES).forEach(([route, miles]) => {
      expect(miles).toBeGreaterThan(0);
      expect(Number.isInteger(miles)).toBe(true);
    });
  });

  test('全ての路線コードがAIRPORTSに存在する', () => {
    const codes = AIRPORTS.map(a => a.code);
    Object.keys(ROUTES).forEach(route => {
      const [dep, arr] = route.split('-');
      expect(codes).toContain(dep);
      expect(codes).toContain(arr);
    });
  });
});

// ─── getAirportName ────────────────────────────────────────────────────────
describe('getAirportName', () => {
  test('HNDは羽田', () => {
    expect(getAirportName('HND')).toBe('羽田');
  });

  test('OKAは那覇', () => {
    expect(getAirportName('OKA')).toBe('那覇');
  });

  test('存在しないコードはそのまま返す', () => {
    expect(getAirportName('ZZZ')).toBe('ZZZ');
  });
});
