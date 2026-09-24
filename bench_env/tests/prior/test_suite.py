from __future__ import annotations

import copy
import json
import datetime
import re
from dataclasses import replace
from pathlib import Path

from bench_env.task.alipay.app import Alipay
from bench_env.env.base import Observation
from bench_env.hybrid_benchmark.runner import HybridBenchmarkConfig, _configured_env_url
from bench_env.task.prior.contracts import (
    PANTRY_TARGETS,
    _contains_equivalent_number,
    _contains_busy_statement,
    _contains_running_invitation,
    _extract_date_isos,
    _is_high_speed_order,
    _number_near_label,
    address_matches,
    canonical_spotify_artist,
    entity_contains,
    normalized_address,
    percentage_matches,
    temperature_matches,
    text_contains_date,
    text_contains_month,
    text_contains_time,
    weather_text_matches,
)
from bench_env.task.prior.specs import (
    CASES,
    INSTRUCTION_OVERRIDES,
    P1_CASES,
    P2_CASES,
    REPAIRED_CASES,
    SEMANTIC_REPAIR_CASES,
    SIMULATED_TIME,
)
from bench_env.task.prior.tasks import RUNTIME_CASES
from bench_env.task.judge import JudgeInput
from bench_env.task.map.app import Map
from bench_env.task.redbook.app import Redbook
from bench_env.task.registry import TaskRegistry
from bench_env.task.weather.app import Weather
from bench_env.task.wechat.app import Wechat
from bench_env.tests.weather.test_tasks import BASE_STATE as WEATHER_BASE_STATE
from bench_env.tests.alipay.test_tasks import BASE_STATE as ALIPAY_BASE_STATE
from bench_env.tests.redbook.test_tasks import BASE_STATE as REDBOOK_BASE_STATE


def _task(index: int):
    return TaskRegistry().create_task(f"prior.HTV5Case{index:02d}")


def _judge(initial_apps, final_apps, *, os_state=None):
    os_value = os_state or {}
    return JudgeInput(
        init_obs=Observation(state={"apps": initial_apps, "os": os_value}),
        last_obs=Observation(state={"apps": final_apps, "os": os_value}),
    )


def _judge_sms(initial_sms, final_sms):
    initial_os = {
        "providers": {
            "sms": initial_sms,
            "contacts": {"contacts": []},
        }
    }
    final_os = {
        "providers": {
            "sms": final_sms,
            "contacts": {"contacts": []},
        }
    }
    return JudgeInput(
        init_obs=Observation(state={"apps": {}, "os": initial_os}),
        last_obs=Observation(state={"apps": {}, "os": final_os}),
    )


def _wechat(contact_id: str, messages=None):
    return {
        "user": {"wxid": "me"},
        "chats": [{"id": contact_id, "messages": list(messages or [])}],
    }


def _outgoing(message_id: str, content: str):
    return {"id": message_id, "senderId": "me", "type": "text", "content": content}


def _named_wechat_message(contact_name: str, content: str):
    path = Path(__file__).resolve().parents[3] / "apps" / "Wechat" / "data" / "defaults.json"
    initial = json.loads(path.read_text(encoding="utf-8"))
    current = copy.deepcopy(initial)
    wechat = Wechat(current)
    wxid = wechat.require_contact_wxid(contact_name)
    chat = next((item for item in current["chats"] if str(item.get("id")) == wxid), None)
    if chat is None:
        contact = wechat.contact_by_name(contact_name)
        chat = {
            "id": wxid,
            "user": {"wxid": wxid, "name": contact["name"], "avatar": contact.get("avatar", "")},
            "messages": [],
        }
        current["chats"].insert(0, chat)
    chat["messages"].append({
        "id": "v5-new-message",
        "senderId": current["user"]["wxid"],
        "type": "text",
        "content": content,
        "timestamp": 1783818000000,
    })
    return initial, current


