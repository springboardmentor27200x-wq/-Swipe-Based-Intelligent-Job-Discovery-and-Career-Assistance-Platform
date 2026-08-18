"""Custom exception handler for SwipeX API."""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Returns consistent JSON error responses across all API endpoints.
    Format: { "success": false, "error": { "code": ..., "message": ... } }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': _flatten_errors(response.data),
            }
        }
        response.data = error_data

    return response


def _flatten_errors(data):
    if isinstance(data, list):
        return ' '.join(str(e) for e in data)
    if isinstance(data, dict):
        messages = []
        for key, value in data.items():
            if key in ('detail', 'non_field_errors'):
                messages.append(str(value[0]) if isinstance(value, list) else str(value))
            else:
                val = value[0] if isinstance(value, list) else value
                messages.append(f"{key}: {val}")
        return ' '.join(messages)
    return str(data)
