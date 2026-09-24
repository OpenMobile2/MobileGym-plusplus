"""Self-built-app Hybrid GUI+Tools task suite, App-Tool-quality probe #4 (2026-08-09).

Unlike v1-v3 (which mostly probed model capability), this suite's purpose is to
probe the **App Tool design itself** for the Broadcast (podcast) app — where the
tool surface is under-exercised or has real field-level gaps — using four lenses:

1. ``idinhand`` — the agent already holds a concrete show_id/episode_id from a
   non-search source (Following list / Saved episodes / Up Next queue, all only
   reachable via GUI browsing, not via ``search_shows``/``search_episodes``) and
   must call ``get_show_summary``/``get_episode_summary`` directly by ID to
   verify details, instead of re-searching by name. This is the exact "ID-in-hand"
   path that ``get_show_summary``/``get_episode_summary`` were designed for but
   which no prior task batch (104 runs) ever exercised.
2. ``state_direct`` — a filtered ``add_to_queue`` write task, graded purely by
   diffing ``broadcast.queueIds`` against the initial state; no Notes relay.
3. ``field_mismatch`` — real field-level gaps confirmed by reading
   ``app_tools/apps/broadcast/index.ts``: (a) a show's ``cadence`` is only a
   coarse update-rhythm label (e.g. "两周一更"), never an actual per-episode
   date, so "what's the actual latest/earliest episode" requires per-episode
   lookups the cadence label cannot answer; (b) a show's ``episode_count`` is a
   count, not a duration total, so "total runtime across all episodes" likewise
   requires per-episode lookups; (c) ``rating`` and ``ratingCount`` are adjacent,
   easily-transposed fields on the same object.
4. ``query_scan_mismatch`` — new full-catalog AND-filter tasks (distinct filter
   dimensions from ``an earlier draft``'s
   ``multiconstraint_03_broadcast_global_highrating_filter``, which used
   rating>=4.8 AND ratingCount>1000). ``search_shows``/``search_episodes``
   both require a non-empty ``query`` (see ``app_tools/core/errors.ts``
   ``requireString``), so a true "no named shortlist" full-catalog scan has no
   single-call shortcut and forces GUI browsing — tagged ``no_tool_gui_fallback``
   like its v2 sibling.

Every concrete title/rating/ratingCount/duration/date/id referenced below was
read directly out of ``apps/Broadcast/data/defaults.json`` (28 shows, 29
episodes) rather than recalled from memory.
"""
