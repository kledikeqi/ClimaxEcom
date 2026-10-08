PYTHON := venv/bin/python
PIP := venv/bin/pip

.PHONY: install backend frontend help

help:
	@echo "make install   - create venv, install backend + frontend dependencies"
	@echo "make backend   - run the FastAPI API on http://localhost:8000"
	@echo "make frontend  - run the Expo web app on http://localhost:8081"

install:
	python3 -m venv venv
	$(PIP) install -r backend/requirements.txt
	cd frontend && npm install

backend:
	cd backend && ../venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npx expo start
