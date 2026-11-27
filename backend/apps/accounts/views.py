from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models import Count
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .serializers import (
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        dev_reset_url = None
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            if settings.DEBUG:
                dev_reset_url = reset_url

            send_mail(
                subject="Reset your CommonGround password",
                message=(
                    f"Hi {user.username},\n\n"
                    f"We received a request to reset your CommonGround password. "
                    f"Use the link below to set a new password:\n\n"
                    f"{reset_url}\n\n"
                    f"If you did not request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        payload = {
            "detail": "If an account with that email exists, a password reset link has been sent."
        }
        if dev_reset_url:
            payload["dev_reset_url"] = dev_reset_url
        return Response(payload, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(
            {"detail": "Your password has been reset successfully. You can now sign in."},
            status=status.HTTP_200_OK,
        )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"detail": "Registration successful.", "username": user.username},
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PublicProfileView(generics.RetrieveAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "username"
    queryset = User.objects.all()


class LeaderboardView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.order_by("-reputation")[:20]


class StatsOverviewView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.challenges.models import Challenge, Category
        from apps.solutions.models import Solution
        from django.db.models import Q
        from django.db.models.functions import TruncMonth

        total_challenges = Challenge.objects.count()
        total_solutions = Solution.objects.count()
        resolved_count = Challenge.objects.filter(status=Challenge.Status.RESOLVED).count()
        active_users = User.objects.filter(is_active=True).count()
        top_categories = list(
            Category.objects.annotate(count=Count("challenge"))
            .order_by("-count")
            .values("name", "slug", "count")[:6]
        )

        monthly_qs = (
            Challenge.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                challenges=Count("id"),
                resolved=Count("id", filter=Q(status=Challenge.Status.RESOLVED)),
            )
            .order_by("month")
        )
        resolved_over_time = [
            {
                "month": row["month"].strftime("%b %Y") if row["month"] else "",
                "challenges": row["challenges"],
                "resolved": row["resolved"],
            }
            for row in monthly_qs
            if row["month"] is not None
        ][-6:]

        return Response({
            "total_challenges": total_challenges,
            "total_solutions": total_solutions,
            "resolved_count": resolved_count,
            "active_users": active_users,
            "top_categories": top_categories,
            "resolved_over_time": resolved_over_time,
        })