def test_v5_materializes_the_same_76_case_ids_and_only_audited_cases_change():
    registry = TaskRegistry()
    names = registry.list_tasks("prior")
    assert len(names) == len(CASES) == len(RUNTIME_CASES) == 76
    assert P1_CASES == {3, 9, 14, 17, 21, 22, 25, 36, 40, 41, 47, 73, 74, 75}
    assert P2_CASES == {2, 5, 6, 7, 15, 23, 32, 38, 42, 44, 46, 53, 63}
    assert SEMANTIC_REPAIR_CASES == {
        1, 8, 9, 10, 15, 16, 18, 23, 24, 29,
        30, 33, 34, 37, 40, 51, 57, 70, 72, 73, 75,
    }
    assert len(REPAIRED_CASES) == 42
    assert {case.index for case in CASES if case.revision == "contract_repaired"} == REPAIRED_CASES
    assert set(INSTRUCTION_OVERRIDES) <= REPAIRED_CASES

    for index in range(1, 77):
        v4 = registry.create_task(f"clocked.HTV4Case{index:02d}")
        v5 = registry.create_task(f"prior.HTV5Case{index:02d}")
        assert v4.__class__ in v5.__class__.__mro__
        assert v5.apps == v4.apps
        assert v5.candidate_tools == v4.candidate_tools
        if index not in REPAIRED_CASES:
            assert v5.description == v4.description
            assert v5.spec.goals == v4.spec.goals


def test_instruction_clarifications_match_the_reviewed_contracts():
    assert "包含这两条笔记的标题" in _task(15).description
    assert "包含完整商品标题" in _task(16).description
    assert "把博主昵称发给陈静" in _task(18).description


def test_case_57_accepts_copy_then_delete_but_rejects_wrong_file_payload():
    task = _task(57)

    def node(
        node_id, name, kind, parent_id, path, *, size=0, mime_type=None
    ):
        value = {
            "id": node_id,
            "name": name,
            "type": kind,
            "parentId": parent_id,
            "path": path,
            "size": size,
        }
        if mime_type is not None:
            value["mimeType"] = mime_type
        return value

    source_dir = node(
        "source-dir", "待提交", "directory", "download", task.source_dir
    )
    archive_dir = node(
        "archive-dir", "archive", "directory", "source-dir",
        f"{task.source_dir}/archive",
    )
    target_sources = [
        node(
            "source-pdf", "供应商盖章确认.pdf", "file", "source-dir",
            f"{task.source_dir}/供应商盖章确认.pdf",
            size=48, mime_type="application/pdf",
        ),
        node(
            "source-image", "流水截图_A.png", "file", "source-dir",
            f"{task.source_dir}/流水截图_A.png",
            size=47, mime_type="image/png",
        ),
    ]
    preserved = []
    for index, path in enumerate(task.preserve_paths):
        preserved.append(node(
            f"preserved-{index}", path.rsplit("/", 1)[-1], "file",
            "archive-dir" if "/archive/" in path else "source-dir", path,
            size=100 + index, mime_type="application/octet-stream",
        ))
    initial_nodes = [source_dir, archive_dir, *target_sources, *preserved]
    target_dir = node(
        "target-dir", "submission", "directory", "documents", task.target_dir
    )
    copied_targets = [
        node(
            "copied-pdf", "供应商盖章确认.pdf", "file", "target-dir",
            f"{task.target_dir}/供应商盖章确认.pdf",
            size=48, mime_type="application/pdf",
        ),
        node(
            "copied-image", "流水截图_A.png", "file", "target-dir",
            f"{task.target_dir}/流水截图_A.png",
            size=47, mime_type="image/png",
        ),
    ]
    current_nodes = [source_dir, archive_dir, target_dir, *copied_targets, *preserved]
    initial_wechat, current_wechat = _named_wechat_message(
        "Boss", "已提交供应商盖章确认.pdf和流水截图_A.png"
    )

    def judge(nodes):
        return JudgeInput(
            init_obs=Observation(state={
                "apps": {"wechat": initial_wechat},
                "os": {"fileSystem": {"nodes": initial_nodes}},
            }),
            last_obs=Observation(state={
                "apps": {"wechat": current_wechat},
                "os": {"fileSystem": {"nodes": nodes}},
            }),
        )

    checks = task.check_goals(judge(current_nodes))
    assert all(check["passed"] for check in checks), checks

    wrong_payload = copy.deepcopy(current_nodes)
    next(
        item for item in wrong_payload
        if item["path"].endswith("/流水截图_A.png")
    )["size"] = 999
    checks = task.check_goals(judge(wrong_payload))
    relocation = next(
        check for check in checks
        if check["field"] == "file_system.requested_files_moved"
    )
    assert not relocation["passed"]


