"""
SwipeX Notifications Views — Milestone 4

GET    /api/v1/notifications/                — list (paginated-lite, ?unread=true filter)
GET    /api/v1/notifications/unread-count/    — badge count
PATCH  /api/v1/notifications/<id>/read/       — mark one as read
POST   /api/v1/notifications/mark-all-read/   — mark all as read
DELETE /api/v1/notifications/<id>/            — delete one
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """GET /api/v1/notifications/?unread=true&type=high_match&limit=50"""
    qs = Notification.objects.filter(user=request.user)

    unread = request.query_params.get('unread')
    if unread is not None:
        qs = qs.filter(is_read=(unread.lower() in ('1', 'true', 'yes')))

    notif_type = request.query_params.get('type')
    if notif_type:
        qs = qs.filter(type=notif_type)

    try:
        limit = min(int(request.query_params.get('limit', 50)), 200)
    except (TypeError, ValueError):
        limit = 50

    qs = qs.select_related('job', 'job__company')[:limit]
    return Response({
        'success': True,
        'data': NotificationSerializer(qs, many=True, context={'request': request}).data,
        'unread_count': Notification.objects.filter(user=request.user, is_read=False).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """GET /api/v1/notifications/unread-count/"""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'success': True, 'data': {'unread_count': count}})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    """PATCH /api/v1/notifications/<pk>/read/"""
    notif = get_object_or_404(Notification, pk=pk, user=request.user)
    notif.mark_read()
    return Response({'success': True, 'data': NotificationSerializer(notif, context={'request': request}).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """POST /api/v1/notifications/mark-all-read/"""
    updated = Notification.objects.filter(user=request.user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )
    return Response({'success': True, 'data': {'marked_read': updated}})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    """DELETE /api/v1/notifications/<pk>/"""
    notif = get_object_or_404(Notification, pk=pk, user=request.user)
    notif.delete()
    return Response({'success': True, 'message': 'Notification deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notification_manual(request):
    """
    POST /api/v1/notifications/
    Lets a user create a note-to-self style reminder, or lets internal
    tooling create arbitrary notifications for the authenticated user.
    Body: { title, message?, type?, priority?, link? }
    """
    title = request.data.get('title')
    if not title:
        return Response({'success': False, 'error': {'message': 'title is required.'}},
                        status=status.HTTP_400_BAD_REQUEST)
    notif = Notification.objects.create(
        user=request.user,
        title=title,
        message=request.data.get('message', ''),
        type=request.data.get('type', Notification.NotificationType.SYSTEM),
        priority=request.data.get('priority', Notification.Priority.NORMAL),
        link=request.data.get('link', ''),
    )
    return Response({'success': True, 'data': NotificationSerializer(notif, context={'request': request}).data},
                    status=status.HTTP_201_CREATED)
