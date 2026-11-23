from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Return consistent JSON error responses: {"detail": "...", "errors": {...}}."""
    response = exception_handler(exc, context)

    if response is not None:
        errors = {}
        detail = ""

        if isinstance(response.data, dict):
            detail = response.data.pop("detail", "")
            if not detail and "non_field_errors" in response.data:
                detail = response.data.pop("non_field_errors")
                if isinstance(detail, list):
                    detail = " ".join(str(d) for d in detail)
            errors = response.data if response.data else {}
            if not detail:
                detail = "Validation error." if errors else "An error occurred."
        elif isinstance(response.data, list):
            detail = " ".join(str(d) for d in response.data)
        else:
            detail = str(response.data)

        response.data = {"detail": str(detail), "errors": errors}

    return response
