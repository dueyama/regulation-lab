# Regulation Lab

Regulation Lab is a web-based experiment tool for studying self-organized proportion regulation through local contacts. It implements two simulation families:

- a lattice/PCA model based on the published proportion regulation framework
- a billiard-style particle model inspired by an older SpriteKit prototype, where collisions act as local contacts

The live `A/B` experiment and density-sweep views focus on two internal modes, `A` and `B`, with switchable transition rules:

- basic symmetric contact rule `(m, n) = (1, 1)`
- asymmetric rule `(m, n) = (1, 2)`
- asymmetric rule `(m, n) = (2, 0)`

The app also includes a four-state lattice experiment following the paper's Fig. 9 idea: two independent local-contact switches, `A/B` and `C/D`, combine into `AC`, `AD`, `BC`, and `BD`.

The app supports deterministic seeds, Japanese/English UI text, live spatial visualization, and ratio time-series plots.

## Reference Paper

This app is based on the lattice/PCA model introduced in:

Iwamoto, M., & Ueyama, D. (2018). Basis of self-organized proportion regulation resulting from local contacts. *Journal of Theoretical Biology*, 440, 112-120. https://doi.org/10.1016/j.jtbi.2017.12.028

The billiard particle mode is an exploratory extension of the same local-contact regulation idea and is not part of the original paper.

## Simulation Notes

### Transition rules

Both simulation families use the same local transition rule interface. For a rule `(m, n)`:

- an `A` individual can switch to `B` with probability `alpha` when it has at least `m` local contacts with `B`
- a `B` individual can switch to `A` with probability `beta` when it has at least `n` local contacts with `B`

The included presets are `(1, 1)`, `(1, 2)`, and `(2, 0)`.

Rule selection applies the paper's `alpha` and `beta` values:

| Rule | alpha | beta | Paper context |
| --- | ---: | ---: | --- |
| `(1, 1)` | 0.2 | 0.8 | Figs. 2-5; `L=M=100`, `N=8000` in Figs. 2-4, density sweep in Fig. 5 |
| `(1, 2)` | 0.01 | 1.0 | Fig. 7a and Fig. 8; `L=M=100`, density sweep |
| `(2, 0)` | 0.8 | 0.2 | Fig. 7b and Appendix B; `L=M=100`, density sweep, bistable above threshold |

Density is not forced by rule selection because it is an experimental axis in the paper's density-dependence figures.

The `Density sweep` view includes lattice/PCA paper-reproduction presets and exploratory billiard-extension presets.

- Fig. 5: symmetric `(1,1)` lattice density sweep
- Fig. 7a: asymmetric `(1,2)` lattice density sweep
- Fig. 7b + Appendix B: asymmetric `(2,0)` lattice density sweep with initial-condition comparison
- Fig. 8: excluded-volume comparison for `(1,2)`
- Billiard extension `(1,1)`, `(1,2)`, and `(2,0)` area-density sweeps

These sweeps are computed live in the browser: for each density and series, the app creates a new simulation and advances it for the preset number of steps. The lattice presets create a new `LatticeSimulation` and advance Monte Carlo steps. The billiard presets create a new `BilliardSimulation` and advance Matter.js physics steps.

The default step counts are intentionally short so the UI remains interactive; they are not cached data and are not intended to be publication-grade fully converged reruns. Billiard-extension sweeps use a longer default observation window than the lattice presets because sparse collision systems need more physics time before their contact history is informative.

During a sweep, the view also shows the current simulation snapshot for the density point being computed.

### Four-state lattice mode

The four-state view follows the paper's Fig. 9 extension concept. Each individual has two independent internal axes:

- `A/B`, regulated by `A + B -> B` with probability `alpha` and `B + B -> A` with probability `beta`
- `C/D`, regulated by `C + D -> D` with probability `gamma` and `D + D -> C` with probability `delta`

The displayed states are the four combinations `AC`, `AD`, `BC`, and `BD`. The app plots all four ratios and shows the independent product expectation:

- `pA = beta / (alpha + beta)`
- `pC = delta / (gamma + delta)`
- `pAC = pA * pC`, `pAD = pA * (1 - pC)`, `pBC = (1 - pA) * pC`, `pBD = (1 - pA) * (1 - pC)`

This mode is currently implemented for the lattice/PCA system only. The billiard extension remains focused on the two-state `A/B` experiment.

### Lattice/PCA mode

The lattice mode uses asynchronous Monte Carlo updates. One displayed step performs `N` random individual updates, where `N` is the number of individuals. Each update samples one individual, evaluates the four-neighbor von Neumann neighborhood, applies the transition rule, and then attempts one random move.

The excluded-volume toggle controls whether a lattice site can contain only one individual. With excluded volume on, moves into occupied sites are rejected. With excluded volume off, multiple individuals can occupy the same site.

### Billiard particle mode

The billiard mode uses Matter.js to move circular particles in continuous space. Friction is set to zero (`friction`, `frictionAir`, and `frictionStatic` are all `0`), and wall reflection is handled explicitly so particles do not lose speed at the boundary.

The billiard density sweep is not a reproduction from the paper. It uses an area-fraction density axis: field size, particle radius, velocity, and restitution are fixed by the preset, and the app varies particle count as `particleCount = round(density * fieldArea / (pi * radius^2))`. With the default billiard preset (`fieldSize=420`, `radius=8`), `density=0.9` corresponds to roughly 790 particles.

Mode switching is not applied continuously while particles remain in contact. After each physics step, the app scans particle pairs and treats only newly detected contacts as contact events, similar to a `didBeginContact` event. A contact is detected when two particle centers are within roughly two radii. Contacts that were already present in the previous step are ignored.

Only particles that participate in a newly detected contact event are eligible for a billiard state transition. The local `B` contact count used by the `(m, n)` rule is then evaluated from all current contacts in that physics step, not only the newly started contact. This matters for rules such as `(2, 0)`: `n=0` means a contact-participating `B` does not need any `B` neighbors to satisfy the `B -> A` condition, not that every `B` particle changes spontaneously on every physics step.

For asymmetric rules such as `(1, 2)` or `(2, 0)`, multiple new contacts in the same discrete physics step can contribute to the local `B` contact count. This is a per-step event aggregation, not an exact continuous-time simultaneous-contact model.

### Randomness

All stochastic choices use a seeded MT19937 generator. Reusing the same configuration and seed should reproduce the same initial state and trajectory.

### Visualization

The time-series chart plots only `pA` and `pB` on the shared `0..1` ratio scale. `B/A` is kept in the current summary because it is not a fraction and can exceed `1`, which makes it misleading when overlaid on the same axis. The vertical stacked bar beside the chart shows the current A/B composition.

## Development

```bash
npm install
npm run dev
```

Build for static hosting:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Deployment

The app is a static Vite build and can be deployed to GitHub Pages, Vercel, or any static hosting service after running:

```bash
npm run build
```

The generated `dist/` directory is build output and is not committed.

## License

Copyright (c) 2026 dueyama.

Released under the MIT License. See [LICENSE](LICENSE).
