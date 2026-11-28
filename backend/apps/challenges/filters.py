from django.db import models
import django_filters
from .models import Challenge


class ChallengeFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    author = django_filters.CharFilter(field_name="author__username", lookup_expr="iexact")
    status = django_filters.CharFilter(field_name="status")
    tag = django_filters.CharFilter(field_name="tags__slug")
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    space = django_filters.CharFilter(field_name="space__slug", lookup_expr="iexact")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Challenge
        fields = ["category", "category_slug", "author", "status", "tag", "location", "space"]

    def filter_category(self, queryset, name, value):
        if str(value).isdigit():
            return queryset.filter(category__id=int(value))
        return queryset.filter(category__slug=value)

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(title__icontains=value) | models.Q(description__icontains=value)
        )

