from django.shortcuts import get_object_or_404, render

# Import models
from blog.models import BlogPost
from blog.models import Category

# Import forms
# from mapApp.forms.incident import IncidentForm


def index(request):
	context = {
		'posts': BlogPost.objects.all(),
		'categories': Category.objects.all()
	}

	return render(request, 'blog/index.html', context)


def post(request, slug):
    post = get_object_or_404(BlogPost, slug=slug)

    return render(request, 'blog/post.html', {
        'post': post,
    })
