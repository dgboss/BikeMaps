from django import forms
from django.utils.text import slugify

from blog.models import BlogPost

class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'body', 'body_html', 'author', 'category', 'is_draft', 'is_removed', 'slug']

    def save(self):
        instance = super(AddForm, self).save(commit=False)
        instance.slug = slugify(instance.title)
        instance.save()

        return instance
