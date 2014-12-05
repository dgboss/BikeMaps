"""
Django settings for VicBikeMap project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

from VicBikeMap.settings.base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '$e05l@n&nv*zh@m=4dgx8j-rj^$w2ugj%$&*99=p$vwd5%ya53'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

TEMPLATE_DEBUG = True

TEMPLATE_DIRS = [os.path.join(BASE_DIR, 'templates')]

ALLOWED_HOSTS = ['localhost', '127.0.0.1']


# Application definitions

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # forum
    'spirit',
    'haystack',
    'djconfig',

    # mapApp requirements
    'minidetector', # Mobile detector
    'django_cron', # Cron tasks
    'django.contrib.gis',
    'djgeojson',
    'crispy_forms',
    'mapApp',
    
    # Blog app
    'blog'
)

# Database
DATABASES = {
    'default': {
        # PostgreSQL database connection on Taylor's Windows computer
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        # 'OPTIONS': {'charset': 'utf8mb4'},
        'NAME': 'bikeDB',
        'USER': 'postgres'
        # 'PASSWORD': 'SUPER_SECRET'


    }
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

STATIC_PATH = os.path.join(BASE_DIR,'static')

STATICFILES_DIRS = (
    STATIC_PATH,
)

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR,'media')

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend' #Dummy backend for development that writes to stdout

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
