"""Task-local simulated-time setup without changing the global environment."""

from __future__ import annotations

from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


SIMULATED_TIME_PARAM = "mobilegym_simulated_time"
TIME_FLOWING_PARAM = "mobilegym_time_flowing"


def simulated_time_bootstrap_url(url: str, value: str) -> str:
    """Return a URL that initializes eager app data under the frozen clock."""

    parts = urlsplit(url)
    query = [
        (key, item)
        for key, item in parse_qsl(parts.query, keep_blank_values=True)
        if key not in {SIMULATED_TIME_PARAM, TIME_FLOWING_PARAM}
    ]
    query.extend([
        (SIMULATED_TIME_PARAM, value),
        (TIME_FLOWING_PARAM, "false"),
    ])
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


async def freeze_simulated_time(env: Any, value: str) -> dict[str, Any]:
    """Freeze TimeService after reset and before any app module is warmed."""

    config = await env.page.evaluate(
        """value => {
            const clock = window.__SIM_TIME__;
            if (!clock) throw new Error('window.__SIM_TIME__ is unavailable');
            clock.setSimulatedTime(value, false);
            return clock.getConfig();
        }""",
        value,
    )
    if not isinstance(config, dict):
        raise RuntimeError("TimeService did not return a configuration object")
    if config.get("mode") != "simulated" or config.get("flowing") is not False:
        raise RuntimeError(f"Failed to freeze simulated time: {config!r}")
    return config


async def realign_weather_library(env: Any) -> dict[str, Any]:
    """Align Weather's eagerly materialized snapshot with the frozen clock."""

    result = await env.page.evaluate(
        """() => {
            const sim = window.__SIM__;
            const clock = window.__SIM_TIME__;
            if (!sim?.getState || !sim?.setState || !clock) {
                throw new Error('simulator state or time API is unavailable');
            }

            const library = sim.getState()?.apps?.weather?.weatherLibrary;
            if (!library || typeof library !== 'object') {
                return { changed: false, reason: 'weatherLibrary unavailable' };
            }

            let anchor = null;
            for (const entry of Object.values(library)) {
                const value = entry?.bundle?.daily?.[0]?.fxDate;
                if (typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}/.test(value)) {
                    anchor = value.slice(0, 10);
                    break;
                }
            }
            if (!anchor) return { changed: false, reason: 'date anchor unavailable' };

            const now = clock.getDate();
            const target = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0'),
            ].join('-');
            const utcDay = (value) => {
                const [year, month, day] = value.split('-').map(Number);
                return Date.UTC(year, month - 1, day);
            };
            const offsetDays = Math.round((utcDay(target) - utcDay(anchor)) / 86400000);
            if (offsetDays === 0) {
                return { changed: false, anchor, target, offsetDays };
            }

            const datePattern = /^(\\d{4})-(\\d{2})-(\\d{2})(.*)$/;
            const shift = (value) => {
                if (typeof value === 'string') {
                    const match = datePattern.exec(value);
                    if (!match) return value;
                    const shifted = new Date(
                        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
                        + offsetDays * 86400000
                    );
                    return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}${match[4]}`;
                }
                if (Array.isArray(value)) return value.map(shift);
                if (value && typeof value === 'object') {
                    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shift(child)]));
                }
                return value;
            };

            sim.setState(
                { apps: { weather: { weatherLibrary: shift(library) } } },
                { deep: true, reload: false }
            );
            return { changed: true, anchor, target, offsetDays };
        }"""
    )
    if not isinstance(result, dict):
        raise RuntimeError("Weather realignment did not return a result object")
    return result


class FrozenTimeSetupMixin:
    """Mirror BaseTask.setup and verify the V4 boot-frozen clock after reset."""

    simulated_time = ""
    _go_home_after_v4_setup = False

    async def setup(self, env: Any, *, warm: bool = True):
        from bench_env.logger import get_logger

        logger = get_logger(__name__)
        sw = env.stopwatch
        sw.reset()

        with sw.phase("reset"):
            await env.reset(app_ids=self.apps or None)

        with sw.phase("freeze_time"):
            await freeze_simulated_time(env, self.simulated_time)

        if "weather" in self.apps:
            with sw.phase("realign_time_dependent_state"):
                await realign_weather_library(env)

        with sw.phase("warm"):
            if warm:
                if len(self.apps) > 1:
                    await env.warm_apps(self.apps)
                elif len(self.apps) == 1:
                    await env.open_app(self.apps[0], wait_stable=True)

        with sw.phase("prepare"):
            await self._prepare(env)

        skip_state_dependent = (
            self._instruction_override is not None
            or not getattr(env, "supports_state_injection", True)
        )

        with sw.phase("sample"):
            state = await env.get_state(required_apps=self.apps or None)
            self._env_state = state
            if not skip_state_dependent and self.sampler:
                result = self.sampler.sample(state, task=self)
                for key, value in result.params.items():
                    if key not in self._user_params:
                        self.params[key] = value
                for warning in result.warnings:
                    logger.warning(f"[{self.id}] {warning}")

        with sw.phase("post_sample"):
            if not skip_state_dependent:
                await self._post_sample(env)

        with sw.phase("init_obs"):
            if self._go_home_after_v4_setup:
                await env.go_home()
            obs = await env.get_observation()

        logger.info(f"[{self.id}] setup: {sw.summary()}")
        return obs
