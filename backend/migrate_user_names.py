import asyncio

from app.database.mongodb import (
    user_collection,
    department_collection,
    designation_collection,
)


async def migrate_users():
    users = user_collection.find({})

    updated = 0
    skipped = 0

    async for user in users:

        department_id = user.get(
            "department_id"
        )

        designation_id = user.get(
            "designation_id"
        )

        if not department_id and not designation_id:
            skipped += 1
            continue

        update_data = {}

        # ---------------------------------------------
        # GET DEPARTMENT NAME
        # ---------------------------------------------

        if department_id:

            department = await department_collection.find_one(
                {
                    "_id": department_id
                }
            )

            if department:

                update_data[
                    "department_name"
                ] = department["name"]

        # ---------------------------------------------
        # GET DESIGNATION NAME
        # ---------------------------------------------

        if designation_id:

            designation = await designation_collection.find_one(
                {
                    "_id": designation_id
                }
            )

            if designation:

                update_data[
                    "designation_name"
                ] = designation["name"]

        # ---------------------------------------------
        # UPDATE USER
        # ---------------------------------------------

        if update_data:

            await user_collection.update_one(
                {
                    "_id": user["_id"]
                },
                {
                    "$set": update_data
                },
            )

            print(
                f"Updated user: {user.get('name')}"
            )

            updated += 1

        else:

            print(
                f"Skipped user: {user.get('name')}"
            )

            skipped += 1

    print()
    print("================================")
    print("Migration completed")
    print(f"Updated: {updated}")
    print(f"Skipped: {skipped}")
    print("================================")


if __name__ == "__main__":
    asyncio.run(
        migrate_users()
    )