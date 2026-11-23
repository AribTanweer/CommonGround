from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.challenges.models import Challenge
from apps.solutions.models import Solution
from .models import Comment, Report
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    ReportSerializer,
)


class IsCommentAuthorOrModerator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if obj.author == request.user:
            return True
        if request.user.is_staff or request.user.groups.filter(name="moderator").exists():
            return True
        return False


class ChallengeCommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /challenges/{challenge_pk}/comments/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Comment.objects.none()
        return (
            Comment.objects
            .filter(challenge_id=self.kwargs["challenge_pk"], parent__isnull=True)
            .select_related("author")
            .prefetch_related("replies__author")
        )

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def perform_create(self, serializer):
        challenge = get_object_or_404(Challenge, pk=self.kwargs["challenge_pk"])
        serializer.save(author=self.request.user, challenge=challenge)


class SolutionCommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /solutions/{solution_pk}/comments/"""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Comment.objects.none()
        return (
            Comment.objects
            .filter(solution_id=self.kwargs["solution_pk"], parent__isnull=True)
            .select_related("author")
            .prefetch_related("replies__author")
        )

    def get_serializer_class(self):
        if self.request and self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def perform_create(self, serializer):
        solution = get_object_or_404(Solution, pk=self.kwargs["solution_pk"])
        serializer.save(author=self.request.user, solution=solution)


class CommentDetailDeleteView(generics.DestroyAPIView):
    """DELETE /comments/{pk}/ (Author or moderator)"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsCommentAuthorOrModerator]


class ReportCreateView(generics.CreateAPIView):
    """POST /reports/"""
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
