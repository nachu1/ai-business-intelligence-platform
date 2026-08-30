import sys
from pathlib import Path

sys.path.append(
    str(Path(__file__).resolve().parents[1])
)

import asyncio

from app.database.mongodb import user_collection


async def migrate_manager_ids():
    employees = await user_collection.find(
        {
            "role": "employee",
            "manager_id": {"$exists": False},
        }
    ).to_list(length=None)

    updated = 0
    skipped = 0

    for employee in employees:
        department_id = employee.get(
            "department_id"
        )

        if not department_id:
            skipped += 1
            print(
                f"Skipped {employee.get('name')}: "
                "department_id is missing."
            )
            continue

        managers = await user_collection.find(
            {
                "company_id": employee["company_id"],
                "department_id": department_id,
                "role": "manager",
                "is_active": True,
            },
            {
                "_id": 1,
            },
        ).to_list(length=None)

        if len(managers) == 1:
            await user_collection.update_one(
                {
                    "_id": employee["_id"]
                },
                {
                    "$set": {
                        "manager_id": managers[0]["_id"],
                    }
                },
            )

            updated += 1

            print(
                f"Updated {employee.get('name')}: "
                f"manager_id = {managers[0]['_id']}"
            )

        else:
            skipped += 1

            print(
                f"Skipped {employee.get('name')}: "
                f"{len(managers)} active managers found."
            )

    print()
    print("Migration completed.")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    asyncio.run(
        migrate_manager_ids()
    )