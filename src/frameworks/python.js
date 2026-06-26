// @ts-check
'use strict';

/** @type {Record<string, import('../types').FrameworkTemplate>} */
const PYTHON_FRAMEWORKS = {
  'django': {
    id: 'django',
    name: 'Django',
    icon: '🎸',
    lang: 'python',
    description: 'Framework web completo con ORM y admin incluidos',
    version: '5.x',
    port: 8000,
    enabled: true,
    templates: ['standard'],
    architectures: ['standard'],
    enabled: true,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['{PROJECT_NAME}', 'app', 'app/templates', 'static'],
    files: {
      '{PROJECT_NAME}/settings.py':
`from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-changeme-replace-in-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = '{PROJECT_NAME}.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'app' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = '{PROJECT_NAME}.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
`,
      '{PROJECT_NAME}/urls.py':
`from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('app.urls')),
]
`,
      '{PROJECT_NAME}/__init__.py': '',
      '{PROJECT_NAME}/wsgi.py':
`import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{PROJECT_NAME}.settings')
application = get_wsgi_application()
`,
      '{PROJECT_NAME}/asgi.py':
`import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{PROJECT_NAME}.settings')
application = get_asgi_application()
`,
      'app/__init__.py': '',
      'app/views.py':
`from django.http import JsonResponse

def index(request):
    return JsonResponse({'message': 'Hello from {PROJECT_NAME}!'})

def health(request):
    return JsonResponse({'status': 'ok'})
`,
      'app/urls.py':
`from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('health/', views.health, name='health'),
]
`,
      'app/models.py':
`from django.db import models

# Create your models here.
`,
      'app/admin.py':
`from django.contrib import admin

# Register your models here.
`,
      'app/apps.py':
`from django.apps import AppConfig

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'
`,
      'manage.py':
`#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{PROJECT_NAME}.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
`,
      'requirements.txt': `django>=5.1\ngunicorn>=22.0\npython-dotenv>=1.0\n`,
      '.env.example':
`SECRET_KEY=your-secret-key-here-replace-before-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
`,
    },
  },

  'fastapi': {
    id: 'fastapi',
    name: 'FastAPI',
    icon: '🚀',
    lang: 'python',
    description: 'API moderna y rápida con tipado automático y documentación',
    version: '0.115+',
    port: 8000,
    enabled: true,
    templates: ['api'],
    architectures: ['standard'],
    enabled: true,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['app', 'app/routers', 'tests'],
    files: {
      'app/__init__.py': '',
      'app/main.py':
`from fastapi import FastAPI
from app.routers import items

app = FastAPI(
    title="{PROJECT_NAME}",
    description="API generada con FastAPI",
    version="1.0.0",
)

app.include_router(items.router)


@app.get("/")
def root():
    return {"message": "Hello from {PROJECT_NAME}!"}


@app.get("/health")
def health():
    return {"status": "ok"}
`,
      'app/routers/__init__.py': '',
      'app/routers/items.py':
`from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/items", tags=["items"])

_db = [{"id": 1, "name": "Item One"}, {"id": 2, "name": "Item Two"}]


@router.get("/")
def get_items():
    return _db


@router.get("/{item_id}")
def get_item(item_id: int):
    item = next((i for i in _db if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
`,
      'tests/__init__.py': '',
      'tests/test_main.py':
`from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_get_items():
    r = client.get("/items/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
`,
      'requirements.txt': `fastapi>=0.115\nuvicorn[standard]>=0.30\npython-dotenv>=1.0\nhttpx>=0.27\n`,
      'main.py':
`import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
`,
      '.env.example':
`APP_NAME={PROJECT_NAME}
DEBUG=true
PORT=8000
DATABASE_URL=sqlite:///./db.sqlite3
`,
    },
  },

  'flask': {
    id: 'flask',
    name: 'Flask',
    icon: '🍶',
    lang: 'python',
    description: 'Microframework minimalista y flexible para Python',
    version: '3.x',
    port: 5000,
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['app', 'app/templates', 'app/static', 'tests'],
    files: {
      'app/__init__.py':
`from flask import Flask


def create_app():
    app = Flask(__name__)

    from app.routes import main
    app.register_blueprint(main)

    return app
`,
      'app/routes.py':
`from flask import Blueprint, jsonify

main = Blueprint('main', __name__)


@main.route('/')
def index():
    return jsonify({"message": "Hello from {PROJECT_NAME}!"})


@main.route('/health')
def health():
    return jsonify({"status": "ok"})
`,
      'tests/__init__.py': '',
      'tests/test_routes.py':
`import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c


def test_index(client):
    r = client.get('/')
    assert r.status_code == 200
    data = r.get_json()
    assert 'message' in data


def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'ok'
`,
      'run.py':
`from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
`,
      'requirements.txt': `flask>=3.1\npython-dotenv>=1.0\ngunicorn>=22.0\npytest>=8.0\n`,
      '.env.example':
`FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db
`,
    },
  },

  'litestar': {
    id: 'litestar',
    name: 'Litestar',
    icon: '⭐',
    lang: 'python',
    description: 'Framework ASGI moderno con validación automática',
    version: '2.x',
    port: 8000,
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['app', 'app/routes', 'app/schemas', 'tests'],
    files: {
      'app/__init__.py': '',
      'app/main.py':
`from litestar import Litestar, get
from litestar.config.cors import CORSConfig

from app.routes.items import router


cors_config = CORSConfig(allow_origins=["*"])


@get("/")
async def root() -> dict:
    return {"message": "Hello from {PROJECT_NAME}!"}


@get("/health")
async def health() -> dict:
    return {"status": "ok", "app": "{PROJECT_NAME}"}


app = Litestar(
    route_handlers=[root, health, router],
    cors_config=cors_config,
)
`,
      'app/routes/__init__.py': '',
      'app/routes/items.py':
`from typing import Optional
from litestar import Router, get
from pydantic import BaseModel


class Item(BaseModel):
    id: int
    name: str


_db: list[Item] = [Item(id=1, name="Item One"), Item(id=2, name="Item Two")]


@get("/")
async def list_items() -> list[Item]:
    return _db


@get("/{item_id:int}")
async def get_item(item_id: int) -> Optional[Item]:
    return next((i for i in _db if i.id == item_id), None)


router = Router(path="/items", route_handlers=[list_items, get_item])
`,
      'app/schemas/__init__.py': '',
      'tests/__init__.py': '',
      'tests/test_main.py':
`from litestar.testing import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    res = client.get("/")
    assert res.status_code == 200
    assert "Hello from {PROJECT_NAME}!" in res.json()["message"]


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
`,
      'requirements.txt': `litestar[standard]>=2.12\nuvicorn[standard]>=0.30\npydantic>=2.0\npython-dotenv>=1.0\n`,
      'main.py':
`import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
`,
      '.env.example':
`APP_NAME={PROJECT_NAME}
DEBUG=true
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./db.sqlite3
`,
    },
  },
};

module.exports = { PYTHON_FRAMEWORKS };
