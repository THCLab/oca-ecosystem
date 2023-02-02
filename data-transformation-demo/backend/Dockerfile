FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i
COPY index.js ./
