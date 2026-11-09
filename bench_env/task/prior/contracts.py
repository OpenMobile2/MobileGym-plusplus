"""Task-local setup and verifier repairs for audited V5 contracts."""

from __future__ import annotations

import datetime
import re
from typing import Any

from bench_env.task.alipay.app import Alipay
from bench_env.task.calendar.app import Calendar
from bench_env.task.clock.app import Clock
from bench_env.task.common_tasks import match_duration
from bench_env.task.ebay.app import Ebay
from bench_env.task.file_manager.app import FileSystem
from bench_env.task.judge import JudgeInput
from bench_env.task.map.app import Map
from bench_env.task.notes.app import Notes
from bench_env.task.railway12306.app import Railway12306
from bench_env.task.redbook.app import Redbook
from bench_env.task.sms.app import sms_from_input
from bench_env.task.spotify.app import Spotify
from bench_env.task.taobao.app import Taobao
from bench_env.task.tencent_meeting.app import TencentMeeting
from bench_env.task.utils import clean_text, extract_numbers, now_ms, norm, sim_today, strip_postal_suffix
from bench_env.task.weather.app import Weather
from bench_env.task.wechat.app import Wechat
from bench_env.task.wechat_reading.app import WechatReading, WECHAT_READING_UI_TO_DATA


SPOTIFY_HISTORY_CASES = {14, 21, 22, 25}
NORMALIZED_EBAY_CASES = {2, 3, 5, 6, 7}
PANTRY_TARGETS = {
    "s_lusen__cv_fresh_milk",
    "s_lusen__cv_coffee_can",
    "s_meihao__sm_apple_bag",
}
PANTRY_NOTE = (
    "每日鲜语4.0鲜牛奶250ml - 卢森便利店(南大和园店)\n"
    "冷萃罐装咖啡 - 卢森便利店(南大和园店)\n"
    "烟台红富士苹果5斤 - 美好优选超市(水沐雍荣店)"
)
SPOTIFY_ARTIST_ALIASES = {
    "周杰伦": "周杰伦",
    "周杰倫": "周杰伦",
    "jaychou": "周杰伦",
    "林俊杰": "林俊杰",
    "林俊傑": "林俊杰",
    "jjlin": "林俊杰",
}


def normalized_entity(value: Any) -> str:
    """Normalize presentation-only spacing and punctuation, preserving identity text."""

    return clean_text(str(value or "")).casefold()


def canonical_spotify_artist(value: Any) -> str:
    token = normalized_entity(value)
    return SPOTIFY_ARTIST_ALIASES.get(token, token)


def normalized_address(value: Any) -> str:
    """Normalize presentation only; never remove identity-bearing place text."""

    text = strip_postal_suffix(str(value or "")).strip()
    if text.startswith("中国"):
        text = text[2:].lstrip()
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[，,、。.;；:：…\[\]（）(){}<>《》“”\"'`~!@#$%^&*_+=?|\\/-]+", "", text)
    return text.casefold()


def _address_variants(value: Any) -> list[str]:
    """Return full and street-level variants while retaining the address core."""

    full = normalized_address(value)
    variants = [full] if full else []
    remainder = full
    # Beijing is the only municipality used by the audited cases. Removing at
    # most city/district prefixes accepts harmless administrative omissions but
    # keeps street, number and POI identity intact.
    for _ in range(2):
        match = re.match(r"^.{2,8}?(?:省|市|自治区|区|县)", remainder)
        if match is None:
            break
        remainder = remainder[match.end():]
        if len(remainder) >= 6:
            variants.append(remainder)
    return list(dict.fromkeys(variants))


def address_matches(actual: Any, expected: Any) -> bool:
    actual_norm = normalized_address(actual)
    return bool(actual_norm) and any(
        variant and variant in actual_norm for variant in _address_variants(expected)
    )


