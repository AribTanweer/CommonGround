from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TagViewSet, ChallengeViewSet, ChallengeUpdateListCreateView

router = DefaultRouter()
router.register("challenges", ChallengeViewSet, basename="challenge")
router.register("categories", CategoryViewSet, basename="category")
router.register("tags", TagViewSet, basename="tag")

urlpatterns = [
    path(
        "challenges/<int:challenge_pk>/updates/",
        ChallengeUpdateListCreateView.as_view(),
        name="challenge-updates",
    ),
    path("", include(router.urls)),
]
