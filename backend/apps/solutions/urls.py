from django.urls import path
from .views import (
    SolutionListView,
    ChallengeSolutionListCreateView,
    SolutionDetailView,
    SolutionVoteView,
    SolutionAcceptView,
    SolutionRevisionListView,
    SolutionMilestoneListCreateView, SolutionMilestoneDetailView,
    VolunteerListCreateView, ResourceOfferListCreateView,
    SolutionQuestionListCreateView, SolutionQuestionAnswerView, SolutionOutcomeView,
    SolutionProgressView,
    VolunteerWithdrawView, ResourceOfferRetractView,
)

urlpatterns = [
    path("solutions/", SolutionListView.as_view(), name="solution-list"),
    path(
        "challenges/<int:challenge_pk>/solutions/",
        ChallengeSolutionListCreateView.as_view(),
        name="challenge-solutions",
    ),
    path("solutions/<int:pk>/", SolutionDetailView.as_view(), name="solution-detail"),
    path("solutions/<int:pk>/vote/", SolutionVoteView.as_view(), name="solution-vote"),
    path("solutions/<int:pk>/accept/", SolutionAcceptView.as_view(), name="solution-accept"),
    path("solutions/<int:pk>/milestones/", SolutionMilestoneListCreateView.as_view(), name="solution-milestones"),
    path("milestones/<int:pk>/", SolutionMilestoneDetailView.as_view(), name="solution-milestone-detail"),
    path("solutions/<int:pk>/volunteers/", VolunteerListCreateView.as_view(), name="solution-volunteers"),
    path("solutions/<int:pk>/resources/", ResourceOfferListCreateView.as_view(), name="solution-resources"),
    path("volunteers/<int:pk>/", VolunteerWithdrawView.as_view(), name="solution-volunteer-withdraw"),
    path("resources/<int:pk>/", ResourceOfferRetractView.as_view(), name="solution-resource-retract"),
    path("solutions/<int:pk>/questions/", SolutionQuestionListCreateView.as_view(), name="solution-questions"),
    path("questions/<int:pk>/answer/", SolutionQuestionAnswerView.as_view(), name="solution-question-answer"),
    path("solutions/<int:pk>/outcome/", SolutionOutcomeView.as_view(), name="solution-outcome"),
    path("solutions/<int:pk>/progress/", SolutionProgressView.as_view(), name="solution-progress"),
    path(
        "solutions/<int:pk>/revisions/",
        SolutionRevisionListView.as_view(),
        name="solution-revisions",
    ),
]
