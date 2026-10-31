

# Create your views here.

from django.shortcuts import render, redirect
from django.contrib import messages
from .models import ContactMessage

def home(request):
    return render(request, "index.html")

def contact_submit(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip()
        kind = request.POST.get("kind", "").strip()
        scale = request.POST.get("scale", "").strip()
        message = request.POST.get("message", "").strip()

        if not all([name, email, kind, scale, message]):
            messages.error(request, "لطفاً تمام فیلدها را پر کنید.")
            return redirect("/#contact")

        if len(name) < 3 or len(message) < 20:
            messages.error(request, "نام یا شرح مسئله معتبر نیست.")
            return redirect("/#contact")

        ContactMessage.objects.create(
            name=name,
            email=email,
            kind=kind,
            scale=scale,
            message=message,
        )

        messages.success(request, "پیام شما با موفقیت ارسال شد  .")
        return redirect("/#contact")

    return redirect("/#contact")