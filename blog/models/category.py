#-*- coding: utf-8 -*-

from django.db import models
from django.core.urlresolvers import reverse
from django.utils.text import slugify


class Category(models.Model):

    title = models.CharField(max_length=75)
    parent = models.ForeignKey('self', null=True, blank=True)

    description = models.CharField(max_length=255, blank=True)

    is_removed = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)

    slug = models.SlugField(unique=True)

    #topic_count = models.PositiveIntegerField(_("topic count"), default=0)

    class Meta:
        app_label = 'blog'
        ordering = ['title', ]
        verbose_name = "category"
        verbose_name_plural = "categories"

    @models.permalink
    def get_absolute_url(self):
        return 'blog:category', (self.slug)

    @property
    def is_subcategory(self):
        if self.parent_id:
            return True
        else:
            return False

    # For admin site
    is_removed.boolean = True
    is_private.boolean = True

    def __unicode__(self):
        if self.parent:
            return "%s, %s" % (self.parent.title, self.title)
        else:
            return self.title


    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super(Category, self).save(*args, **kwargs)
