#!/bin/bash
docker-compose -f docker-compose.yml -p passwordless_frontend_test up -d
cd frontend && yarn test
cd ..
docker-compose -f docker-compose.yml -p passwordless_frontend_test down
