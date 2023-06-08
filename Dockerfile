# use for local development environment
FROM node:14.20.0-bullseye


WORKDIR /app

COPY package*.json ./
COPY adc.json /app/adc.json

RUN npm install

ENV GOOGLE_APPLICATION_CREDENTIALS=/app/adc.json

COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]