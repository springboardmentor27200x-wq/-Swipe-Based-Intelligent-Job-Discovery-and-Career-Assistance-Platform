from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, RecruiterProfile


class UserAdmin(BaseUserAdmin):
    ordering = ['-date_joined']
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_email_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_email_verified', 'auth_provider']
    search_fields = ['email', 'first_name', 'last_name']
    readonly_fields = ['id', 'date_joined', 'last_login']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Role & Provider', {'fields': ('role', 'auth_provider')}),
        ('Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_email_verified', 'is_profile_complete')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'role', 'password1', 'password2'),
        }),
    )


admin.site.register(User, UserAdmin)
admin.site.register(UserProfile)
admin.site.register(RecruiterProfile)
