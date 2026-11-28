import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from .tokens import email_verification_token_generator

User = get_user_model()

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]{3,30}$")


class UserSummarySerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "avatar", "reputation")
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.profile_is_public:
            data["avatar"] = None
        return data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow signing in with either username or email address."""

    def validate(self, attrs):
        identifier = (attrs.get(self.username_field) or "").strip()
        if identifier and not User.objects.filter(username=identifier).exists():
            user_by_email = User.objects.filter(email__iexact=identifier).first()
            if user_by_email:
                attrs[self.username_field] = user_by_email.username
        return super().validate(attrs)


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False)
    bio = serializers.CharField(required=False, allow_blank=True, default="")
    location = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2", "bio", "location")

    def validate_username(self, value):
        username = value.strip()
        if not USERNAME_REGEX.match(username):
            raise serializers.ValidationError(
                "Username must be 3-30 characters and contain only letters, numbers, underscores, dots, or hyphens."
            )
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def validate(self, attrs):
        if "password2" in attrs and attrs["password2"] is not None:
            if attrs["password"] != attrs["password2"]:
                raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2", None)
        user = User.objects.create_user(**validated_data)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"token": "This password reset link is invalid or has expired."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "This password reset link is invalid or has expired."})

        validate_password(attrs["new_password"], user=user)
        attrs["user"] = user
        return attrs


class VerifyEmailSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({"token": "This verification link is invalid or has expired."})

        if not email_verification_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "This verification link is invalid or has expired."})

        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"], user=self.context["request"].user)
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    challenges_count = serializers.SerializerMethodField()
    solutions_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "bio", "avatar", "location",
            "show_location_publicly", "profile_is_public", "reputation", "is_email_verified", "email_notifications_enabled", "date_joined",
            "challenges_count", "solutions_count",
        )
        read_only_fields = ("id", "username", "reputation", "is_email_verified", "date_joined")

    def get_challenges_count(self, obj) -> int:
        return obj.challenges.count()

    def get_solutions_count(self, obj) -> int:
        return obj.solutions.count()


class PublicUserSerializer(serializers.ModelSerializer):
    challenges_count = serializers.SerializerMethodField()
    solutions_count = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    avatar = serializers.ImageField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "bio", "avatar", "location",
            "profile_is_public", "reputation", "is_email_verified", "date_joined",
            "challenges_count", "solutions_count",
        )

    def get_challenges_count(self, obj) -> int:
        return obj.challenges.count()

    def get_solutions_count(self, obj) -> int:
        return obj.solutions.count()

    def get_location(self, obj) -> str:
        return obj.location if obj.profile_is_public and obj.show_location_publicly else ""

    def get_bio(self, obj) -> str:
        return obj.bio if obj.profile_is_public else ""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.profile_is_public:
            data["avatar"] = None
        return data


class ActionMessageSerializer(serializers.Serializer):
    detail = serializers.CharField()
    username = serializers.CharField(required=False)
    dev_reset_url = serializers.URLField(required=False)
    dev_verify_url = serializers.URLField(required=False)


class EmptyRequestSerializer(serializers.Serializer):
    pass


class TopCategorySerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.CharField()
    count = serializers.IntegerField()


class ResolvedOverTimeSerializer(serializers.Serializer):
    month = serializers.CharField()
    challenges = serializers.IntegerField()
    resolved = serializers.IntegerField()


class StatsOverviewSerializer(serializers.Serializer):
    total_challenges = serializers.IntegerField()
    total_solutions = serializers.IntegerField()
    resolved_count = serializers.IntegerField()
    active_users = serializers.IntegerField()
    top_categories = TopCategorySerializer(many=True)
    resolved_over_time = ResolvedOverTimeSerializer(many=True)
