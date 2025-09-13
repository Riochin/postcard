from .client import DynamoDBClient
from .users import UserOperations
from .postcards import PostcardOperations
from .collections import CollectionOperations

# Create global instance
db = DynamoDBClient()

__all__ = [
    "db",
    "DynamoDBClient",
    "UserOperations",
    "PostcardOperations",
    "CollectionOperations",
]
