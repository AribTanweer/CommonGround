from django.urls import path
from .views import MeView, PublicProfileView, LeaderboardView, StatsOverviewView

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("<str:username>/", PublicProfileView.as_view(), name="user-profile"),
]

# Stats and leaderboard are included via config/urls but we keep them here
# for logical grouping. They'll be included at a different prefix.
