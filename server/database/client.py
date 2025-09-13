from .base import BaseDynamoDBOperations
from .users import UserOperations
from .postcards import PostcardOperations
from .collections import CollectionOperations


class DynamoDBClient(BaseDynamoDBOperations):
    """Main DynamoDB client that combines all operations"""

    def __init__(self):
        super().__init__()
        self.users = UserOperations(self)
        self.postcards = PostcardOperations(self)
        self.collections = CollectionOperations(self)

    # User operations
    def create_user(
        self, user_id: str, username: str, email: str, profile_image_url: str
    ) -> bool:
        return self.users.create_user(user_id, username, email, profile_image_url)

    def get_user(self, user_id: str):
        return self.users.get_user(user_id)

    def update_user(self, user_id: str, username: str, profile_image_url: str) -> bool:
        return self.users.update_user(user_id, username, profile_image_url)

    def delete_user(self, user_id: str) -> bool:
        return self.users.delete_user(user_id)

    # Postcard operations
    def create_postcard(self, author_id: str, image_url: str, text: str):
        return self.postcards.create_postcard(author_id, image_url, text)

    def get_postcard(self, postcard_id: str):
        return self.postcards.get_postcard(postcard_id)

    def update_postcard(self, postcard_id: str, image_url: str, text: str) -> bool:
        return self.postcards.update_postcard(postcard_id, image_url, text)

    def delete_postcard(self, postcard_id: str) -> bool:
        return self.postcards.delete_postcard(postcard_id)

    def add_path_point(
        self, postcard_id: str, prefecture: str, lat: float, lon: float
    ) -> bool:
        return self.postcards.add_path_point(postcard_id, prefecture, lat, lon)

    def get_postcard_path(self, postcard_id: str):
        return self.postcards.get_postcard_path(postcard_id)

    def get_nearby_postcards(self, lat: float, lon: float, radius: int = 1000):
        return self.postcards.get_nearby_postcards(lat, lon, radius)

    # Collection operations
    def collect_postcard(self, user_id: str, postcard_id: str) -> bool:
        return self.collections.collect_postcard(user_id, postcard_id)

    def get_user_collection(self, user_id: str):
        return self.collections.get_user_collection(user_id)

    def like_postcard(self, user_id: str, postcard_id: str) -> bool:
        return self.collections.like_postcard(user_id, postcard_id)
