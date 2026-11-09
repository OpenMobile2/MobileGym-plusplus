from bench_env.env.mobile_gym import MobileGymEnv, resolve_app_name_from_map


def test_resolve_app_name_ignores_case_and_spaces():
    name_map = MobileGymEnv.APP_NAME_MAP
    known = MobileGymEnv._KNOWN_APP_IDS

    assert resolve_app_name_from_map(name_map, known, "WECHAT") == "wechat"
    assert resolve_app_name_from_map(name_map, known, "qq music") == "qqmusic"
    assert resolve_app_name_from_map(name_map, known, "File Manager") == "file_manager"
    assert resolve_app_name_from_map(name_map, known, "file-manager") == "file_manager"
    assert resolve_app_name_from_map(name_map, known, "Days Matter") == "daysmatter"
    assert resolve_app_name_from_map(name_map, known, "calendar") == "calendar"


def test_resolve_app_name_does_not_collapse_taobao_into_flash_sale():
    name_map = MobileGymEnv.APP_NAME_MAP
    known = MobileGymEnv._KNOWN_APP_IDS

    assert resolve_app_name_from_map(name_map, known, "淘宝") == "taobao"
    assert resolve_app_name_from_map(name_map, known, "淘宝闪购") == "tbsg"
    assert resolve_app_name_from_map(name_map, known, "美团") is None
    assert resolve_app_name_from_map(name_map, known, "meituan") is None
    assert resolve_app_name_from_map(name_map, known, "") is None
