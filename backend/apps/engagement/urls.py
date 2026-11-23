from django.urls import path
from .views import (
    ChallengeCommentListCreateView,
    SolutionCommentListCreateView,
    CommentDetailDeleteView,
    ReportCreateView,
)

urlpatterns = [
    path(
        "challenges/<int:challenge_pk>/comments/",
        ChallengeCommentListCreateView.as_view(),
        name="challenge-comments",
    ),
    path(
        "solutions/<int:solution_pk>/comments/",
        SolutionCommentListCreateView.as_view(),
        name="solution-comments",
    ),
    path("comments/<int:pk>/", CommentDetailDeleteView.as_view(), name="comment-detail"),
    path("reports/", ReportCreateView.as_view(), name="report-create"),
]