def test_cases_01_08_and_10_accept_reviewed_free_text_formats():
    alipay = Alipay(ALIPAY_BASE_STATE)

    case01 = _task(1)
    transaction = alipay.largest_expense()
    target = str(transaction["targetAccount"])
    amount = abs(float(transaction["delta"]))
    notes_initial = {"notes": []}
    notes_final = {"notes": [{
        "id": "new-note", "title": "开支提醒",
        "content": f"这是一笔转账，对方是{target}，金额{amount:g}元。",
        "createdAt": 2, "updatedAt": 2,
    }]}
    checks = case01.check_goals(_judge(
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "notes": notes_initial},
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "notes": notes_final},
    ))
    assert all(check["passed"] for check in checks), checks

    case08 = _task(8)
    expense1 = alipay.monthly_expense("2026-01")
    expense2 = alipay.monthly_expense("2025-12")
    difference = abs(expense1 - expense2)
    winner = "2026/01" if expense1 > expense2 else "2025/12"
    month_note = {"notes": [{
        "id": "month-note", "title": "月度花销对比",
        "content": f"两个月花销为{expense1:g}和{expense2:g}，{winner}更多，差{difference:g}。",
        "createdAt": 3, "updatedAt": 3,
    }]}
    checks = case08.check_goals(_judge(
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "notes": notes_initial},
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "notes": month_note},
    ))
    assert all(check["passed"] for check in checks), checks

    case10 = _task(10)
    os_state = {"time": {"timestamp": 1783818000000}}
    count, spending = alipay.bill_type_year_summary(
        "订单", 2026, until_ms=os_state["time"]["timestamp"]
    )
    initial_wechat, current_wechat = _named_wechat_message(
        "陈静", f"今年一共{count}笔，共花{spending:g}元。"
    )
    checks = case10.check_goals(_judge(
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": initial_wechat},
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": current_wechat},
        os_state=os_state,
    ))
    assert all(check["passed"] for check in checks), checks


def test_case_29_accepts_equivalent_expanded_author_statistics():
    task = _task(29)
    redbook = Redbook(REDBOOK_BASE_STATE)
    top_note = redbook.most_liked_search_note("旅行")
    author = redbook.note_author(top_note)
    top_collected = redbook.user_max_collected_note(str(author["name"]))
    expected_stats = str(author["likesAndCollections"])
    stats_number = re.search(r"\d+(?:\.\d+)?", expected_stats)
    assert stats_number is not None
    expanded = float(stats_number.group(0)) * (10000 if "万" in expected_stats else 1)
    initial_wechat, current_wechat = _named_wechat_message(
        "陈静",
        f"{top_collected['title']}，作者{author['name']}，获赞与收藏数{expanded:g}。",
    )
    checks = task.check_goals(_judge(
        {"redbook": copy.deepcopy(REDBOOK_BASE_STATE), "wechat": initial_wechat},
        {"redbook": copy.deepcopy(REDBOOK_BASE_STATE), "wechat": current_wechat},
    ))
    assert all(check["passed"] for check in checks), checks


def test_v5_runner_bootstraps_the_same_frozen_clock_without_changing_v3():
    base = HybridBenchmarkConfig(
        env_url="http://127.0.0.1:4181/#screen",
        model_base_url="https://example.invalid/v1",
        model_name="test",
        suite="prior",
    )
    configured = _configured_env_url(base)
    assert "mobilegym_simulated_time=2026-07-12+09%3A00%3A00" in configured
    assert "mobilegym_time_flowing=false" in configured
    assert configured.endswith("#screen")
    assert _configured_env_url(replace(base, suite="drafts")) == base.env_url
    assert {case.simulated_time for case in RUNTIME_CASES} == {SIMULATED_TIME}


def test_case_47_is_pinned_to_july_14_independently_of_host_date():
    assert _task(47).params["date"] == "2026-07-14"
    assert TaskRegistry().create_task("clocked.HTV4Case47").description == _task(47).description


def test_product_entity_matching_accepts_spacing_but_not_another_product():
    expected = "Apple 电脑 电子产品 61"
    assert entity_contains("Apple电脑电子产品61\n价格 1200", expected)
    assert entity_contains("Apple-电脑（电子产品）61", expected)
    assert not entity_contains("Apple 电脑 电子产品 62", expected)


