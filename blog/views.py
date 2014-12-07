from django.shortcuts import get_object_or_404, render

# Import models
from blog.models import BlogPost
from blog.models import Category

# Import forms
# from mapApp.forms.incident import IncidentForm


def index(request, page):
	if not page: page = 0
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
    post = get_object_or_404(BlogPost, slug=slug)

    return render(request, 'blog/post.html', {
        'post': post,
    })
