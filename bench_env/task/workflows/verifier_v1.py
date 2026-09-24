"""Strict semantic verifier contracts for the 0815 delivery suite.

An absent contract fails closed.  This module never treats agent COMPLETE,
trajectory existence, or a screenshot as semantic success.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Callable

from bench_env.task.judge import JudgeInput


CONTRACTS_PATH = Path(__file__).with_name("verifier_contracts_v1.json")
_SELECTOR = re.compile(r"^(?P<field>[^[]+)\[(?P<key>[^=]+)=(?P<value>[^]]+)\]$")


def load_contracts() -> dict[str, dict[str, Any]]:
    payload = json.loads(CONTRACTS_PATH.read_text(encoding="utf-8"))
    if payload.get("schema_version") != "1.0":
        raise ValueError("unsupported verifier contract schema")
    contracts = payload.get("contracts")
    if not isinstance(contracts, dict):
        raise ValueError("contracts must be an object")
    return contracts


def _resolve(root: Any, path: str) -> Any:
    current = root
    for part in path.split(".") if path else []:
        selector = _SELECTOR.match(part)
        if selector:
            if not isinstance(current, dict):
                return None
            rows = current.get(selector.group("field"))
            if not isinstance(rows, list):
                return None
            key, value = selector.group("key"), selector.group("value")
            current = next(
                (row for row in rows if isinstance(row, dict) and str(row.get(key)) == value),
                None,
            )
        elif isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list) and part.isdigit():
            index = int(part)
            current = current[index] if 0 <= index < len(current) else None
        else:
            return None
    return current


def _matches(actual: Any, expected: Any) -> bool:
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(
            key in actual and _matches(actual[key], value) for key, value in expected.items()
        )
    if isinstance(expected, list):
        return isinstance(actual, list) and all(
            any(_matches(candidate, wanted) for candidate in actual) for wanted in expected
        )
    return actual == expected


def _contains(actual: Any, expected: Any) -> bool:
    if isinstance(actual, str):
        return str(expected).casefold() in actual.casefold()
    if isinstance(actual, list):
        return any(_matches(candidate, expected) for candidate in actual)
    if isinstance(actual, dict) and isinstance(expected, dict):
        return _matches(actual, expected)
    return False


def _new_rows(actual: Any, initial: Any) -> list[Any] | None:
    """Return entities created during the task for list and id-keyed-map stores."""
    if isinstance(actual, list) and isinstance(initial, list):
        return [row for row in actual if row not in initial]
    if isinstance(actual, dict) and isinstance(initial, dict):
        return [row for key, row in actual.items() if key not in initial]
    return None


def _assertion_check(assertion: dict[str, Any], input: JudgeInput) -> dict[str, Any]:
    if assertion.get("op") == "any_of":
        options = assertion.get("expected") or assertion.get("assertions") or []
        checks = [_assertion_check(option, input) for option in options]
        passed = any(check["passed"] for check in checks)
        return {
            "field": assertion.get("field") or "any_of",
            "source": "any_of",
            "initial": None,
            "expected": [check.get("expected") for check in checks],
            "actual": [check.get("actual") for check in checks],
            "passed": bool(passed),
        }

    source = assertion.get("source", "apps")
    if source == "apps":
        initial_root, final_root = input.apps_init, input.apps
    elif source == "os":
        initial_root, final_root = input.os_init, input.os
    elif source == "route":
        initial_root, final_root = input.init_obs.route, input.route
    elif source == "answer":
        initial_root, final_root = None, input.answer or ""
    else:
        raise ValueError(f"unsupported assertion source: {source}")

    path = str(assertion.get("path") or "")
    initial = _resolve(initial_root, path) if initial_root is not None else None
    actual = _resolve(final_root, path) if path else final_root
    expected = assertion.get("expected")
    op = assertion.get("op", "eq")
    if op == "eq":
        passed = actual == expected
    elif op == "contains":
        passed = _contains(actual, expected)
    elif op == "not_contains":
        passed = not _contains(actual, expected)
    elif op == "absent":
        passed = actual is None
    elif op == "changed":
        passed = actual != initial
    elif op == "approx":
        tolerance = assertion.get("tolerance", 0)
        passed = (
            isinstance(actual, (int, float))
            and not isinstance(actual, bool)
            and isinstance(expected, (int, float))
            and not isinstance(expected, bool)
            and isinstance(tolerance, (int, float))
            and abs(actual - expected) <= tolerance
        )
    elif op == "nonempty":
        passed = isinstance(actual, (str, list, dict)) and len(actual) > 0
    elif op == "length_at_least":
        passed = isinstance(actual, (str, list, dict)) and len(actual) >= int(expected)
    elif op == "new_contains":
        new_rows = _new_rows(actual, initial)
        if new_rows is None:
            passed = False
        else:
            passed = any(_contains(row, expected) for row in new_rows)
    elif op == "new_contains_any":
        new_rows = _new_rows(actual, initial)
        passed = (
            new_rows is not None
            and isinstance(expected, list)
            and any(_contains(row, candidate) for row in new_rows for candidate in expected)
        )
    elif op == "new_contains_exactly_once":
        new_rows = _new_rows(actual, initial)
        if new_rows is None:
            passed = False
        else:
            passed = sum(1 for row in new_rows if _contains(row, expected)) == 1
    elif op == "new_contains_regex":
        # Match a newly created entity structurally, then validate one dynamic
        # text field and any required non-empty fields (for timestamped notes,
        # generated codes, etc.).
        new_rows = _new_rows(actual, initial)
        if new_rows is None or not isinstance(expected, dict):
            passed = False
        else:
            match = expected.get("match")
            field = str(expected.get("field") or "")
            pattern = str(expected.get("pattern") or "")
            nonempty_fields = expected.get("nonempty_fields") or []
            passed = any(
                isinstance(row, dict)
                and isinstance(match, dict)
                and _contains(row, match)
                and isinstance(row.get(field), str)
                and re.fullmatch(pattern, row[field]) is not None
                and all(
                    isinstance(row.get(name), (str, list, dict)) and len(row[name]) > 0
                    for name in nonempty_fields
                )
                for row in new_rows
            )
    elif op == "new_linked":
        # Verify a newly created entity and the referenced newly created parent.
        # This prevents two independent writes from passing a relationship task.
        new_rows = _new_rows(actual, initial)
        if new_rows is None or not isinstance(expected, dict):
            passed = False
        else:
            match = expected.get("match")
            reference_path = expected.get("reference_path")
            reference_field = expected.get("reference_field")
            reference_match = expected.get("reference_match")
            references = _resolve(final_root, str(reference_path or ""))
            initial_references = _resolve(initial_root, str(reference_path or ""))
            new_references = _new_rows(references, initial_references) or []
            passed = any(
                isinstance(row, dict)
                and isinstance(match, dict)
                and _contains(row, match)
                and any(
                    isinstance(ref, dict)
                    and ref.get("id") == row.get(reference_field)
                    and isinstance(reference_match, dict)
                    and _contains(ref, reference_match)
                    for ref in new_references
                )
                for row in new_rows
            )
    elif op == "references_new":
        # Verify that a final object points at an entity created during this task.
        if not isinstance(actual, dict) or not isinstance(expected, dict):
            passed = False
        else:
            reference_path = str(expected.get("reference_path") or "")
            reference_field = str(expected.get("reference_field") or "")
            reference_match = expected.get("reference_match")
            references = _resolve(final_root, reference_path)
            initial_references = _resolve(initial_root, reference_path)
            new_references = _new_rows(references, initial_references) or []
            passed = any(
                isinstance(row, dict)
                and actual.get(reference_field) == row.get("id")
                and isinstance(reference_match, dict)
                and _contains(row, reference_match)
                for row in new_references
            )
    else:
        raise ValueError(f"unsupported assertion op: {op}")

    if assertion.get("initial_must_differ", False):
        passed = passed and initial != expected
    return {
        "field": assertion.get("field") or f"{source}.{path}",
        "source": source,
        "initial": initial,
        "expected": expected if op != "absent" else "absent",
        "actual": actual,
        "passed": bool(passed),
    }


def evaluate_contract(task_id: str, input: JudgeInput) -> list[dict[str, Any]]:
    contract = load_contracts().get(task_id)
    if contract is None:
        return [{
            "field": "semantic_verifier_contract",
            "source": "contract_registry",
            "initial": None,
            "expected": f"reviewed verifier contract for {task_id}",
            "actual": "missing",
            "passed": False,
        }]
    if contract.get("review_status") != "passed":
        return [{
            "field": "semantic_verifier_review",
            "source": "contract_registry",
            "initial": None,
            "expected": "review_status=passed",
            "actual": contract.get("review_status", "missing"),
            "passed": False,
        }]
    assertions = contract.get("assertions")
    if not isinstance(assertions, list) or not assertions:
        raise ValueError(f"{task_id}: passed contract must have assertions")
    return [_assertion_check(assertion, input) for assertion in assertions]


def verifier_for(task_id: str) -> Callable[[JudgeInput], list[dict[str, Any]]]:
    def verify(input: JudgeInput) -> list[dict[str, Any]]:
        return evaluate_contract(task_id, input)
    return verify


def expected_changes_for(task_id: str) -> list[str]:
    contract = load_contracts().get(task_id) or {}
    values = contract.get("expected_changes") or []
    if not isinstance(values, list) or not all(isinstance(value, str) for value in values):
        raise ValueError(f"{task_id}: expected_changes must be a string list")
    return values
