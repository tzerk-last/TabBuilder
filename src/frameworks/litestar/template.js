// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const LITESTAR = {
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
  };

module.exports = { LITESTAR };
