from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from bench_env.env.base import Observation
from bench_env.hybrid_benchmark.runner import HybridBenchmarkConfig, _configured_env_url
from bench_env.task.native.specs import CASES, EXCLUDED_CASES, REPAIRED_CASES
from bench_env.task.native.tasks import RUNTIME_CASES
from bench_env.task.judge import JudgeInput
from bench_env.task.registry import TaskRegistry
from bench_env.task.wechat.app import Wechat
from bench_env.tests.alipay.test_tasks import BASE_STATE as ALIPAY_BASE_STATE


def _task(index: int):
    return TaskRegistry().create_task(f"native.HTV6Case{index:02d}")


def _wechat_with_message(contact_name: str, content: str):
    path = Path(__file__).resolve().parents[3] / "apps" / "Wechat" / "data" / "defaults.json"
    initial = json.loads(path.read_text(encoding="utf-8"))
    current = copy.deepcopy(initial)
    wechat = Wechat(current)
    wxid = wechat.require_contact_wxid(contact_name)
    chat = next(
        (item for item in current["chats"] if str(item.get("id")) == wxid),
        None,
    )
    if chat is None:
        contact = wechat.contact_by_name(contact_name)
        chat = {
            "id": wxid,
            "user": {
                "wxid": wxid,
                "name": contact["name"],
                "avatar": contact.get("avatar", ""),
            },
            "messages": [],
        }
        current["chats"].insert(0, chat)
    chat["messages"].append({
        "id": "v6-new-message",
        "senderId": current["user"]["wxid"],
        "type": "text",
        "content": content,
        "timestamp": 1783818000000,
    })
    return initial, current


def _judge(apps_init, apps):
    os_state = {"time": {"timestamp": 1783818000000}}
    return JudgeInput(
        init_obs=Observation(state={"apps": apps_init, "os": os_state}),
        last_obs=Observation(state={"apps": apps, "os": os_state}),
    )


def test_v6_registers_75_stable_ids_without_case_45():
    registry = TaskRegistry()
    names = registry.list_tasks("native")
    assert len(names) == len(CASES) == len(RUNTIME_CASES) == 75
    assert EXCLUDED_CASES == {45}
    assert REPAIRED_CASES == {11, 20, 25, 33, 54}
    assert "HTV6Case45" not in names
    assert names == [
        f"HTV6Case{index:02d}"
        for index in range(1, 77)
        if index != 45
    ]

    for index in range(1, 77):
        if index == 45:
            continue
        v5 = registry.create_task(f"prior.HTV5Case{index:02d}")
        v6 = registry.create_task(f"native.HTV6Case{index:02d}")
        assert v5.__class__ in v6.__class__.__mro__
        if index == 25:
            assert v6.description != v5.description
            assert "今天在听的歌" in v6.description
            assert "现在在听的歌" not in v6.description
        else:
            assert v6.description == v5.description
        assert v6.apps == v5.apps
        assert v6.candidate_tools == v5.candidate_tools

    with pytest.raises(ValueError):
        registry.create_task("native.HTV6Case45")


@pytest.mark.parametrize("alias", ["正中(刘沐辰)", "正中", "刘沐辰"])
def test_case_11_accepts_each_counterparty_name_visible_in_alipay(alias: str):
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静", f"金额是2500元，交易对象是{alias}。"
    )
    checks = _task(11).check_goals(_judge(
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": initial_wechat},
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": current_wechat},
    ))
    assert checks and all(check["passed"] for check in checks)


def test_case_11_still_rejects_a_wrong_counterparty():
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静", "金额是2500元，交易对象是完全无关的人。"
    )
    checks = _task(11).check_goals(_judge(
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": initial_wechat},
        {"alipay": copy.deepcopy(ALIPAY_BASE_STATE), "wechat": current_wechat},
    ))
    assert checks[0]["passed"] is True
    assert checks[1]["passed"] is False


def _load_app_defaults(app_dir: str):
    path = Path(__file__).resolve().parents[3] / "apps" / app_dir / "data" / "defaults.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _wechat_with_moment(content: str):
    initial = _load_app_defaults("Wechat")
    current = copy.deepcopy(initial)
    current["moments"].insert(0, {
        "id": "v6-new-moment",
        "wxid": current["user"]["wxid"],
        "userName": current["user"]["name"],
        "userAvatar": current["user"].get("avatar", ""),
        "content": content,
        "timestamp": 1783818000000,
    })
    return initial, current


CASE25_LIKED_TRACKS = """Bad Habits - Ed Sheeran
bad guy - Billie Eilish
Welcome to New York - Taylor Swift
Love Story - Taylor Swift
Rolling In the Deep - Adele"""


def _case_25_checks(moment_content: str):
    initial_wechat, current_wechat = _wechat_with_moment(moment_content)
    reading = {
        "readingRecords": [
            {"date": "2026-07-12", "duration": 30},
            {"date": "2026-07-11", "duration": 172},
            {"date": "2026-07-10", "duration": 45},
            {"date": "2026-07-09", "duration": 18},
            {"date": "2026-07-08", "duration": 48},
            {"date": "2026-07-07", "duration": 226},
        ],
    }
    spotify = _load_app_defaults("Spotify")
    return _task(25).check_goals(_judge(
        {
            "wechat_reading": reading,
            "spotify": spotify,
            "wechat": initial_wechat,
        },
        {
            "wechat_reading": copy.deepcopy(reading),
            "spotify": copy.deepcopy(spotify),
            "wechat": current_wechat,
        },
    ))


