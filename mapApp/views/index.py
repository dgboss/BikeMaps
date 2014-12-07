from django.shortcuts import render

# Import models
from mapApp.models import Incident, Hazard, Theft, AlertArea

# Import forms
from mapApp.forms import IncidentForm, GeofenceForm, EditForm, HazardForm, TheftForm


def index(request, lat=None, lng=None, zoom=None):
	context = indexContext(request)

	# Add zoom and center data if present
	if not None in [lat, lng, zoom]:
		context['lat']= float(lat)
		context['lng']= float(lng)
		context['zoom']= int(zoom)

	return render(request, 'mapApp/index.html', context)


# Define default context data for the index view. Forms can be overridden to display errors (used by other views)
def indexContext(request, incidentForm=IncidentForm(), geofenceForm=GeofenceForm(), hazardForm=HazardForm(), theftForm=TheftForm()):
	incidents = Incident.objects.all()

	return {
		# Model data used by map
		'collisions': incidents.exclude(incident__contains="Near collision"),
		'nearmisses': incidents.filter(incident__contains="Near collision"),
		'hazards': Hazard.objects.all(),
		'thefts': Theft.objects.all(),
		"geofences": AlertArea.objects.filter(user=request.user.id),

		# Form data used by map
		"incidentForm": incidentForm,
		"geofenceForm": geofenceForm,
		"hazardForm": hazardForm,
		"theftForm": theftForm,

		"editForm": EditForm()
	}
