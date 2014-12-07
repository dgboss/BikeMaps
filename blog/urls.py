from django.conf.urls import patterns, url

from blog import views


urlpatterns = patterns('',
	# Index page
	url(r'^/?(?P<page>-?\d*)?/?$', views.index, name='index'),
	url(r'^post/(?P<slug>[\w-]*)/?$', views.post, name='post'),


)
