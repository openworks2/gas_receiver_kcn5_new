FROM node:20.10.0-alpine3.18

RUN apk update && apk add redis

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 80 6379

CMD ["./bin/start.sh"]