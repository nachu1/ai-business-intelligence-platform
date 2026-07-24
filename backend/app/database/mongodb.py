from motor.motor_asyncio import AsyncIOMotorClient

from app.config.settings import MONGODB_URL, DATABASE_NAME

# Create MongoDB client
client = AsyncIOMotorClient(MONGODB_URL)

# Select database
db = client[DATABASE_NAME]

# Collections
company_collection = db["companies"]
user_collection = db["users"]