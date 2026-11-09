from __future__ import annotations

from bench_env.env.app_aliases import (
    build_app_name_map,
    resolve_app_id,
)
from bench_env.env.mobile_gym import MobileGymEnv


def test_manifest_aliases_cover_0815_apps():
    mapping = build_app_name_map()
    assert mapping["BOSS直聘"] == "boss"
    assert mapping["闲鱼"] == "xianyu"
    assert mapping["菜鸟"] == "cainiao"
    assert mapping["淘宝闪购"] == "tbsg"
    assert mapping["Slack"] == "slack"
    assert mapping["猫眼"] == "maoyan"
    assert mapping["滴滴出行"] == "didi"
    assert mapping["大众点评"] == "dianping"
    assert mapping["卡皮记账"] == "kapi"
    assert mapping["卡皮总账本"] == "kapi"
    assert mapping["笔记"] == "notes"
    assert mapping["备忘录"] == "notes"


def test_resolve_app_id_is_case_insensitive():
    mapping = build_app_name_map()
    ids = frozenset(mapping.values())
    assert resolve_app_id("BOSS直聘", mapping, ids) == "boss"
    assert resolve_app_id("boss", mapping, ids) == "boss"
    assert resolve_app_id("slack", mapping, ids) == "slack"
    assert resolve_app_id("Days Matter", mapping, ids) == "daysmatter"
    assert resolve_app_id("小宇宙", mapping, ids) is None
    assert resolve_app_id("Nimbus Mail", mapping, ids) is None


def test_env_class_map_uses_manifests():
    assert MobileGymEnv.APP_NAME_MAP["BOSS直聘"] == "boss"
    assert "boss" in MobileGymEnv._KNOWN_APP_IDS
    assert MobileGymEnv.APP_NAME_MAP["笔记"] == "notes"
