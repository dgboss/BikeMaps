from django.shortcuts import render

# Import models
# from mapApp.models.incident import Incident

# Import forms
# from mapApp.forms.incident import IncidentForm


def index(request):
	context = {'phrase': "hello world"}

	return render(request, 'blog/index.html', context)
