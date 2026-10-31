from django.db import models

# Create your models here.

from django.db import models


class ContactMessage(models.Model):
    name = models.CharField(
        max_length=150,
        verbose_name="نام و نام خانوادگی"
    )
    email = models.EmailField(
        verbose_name="ایمیل"
    )
    kind = models.CharField(
        max_length=100,
        verbose_name="نوع همکاری"
    )
    scale = models.CharField(
        max_length=100,
        verbose_name="مقیاس فعلی"
    )
    message = models.TextField(
        verbose_name="شرح مسئله"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="تاریخ ارسال"
    )

    def __str__(self):
        return f"{self.name} - {self.kind}"

    class Meta:
        verbose_name = "پیام تماس"
        verbose_name_plural = "پیام‌های تماس"
        ordering = ["-created_at"]