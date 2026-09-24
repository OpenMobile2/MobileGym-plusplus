import asyncio

from bench_env.hybrid_agent.setups import CALENDAR_DEMO_EVENT, setup_calendar_demo


class _FakeSetupEnv:
    def __init__(self):
        self.patch = None
        self.home_called = False

    async def set_state(self, patch, *, deep, reload):
        assert deep is True
        assert reload is False
        self.patch = patch

    async def get_state(self, *, required_apps):
        assert required_apps == ["calendar"]
        return self.patch

    async def go_home(self):
        self.home_called = True


def test_calendar_demo_setup_injects_event_before_returning_home():
    env = _FakeSetupEnv()

    event = asyncio.run(setup_calendar_demo(env))

    assert event == CALENDAR_DEMO_EVENT
    assert env.patch == {"apps": {"calendar": {"events": [CALENDAR_DEMO_EVENT]}}}
    assert env.home_called is True
    assert event["title"] == "项目评审"
    assert event["location"] == "3号会议室"
    assert event["endTs"] - event["startTs"] == 60 * 60 * 1000
