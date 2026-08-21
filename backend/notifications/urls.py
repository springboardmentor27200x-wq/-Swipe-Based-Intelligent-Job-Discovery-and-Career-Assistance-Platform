from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    PushSubscribeView,
    DeleteNotificationView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('<uuid:pk>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('read-all/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
    path('<uuid:pk>/delete/', DeleteNotificationView.as_view(), name='delete_notification'),
    path('push/subscribe/', PushSubscribeView.as_view(), name='push_subscribe'),
]
