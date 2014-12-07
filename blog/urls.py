from django.conf.urls import patterns, url

from blog import views


urlpatterns = patterns('',
	# View Posts
	url(r'^$', views.index, name='index'),
	url(r'^(?P<page>-?\d*)?/?$', views.index, name='index'),
	
	url(r'^post/(?P<slug>[\w-]*)/?$', views.post, name='post'),

	# Create new post
	url(r'^create/?$', views.create, name='create'),

)
