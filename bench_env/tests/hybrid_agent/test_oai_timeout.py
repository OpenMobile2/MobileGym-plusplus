from __future__ import annotations

from types import SimpleNamespace

from bench_env.llm.openai_chat import LLMClient


def test_non_stream_request_uses_total_timeout_deadline():
    captured = {}

    def create(**kwargs):
        captured.update(kwargs)
        return {"choices": [{"message": {"content": "ok"}}]}

    client = object.__new__(LLMClient)
    client.model = "test-model"
    client.timeout_s = 600.0
    client.total_timeout_s = 300.0
    client.default_args = {}
    client._client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=create))
    )

    result = client.chat(messages=[{"role": "user", "content": "hello"}])

    assert result.content == "ok"
    assert 0 < captured["timeout"] <= 300.0
