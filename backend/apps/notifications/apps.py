from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    label = 'notifications'
    verbose_name = 'Notifications'

    def ready(self):
        # Wire up signal handlers (new applications, status changes, etc.)
        from . import signals  # noqa: F401
