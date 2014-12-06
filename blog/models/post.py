#-*- coding: utf-8 -*-

from django.db import models
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils.text import slugify

class BlogPost(models.Model):
    title = models.CharField(max_length=75)
    body = models.TextField(null=True, blank=True)

    author = models.ForeignKey(settings.AUTH_USER_MODEL)
    post_date = models.DateTimeField(auto_now_add=True)

    category = models.ForeignKey('blog.Category', related_name='categoryPost', null=True, blank=True)

    is_draft = models.BooleanField(default=True)
    is_removed = models.BooleanField(default=False)

    slug = models.SlugField(unique=True)

    class Meta:
        app_label = 'blog'
        ordering = ['title', ]
        verbose_name = "post"
        verbose_name_plural = "posts"

    @models.permalink
    def get_absolute_url(self):
        return 'blog:post', (self.slug)

    def __unicode__(self):
        return "%s: %s..." % (self.author.username, self.body[:50])

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super(BlogPost, self).save(*args, **kwargs)
