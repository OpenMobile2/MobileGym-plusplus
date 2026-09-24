# Location Service

Use `LocationService` instead of `navigator.geolocation`.

The simulator location can be deterministic, preset by benchmark setup, or configured to simulate errors. This keeps map/search/weather tasks reproducible.

Typical app rule:

```ts
import * as LocationService from '@/os/LocationService';

LocationService.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
  },
  (error) => {
    console.warn(error.message);
  },
);
```

Benchmarks and debug tooling control location through `__SIM_LOCATION__`.

See the service index for broader context: [README.md](README.md).
