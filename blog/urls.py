from django.conf.urls import patterns, url

from blog import views


urlpatterns = patterns('',
	# Index page
	url(r'^$', views.index, name='index'),


)
