from django.urls import path
from apps.accounts.views import StatsOverviewView, LeaderboardView

urlpatterns = [
    path("stats/overview/", StatsOverviewView.as_view(), name="stats-overview"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
