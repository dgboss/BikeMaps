from django.shortcuts import get_object_or_404, render, render_to_response

# Import models
from blog.models import BlogPost
from blog.models import Category

# Import forms
# from mapApp.forms.incident import IncidentForm


def index(request, page=0):
	page = int(page)
	index = page * 5
	offset = index + 5

	context = {
		'posts': BlogPost.objects.all()[index:offset],
		'categories': Category.objects.all(),
		'next_page': page+1,
		'prev_page': page-1,

	}

	return render(request, 'blog/index.html', context)


def post(request, slug):
    return render_to_response('blog/post.html', {
        'post': get_object_or_404(BlogPost, slug=slug),
    })


def create(request):
	return render(request, 'blog/index.html', context)
