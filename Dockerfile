# FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7
#
# RUN pip install pipenv
# COPY Pipfile .
# COPY Pipfile.lock .
# RUN pipenv install --system --deploy --ignore-pipfile
# COPY ./app /app/app
from kennethreitz/pipenv
ADD ./app /app/app
WORKDIR /app


CMD uvicorn --host '0.0.0.0' --port 80 --log-level debug app.main:app
