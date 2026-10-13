from datetime import UTC, datetime, timedelta

import pytest
from pydantic import ValidationError

from app.core.clock import SystemClock
from app.schemas.pagination import PageParams


def test_system_clock_returns_current_utc_instant() -> None:
    now = SystemClock().now()

    assert now.tzinfo is UTC
    assert abs(now - datetime.now(UTC)) < timedelta(seconds=5)


def test_page_params_defaults() -> None:
    params = PageParams()

    assert (params.page, params.per_page) == (1, 20)


@pytest.mark.parametrize(("page", "per_page"), [(0, 20), (1, 0), (1, 101)])
def test_page_params_rejects_out_of_range(page: int, per_page: int) -> None:
    with pytest.raises(ValidationError):
        PageParams(page=page, per_page=per_page)