_CHINESE_DIGITS = {"〇": 0, "零": 0, "一": 1, "二": 2, "两": 2, "三": 3,
                   "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9}


def _parse_chinese_number(value: str, *, digit_sequence: bool = False) -> int | None:
    token = str(value or "").strip()
    if not token:
        return None
    if token.isdigit():
        return int(token)
    if digit_sequence:
        try:
            return int("".join(str(_CHINESE_DIGITS[char]) for char in token))
        except (KeyError, ValueError):
            return None
    if token == "十":
        return 10
    if "十" in token:
        left, right = token.split("十", 1)
        tens = _CHINESE_DIGITS.get(left, 1) if left else 1
        ones = _CHINESE_DIGITS.get(right, 0) if right else 0
        return tens * 10 + ones
    if len(token) == 1:
        return _CHINESE_DIGITS.get(token)
    return None


def _contains_equivalent_number(text: Any, expected: Any, *, tolerance: float = 0.01) -> bool:
    def values(value: Any) -> list[float]:
        parsed: list[float] = []
        for match in re.finditer(
            r"(?<![\d.])(-?\d+(?:\.\d+)?)\s*(万|w|千|k)?",
            str(value or ""),
            re.I,
        ):
            number = float(match.group(1))
            unit = (match.group(2) or "").casefold()
            if unit in {"万", "w"}:
                number *= 10000
            elif unit in {"千", "k"}:
                number *= 1000
            parsed.append(number)
        return parsed

    expected_values = values(expected)
    if not expected_values:
        return False
    target = expected_values[0]
    return any(abs(value - target) <= tolerance for value in values(text))


def percentage_matches(text: Any, expected: Any) -> bool:
    expected_match = re.search(r"-?\d+(?:\.\d+)?", str(expected or ""))
    if expected_match is None:
        return False
    target = float(expected_match.group(0))
    raw = str(text or "")
    candidates = [
        float(match.group(1))
        for match in re.finditer(r"(?<![\d.])(-?\d+(?:\.\d+)?)\s*%", raw)
    ]
    candidates.extend(
        float(match.group(1))
        for match in re.finditer(r"(?:推荐值|推荐度|推荐)\D{0,8}(-?\d+(?:\.\d+)?)", raw)
    )
    return any(abs(value - target) <= 0.001 for value in candidates)


def _weather_category(text: Any) -> str:
    raw = str(text or "")
    lowered = raw.casefold()
    if Weather.is_raining_text(raw):
        return "rain"
    if "雪" in raw or "snow" in lowered:
        return "snow"
    if "霾" in raw or "haze" in lowered:
        return "haze"
    if "雾" in raw or "fog" in lowered:
        return "fog"
    if "沙尘" in raw or "dust" in lowered or "sand" in lowered:
        return "dust"
    if "风" in raw or "wind" in lowered:
        return "wind"
    if Weather.is_cloudy_text(raw):
        return "cloudy"
    if Weather.is_sunny_text(raw):
        return "sunny"
    return normalized_entity(raw)


def weather_text_matches(actual: Any, expected: Any) -> bool:
    expected_category = _weather_category(expected)
    return bool(expected_category) and expected_category == _weather_category(actual)


def text_contains_time(text: Any, expected_hhmm: str) -> bool:
    hour, minute = (int(part) for part in expected_hhmm.split(":"))
    raw = str(text or "")
    for match in re.finditer(r"(?<!\d)(\d{1,2})\s*:\s*(\d{2})(?!\d)", raw):
        if (int(match.group(1)), int(match.group(2))) == (hour, minute):
            return True
    pattern = re.compile(
        r"(上午|下午|早上|晚上|中午|凌晨|傍晚)?\s*"
        r"([0-9〇零一二两三四五六七八九十]{1,3})\s*点"
        r"(?:\s*([0-9〇零一二两三四五六七八九十]{1,3})\s*分?)?"
    )
    for match in pattern.finditer(raw):
        parsed_hour = _parse_chinese_number(match.group(2))
        parsed_minute = _parse_chinese_number(match.group(3) or "0")
        if parsed_hour is None or parsed_minute is None:
            continue
        prefix = match.group(1) or ""
        if prefix in {"下午", "晚上", "傍晚"} and parsed_hour < 12:
            parsed_hour += 12
        elif prefix in {"上午", "早上", "凌晨"} and parsed_hour == 12:
            parsed_hour = 0
        if (parsed_hour, parsed_minute) == (hour, minute):
            return True
    return False


def temperature_matches(text: Any, expected: float) -> bool:
    raw = str(text or "")
    patterns = (
        r"(?:温度|气温|当前)\D{0,8}(-?\d+(?:\.\d+)?)",
        r"(-?\d+(?:\.\d+)?)\s*(?:℃|°\s*[Cc]|摄氏度)",
        r"(-?\d+(?:\.\d+)?)\s*度(?![以之])",
    )
    return any(
        abs(float(match.group(1)) - float(expected)) <= 0.1
        for pattern in patterns
        for match in re.finditer(pattern, raw, re.I)
    )


def text_contains_month(text: Any, month_iso: str) -> bool:
    year, month = (int(part) for part in month_iso.split("-"))
    patterns = (
        rf"(?<!\d){year}\s*年\s*0?{month}\s*月(?!\d)",
        rf"(?<!\d){year}\s*[-/.]\s*0?{month}(?!\d)",
        rf"(?<!\d)0?{month}\s*月(?!\d)",
    )
    return any(re.search(pattern, str(text or "")) for pattern in patterns)


def entity_contains(text: Any, expected: Any) -> bool:
    token = normalized_entity(expected)
    return bool(token) and token in normalized_entity(text)


def _entity_check(text: str, expected: str, *, field: str) -> dict[str, Any]:
    return {
        "field": field,
        "expected": {"normalized_contains": expected},
        "actual": text[:240] or "(none)",
        "passed": entity_contains(text, expected),
    }


def _replace_check(
    checks: list[dict[str, Any]], field: str, replacement: dict[str, Any]
) -> list[dict[str, Any]]:
    return [replacement if check.get("field") == field else check for check in checks]


def _new_wechat_texts_by_id(input: JudgeInput, contact_id: str) -> list[str]:
    chats = (input.apps.get("wechat") or {}).get("chats") or []
    initial = (input.apps_init.get("wechat") or {}).get("chats") or []
    current_chat = next((chat for chat in chats if str(chat.get("id")) == contact_id), None)
    initial_chat = next((chat for chat in initial if str(chat.get("id")) == contact_id), None)
    initial_ids = {
        str(message.get("id"))
        for message in (initial_chat or {}).get("messages", [])
        if isinstance(message, dict)
    }
    me = str((input.apps.get("wechat") or {}).get("user", {}).get("wxid") or "")
    return [
        str(message.get("content") or "")
        for message in (current_chat or {}).get("messages", [])
        if isinstance(message, dict)
        and str(message.get("id")) not in initial_ids
        and str(message.get("senderId") or "") == me
        and str(message.get("type") or "") == "text"
    ]


def text_contains_date(text: str, date_iso: str, *, require_year: bool = False) -> bool:
    year, month, day = (int(part) for part in date_iso.split("-"))
    patterns = [
        rf"(?<!\d){year}\s*年\s*0?{month}\s*月\s*0?{day}\s*[日号]?(?!\d)",
        rf"(?<!\d){year}\s*[-/.]\s*0?{month}\s*[-/.]\s*0?{day}(?!\d)",
    ]
    if not require_year:
        patterns.extend([
            rf"(?<!\d)0?{month}\s*月\s*0?{day}\s*[日号](?!\d)",
            rf"(?<!\d)0?{month}\s*[-/.]\s*0?{day}(?!\d)",
        ])
    if any(re.search(pattern, text) for pattern in patterns):
        return True

    chinese_year = "".join(
        next(key for key, number in _CHINESE_DIGITS.items() if number == int(digit) and key != "零")
        if digit != "0" else "零"
        for digit in str(year)
    )
    chinese_year_variants = {chinese_year, chinese_year.replace("零", "〇")}

    def chinese_number(value: int) -> str:
        if value < 10:
            return next(key for key, number in _CHINESE_DIGITS.items() if number == value and key not in {"〇", "两"})
        tens, ones = divmod(value, 10)
        return ("" if tens == 1 else chinese_number(tens)) + "十" + (chinese_number(ones) if ones else "")

    month_zh = chinese_number(month)
    day_zh = chinese_number(day)
    chinese_patterns = [
        rf"{year_text}\s*年\s*{month_zh}\s*月\s*{day_zh}\s*[日号]?"
        for year_text in chinese_year_variants
    ]
    if not require_year:
        chinese_patterns.append(rf"{month_zh}\s*月\s*{day_zh}\s*[日号]")
    return any(re.search(pattern, text) for pattern in chinese_patterns)


def _date_message_check(
    input: JudgeInput,
    contact_id: str,
    dates: list[str],
    *,
    field: str,
    require_year: bool = False,
) -> dict[str, Any]:
    texts = _new_wechat_texts_by_id(input, contact_id)
    actual = "\n".join(texts)
    return {
        "field": field,
        "expected": {"contact_id": contact_id, "dates": dates},
        "actual": actual[:300] or "(none)",
        "passed": bool(actual) and all(
            text_contains_date(actual, value, require_year=require_year)
            for value in dates
        ),
    }


def _new_enabled_alarm(clock: Clock, hour: int, minute: int, *, field: str) -> dict[str, Any]:
    matches = [
        alarm
        for alarm in clock.new_alarms()
        if int(alarm.get("hour", -1)) == hour
        and int(alarm.get("minute", -1)) == minute
        and bool(alarm.get("enabled"))
    ]
    return {
        "field": field,
        "expected": {"time": f"{hour:02d}:{minute:02d}", "new": True, "enabled": True},
        "actual": matches[0] if matches else None,
        "passed": bool(matches),
    }


def _number_near_label(text: str, labels: list[str], amount: float) -> bool:
    number_pattern = (
        r"(?<![0-9A-Za-z_.])"
        r"(-?(?:\d{1,3}(?:[，,]\d{3})+|\d+)(?:\.\d+)?)"
        r"(?![0-9A-Za-z_.])"
    )

    def numbers_in(value: str) -> list[tuple[float, int, int]]:
        return [
            (
                float(match.group(1).replace(",", "").replace("，", "")),
                match.start(),
                match.end(),
            )
            for match in re.finditer(number_pattern, value)
        ]

    # Newlines separate list entries. Only join a label-only line with the next
    # line so layouts such as "南京饭店\n金额：286.50元" remain valid without
    # allowing the previous entry's amount to bind to the next entry's label.
    segments = [
        value.strip()
        for value in re.split(r"[；;。！？!?\n]+", text or "")
        if value.strip()
    ]
    candidates = list(segments)
    for index, segment in enumerate(segments[:-1]):
        if not numbers_in(re.sub(r"\s+", "", segment)) and any(
            entity_contains(segment, label) for label in labels
        ):
            candidates.append(f"{segment}\n{segments[index + 1]}")

    for segment in candidates:
        compact = re.sub(r"\s+", "", segment).casefold()
        numbers = numbers_in(compact)
        for label in labels:
            token = re.sub(r"\s+", "", str(label or "")).casefold()
            if not token or not entity_contains(segment, label):
                continue
            position = compact.find(token)
            if position < 0:
                if len(numbers) == 1 and abs(numbers[0][0] - float(amount)) <= 0.01:
                    return True
                continue
            nearest = min(
                numbers,
                key=lambda item: min(abs(item[1] - (position + len(token))), abs(item[2] - position)),
                default=None,
            )
            if nearest is not None and abs(nearest[0] - float(amount)) <= 0.01:
                return True
    return False


def _extract_date_isos(text: str, *, reference_date: datetime.date) -> set[str]:
    """Extract explicit and short Chinese dates without treating arbitrary numbers as dates."""

    found: set[str] = set()

    def add(year: int, month: int, day: int) -> None:
        try:
            found.add(datetime.date(year, month, day).isoformat())
        except ValueError:
            return

    for match in re.finditer(
        r"(?<!\d)(\d{4})\s*(?:年|[-/.])\s*(\d{1,2})\s*(?:月|[-/.])\s*(\d{1,2})\s*[日号]?(?!\d)",
        text or "",
    ):
        add(*(int(part) for part in match.groups()))

    chinese_token = r"[〇零一二两三四五六七八九十]{1,4}"
    for match in re.finditer(
        rf"({chinese_token})\s*年\s*({chinese_token})\s*月\s*({chinese_token})\s*[日号]?",
        text or "",
    ):
        year = _parse_chinese_number(match.group(1), digit_sequence=True)
        month = _parse_chinese_number(match.group(2))
        day = _parse_chinese_number(match.group(3))
        if year is not None and month is not None and day is not None:
            add(year, month, day)

    for match in re.finditer(r"(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]", text or ""):
        add(reference_date.year, int(match.group(1)), int(match.group(2)))

    for match in re.finditer(
        rf"({chinese_token})\s*月\s*({chinese_token})\s*[日号]", text or ""
    ):
        month = _parse_chinese_number(match.group(1))
        day = _parse_chinese_number(match.group(2))
        if month is not None and day is not None:
            add(reference_date.year, month, day)

    # Support compact lists such as "7月13日、15日、16日".
    for group in re.finditer(r"(?<!\d)(\d{1,2})\s*月([^。；;\n]*)", text or ""):
        month = int(group.group(1))
        for day in re.findall(r"(?<!\d)(\d{1,2})\s*[日号]", group.group(2)):
            add(reference_date.year, month, int(day))

    weekday_numbers = {"一": 0, "二": 1, "三": 2, "四": 3, "五": 4,
                       "六": 5, "日": 6, "天": 6,
                       "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6}
    for match in re.finditer(r"(?:星期|周)([一二三四五六日天1-7])", text or ""):
        weekday = weekday_numbers[match.group(1)]
        delta = (weekday - reference_date.weekday()) % 7
        value = reference_date + datetime.timedelta(days=delta)
        add(value.year, value.month, value.day)

    relative = {
        "大后天": 3,
        "后天": 2,
        "明天": 1,
        "今天": 0,
    }
    remaining = text or ""
    for label, offset in relative.items():
        if label in remaining:
            value = reference_date + datetime.timedelta(days=offset)
            add(value.year, value.month, value.day)
            remaining = remaining.replace(label, "")
    return found


def _contains_running_invitation(text: str) -> bool:
    compact = re.sub(r"\s+", "", text or "")
    patterns = (
        r"一起.{0,5}跑",
        r"约.{0,5}跑",
        r"要不要.{0,8}跑",
        r"有空.{0,8}跑",
        r"来.{0,5}跑",
        r"跑(?:步)?.{0,2}[吗嘛吧呀]",
    )
    return any(re.search(pattern, compact) for pattern in patterns)


def _contains_busy_statement(text: Any) -> bool:
    compact = re.sub(r"\s+", "", str(text or ""))
    pattern = re.compile(
        r"不行|冲突|排不开|(?<!没)有安排|没空|时间.{0,4}(?:占用|被占)|"
        r"无法安排|不能安排|不方便"
    )
    return pattern.search(compact) is not None


def _is_high_speed_order(order: dict[str, Any] | None) -> bool:
    """Orders store trainNo but not the TrainInfo-only trainType field."""

    return bool(order) and str(order.get("trainNo") or "").upper().startswith("G")


def _cart_quantities(app: dict[str, Any]) -> dict[tuple[str, str], int]:
    quantities: dict[tuple[str, str], int] = {}
    for line in app.get("cart") or []:
        key = (str(line.get("itemId") or ""), str(line.get("skuDesc") or ""))
        quantities[key] = quantities.get(key, 0) + int(line.get("qty") or 0)
    return quantities


def _cart_quantities_for_output(
    quantities: dict[tuple[str, str], int],
) -> list[dict[str, Any]]:
    return [
        {"item_id": item_id, "sku_desc": sku_desc, "quantity": quantity}
        for (item_id, sku_desc), quantity in sorted(quantities.items())
    ]


class V5ContractMixin:
    """Layer contract repairs over the V4 task wrappers without changing V4."""

    async def _prepare(self, env: Any) -> None:
        await super()._prepare(env)

        if self.spec.index in SPOTIFY_HISTORY_CASES:
            state = await env.get_state(required_apps=["spotify"])
            recent = list(state["apps"]["spotify"].get("recentPlays") or [])
            newest = datetime.datetime.fromisoformat("2026-07-12T08:55:00+08:00")
            history = []
            for index, track in enumerate(recent):
                played_at = newest - datetime.timedelta(minutes=15 * index)
                history.append({
                    "sourceType": "standalone",
                    "sourceId": "standalone",
                    "sourceTitle": "",
                    "track": track,
                    "timestamp": int(played_at.timestamp() * 1000),
                })
            await env.set_state(
                {"apps": {"spotify": {"playHistory": history}}},
                deep=True,
                reload=False,
            )

        if self.spec.index == 74:
            state = await env.get_state(required_apps=["notes"])
            notes = []
            for note in state["apps"]["notes"].get("notes") or []:
                if str(note.get("title") or "") == "Office pantry":
                    note = {**note, "content": PANTRY_NOTE}
                notes.append(note)
            await env.set_state(
                {"apps": {"notes": {"notes": notes}}},
                deep=True,
                reload=False,
            )

    def _repair_ebay_checks(
        self, input: JudgeInput, checks: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        case = self.spec.index
        ebay_state = input.apps_init["ebay"] if case == 3 else input.apps["ebay"]
        ebay = Ebay(ebay_state)

        if case == 3:
            notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
            first = ebay.cheapest_product(query=self.p.item1)
            second = ebay.cheapest_product(query=self.p.item2)
            checks = _replace_check(
                checks,
                "item1_title",
                _entity_check(notes.latest_note_text, first.title, field="item1_title"),
            )
            return _replace_check(
                checks,
                "item2_title",
                _entity_check(notes.latest_note_text, second.title, field="item2_title"),
            )

        top = ebay.cheapest_product(
            query=self.p.query,
            condition="全新" if case in {2, 6, 7} else None,
        )
        if case in {2, 5, 7}:
            notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
            checks = _replace_check(
                checks,
                "note_title",
                _entity_check(notes.latest_note_text, top.title, field="note_title"),
            )
        if case in {6, 7}:
            wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
            checks = _replace_check(
                checks,
                "wechat_title",
                _entity_check(
                    wechat.joined_new_texts_to(self.p.contact),
                    top.title,
                    field="wechat_title",
                ),
            )
        return checks

    def _check_case_01(self, input: JudgeInput) -> list[dict[str, Any]]:
        alipay = Alipay(input.apps_init["alipay"])
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        transaction = alipay.largest_expense()
        primary = alipay.transaction_primary_label(transaction)
        transfer_target = re.sub(r"^转账\s*(?:[-—:：]|给)?\s*", "", primary).strip()
        required = ["转账", transfer_target] if primary.startswith("转账") and transfer_target else [primary]
        actual = notes.latest_note_text
        return [
            {
                "field": "largest_expense_target",
                "expected": {"independent_tokens": required},
                "actual": actual[:300] or "(none)",
                "passed": bool(actual) and all(entity_contains(actual, token) for token in required),
            },
            notes.check_latest_contains_number(
                round(abs(float(transaction["delta"])), 2),
                field="largest_expense_amount",
            ),
        ]

    def _check_case_08(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        alipay = Alipay(input.apps_init["alipay"])
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        expense1 = alipay.monthly_expense(self.p.month1)
        expense2 = alipay.monthly_expense(self.p.month2)
        winner = self.p.month1 if expense1 > expense2 else self.p.month2 if expense2 > expense1 else "一样"
        actual = notes.latest_note_text
        replacement = {
            "field": "note_winner",
            "expected": {"month": winner, "equivalent_formats": True},
            "actual": actual[:300] or "(none)",
            "passed": entity_contains(actual, "一样") if winner == "一样" else text_contains_month(actual, winner),
        }
        return _replace_check(checks, "note_winner", replacement)

    def _check_case_09(self, input: JudgeInput) -> list[dict[str, Any]]:
        alipay = Alipay(input.apps_init["alipay"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        cutoff = now_ms(input.os_init) - 30 * 86400 * 1000
        expenses = sorted(
            (
                tx
                for tx in alipay.transactions
                if float(tx["delta"]) < 0 and cutoff <= int(tx["timestamp"]) <= now_ms(input.os_init)
            ),
            key=lambda tx: abs(float(tx["delta"])),
            reverse=True,
        )[:3]
        actual = wechat.joined_new_texts_to(self.p.contact)
        checks = []
        for index, tx in enumerate(expenses, start=1):
            labels = alipay.transaction_labels(tx)
            amount = round(abs(float(tx["delta"])), 2)
            checks.append({
                "field": f"wechat_top{index}_pair",
                "expected": {"labels": labels[:3], "amount": amount},
                "actual": actual[:300] or "(none)",
                "passed": _number_near_label(actual, labels, amount),
            })
        sentences = [
            value.strip()
            for value in re.split(r"[。！？!?\n]+", actual)
            if value.strip()
        ]
        checks.append({
            "field": "wechat_closing",
            "expected": "last sentence is 我最近得省着点了",
            "actual": sentences[-1] if sentences else "(none)",
            "passed": bool(sentences) and norm(sentences[-1]) == norm("我最近得省着点了"),
        })
        return checks

    def _check_case_10(self, input: JudgeInput) -> list[dict[str, Any]]:
        alipay = Alipay(input.apps_init["alipay"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        year = sim_today(input.os_init).year
        count, spending = alipay.bill_type_year_summary(
            str(self.p.bill_type), year, until_ms=now_ms(input.os_init)
        )
        return [
            wechat.check_new_sent_contains_number(
                self.p.contact, count, tolerance=0.01, field="wechat_bill_count"
            ),
            wechat.check_new_sent_contains_number(
                self.p.contact, spending, tolerance=0.02, field="wechat_bill_spending"
            ),
        ]

    def _check_case_14(self, input: JudgeInput) -> list[dict[str, Any]]:
        spotify = Spotify(input.apps_init["spotify"])
        reading = WechatReading(input.apps_init["wechat_reading"])
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        redbook = Redbook(input.apps["redbook"], init=input.apps_init["redbook"])
        song = str(spotify.nth_today_play(1)["title"])
        book = reading.first_hot_search_title()
        matching_notes = [
            note for note in notes.new_notes()
            if str(note.get("title") or "").strip() == "今日文化清单"
            and entity_contains(note.get("content"), song)
            and entity_contains(note.get("content"), book)
        ]
        return [
            {
                "field": "new_cultural_checklist",
                "expected": {"title": "今日文化清单", "contains": [song, book]},
                "actual": [
                    {"title": note.get("title"), "content": note.get("content")}
                    for note in notes.new_notes()
                ],
                "passed": bool(matching_notes),
            },
            redbook.check_note_published(
                text_keywords=(song, book),
                new_only=True,
                field="cultural_redbook",
            ),
        ]

    def _check_case_17(self, input: JudgeInput) -> list[dict[str, Any]]:
        reading = WechatReading(input.apps_init["wechat_reading"])
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        targets = []
        for shelf_item in reading.shelf:
            book_id = str(shelf_item.get("bookId") or "")
            progress = reading.get_progress(book_id)
            if progress <= 0 or progress >= 99.9:
                continue
            targets.append(str(reading.require_store_book(book_id)["title"]))
        if not targets:
            raise ValueError("No in-progress unfinished shelf books in fixed setup")
        candidates = []
        for note in notes.new_notes():
            content = f"{note.get('title', '')}\n{note.get('content', '')}"
            if (
                ("计划" in content or "plan" in content.casefold())
                and all(entity_contains(content, title) for title in targets)
            ):
                candidates.append(note)
        return [{
            "field": "new_weekly_reading_plan",
            "expected": {"all_in_progress_shelf_books": targets},
            "actual": [
                {"title": note.get("title"), "content": note.get("content")}
                for note in notes.new_notes()
            ],
            "passed": bool(candidates),
        }]

    def _check_case_22(self, input: JudgeInput) -> list[dict[str, Any]]:
        spotify = Spotify(input.apps["spotify"], init=input.apps_init["spotify"])
        redbook = Redbook(input.apps["redbook"], init=input.apps_init["redbook"])
        track = spotify.init.nth_today_play(3)
        song = str(track["title"])
        artist = str(track["artist"])
        return [
            redbook.check_note_published(
                content_keywords=(song, artist),
                new_only=True,
                field="redbook_post_body",
            ),
            spotify.check_playlist_exists(self.p.playlist, field="playlist_exists"),
            spotify.check_playlist_has_titles(
                self.p.playlist, [song], field="playlist_has_song"
            ),
        ]

    def _check_case_23(self, input: JudgeInput) -> list[dict[str, Any]]:
        reading = WechatReading(input.apps["wechat_reading"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        categories = WECHAT_READING_UI_TO_DATA.get(self.p.category, [self.p.category])
        books = [book for book in reading.store if str(book.get("category")) in categories]
        if not books:
            raise ValueError(f"No books in category {self.p.category!r}")
        best_value = max(float(book.get("recommendedValue") or 0) for book in books)
        winners = [book for book in books if float(book.get("recommendedValue") or 0) == best_value]
        if len(winners) != 1:
            raise ValueError(f"recommendedValue maximum is not unique: {best_value}")
        winner = winners[0]
        actual = wechat.joined_new_texts_to(self.p.contact)
        return [{
            "field": "best_recommended_book_share",
            "expected": {
                "title": winner["title"],
                "recommended_value": winner["recommendedValue"],
            },
            "actual": actual[:300] or "(none)",
            "passed": (
                entity_contains(actual, winner["title"])
                and percentage_matches(actual, winner["recommendedValue"])
            ),
        }]

    def _check_case_24(self, input: JudgeInput) -> list[dict[str, Any]]:
        reading = WechatReading(input.apps["wechat_reading"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        date_value, minutes = reading.best_reading_day_and_duration(input.os)
        labels = WechatReading.date_labels(date_value, input.os)
        actual = wechat.joined_new_texts_to(self.p.contact)
        return [{
            "field": "reading_stats",
            "expected": {"date": labels, "duration_minutes": minutes},
            "actual": actual[:300] or "(none)",
            "passed": (
                bool(actual)
                and any(label in actual for label in labels)
                and match_duration(f"{minutes}分钟", actual)
            ),
        }]

    def _repair_redbook_stats_checks(
        self, input: JudgeInput, checks: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        redbook = Redbook(input.apps_init["redbook"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        if self.spec.index == 29:
            top_note = redbook.most_liked_search_note(self.p.query)
            author = redbook.note_author(top_note)
            field = "author_top_collected_stats_share"
        else:
            top_note = redbook.user_max_liked_note(self.p.user)
            author = redbook.note_author(top_note)
            field = "top_liked_stats_share"
        expected = author["likesAndCollections"]
        actual = wechat.joined_new_texts_to(self.p.contact)
        replacement = {
            "field": field,
            "expected": {"equivalent_count": expected},
            "actual": actual[:300] or "(none)",
            "passed": bool(actual) and _contains_equivalent_number(actual, expected, tolerance=0.5),
        }
        return _replace_check(checks, field, replacement)

    def _check_case_25(self, input: JudgeInput) -> list[dict[str, Any]]:
        reading = WechatReading(input.apps_init["wechat_reading"])
        spotify = Spotify(input.apps_init["spotify"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        best_date, _minutes = reading.best_reading_day_and_duration(input.os_init)
        date_labels = WechatReading.date_labels(best_date, input.os_init)
        liked = spotify.liked_recent_intersection()
        liked_keys = {
            (normalized_entity(track.get("title")), normalized_entity(track.get("artist")))
            for track in liked
        }
        unliked = [
            track
            for track in spotify.recent_plays
            if (normalized_entity(track.get("title")), normalized_entity(track.get("artist")))
            not in liked_keys
        ]
        actual = wechat._latest_new_moment_content()
        actual_norm = norm(actual)
        missing = [
            {"title": track.get("title"), "artist": track.get("artist")}
            for track in liked
            if not entity_contains(actual, track.get("title"))
            or not entity_contains(actual, track.get("artist"))
        ]
        forbidden = [
            str(track.get("title") or "")
            for track in unliked
            if entity_contains(actual, track.get("title"))
        ]
        return [
            {
                "field": "moment_headings",
                "expected": ["最近阅读最投入的一天", "现在在听的歌"],
                "actual": actual[:300] or "(none)",
                "passed": bool(actual) and all(norm(value) in actual_norm for value in ("最近阅读最投入的一天", "现在在听的歌")),
            },
            {
                "field": "moment_reading_day",
                "expected": date_labels,
                "actual": actual[:300] or "(none)",
                "passed": bool(actual) and any(label in actual for label in date_labels),
            },
            {
                "field": "moment_liked_tracks_exact",
                "expected": [{"title": t.get("title"), "artist": t.get("artist")} for t in liked],
                "actual": {"text": actual[:300] or "(none)", "missing": missing, "unliked_hits": forbidden},
                "passed": bool(actual) and bool(liked) and not missing and not forbidden,
            },
        ]

    def _check_case_32(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        weather = Weather(input.apps_init["weather"])
        calendar = Calendar(input.apps_init["calendar"])
        rail = Railway12306(input.apps["railway12306"], init=input.apps_init["railway12306"])
        target_date = next(
            (
                date
                for date in weather.non_rainy_dates(self.p.city, 1, 14)
                if calendar.count_events_on_date(datetime.date.fromisoformat(date)) == 0
            ),
            None,
        )
        if target_date is None:
            raise ValueError("No non-rainy free date in the fixed 14-day setup")
        train = rail.pick_train_for_route_strict(
            "earliest",
            from_station=self.p.from_station,
            to_station=self.p.city,
            only_high_speed=True,
        )
        if train is None:
            return checks
        hour, minute = map(int, str(train["departTime"]).split(":"))
        alarm_time = datetime.datetime(2000, 1, 1, hour, minute) - datetime.timedelta(hours=1)
        replacement = _new_enabled_alarm(
            Clock(input.apps["clock"], init=input.apps_init["clock"]),
            alarm_time.hour,
            alarm_time.minute,
            field="alarm",
        )
        return _replace_check(checks, "alarm", replacement)

    def _check_case_38(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        spotify = Spotify(input.apps["spotify"])
        playlist = spotify.get_playlist_by_name(self.p.playlist)
        tracks = list((playlist or {}).get("tracks") or [])
        artists = [canonical_spotify_artist(track.get("artist")) for track in tracks]
        expected = {
            canonical_spotify_artist(self.p.artist1): int(self.p.count),
            canonical_spotify_artist(self.p.artist2): int(self.p.count),
        }
        actual = {artist: artists.count(artist) for artist in set(artists)}
        exact = {
            "field": "playlist_exact_artist_multiset",
            "expected": expected,
            "actual": actual,
            "passed": len(tracks) == sum(expected.values()) and actual == expected,
        }
        replaced = []
        for check in checks:
            if check.get("field") in {"playlist_track_count", "playlist_artist1_count", "playlist_artist2_count"}:
                continue
            replaced.append(check)
        replaced.append(exact)
        return replaced

    def _check_case_33(self, input: JudgeInput) -> list[dict[str, Any]]:
        best = Map.best_rated_from_results(
            Map.geo_search(self.p.category, limit=0),
            max_distance_meters=float(self.p.radius),
        )
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat.joined_new_texts_to(self.p.contact)
        expected_address = Map.extract_address(best)
        return [{
            "field": "best_poi_share",
            "expected": {
                "name": best["name"],
                "rating": best["rating"],
                "address": expected_address,
            },
            "actual": actual[:400] or "(none)",
            "passed": (
                entity_contains(actual, best["name"])
                and _contains_equivalent_number(actual, best["rating"], tolerance=0.01)
                and address_matches(actual, expected_address)
            ),
        }]

    def _check_case_34(self, input: JudgeInput) -> list[dict[str, Any]]:
        places = Map.resolve_places(str(self.p.place))
        addresses = [Map.extract_address(place) for place in places]
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat.joined_new_texts_to(self.p.contact)
        return [{
            "field": "place_address_share",
            "expected": {"any_legal_candidate_address": addresses},
            "actual": actual[:400] or "(none)",
            "passed": bool(actual) and any(address_matches(actual, address) for address in addresses),
        }]

    def _check_case_37(self, input: JudgeInput) -> list[dict[str, Any]]:
        places = Map.resolve_places(str(self.p.dest))
        weather = Weather(input.apps["weather"])
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat.joined_new_texts_to(self.p.contact)
        attempts = []
        for place in places:
            address = Map.extract_address(place)
            weather_text = weather.current_weather_text(address)
            temperature = weather.current_temp(address)
            attempt = {
                "place": place.get("name"),
                "address": address,
                "weather": weather_text,
                "temperature": temperature,
                "address_passed": address_matches(actual, address),
                "weather_passed": weather_text_matches(actual, weather_text),
                "temperature_passed": temperature_matches(actual, temperature),
            }
            attempt["passed"] = all(
                attempt[key]
                for key in ("address_passed", "weather_passed", "temperature_passed")
            )
            attempts.append(attempt)
        matched = next((attempt for attempt in attempts if attempt["passed"]), None)
        return [{
            "field": "travel_plan_same_candidate",
            "expected": attempts,
            "actual": {"text": actual[:400] or "(none)", "matched": matched},
            "passed": matched is not None,
        }]

    def _check_case_44(self, input: JudgeInput) -> list[dict[str, Any]]:
        best = Map.nearest_from_results(Map.geo_search(self.p.brand, limit=0))
        expected = Map.extract_address(best)
        messages = sms_from_input(input).new_outgoing_messages_to(self.p.sms_contact)
        actual = "\n".join(str(message.get("content") or "") for message in messages)
        return [{
            "field": "food_address_sms",
            "expected": {
                "recipient": self.p.sms_contact,
                "normalized_address": expected,
            },
            "actual": actual[:300] or None,
            "passed": bool(actual) and address_matches(actual, expected),
        }]

    def _check_case_40(self, input: JudgeInput) -> list[dict[str, Any]]:
        weather = Weather(input.apps["weather"])
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        note = notes.find_note_by_title("适合出行的日子")
        initial = notes.init.find_note_by_title("适合出行的日子") if notes.has_init else None
        text = f"{(note or {}).get('title', '')}\n{(note or {}).get('content', '')}"
        initial_text = f"{(initial or {}).get('title', '')}\n{(initial or {}).get('content', '')}"
        days = weather.daily_range(self.p.city, 1, 5)
        expected_dates = [str(day["fxDate"]) for day in days if not Weather.is_rainy_forecast(day)]
        rainy_dates = [str(day["fxDate"]) for day in days if Weather.is_rainy_forecast(day)]
        actual_dates = _extract_date_isos(text, reference_date=sim_today(input.os))
        return [{
            "field": "non_rainy_dates_exact",
            "expected": {"included": expected_dates, "excluded": rainy_dates},
            "actual": {"text": text[:300], "parsed_dates": sorted(actual_dates)},
            "passed": (
                note is not None
                and text != initial_text
                and actual_dates == set(expected_dates)
            ),
        }]

    def _check_case_41(self, input: JudgeInput) -> list[dict[str, Any]]:
        weather = Weather(input.apps["weather"])
        rail = Railway12306(input.apps["railway12306"], init=input.apps_init["railway12306"])
        try:
            target_date = weather.first_non_rainy_date(self.p.city, 1, 3)
        except ValueError:
            return [{
                "field": "fixed_setup_has_non_rainy_day",
                "expected": "at least one non-rainy day",
                "actual": "none",
                "passed": False,
            }]
        order_check = rail.check_booking_order(
            from_station=self.p.from_station,
            to_station=self.p.city,
            date=target_date,
            passenger_names=[rail.user_name],
            field="newPendingOrder",
        )
        orders = rail.new_pending_orders()
        selected = orders[0] if orders else None
        high_speed = _is_high_speed_order(selected)
        return [
            order_check,
            {
                "field": "newPendingOrder.high_speed",
                "expected": "G-series high-speed train",
                "actual": Railway12306.describe_order(selected) if selected else "no new order",
                "passed": high_speed,
            },
        ]

    def _check_case_42(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        replacement = _new_enabled_alarm(
            Clock(input.apps["clock"], init=input.apps_init["clock"]),
            8,
            0,
            field="alarm",
        )
        return _replace_check(checks, "alarm", replacement)

    def _check_case_46(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        sms = sms_from_input(input)
        messages = sms.new_outgoing_messages_to(self.p.contact)
        actual = "\n".join(str(message.get("content") or "") for message in messages)
        checks.append({
            "field": "sms_running_invitation",
            "expected": "an explicit invitation to run together",
            "actual": actual[:300] or "(none)",
            "passed": bool(actual) and _contains_running_invitation(actual),
        })
        return checks

    def _check_case_53(self, input: JudgeInput) -> list[dict[str, Any]]:
        meeting = TencentMeeting(
            input.apps["tencent_meeting"], init=input.apps_init["tencent_meeting"]
        )
        initial_scheduled_ids = {
            str(item.get("id") or "") for item in meeting.init.scheduled_meetings
        }
        candidates = [
            item for item in meeting.scheduled_meetings
            if str(item.get("id") or "") not in initial_scheduled_ids
        ]
        current_active = meeting.active_meeting
        if current_active is not None:
            initial_active = meeting.init.active_meeting
            initial_id = str((initial_active or {}).get("meetingId") or "")
            current_id = str(current_active.get("meetingId") or "")
            if current_id and (initial_active is None or current_id != initial_id):
                candidates.append(current_active)
        if not candidates:
            return [{
                "field": "new_meeting",
                "expected": "a newly scheduled or newly active meeting",
                "actual": None,
                "passed": False,
            }]
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        sms = sms_from_input(input)
        attempts = []
        for candidate in candidates:
            meeting_id = re.sub(r"\s+", "", str(candidate.get("meetingId") or ""))
            if not meeting_id:
                continue
            wx = wechat.check_new_sent_meeting_id(
                self.p.contact1, meeting_id, field="multichannel_wechat"
            )
            sm = sms.check_new_outgoing_contains_meeting_id(
                self.p.contact2, meeting_id, field="multichannel_sms"
            )
            attempts.append({
                "meeting_id": meeting_id,
                "meeting": candidate,
                "wechat": wx["actual"],
                "sms": sm["actual"],
                "passed": wx["passed"] and sm["passed"],
            })
        matched = next((attempt for attempt in attempts if attempt["passed"]), None)
        return [{
            "field": "multichannel_new_meeting_id",
            "expected": "the same newly created meeting ID in both messages",
            "actual": matched or attempts,
            "passed": matched is not None,
        }]

    def _check_case_57(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        fs = FileSystem(input.os["fileSystem"], init=input.os_init["fileSystem"])
        init_by_path = {
            str(node["path"]): node for node in fs.init_nodes
        }
        failures = []
        for src, dst in self.move_map.items():
            source = init_by_path.get(src)
            current_source = fs.find_by_path(src)
            target = fs.find_by_path(dst)
            passed = (
                source is not None
                and current_source is None
                and target is not None
                and target.get("type") == source.get("type") == "file"
                and str(target.get("name") or "") == dst.rsplit("/", 1)[-1]
                and int(target.get("size") or 0) == int(source.get("size") or 0)
                and str(target.get("mimeType") or "") == str(source.get("mimeType") or "")
            )
            if not passed:
                failures.append({
                    "from": src,
                    "to": dst,
                    "source_still_exists": current_source is not None,
                    "expected_source_metadata": source,
                    "actual_target": target,
                })
        replacement = {
            "field": "file_system.requested_files_moved",
            "expected": {
                "source_paths_absent": list(self.move_map),
                "targets_preserve_file_name_type_and_size": list(self.move_map.values()),
                "node_identity_required": False,
            },
            "actual": failures,
            "passed": not failures,
        }
        return _replace_check(
            checks, "file_system.requested_files_moved", replacement
        )

    def _check_case_51(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        calendar = Calendar(input.apps["calendar"], init=input.apps_init["calendar"])
        tomorrow = sim_today(input.os) + datetime.timedelta(days=1)
        hour, minute = Calendar.parse_hh_mm(self.p.time)
        if not calendar.init.event_blocks_slot_on_date(tomorrow, hour, minute):
            return checks
        wechat = Wechat(input.apps["wechat"], init=input.apps_init["wechat"])
        actual = wechat.joined_new_texts_to(self.p.contact)
        replacement = {
            "field": "reject_wechat",
            "expected": "a natural statement that the requested time is unavailable",
            "actual": actual[:300] or "(none)",
            "passed": bool(actual) and _contains_busy_statement(actual),
        }
        return _replace_check(checks, "reject_wechat", replacement)

    def _check_case_70(self, input: JudgeInput) -> list[dict[str, Any]]:
        taobao = Taobao(input.apps["taobao"], init=input.apps_init["taobao"])
        search_check = taobao.check_search_history_contains(self.p.search_kw)
        paid_check = taobao.check_new_paid_order(self.p.item_id, self.p.item_title)
        item = taobao.find_item_by_id(self.p.item_id)
        expected_sku = ";".join(
            f"{spec.get('name')}:{(spec.get('options') or [''])[0]}"
            for spec in item.get("specs") or []
        )
        candidates = [
            order
            for order in taobao.new_orders()
            if any(str(line.get("itemId")) == str(self.p.item_id) for line in order.get("lines") or [])
        ]
        order = candidates[0] if candidates else None
        lines = list((order or {}).get("lines") or [])
        line = lines[0] if len(lines) == 1 else None
        exact_check = {
            "field": "new_paid_order_exact_default",
            "expected": {
                "base_paid_order": True,
                "single_item_line": self.p.item_id,
                "quantity": 1,
                "default_sku": expected_sku,
            },
            "actual": {
                "order_id": (order or {}).get("id"),
                "status": (order or {}).get("status"),
                "lines": lines,
            },
            "passed": (
                paid_check["passed"]
                and line is not None
                and str(line.get("itemId")) == str(self.p.item_id)
                and int(line.get("qty") or 0) == 1
                and normalized_entity(line.get("skuDesc")) == normalized_entity(expected_sku)
            ),
        }
        return [search_check, exact_check]

    def _check_case_72(self, input: JudgeInput) -> list[dict[str, Any]]:
        checks = super().check_goals(input)
        notes = Notes(input.apps["notes"], init=input.apps_init["notes"])
        candidates = [
            note
            for note in notes.new_notes()
            if normalized_entity(note.get("title")) == normalized_entity("发布通知准备")
        ]
        attempts = []
        for note in candidates:
            text = f"{note.get('title', '')}\n{note.get('content', '')}"
            attempts.append({
                "id": note.get("id"),
                "version_passed": entity_contains(text, "RC-204"),
                "deadline_passed": text_contains_time(text, "18:00"),
                "alarm_time_passed": text_contains_time(text, "17:50"),
                "text": text[:300],
            })
        for attempt in attempts:
            attempt["passed"] = all(
                attempt[key]
                for key in ("version_passed", "deadline_passed", "alarm_time_passed")
            )
        note_check = {
            "field": "notes_note[2]",
            "expected": {
                "title": "发布通知准备",
                "version": "RC-204",
                "deadline": "18:00 (semantic)",
                "alarm_time": "17:50 (semantic)",
            },
            "actual": attempts,
            "passed": any(attempt["passed"] for attempt in attempts),
        }
        return _replace_check(checks, "notes_note[2]", note_check)

    def _check_case_74(self, input: JudgeInput) -> list[dict[str, Any]]:
        initial = input.apps_init.get("tbsg") or {}
        current = input.apps.get("tbsg") or {}
        expected = _cart_quantities(initial)
        for item_id in PANTRY_TARGETS:
            expected[(item_id, "")] = expected.get((item_id, ""), 0) + 1
        actual = _cart_quantities(current)
        initial_order_ids = [str(order.get("id")) for order in initial.get("orders") or []]
        current_order_ids = [str(order.get("id")) for order in current.get("orders") or []]
        return [
            {
                "field": "tbsg_cart_exact_delta",
                "expected": _cart_quantities_for_output(expected),
                "actual": _cart_quantities_for_output(actual),
                "passed": actual == expected,
            },
            {
                "field": "tbsg_orders_unchanged",
                "expected": initial_order_ids,
                "actual": current_order_ids,
                "passed": current_order_ids == initial_order_ids,
            },
            {
                "field": "tbsg_checkout_unchanged",
                "expected": initial.get("checkoutDraft"),
                "actual": current.get("checkoutDraft"),
                "passed": current.get("checkoutDraft") == initial.get("checkoutDraft"),
            },
        ]

    def check_goals(self, input: JudgeInput) -> list[dict[str, Any]]:
        case = self.spec.index
        if case == 1:
            return self._check_case_01(input)
        if case in NORMALIZED_EBAY_CASES:
            return self._repair_ebay_checks(input, super().check_goals(input))
        if case == 8:
            return self._check_case_08(input)
        if case == 9:
            return self._check_case_09(input)
        if case == 10:
            return self._check_case_10(input)
        if case == 14:
            return self._check_case_14(input)
        if case == 17:
            return self._check_case_17(input)
        if case == 22:
            return self._check_case_22(input)
        if case == 23:
            return self._check_case_23(input)
        if case == 24:
            return self._check_case_24(input)
        if case == 25:
            return self._check_case_25(input)
        if case in {29, 30}:
            return self._repair_redbook_stats_checks(input, super().check_goals(input))
        if case == 32:
            return self._check_case_32(input)
        if case == 33:
            return self._check_case_33(input)
        if case == 34:
            return self._check_case_34(input)
        if case == 37:
            return self._check_case_37(input)
        if case == 38:
            return self._check_case_38(input)
        if case == 40:
            return self._check_case_40(input)
        if case == 41:
            return self._check_case_41(input)
        if case == 42:
            return self._check_case_42(input)
        if case == 44:
            return self._check_case_44(input)
        if case == 46:
            return self._check_case_46(input)
        if case == 51:
            return self._check_case_51(input)
        if case == 53:
            return self._check_case_53(input)
        if case == 57:
            return self._check_case_57(input)
        if case == 70:
            return self._check_case_70(input)
        if case == 72:
            return self._check_case_72(input)
        if case == 73:
            checks = super().check_goals(input)
            return [
                checks[0],
                _date_message_check(
                    input,
                    "ht_mia",
                    ["2026-08-20", "2026-08-13"],
                    field="wechat_original_and_preparation_dates",
                ),
            ]
        if case == 74:
            return self._check_case_74(input)
        if case == 75:
            checks = super().check_goals(input)
            return [
                checks[0],
                _date_message_check(
                    input,
                    "ht_alice",
                    ["2026-11-01"],
                    field="wechat_preparation_date",
                    require_year=True,
                ),
            ]
        return super().check_goals(input)
