FROM node:latest

WORKDIR /app

COPY . .

RUN npm update && npm install --only=prod

EXPOSE 80

CMD [ "node", "./index.js" ]