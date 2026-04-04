# PP計算機 — Test Suite

Unit tests for the core PP calculation logic of the PP Calculator app.

---

## Running Tests

```bash
npm test
```

A HTML report is generated at `test-report/report.html` after each run.

---

## Test Files

| File | Type | Description |
|------|------|-------------|
| `__tests__/ppCalc.test.ts` | Unit | PP calculation logic and route data integrity |

---

## Mocks

| File | Purpose |
|------|---------|
| `__mocks__/expo.js` | Mocks all expo-* packages |
| `__mocks__/async-storage.js` | Mocks AsyncStorage |

---

## Test Coverage

### `getBaseMileage`
Verifies that the route distance lookup returns correct mileage values.

| Test | Description |
|------|-------------|
| HND→OKA is 984 miles | Checks the base mileage for the Tokyo→Naha route |
| OKA→HND is also 984 miles | Confirms routes are bidirectional (reverse lookup works) |
| HND→CTS is 510 miles | Checks the Tokyo→Sapporo route |
| HND→KIX is 280 miles | Checks the Tokyo→Osaka (Kansai) route |
| HND→SIN exists | Confirms an international route is present in the data |
| Unknown route returns null | Ensures invalid routes return null instead of crashing |

---

### `isDomestic`
Verifies that domestic vs international route classification is correct.

| Test | Description |
|------|-------------|
| HND→OKA is domestic | Tokyo→Naha should be classified as a domestic route |
| HND→ICN is international | Tokyo→Seoul should be classified as international |
| HND→SIN is international | Tokyo→Singapore should be classified as international |

---

### `getRouteMultiplier`
Verifies that the correct PP multiplier is applied based on route type.

| Test | Description |
|------|-------------|
| Domestic routes use ×2 | All domestic routes apply a 2x multiplier |
| Asia/Oceania routes use ×1.5 | Routes to Asia/Oceania apply a 1.5x multiplier |
| Other international routes use ×1 | Long-haul routes (e.g. Europe) apply no multiplier |

---

### `calcPP`
Verifies the PP calculation formula for various fare types.

Formula: `PP = floor(floor(baseMileage × fareRate) × routeMultiplier) + boardingPoints`

| Test | Description |
|------|-------------|
| HND→OKA Standard (80%, ×2, +200PP) round trip | Most common SFC training route. Expected: 1,774PP one way / 3,548PP round trip |
| HND→OKA Flex (100%, ×2, +400PP) one way | Highest domestic fare tier |
| HND→OKA Simple (70%, ×2, +100PP) one way | Lowest domestic fare tier |
| HND→SIN Y/B/M (100%, ×1.5, +400PP) one way | International route with Asia multiplier |
| 0% fare rate equals boarding points only | Edge case: PP should equal only the boarding bonus |
| First class 150% fare calculation | Premium first class fare tier |

---

### `PP単価 (PP Cost per Yen)`
Verifies the PP unit cost calculation used to evaluate route efficiency.

| Test | Description |
|------|-------------|
| HND→OKA Standard round trip PP unit cost | With 3,548PP and ¥25,300, expected unit cost is ¥7.13/PP |

---

### `SFC Achievement Trips`
Verifies the number of round trips required to reach the 50,000PP SFC threshold.

| Test | Description |
|------|-------------|
| HND→OKA Standard requires 15 round trips | Confirms the trip count matches the formula |

---

### `masterData Integrity`
Validates the consistency of the route database.

| Test | Description |
|------|-------------|
| All routes have positive integer mileage | No routes have zero, negative, or decimal mileage values |
| All route airport codes exist in AIRPORTS | Every code in ROUTES is defined in the AIRPORTS array |

---

### `getAirportName`
Verifies that airport codes resolve correctly to Japanese city names.

| Test | Description |
|------|-------------|
| HND returns 羽田 | Tokyo Haneda airport code lookup |
| OKA returns 那覇 | Naha airport code lookup |
| Unknown code returns the code itself | Graceful fallback for unrecognized codes |

---

## Notes

- Tests run in a Node.js environment using `ts-jest` — no simulator or device needed
- UI component tests are not included as they require a native environment (simulator/device)
- Test files and reports are excluded from EAS production builds via `.easignore`