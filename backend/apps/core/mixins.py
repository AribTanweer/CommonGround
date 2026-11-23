"""Utility mixins for viewsets."""


class OwnerOnCreateMixin:
    """Automatically set author=request.user on create."""

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
