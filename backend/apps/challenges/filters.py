from django.db import models
import django_filters
from .models import Challenge


class ChallengeFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="category__id")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    status = django_filters.CharFilter(field_name="status")
    tag = django_filters.CharFilter(field_name="tags__slug")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Challenge
        fields = ["category", "category_slug", "status", "tag"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(title__icontains=value) | models.Q(description__icontains=value)
        )

