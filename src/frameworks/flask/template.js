// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const FLASK = {
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
  };

module.exports = { FLASK };
