from __future__ import annotations

from typing import Any


NOTE_STYLE_PRESETS = {"balanced", "concise", "detailed"}
PREFERRED_FOCUS_OPTIONS = {"general", "symptom_driven", "assessment_driven", "plan_driven"}
ENCOUNTER_TYPES = {"acute_visit", "follow_up", "counselling_education", "medication_review"}

DEFAULT_STYLE_PROFILE = {
    "note_style_preset": "balanced",
    "preferred_focus": "general",
    "include_bullets_in_plan": False,
    "include_patient_friendly_language": False,
}


def normalize_note_style_preset(value: str | None) -> str:
    if value in NOTE_STYLE_PRESETS:
        return value
    return DEFAULT_STYLE_PROFILE["note_style_preset"]


def normalize_preferred_focus(value: str | None) -> str:
    if value in PREFERRED_FOCUS_OPTIONS:
        return value
    return DEFAULT_STYLE_PROFILE["preferred_focus"]


def normalize_encounter_type(value: str | None) -> str:
    if value in ENCOUNTER_TYPES:
        return value
    return "follow_up"


def serialize_style_profile(source: Any) -> dict[str, Any]:
    if source is None:
        return dict(DEFAULT_STYLE_PROFILE)

    if isinstance(source, dict):
        get_value = source.get
    else:
        get_value = lambda key: getattr(source, key, None)

    return {
        "note_style_preset": normalize_note_style_preset(get_value("note_style_preset")),
        "preferred_focus": normalize_preferred_focus(get_value("preferred_focus")),
        "include_bullets_in_plan": bool(get_value("include_bullets_in_plan")),
        "include_patient_friendly_language": bool(get_value("include_patient_friendly_language")),
    }


def resolve_style_profile(*, user: Any = None, overrides: dict[str, Any] | None = None) -> dict[str, Any]:
    resolved = serialize_style_profile(user)
    if not overrides:
        return resolved

    if "note_style_preset" in overrides and overrides["note_style_preset"] is not None:
        resolved["note_style_preset"] = normalize_note_style_preset(overrides["note_style_preset"])
    if "preferred_focus" in overrides and overrides["preferred_focus"] is not None:
        resolved["preferred_focus"] = normalize_preferred_focus(overrides["preferred_focus"])
    if "include_bullets_in_plan" in overrides and overrides["include_bullets_in_plan"] is not None:
        resolved["include_bullets_in_plan"] = bool(overrides["include_bullets_in_plan"])
    if "include_patient_friendly_language" in overrides and overrides["include_patient_friendly_language"] is not None:
        resolved["include_patient_friendly_language"] = bool(overrides["include_patient_friendly_language"])

    return resolved
