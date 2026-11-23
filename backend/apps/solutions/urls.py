from django.urls import path
from .views import (
    ChallengeSolutionListCreateView,
    SolutionDetailView,
    SolutionVoteView,
    SolutionAcceptView,
    SolutionRevisionListView,
)

urlpatterns = [
    path(
        "challenges/<int:challenge_pk>/solutions/",
        ChallengeSolutionListCreateView.as_view(),
        name="challenge-solutions",
    ),
    path("solutions/<int:pk>/", SolutionDetailView.as_view(), name="solution-detail"),
    path("solutions/<int:pk>/vote/", SolutionVoteView.as_view(), name="solution-vote"),
    path("solutions/<int:pk>/accept/", SolutionAcceptView.as_view(), name="solution-accept"),
    path(
        "solutions/<int:pk>/revisions/",
        SolutionRevisionListView.as_view(),
        name="solution-revisions",
    ),
]
