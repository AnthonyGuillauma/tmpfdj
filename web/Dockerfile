FROM node:latest

WORKDIR /app

COPY . .

RUN cd frontend && npm install
RUN cd backend && npm update && npm install --only=prod

EXPOSE 80

CMD [ "node", "./backend/index.js" ]