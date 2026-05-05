"""Initial relational schema.

Revision ID: 20260504_0001
Revises:
Create Date: 2026-05-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260504_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return sa.inspect(bind).has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    columns = sa.inspect(bind).get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def _index_exists(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    indexes = sa.inspect(bind).get_indexes(table_name)
    return any(index["name"] == index_name for index in indexes)


def _create_index_if_missing(
    index_name: str,
    table_name: str,
    columns: list[str],
    *,
    unique: bool = False,
) -> None:
    if _table_exists(table_name) and not _index_exists(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if _table_exists(table_name) and not _column_exists(table_name, column.name):
        op.add_column(table_name, column)


def upgrade() -> None:
    if not _table_exists("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("first_name", sa.String(), nullable=False),
            sa.Column("last_name", sa.String(), nullable=False),
            sa.Column("specialty", sa.String(), nullable=True),
            sa.Column("hospital", sa.String(), nullable=True),
            sa.Column("license_no", sa.String(), nullable=True),
            sa.Column("note_style_preset", sa.String(), server_default="balanced", nullable=False),
            sa.Column("preferred_focus", sa.String(), server_default="general", nullable=False),
            sa.Column("include_bullets_in_plan", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("include_patient_friendly_language", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        _add_column_if_missing(
            "users",
            sa.Column("note_style_preset", sa.String(), server_default="balanced", nullable=False),
        )
        _add_column_if_missing(
            "users",
            sa.Column("preferred_focus", sa.String(), server_default="general", nullable=False),
        )
        _add_column_if_missing(
            "users",
            sa.Column("include_bullets_in_plan", sa.Boolean(), server_default=sa.false(), nullable=False),
        )
        _add_column_if_missing(
            "users",
            sa.Column("include_patient_friendly_language", sa.Boolean(), server_default=sa.false(), nullable=False),
        )
    _create_index_if_missing(op.f("ix_users_email"), "users", ["email"], unique=True)
    _create_index_if_missing(op.f("ix_users_id"), "users", ["id"])

    if not _table_exists("transcriptions"):
        op.create_table(
            "transcriptions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("patient_id", sa.String(), nullable=False),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("transcription", sa.Text(), nullable=False),
            sa.Column("confidence_score", sa.Float(), nullable=False),
            sa.Column("duration", sa.String(), nullable=True),
            sa.Column("status", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing(op.f("ix_transcriptions_id"), "transcriptions", ["id"])

    if not _table_exists("medical_entities"):
        op.create_table(
            "medical_entities",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("transcription_id", sa.Integer(), nullable=False),
            sa.Column("text", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=False),
            sa.Column("confidence", sa.Float(), nullable=True),
            sa.Column("start", sa.Integer(), nullable=True),
            sa.Column("end", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["transcription_id"], ["transcriptions.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
    _create_index_if_missing(op.f("ix_medical_entities_id"), "medical_entities", ["id"])

    if not _table_exists("soap_notes"):
        op.create_table(
            "soap_notes",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("transcription_id", sa.Integer(), nullable=False),
            sa.Column("subjective", sa.Text(), nullable=True),
            sa.Column("objective", sa.Text(), nullable=True),
            sa.Column("assessment", sa.Text(), nullable=True),
            sa.Column("plan", sa.Text(), nullable=True),
            sa.Column("source", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True),
            sa.ForeignKeyConstraint(["transcription_id"], ["transcriptions.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("transcription_id"),
        )
    _create_index_if_missing(op.f("ix_soap_notes_id"), "soap_notes", ["id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_soap_notes_id"), table_name="soap_notes")
    op.drop_table("soap_notes")
    op.drop_index(op.f("ix_medical_entities_id"), table_name="medical_entities")
    op.drop_table("medical_entities")
    op.drop_index(op.f("ix_transcriptions_id"), table_name="transcriptions")
    op.drop_table("transcriptions")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
