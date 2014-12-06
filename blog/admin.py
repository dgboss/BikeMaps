from django.contrib import admin

# Register models
from blog.models.category import Category
from blog.models.post import BlogPost

from spirit.models import User

class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("title",)}

    list_display = ('title', 'is_private', 'parent', 'is_removed', 'description', 'slug')

    fieldsets = [
	    ('Basic', {'fields': ['title', 'is_private', 'parent', 'is_removed', 'slug']}),
	    ('Detail', {'fields': ['description'], 'classes':['collapse']}),
    ]
admin.site.register(Category, CategoryAdmin)


class BlogPostAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("title",)}

    list_display = ('title', 'author', 'category', 'is_draft', 'post_date', 'is_removed', 'slug')

    fieldsets = [
	    ('Basic', {'fields': ['title', 'author', 'is_draft', 'category', 'is_removed', 'slug']}),
	    ('Post', {'fields': ['body'], 'classes':['collapse']}),
    ]
admin.site.register(BlogPost, BlogPostAdmin)
