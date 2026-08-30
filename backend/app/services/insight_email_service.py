from typing import Any
from bson import ObjectId

from app.database.mongodb import user_collection
from app.services.email_service import send_email


async def send_insight_email(
    company_id: str,
    insights: list[dict[str, Any]],
):
    if not insights:
        return

    try:
        company_object_id = ObjectId(company_id)
    except Exception:
        print(
            f"Invalid company ID: {company_id}"
        )
        return

    admins = await user_collection.find(
        {
            "company_id": company_object_id,
            "role": "admin",
            "is_active": True,
        },
        {
            "_id": 1,
            "email": 1,
            "name": 1,
        },
    ).to_list(length=None)

    if not admins:
        print(
            f"No active admins found for company: {company_id}"
        )
        return

    insight_html = ""

    for index, insight in enumerate(insights, 1):
        insight_html += f"""
        <div style="
            margin-bottom:20px;
            padding:18px;
            border:1px solid #e2e8f0;
            border-radius:12px;
            background:#f8fafc;
        ">
            <h3 style="
                margin:0 0 8px;
                color:#0f172a;
                font-size:16px;
            ">
                {index}. {insight["title"]}
            </h3>

            <p style="
                margin:0 0 10px;
                color:#475569;
                font-size:14px;
                line-height:1.6;
            ">
                {insight["description"]}
            </p>

            <span style="
                display:inline-block;
                padding:5px 9px;
                border-radius:999px;
                background:#e0f2fe;
                color:#0369a1;
                font-size:11px;
                font-weight:bold;
                text-transform:uppercase;
            ">
                {insight["category"]}
            </span>
        </div>
        """

    subject = "New Business Insights – BizInsight"

    for admin in admins:
        try:
            await send_email(
                recipient=admin["email"],
                subject=subject,
                body=f"""
                <html>
                <body style="
                    margin:0;
                    padding:30px 15px;
                    background:#f1f5f9;
                    font-family:Arial,sans-serif;
                ">
                    <div style="
                        max-width:650px;
                        margin:auto;
                        background:#ffffff;
                        padding:30px;
                        border-radius:16px;
                    ">

                        <h2 style="
                            margin:0;
                            color:#0f172a;
                        ">
                            Business Insights
                        </h2>

                        <p style="
                            color:#64748b;
                            font-size:14px;
                            line-height:1.6;
                        ">
                            Hello {admin.get("name", "there")},
                        </p>

                        <p style="
                            color:#475569;
                            font-size:14px;
                            line-height:1.6;
                        ">
                            Your latest business document generated
                            the following important insights:
                        </p>

                        {insight_html}

                        <p style="
                            color:#64748b;
                            font-size:13px;
                            line-height:1.6;
                        ">
                            You can view the complete analysis in
                            your BizInsight dashboard.
                        </p>

                        <p style="
                            color:#475569;
                            font-size:14px;
                        ">
                            Regards,<br>
                            <strong>BizInsight</strong>
                        </p>

                    </div>
                </body>
                </html>
                """,
            )

        except Exception as error:
            print(
                f"Insight email failed for "
                f"{admin.get('email')}: {error}"
            )