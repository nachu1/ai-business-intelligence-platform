from motor.motor_asyncio import AsyncIOMotorClient

from app.config.settings import MONGODB_URL, DATABASE_NAME

# Create MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)

# Select database
db = client[DATABASE_NAME]

# Collections
company_collection = db["companies"]
user_collection = db["users"]
document_collection = db["documents"]
document_analysis_collection = db["document_analysis"]
chat_collection = db["chats"]
message_collection = db["messages"]
invitation_collection = db["invitations"]
department_collection = db["departments"]
designation_collection = db["designations"]
conversation_collection = db["conversations"]
user_message_collection = db["user_messages"]
task_collection = db["tasks"]
password_reset_collection = db["password_resets"]
notification_collection = db["notifications"]
document_analysis_job_collection = db[
    "document_analysis_jobs"
]