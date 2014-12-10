from django.shortcuts import get_object_or_404, render, render_to_response

# Import models
from blog.models import BlogPost, Category

# Import forms
from blog.forms import BlogPostForm


def index(request, page=0):
	page = int(page)
	index = page * 5 #5 is blog posts per page
	offset = index + 5

	allPosts = BlogPost.objects.all()

	context = {
		'posts': allPosts[index:offset],
		'categories': Category.objects.all(),

		'next_page_exists': allPosts[offset:].exists(),
		'prev_page_exists': page > 0,

		'next_page': page+1,
		'prev_page': page-1,
		'curr_page': page,

	}

	return render(request, 'blog/index.html', context)


def post(request, slug):
    return render(request, 'blog/post.html', {
        'post': get_object_or_404(BlogPost, slug=slug),
    })


def create(request):
	return render(request, 'blog/create.html', {"post_form": BlogPostForm})
