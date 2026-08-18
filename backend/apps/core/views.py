"""Core views — health check and platform info."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Platform health check endpoint."""
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:
        db_ok = False

    return Response({
        'success': True,
        'data': {
            'status': 'healthy' if db_ok else 'degraded',
            'platform': 'SwipeX',
            'version': '1.0.0',
            'milestone': 1,
            'timestamp': timezone.now().isoformat(),
            'services': {
                'database': 'up' if db_ok else 'down',
                'api': 'up',
            }
        }
    })
