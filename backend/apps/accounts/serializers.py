from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "avatar", "reputation")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    location = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "bio", "location")

    def validate(self, attrs):
        if "password2" in attrs and attrs["password2"]:
            if attrs["password"] != attrs["password2"]:
                raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    challenges_count = serializers.SerializerMethodField()
    solutions_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "bio", "avatar", "location",
            "reputation", "date_joined", "challenges_count", "solutions_count",
        )
        read_only_fields = ("id", "username", "reputation", "date_joined")

    def get_challenges_count(self, obj):
        return obj.challenges.count()

    def get_solutions_count(self, obj):
        return obj.solutions.count()


class PublicUserSerializer(serializers.ModelSerializer):
    challenges_count = serializers.SerializerMethodField()
    solutions_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "bio", "avatar", "location",
            "reputation", "date_joined", "challenges_count", "solutions_count",
        )

    def get_challenges_count(self, obj):
        return obj.challenges.count()

    def get_solutions_count(self, obj):
        return obj.solutions.count()
