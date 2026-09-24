# Known Issues

Silent traps and host limits that affect `bench_env` at production scale. Each issue here produces wrong numbers or hangs *without* crashing, so it is worth scanning this page once before configuring a large run.

---

## 1. `--processes N --isolation contexts` silently lowers SR

**Symptom.** No crash, no error logs. SR drops by roughly 4–5 percentage points compared to an equivalent `--isolation pages` run. The regression concentrates on tasks that inject seed state in `_post_sample`.

**Mechanism.** Under multi-process sharding, all N contexts inside a single Chromium begin `reset` simultaneously through `asyncio.gather` with no stagger. IndexedDB hydrate completes *after* `_post_sample` has called `setState`, and silently overwrites the injected seed values. The race window does not fire on `--isolation pages` (pages share an IDB origin so hydrate is already warm when the second page resets) and does not fire on single-process `contexts` (natural ramp staggering keeps the window narrow).

**Workaround.** Use `--isolation pages` for all multi-process runs. It is the production default and is faster than `contexts` in practice.

---

## 2. Page-per-browser limit: keep `N / B ≤ 8`

**Symptom.** Beyond roughly 8 pages in one Chromium process: occasional pointer-event jitter, short GC pauses, and flaky page initialization. Not a hard failure, but stability degrades.

**Mechanism.** A single Chromium process serializes parts of its rendering pipeline (renderer GC, main-thread compositor) across all its pages. Empirically, 6–8 concurrent pages per browser is the cleanly-handled range.

**Workaround.** With `--isolation pages`, configure `--browsers B --parallel N` so that `N / B ≤ 8`. To grow total concurrency, add browsers — not pages per browser. For best fault isolation, **pair browsers and processes 1:1** (`--processes B --browsers B`): each Chromium then runs under its own Python worker, so a single browser crash or memory leak is contained to one shard and cannot disrupt the rest.

Recommended layouts (all `--isolation pages`):

| Target parallelism | Layout |
|---|---|
| ≤ 8 | 1 process × 1 browser × N pages |
| 16 | 2 processes × 1 browser × 8 pages |
| 32 | 4 processes × 1 browser × 8 pages |
| 256 | 32 processes × 1 browser × 8 pages |

---

## 3. `--parallel ≥ 192` stalls on `_wait_ready __SIM__ timeout`

**Symptom.** `errors.jsonl` fills with entries like

```
RuntimeError: [WN][page#1] _wait_ready phase=__SIM__ timeout:
  TimeoutError: Page.wait_for_function: Timeout 60000ms exceeded.
```

while CPU, GPU, network, and disk all sit around 10% idle. The pipeline looks starved but nothing is actually busy.

**Mechanism.** Linux caps `fs.inotify.max_user_instances` per uid (default 128 on older kernels, 1024 on Ubuntu 22.04+). Each headless Chromium creates at least one inotify instance. Once the per-uid cap is reached, `inotify_init()` returns `EMFILE`, and the affected Chromium subsystems enter silent retry loops — deferring `__SIM__` exposure past the 60-second readiness timeout.

### Diagnostic

While the run is stalling, in a separate shell:

```bash
find /proc/*/fd -lname 'anon_inode:inotify' 2>/dev/null | wc -l
```

- The number ≈ `cat /proc/sys/fs/inotify/max_user_instances` → this is the cause.
- The number ≪ the cap → look elsewhere.

An idle system shows fewer than 50 inotify instances.

### Workaround (with sudo, preferred)

```bash
# Temporary (resets on reboot)
sudo sysctl -w fs.inotify.max_user_instances=8192

# Persistent
echo "fs.inotify.max_user_instances = 8192" | sudo tee /etc/sysctl.d/99-mobilegym.conf
sudo sysctl --system
```

8192 is conservative; ML and CI hosts commonly run 32 768 – 524 288. The value only sets a kernel hash-table preallocation cap and has no security implications.

### Workaround (no sudo)

The inotify cap is per uid, so two alternatives exist:

1. **Run on a different uid.** Two users sharing the host each get their own 128 instances.
2. **Stagger the launch.** Split one large run into chunks of ≤ 80 envs each, launched at least 60 s apart. Inotify usage stabilizes between chunks. Merge `results.jsonl` and `summary.json` after all chunks complete.

```bash
python -m bench_env.run --parallel 80 --runs-dir runs/part1 ... &
sleep 60
python -m bench_env.run --parallel 80 --runs-dir runs/part2 ... &
sleep 60
python -m bench_env.run --parallel 80 --runs-dir runs/part3 ... &
wait
```

### What does *not* work

User namespaces cannot bypass this limit. Although `unshare --user --map-root-user` grants `CAP_SYS_RESOURCE` inside the new namespace, modifying `fs.inotify.max_user_instances` requires the capability in the init namespace; child namespaces inherit the parent's cap and can only lower it.

---

## See also

- [`FRAMEWORK.md`](FRAMEWORK.md) §6 — full isolation-level reference and multi-process sharding semantics.
