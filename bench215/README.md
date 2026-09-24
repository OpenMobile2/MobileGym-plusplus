# Bench

215 tasks with programmatic checkers. Suite directories:

- `compose`, `flow`, `social`, `additional`, `continued`
- `workflows`, `services`, `native`, `crossapp`

Run from the repository root after the simulator is up:

```bash
zsh bench215/run.sh \
  --mode hybrid \
  --env-url http://127.0.0.1:4173 \
  --model-base-url http://HOST:PORT/v1 \
  --model-name YourModel \
  --model-api-key "$OPENAI_API_KEY" \
  --output-dir runs/bench-hybrid
```

Use `--mode gui_only` for the GUI-only setting. Both modes share the same tasks and checkers.