def test_top3_pair_matching_rejects_amount_only_and_swapped_amounts():
    labels = ["南京饭店", "餐饮消费"]
    assert _number_near_label("南京饭店 286.50元", labels, 286.5)
    assert _number_near_label("南京饭店\n金额：286.50元", labels, 286.5)
    assert _number_near_label("南京饭店，金额：286.50元", labels, 286.5)
    assert not _number_near_label("南京饭店 99元；另一笔 286.50元", labels, 286.5)
    assert not _number_near_label("共支出286.50元", labels, 286.5)
    assert not _number_near_label("南京饭店 99元，另一笔 286.50元", labels, 286.5)

    actual_message = (
        "转账-浩杰(李浩杰) 520\n"
        "转账-正中(刘沐辰) 200\n"
        "美团 168\n"
        "我最近得省着点了"
    )
    assert _number_near_label(actual_message, ["美团", "美团外卖-海底捞火锅"], 168)
    assert not _number_near_label(actual_message, ["美团", "美团外卖-海底捞火锅"], 200)


def test_date_matcher_requires_a_complete_calendar_date():
    assert text_contains_date("原截止日期是2026年8月20日", "2026-08-20")
    assert text_contains_date("准备日期：8月13日", "2026-08-13")
    assert text_contains_date("准备日期 2026-11-01", "2026-11-01")
    assert not text_contains_date("11月10日", "2026-11-01")
    assert not text_contains_date("月份11，日期1", "2026-11-01")
    assert text_contains_date("准备日期为11月1日", "2026-11-01")
    assert not text_contains_date(
        "准备日期为11月1日", "2026-11-01", require_year=True
    )
    assert text_contains_date("原截止日期是八月二十号", "2026-08-20")
    assert text_contains_date(
        "准备日期为二零二六年十一月一号",
        "2026-11-01",
        require_year=True,
    )
    assert text_contains_date(
        "准备日期为二〇二六年十一月一日",
        "2026-11-01",
        require_year=True,
    )


def test_case_40_date_extraction_supports_natural_lists_but_rejects_extra_dates():
    reference = datetime.date(2026, 7, 12)
    assert _extract_date_isos(
        "适合出行的日子：明天、7月15日、16日", reference_date=reference
    ) == {"2026-07-13", "2026-07-15", "2026-07-16"}
    assert _extract_date_isos(
        "7月13日、15日、16日、18日", reference_date=reference
    ) == {"2026-07-13", "2026-07-15", "2026-07-16", "2026-07-18"}
    assert _extract_date_isos(
        "周一、星期三、七月十六号", reference_date=reference
    ) == {"2026-07-13", "2026-07-15", "2026-07-16"}


def test_semantic_number_month_time_weather_and_temperature_helpers():
    assert percentage_matches("推荐值 98%", "98.0%")
    assert not percentage_matches("《1998年的故事》", "98.0%")
    assert _contains_equivalent_number("获赞与收藏 12000", "1.2万", tolerance=0.5)
    assert _contains_equivalent_number("获赞与收藏 1.2万", 12000, tolerance=0.5)
    assert not _contains_equivalent_number("获赞与收藏 1.3万", 12000, tolerance=0.5)
    assert text_contains_month("2026/01 花得更多", "2026-01")
    assert text_contains_month("1月花得更多", "2026-01")
    assert not text_contains_month("12月花得更多", "2026-01")
    assert text_contains_time("截止下午六点，下午五点五十分提醒", "18:00")
    assert text_contains_time("截止下午六点，下午五点五十分提醒", "17:50")
    assert not text_contains_time("截止下午六点，下午五点四十分提醒", "17:50")
    assert weather_text_matches("目前天气晴朗", "Clear")
    assert weather_text_matches("今天多云", "Cloudy")
    assert weather_text_matches("当前天气：霾，温度：20℃", "霾")
    assert weather_text_matches("当前天气：雾霾，温度：20℃", "Haze")
    assert not weather_text_matches("今天有雨", "Clear")
    assert temperature_matches("当前温度29℃，地址东长安街16号", 29)
    assert not temperature_matches("地址东长安街16号", 16)
    assert _contains_busy_statement("03:30已经有安排了")
    assert _contains_busy_statement("那个时间没空")
    assert _contains_busy_statement("该时段无法安排")
    assert not _contains_busy_statement("03:30没有安排，可以开会")


def test_case_41_reads_high_speed_semantics_from_order_train_number():
    assert _is_high_speed_order({"trainNo": "G101"})
    assert _is_high_speed_order({"trainNo": "g101"})
    assert not _is_high_speed_order({"trainNo": "D101"})
    assert not _is_high_speed_order(None)


