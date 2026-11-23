from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count

from .serializers import RegisterSerializer, UserProfileSerializer, PublicUserSerializer

User = get_user_model()


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
        from django.db.models import Count

        total_challenges = Challenge.objects.count()
        resolved_count = Challenge.objects.filter(status=Challenge.Status.RESOLVED).count()
        active_users = User.objects.filter(is_active=True).count()
        top_categories = list(
            Category.objects.annotate(count=Count("challenge"))
            .order_by("-count")
            .values("name", "slug", "count")[:6]
        )

        return Response({
            "total_challenges": total_challenges,
            "resolved_count": resolved_count,
            "active_users": active_users,
            "top_categories": top_categories,
        })