def test_case_25_accepts_clarified_section_heading_and_exact_intersection():
    checks = _case_25_checks(
        "最近阅读最投入的一天：周二，226分钟。\n"
        f"今天在听的歌：\n{CASE25_LIKED_TRACKS}"
    )
    assert checks and all(check["passed"] for check in checks)


def test_case_25_rejects_the_replaced_v5_heading():
    checks = _case_25_checks(
        "最近阅读最投入的一天：周二，226分钟。\n"
        f"现在在听的歌：\n{CASE25_LIKED_TRACKS}"
    )
    by_field = {check["field"]: check for check in checks}
    assert by_field["moment_headings"]["passed"] is False
    assert by_field["moment_reading_day"]["passed"] is True
    assert by_field["moment_liked_tracks_exact"]["passed"] is True


def test_case_25_still_rejects_a_recent_but_unliked_track():
    checks = _case_25_checks(
        "最近阅读最投入的一天：周二，226分钟。\n"
        f"今天在听的歌：\n{CASE25_LIKED_TRACKS}\n搁浅 - 周杰伦"
    )
    by_field = {check["field"]: check for check in checks}
    assert by_field["moment_headings"]["passed"] is True
    assert by_field["moment_reading_day"]["passed"] is True
    assert by_field["moment_liked_tracks_exact"]["passed"] is False
    assert by_field["moment_liked_tracks_exact"]["actual"]["unliked_hits"] == ["搁浅"]


def _tencent_meeting_at_suite_time():
    state = _load_app_defaults("TencentMeeting")
    now = 1783818000000
    for index, meeting in enumerate(state["scheduledMeetings"]):
        meeting["startTime"] = now + (index + 2) * 60 * 60 * 1000
    return state


def test_case_20_accepts_complete_title_without_punctuation_or_emoji():
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静",
        "数分到底怎么啃啊有没有顺手的教材资料或者口碑好的线上课求姐妹们安利",
    )
    redbook = _load_app_defaults("RedBook")
    checks = _task(20).check_goals(_judge(
        {"redbook": redbook, "wechat": initial_wechat},
        {"redbook": copy.deepcopy(redbook), "wechat": current_wechat},
    ))
    assert checks[0]["passed"] is True


def test_case_20_still_rejects_a_generic_title_summary():
    initial_wechat, current_wechat = _wechat_with_message("陈静", "数据分析")
    redbook = _load_app_defaults("RedBook")
    checks = _task(20).check_goals(_judge(
        {"redbook": redbook, "wechat": initial_wechat},
        {"redbook": copy.deepcopy(redbook), "wechat": current_wechat},
    ))
    assert checks[0]["passed"] is False


@pytest.mark.parametrize(
    ("name", "address"),
    [
        (
            "雕刻时光咖啡馆（腾讯店）",
            "北京市海淀区CN 北京市 海淀区 知春路 49 49号希格玛大厦1层腾讯公司内(知春路地铁",
        ),
        ("潜渊咖啡馆", "北京市海淀区五道口中关村东路68号"),
    ],
)
def test_case_33_accepts_gui_indistinguishable_top_distance_ties(name, address):
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静", f"{name}，评分5.0，地址：{address}"
    )
    checks = _task(33).check_goals(_judge(
        {"wechat": initial_wechat},
        {"wechat": current_wechat},
    ))
    assert checks[0]["passed"] is True
    candidates = checks[0]["expected"]["any_gui_indistinguishable_best_candidate"]
    assert {candidate["name"] for candidate in candidates} == {
        "雕刻时光咖啡馆（腾讯店）",
        "潜渊咖啡馆",
    }
    assert {candidate["display_distance_meters"] for candidate in candidates} == {450.0}


def test_case_54_accepts_natural_exact_hour_expression():
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静", "我还有2小时44分钟到，会议11点开始"
    )
    tencent_meeting = _tencent_meeting_at_suite_time()
    map_state = _load_app_defaults("Map")
    checks = _task(54).check_goals(_judge(
        {
            "tencent_meeting": tencent_meeting,
            "map": map_state,
            "wechat": initial_wechat,
        },
        {
            "tencent_meeting": copy.deepcopy(tencent_meeting),
            "map": copy.deepcopy(map_state),
            "wechat": current_wechat,
        },
    ))
    assert checks[0]["passed"] is True


def test_case_54_rejects_a_different_minute_value():
    initial_wechat, current_wechat = _wechat_with_message(
        "陈静", "我还有2小时44分钟到，会议11点30分开始"
    )
    tencent_meeting = _tencent_meeting_at_suite_time()
    map_state = _load_app_defaults("Map")
    checks = _task(54).check_goals(_judge(
        {
            "tencent_meeting": tencent_meeting,
            "map": map_state,
            "wechat": initial_wechat,
        },
        {
            "tencent_meeting": copy.deepcopy(tencent_meeting),
            "map": copy.deepcopy(map_state),
            "wechat": current_wechat,
        },
    ))
    assert checks[0]["passed"] is False


def test_runner_bootstraps_v6_with_the_frozen_suite_time():
    config = HybridBenchmarkConfig(
        suite="native",
        env_url="http://127.0.0.1:4181",
        model_base_url="http://example.invalid/v1",
        model_name="test-model",
    )
    url = _configured_env_url(config)
    assert url.startswith("http://127.0.0.1:4181?")
    assert "mobilegym_simulated_time=" in url