def test_case_46_requires_invitation_semantics_not_the_word_running_alone():
    assert _contains_running_invitation("7月13日多云，要不要一起跑步？")
    assert _contains_running_invitation("天气不错，约你跑个步")
    assert not _contains_running_invitation("7月13日天气多云，适合跑步")


def test_case_38_normalizes_only_known_artist_aliases():
    assert canonical_spotify_artist("周杰倫") == canonical_spotify_artist("周杰伦")
    assert canonical_spotify_artist("Jay Chou") == canonical_spotify_artist("周杰伦")
    assert canonical_spotify_artist("林俊傑") == canonical_spotify_artist("林俊杰")
    assert canonical_spotify_artist("JJ Lin") == canonical_spotify_artist("林俊杰")
    assert canonical_spotify_artist("王力宏") != canonical_spotify_artist("周杰伦")


def test_case_38_verifier_accepts_traditional_aliases_but_rejects_extra_tracks():
    task = _task(38)
    tracks = [
        {"id": "jay-1", "title": "晴天", "artist": "周杰倫"},
        {"id": "jay-2", "title": "稻香", "artist": "Jay Chou"},
        {"id": "jj-1", "title": "江南", "artist": "林俊傑"},
        {"id": "jj-2", "title": "修炼爱情", "artist": "JJ Lin"},
    ]
    spotify = {
        "searchHistory": [{"query": "周杰伦"}, {"query": "林俊杰"}],
        "customPlaylists": [{"title": "双艺人精选", "tracks": tracks}],
        "currentTrack": tracks[0],
        "isPlaying": True,
    }
    checks = task.check_goals(_judge({"spotify": {}}, {"spotify": spotify}))
    assert all(check["passed"] for check in checks), checks

    with_extra = copy.deepcopy(spotify)
    with_extra["customPlaylists"][0]["tracks"].append(
        {"id": "other-1", "title": "唯一", "artist": "王力宏"}
    )
    checks = task.check_goals(_judge({"spotify": {}}, {"spotify": with_extra}))
    exact = next(check for check in checks if check["field"] == "playlist_exact_artist_multiset")
    assert not exact["passed"]


def test_case_44_address_normalization_preserves_place_identity():
    expected = "北京市海淀区上地西路27号"
    formatted = "中国北京 市 海淀区，上地西路 27 号，邮政编码: 100085"
    wrong_place = "中国北京市海淀区五道口成府路华清嘉园 邮政编码: 100190"
    assert normalized_address(expected) in normalized_address(formatted)
    assert normalized_address(expected) not in normalized_address(wrong_place)
    assert address_matches("地址：上地西路27号", expected)
    assert not address_matches("地址：五道口成府路华清嘉园", expected)


def test_address_matching_retains_front_gate_and_street_identity():
    expected = "北京市东城区前门东长安街16号"
    assert address_matches("中国北京 市 东城区，前门东长安街 16 号，邮编100051", expected)
    assert address_matches("地址是前门东长安街16号", expected)
    assert not address_matches("地址是景山前街4号", expected)


def test_cases_33_and_34_accept_address_formatting_without_accepting_wrong_places():
    case33 = _task(33)
    best = Map.best_rated_from_results(
        Map.geo_search("咖啡馆", limit=0), max_distance_meters=2000
    )
    initial_wechat, current_wechat = _named_wechat_message(
        "陈静",
        f"{best['name']}，评分5.0，地址是五道口中关村东路 68 号，邮编100190。",
    )
    checks = case33.check_goals(_judge(
        {"wechat": initial_wechat}, {"wechat": current_wechat}
    ))
    assert all(check["passed"] for check in checks), checks

    _, wrong_wechat = _named_wechat_message(
        "陈静", f"{best['name']}，评分5，地址是上地西路27号。"
    )
    checks = case33.check_goals(_judge(
        {"wechat": initial_wechat}, {"wechat": wrong_wechat}
    ))
    assert not checks[0]["passed"]

    case34 = _task(34)
    initial_wechat, current_wechat = _named_wechat_message(
        "陈静", "故宫地址是景山前街4号。"
    )
    checks = case34.check_goals(_judge(
        {"wechat": initial_wechat}, {"wechat": current_wechat}
    ))
    assert all(check["passed"] for check in checks), checks


