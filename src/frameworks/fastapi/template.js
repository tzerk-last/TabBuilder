// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const FASTAPI = {
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
  };

module.exports = { FASTAPI };
