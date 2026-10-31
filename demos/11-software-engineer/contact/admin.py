from django.contrib import admin

# Register your models here.

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "email",
        "kind",
        "scale",
        "created_at",
    )

    search_fields = ("name", "email", "message")
    list_filter = ("kind", "scale", "created_at")
    readonly_fields = ("created_at",)
