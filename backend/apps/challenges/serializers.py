from rest_framework import serializers
from apps.accounts.serializers import UserSummarySerializer
from .models import Category, Tag, Challenge, ChallengeUpdate, Follow


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon")


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "slug")


class ChallengeListSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    solutions_count = serializers.SerializerMethodField()
    is_supported = serializers.SerializerMethodField()
    has_supported = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            "id", "title", "slug", "description", "author", "author_username",
            "category", "category_name", "tags", "location", "image",
            "status", "support_count", "solutions_count",
            "is_supported", "has_supported",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "author", "slug", "support_count", "created_at", "updated_at")

    def get_solutions_count(self, obj):
        return getattr(obj, "_solutions_count", obj.solutions.count())

    def get_is_supported(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.engagement.models import Vote
            return Vote.objects.filter(user=request.user, challenge=obj).exists()
        return False

    def get_has_supported(self, obj):
        return self.get_is_supported(obj)


class ChallengeDetailSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    author_username = serializers.CharField(source="author.username", read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), write_only=True, required=False, source="category"
    )
    category_name = serializers.CharField(source="category.name", read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False, source="tags"
    )
    solutions_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_supported = serializers.SerializerMethodField()
    has_supported = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = (
            "id", "title", "slug", "description", "author", "author_username",
            "category", "category_id", "category_name", "tags", "tag_ids", "location", "image",
            "status", "support_count", "solutions_count",
            "is_following", "is_supported", "has_supported",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "author", "slug", "support_count", "status", "created_at", "updated_at")

    def get_solutions_count(self, obj):
        return obj.solutions.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Follow.objects.filter(user=request.user, challenge=obj).exists()
        return False

    def get_is_supported(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.engagement.models import Vote
            return Vote.objects.filter(user=request.user, challenge=obj).exists()
        return False

    def get_has_supported(self, obj):
        return self.get_is_supported(obj)


class ChallengeCreateSerializer(serializers.ModelSerializer):
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = Challenge
        fields = (
            "id", "title", "description", "category", "tag_ids", "tags",
            "location", "image",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        tags = validated_data.pop("tags", [])
        final_tags = tag_ids or tags
        challenge = Challenge.objects.create(**validated_data)
        if final_tags:
            challenge.tags.set(final_tags)
        return challenge


class ChallengeUpdateSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)

    class Meta:
        model = ChallengeUpdate
        fields = ("id", "author", "body", "status", "evidence_url", "created_at")
        read_only_fields = ("id", "author", "status", "created_at")
