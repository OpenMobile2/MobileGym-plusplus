"""Declarative records for Hybrid Tools V5."""

from __future__ import annotations

from dataclasses import dataclass

from bench_env.task.clocked.model import HybridV4Case


@dataclass(frozen=True)
class HybridV5Case(HybridV4Case):
    contract_severity: str = "OK"
    contract_repair: str = "Unchanged from V4."

    @property
    def class_name(self) -> str:
        return f"HTV5Case{self.index:02d}"