def test_case_37_keeps_address_weather_and_temperature_in_one_candidate_contract():
    task = _task(37)
    place = Map.resolve_places("中国国家博物馆")[0]
    weather = Weather(WEATHER_BASE_STATE)
    address = Map.extract_address(place)
    expected_weather = weather.current_weather_text(address)
    expected_temp = weather.current_temp(address)
    initial_wechat, current_wechat = _named_wechat_message(
        "陈静",
        f"地址：前门东长安街16号；天气晴朗；当前温度{expected_temp:g}℃。",
    )
    checks = task.check_goals(_judge(
        {"wechat": initial_wechat, "weather": copy.deepcopy(WEATHER_BASE_STATE)},
        {"wechat": current_wechat, "weather": copy.deepcopy(WEATHER_BASE_STATE)},
    ))
    assert all(check["passed"] for check in checks), (expected_weather, checks)

    _, wrong_wechat = _named_wechat_message(
        "陈静", f"地址：景山前街4号；天气晴朗；当前温度{expected_temp:g}℃。"
    )
    checks = task.check_goals(_judge(
        {"wechat": initial_wechat, "weather": copy.deepcopy(WEATHER_BASE_STATE)},
        {"wechat": wrong_wechat, "weather": copy.deepcopy(WEATHER_BASE_STATE)},
    ))
    assert not checks[0]["passed"]


def test_case_44_verifier_accepts_address_formatting_but_rejects_wrong_place():
    task = _task(44)
    initial_sms = {
        "conversations": [{"id": "sms-zhangsan", "sender": "张三"}],
        "messagesByConversationId": {"sms-zhangsan": []},
    }

    def final_sms(content: str):
        return {
            "conversations": [{"id": "sms-zhangsan", "sender": "张三"}],
            "messagesByConversationId": {
                "sms-zhangsan": [{
                    "id": "new-message",
                    "isOutgoing": True,
                    "content": content,
                }]
            },
        }

    formatted = "最近的是中国北京 市 海淀区，上地西路 27 号，邮政编码: 100085"
    checks = task.check_goals(_judge_sms(initial_sms, final_sms(formatted)))
    assert all(check["passed"] for check in checks), checks

    wrong_place = "中国北京市海淀区五道口成府路华清嘉园 邮政编码: 100190"
    checks = task.check_goals(_judge_sms(initial_sms, final_sms(wrong_place)))
    assert not checks[0]["passed"]


def test_case_73_accepts_both_dates_without_hidden_title_and_rejects_one_date():
    task = _task(73)
    event = {
        "id": "new_event",
        "title": "Contract renewal",
        "startTs": 1786550400000,
        "allDay": True,
        "alarmEnabled": False,
        "description": "",
    }
    initial = {
        "calendar": {"events": []},
        "wechat": _wechat("ht_mia"),
    }
    final = {
        "calendar": {"events": [event]},
        "wechat": _wechat("ht_mia", [_outgoing("m1", "原截止日期是8月20日，准备日期是8月13日")]),
    }
    checks = task.check_goals(_judge(initial, final))
    assert all(check["passed"] for check in checks), checks

    final["wechat"] = _wechat("ht_mia", [_outgoing("m2", "准备日期是8月13日")])
    checks = task.check_goals(_judge(initial, final))
    assert checks[0]["passed"] and not checks[1]["passed"]


def test_case_74_requires_the_exact_cart_delta_and_preserves_checkout_and_orders():
    task = _task(74)
    initial_tbsg = {
        "cart": [{"id": "old", "itemId": "existing", "skuDesc": None, "qty": 1}],
        "orders": [{"id": "order-1"}],
        "checkoutDraft": None,
    }
    final_tbsg = copy.deepcopy(initial_tbsg)
    final_tbsg["cart"].extend(
        {"id": f"new-{index}", "itemId": item_id, "skuDesc": None, "qty": 1}
        for index, item_id in enumerate(sorted(PANTRY_TARGETS))
    )
    checks = task.check_goals(_judge({"tbsg": initial_tbsg}, {"tbsg": final_tbsg}))
    assert all(check["passed"] for check in checks), checks
    json.dumps(checks, ensure_ascii=False)

    too_many = copy.deepcopy(final_tbsg)
    too_many["cart"][-1]["qty"] = 2
    checks = task.check_goals(_judge({"tbsg": initial_tbsg}, {"tbsg": too_many}))
    assert not checks[0]["passed"]

    extra = copy.deepcopy(final_tbsg)
    extra["cart"].append({"id": "extra", "itemId": "not-listed", "skuDesc": None, "qty": 1})
    checks = task.check_goals(_judge({"tbsg": initial_tbsg}, {"tbsg": extra}))
    assert not checks[0]["passed"]

    checkout = copy.deepcopy(final_tbsg)
    checkout["checkoutDraft"] = {"draftOrderId": "draft"}
    checks = task.check_goals(_judge({"tbsg": initial_tbsg}, {"tbsg": checkout}))
    assert not checks[2]["passed"]


