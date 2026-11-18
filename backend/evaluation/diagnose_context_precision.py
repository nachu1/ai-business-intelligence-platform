
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RUN_PATH = BASE_DIR / "runs" / "evaluation_01.json"
METRICS_PATH = BASE_DIR / "metrics" / "evaluation_01.json"

with open(RUN_PATH, "r", encoding="utf-8") as f:
    records = json.load(f)

with open(METRICS_PATH, "r", encoding="utf-8") as f:
    metrics = json.load(f)

question_text = (
    "How much and by what percentage did revenue increase "
    "from May to June 2026?"
)

matches = [
    record for record in records
    if record.get("user_input", "").strip() == question_text
]

if not matches:
    print("Q6 not found. Available questions:")
    for record in records:
        print("-", record.get("user_input"))
    raise SystemExit(1)

record = matches[0]

print("\nQUESTION:")
print(record["user_input"])

print("\nREFERENCE ANSWER:")
print(record.get("reference"))

print("\nACTUAL ANSWER:")
print(record.get("response"))

print("\nRETRIEVED CONTEXTS:")
for i, context in enumerate(record.get("retrieved_contexts", []), 1):
    print(f"\n--- Context {i} ---")
    print(context)

print("\nSAVED METRICS FOR Q6:")
for item in metrics.get("individual_scores", []):
    if item.get("user_input", "").strip() == question_text:
        print(json.dumps(item, indent=2, ensure_ascii=False))
        break
else:
    print("Could not match Q6 in the saved metrics.")
