FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7

RUN pip install pipenv
COPY Pipfile .
COPY Pipfile.lock .
RUN pipenv install --system --deploy --ignore-pipfile
COPY ./app /app/app
