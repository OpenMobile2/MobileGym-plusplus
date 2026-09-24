"""Declarative case record for Hybrid Tools V6."""

from __future__ import annotations

from dataclasses import dataclass

from bench_env.task.prior.model import HybridV5Case


@dataclass(frozen=True)
class HybridV6Case(HybridV5Case):
    """A stable-ID V6 case derived from an audited V5 contract."""

    @property
    def class_name(self) -> str:
        return f"HTV6Case{self.index:02d}"
