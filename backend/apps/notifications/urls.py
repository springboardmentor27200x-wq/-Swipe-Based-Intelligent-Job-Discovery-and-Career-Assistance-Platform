from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.notification_list, name='notification_list'),
    path('notifications/create/', views.create_notification_manual, name='notification_create'),
    path('notifications/unread-count/', views.unread_count, name='notification_unread_count'),
    path('notifications/mark-all-read/', views.mark_all_read, name='notification_mark_all_read'),
    path('notifications/<uuid:pk>/read/', views.mark_read, name='notification_mark_read'),
    path('notifications/<uuid:pk>/', views.delete_notification, name='notification_delete'),
]
