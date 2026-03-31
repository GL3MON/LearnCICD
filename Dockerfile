FROM node:current-alpine3.23

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npx", "nodemon", "start", "server.js"]