from django import forms
from django.utils.text import slugify

from .models import BlogPost

class AddForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = (
            'title'
        )

    def save(self):
        instance = super(AddForm, self).save(commit=False)
        instance.slug = slugify(instance.title)
        instance.save()

        return instance
