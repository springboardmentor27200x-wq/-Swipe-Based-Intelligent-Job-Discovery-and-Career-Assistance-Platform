from django.contrib import admin 
from .models import Job, Application, SavedJob 
from .models import Notification

admin.site.register(Job) 
admin.site.register(Application) 
admin.site.register(SavedJob)
admin.site.register(Notification)
