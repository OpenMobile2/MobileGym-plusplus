"""Broadcast (播客) app state accessor."""

from __future__ import annotations

from typing import Any

from bench_env.task.base import BaseApp


class Broadcast(BaseApp):
    @property
    def saved_episode_ids(self) -> list[str]:
        value = self.get("savedEpisodeIds")
        if not isinstance(value, list):
            raise ValueError("broadcast.savedEpisodeIds is not a list")
        return [str(x) for x in value]

    def check_saved_count_increased(self, delta: int = 1) -> dict[str, Any]:
        before = len(self.init.saved_episode_ids)
        after = len(self.saved_episode_ids)
        return {
            "field": "broadcast.savedEpisodeIds.length",
            "expected": before + delta,
            "actual": after,
            "passed": after == before + delta,
        }