def test_case_75_accepts_natural_exact_date_and_rejects_wrong_november_date():
    task = _task(75)
    event = {
        "id": "new_event",
        "title": "准备 Mia 生日礼物",
        "startTs": 1793530800000,
        "endTs": 1793532600000,
        "reminderMinutesBefore": 1440,
        "alarmEnabled": True,
        "allDay": False,
        "description": "",
    }
    initial = {"calendar": {"events": []}, "wechat": _wechat("ht_alice")}
    final = {
        "calendar": {"events": [event]},
        "wechat": _wechat("ht_alice", [_outgoing("m1", "准备日期为2026年11月1日")]),
    }
    checks = task.check_goals(_judge(initial, final))
    assert all(check["passed"] for check in checks), checks

    final["wechat"] = _wechat("ht_alice", [_outgoing("m2", "准备日期为11月11日")])
    checks = task.check_goals(_judge(initial, final))
    assert checks[0]["passed"] and not checks[1]["passed"]

    final["wechat"] = _wechat("ht_alice", [_outgoing("m3", "准备日期为11月1日")])
    checks = task.check_goals(_judge(initial, final))
    assert checks[0]["passed"] and not checks[1]["passed"]


def test_case_70_requires_quantity_one_and_the_default_sku():
    task = _task(70)
    path = Path(__file__).resolve().parents[3] / "apps" / "Taobao" / "data" / "defaults.json"
    initial_taobao = json.loads(path.read_text(encoding="utf-8"))
    final_taobao = copy.deepcopy(initial_taobao)
    final_taobao["searchHistory"].append("清风山")
    source = next(
        order
        for order in final_taobao["orders"]
        if any(line.get("itemId") == "i_handcream" for line in order.get("lines") or [])
    )
    order = copy.deepcopy(source)
    order.update({"id": "new-paid", "status": "pendingShip", "paidAt": 1780000000000})
    final_taobao["orders"].append(order)

    checks = task.check_goals(_judge(
        {"taobao": initial_taobao}, {"taobao": final_taobao}
    ))
    assert all(check["passed"] for check in checks), checks

    wrong_qty = copy.deepcopy(final_taobao)
    wrong_qty["orders"][-1]["lines"][0]["qty"] = 2
    checks = task.check_goals(_judge(
        {"taobao": initial_taobao}, {"taobao": wrong_qty}
    ))
    assert checks[0]["passed"] and not checks[1]["passed"]

    wrong_sku = copy.deepcopy(final_taobao)
    wrong_sku["orders"][-1]["lines"][0]["skuDesc"] = "香味:青柑;规格:75mL 单支"
    checks = task.check_goals(_judge(
        {"taobao": initial_taobao}, {"taobao": wrong_sku}
    ))
    assert checks[0]["passed"] and not checks[1]["passed"]


def test_case_72_accepts_semantic_note_times_but_keeps_alarm_and_version_strict():
    task = _task(72)
    initial = {"clock": {"alarms": []}, "notes": {"notes": []}}
    final = {
        "clock": {"alarms": [{
            "id": "new-alarm", "hour": 17, "minute": 50,
            "enabled": True, "repeat": "once",
        }]},
        "notes": {"notes": [{
            "id": "new-note", "title": "发布通知准备",
            "content": "候选版本 RC-204，截止下午六点，下午五点五十分提醒。",
        }]},
    }
    checks = task.check_goals(_judge(initial, final))
    assert all(check["passed"] for check in checks), checks

    wrong_version = copy.deepcopy(final)
    wrong_version["notes"]["notes"][0]["content"] = "候选版本 RC-205，截止下午六点，下午五点五十分提醒。"
    checks = task.check_goals(_judge(initial, wrong_version))
    assert checks[0]["passed"] and not checks[1]["passed"]
