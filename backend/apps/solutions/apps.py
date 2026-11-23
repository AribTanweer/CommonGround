from django.apps import AppConfig


class SolutionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.solutions"

    def ready(self):
        import apps.solutions.signals  # noqa: F401
