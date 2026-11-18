from app.database.mongodb import (
    document_collection,
    user_collection,
)


async def create_indexes():
    # =========================
    # DOCUMENT INDEXES
    # =========================

    await document_collection.create_index(
        [
            ("company_id", 1),
            ("original_filename", 1),
        ]
    )

    await document_collection.create_index(
        [
            ("company_id", 1),
            ("department_id", 1),
            ("original_filename", 1),
        ]
    )

    await document_collection.create_index(
        [
            ("company_id", 1),
            ("uploaded_by", 1),
            ("original_filename", 1),
        ]
    )

    # =========================
    # USER INDEXES
    # =========================

    await user_collection.create_index(
        [
            ("company_id", 1),
            ("role", 1),
            ("is_active", 1),
        ]
    )

    await user_collection.create_index(
        [
            ("company_id", 1),
            ("department_id", 1),
            ("role", 1),
            ("is_active", 1),
            ("name", 1),
        ]
    )

    await user_collection.create_index(
        [
            ("company_id", 1),
            ("manager_id", 1),
            ("role", 1),
            ("is_active", 1),
            ("name", 1),
        ]
    )