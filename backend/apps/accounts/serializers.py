import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

User = get_user_model()

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_.-]{3,30}$")


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "avatar", "reputation")
        read_only_fields = fields


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
