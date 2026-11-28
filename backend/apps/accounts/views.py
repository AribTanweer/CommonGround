import logging
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.db.models import Count
from django.utils.encoding import force_bytes
from django.utils.html import escape
from django.utils.http import urlsafe_base64_encode
from drf_spectacular.utils import extend_schema

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicUserSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    VerifyEmailSerializer,
    ActionMessageSerializer, EmptyRequestSerializer, StatsOverviewSerializer,
)
from .tokens import email_verification_token_generator

logger = logging.getLogger(__name__)
User = get_user_model()


def _send_action_email(
    *,
    subject: str,
    username: str,
    intro_text: str,
    cta_label: str,
    action_url: str,
    footer_text: str,
    recipient: str,
    user_id: int,
) -> None:
    """Send a branded HTML + plain-text email without crashing the caller on SMTP errors."""
    text_body = (
        f"Hi {username},\n\n"
        f"{intro_text}\n\n"
        f"{action_url}\n\n"
        f"{footer_text}"
    )
    safe_user = escape(username)
    safe_intro = escape(intro_text)
    safe_cta = escape(cta_label)
    safe_url = escape(action_url)
    safe_footer = escape(footer_text)
    html_body = (
        f"<div style=\"font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;\">"
        f"<h2 style=\"margin:0 0 12px;color:#4f46e5;\">CommonGround</h2>"
        f"<p>Hi <strong>{safe_user}</strong>,</p>"
        f"<p>{safe_intro}</p>"
        f"<p style=\"margin:24px 0;\"><a href=\"{safe_url}\" "
        f"style=\"display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;\">"
        f"{safe_cta}</a></p>"
        f"<p style=\"font-size:12px;color:#64748b;\">Or copy this link into your browser:<br/>{safe_url}</p>"
        f"<hr style=\"border:none;border-top:1px solid #e2e8f0;margin:24px 0;\"/>"
        f"<p style=\"font-size:12px;color:#64748b;\">{safe_footer}</p>"
        f"</div>"
    )
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send '%s' email to user_id=%s", subject, user_id)


def _send_verification_email(user) -> str:
    """Generate a single-use email verification URL and send it to the user."""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token_generator.make_token(user)
    verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    _send_action_email(
        subject="Verify your CommonGround email address",
        username=user.username,
        intro_text="Welcome to CommonGround! Please verify your email address to confirm your account.",
        cta_label="Verify Email",
        action_url=verify_url,
        footer_text="If you did not create a CommonGround account, you can safely ignore this email.",
        recipient=user.email,
        user_id=user.pk,
    )
    return verify_url


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = "auth_login"


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "password_reset"

    @extend_schema(request=PasswordResetRequestSerializer, responses={200: ActionMessageSerializer})
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

            expiry_minutes = max(1, settings.PASSWORD_RESET_TIMEOUT // 60)
            _send_action_email(
                subject="Reset your CommonGround password",
                username=user.username,
                intro_text=(
                    f"We received a request to reset your CommonGround password. "
                    f"This link is single-use and expires in {expiry_minutes} minutes."
                ),
                cta_label="Reset Password",
                action_url=reset_url,
                footer_text="If you did not request a password reset, you can safely ignore this email.",
                recipient=user.email,
                user_id=user.pk,
            )

        payload = {
            "detail": "If an account with that email exists, a password reset link has been sent."
        }
        if dev_reset_url:
            payload["dev_reset_url"] = dev_reset_url
        return Response(payload, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "password_reset"

    @extend_schema(request=PasswordResetConfirmSerializer, responses={200: ActionMessageSerializer})
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


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = "password_reset"

    @extend_schema(request=VerifyEmailSerializer, responses={200: ActionMessageSerializer})
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
        return Response(
            {"detail": "Email address verified successfully."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "password_reset"

    @extend_schema(request=EmptyRequestSerializer, responses={200: ActionMessageSerializer})
    def post(self, request):
        user = request.user
        if user.is_email_verified:
            return Response(
                {"detail": "Your email address is already verified."},
                status=status.HTTP_200_OK,
            )
        verify_url = _send_verification_email(user)
        payload = {"detail": "Verification email sent. Please check your inbox."}
        if settings.DEBUG:
            payload["dev_verify_url"] = verify_url
        return Response(payload, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "auth_login"

    @extend_schema(request=ChangePasswordSerializer, responses={200: ActionMessageSerializer})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "auth_register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verify_url = _send_verification_email(user)
        payload = {
            "detail": "Registration successful. Please check your email to verify your account.",
            "username": user.username,
        }
        if settings.DEBUG:
            payload["dev_verify_url"] = verify_url
        return Response(payload, status=status.HTTP_201_CREATED)


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

    @extend_schema(responses=StatsOverviewSerializer)
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
