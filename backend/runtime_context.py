from __future__ import annotations

from contextvars import ContextVar, Token
from datetime import datetime


_reference_date_var: ContextVar[str | None] = ContextVar("reference_date", default=None)


def set_reference_date(value: str | None) -> Token:
    return _reference_date_var.set(value)


def reset_reference_date(token: Token) -> None:
    _reference_date_var.reset(token)


def get_reference_datetime() -> datetime:
    value = _reference_date_var.get()
    if value:
        try:
            return datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            pass
    return datetime.utcnow()
