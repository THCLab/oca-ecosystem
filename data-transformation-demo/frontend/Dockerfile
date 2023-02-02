FROM node:16 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM alpine as production
WORKDIR /app
RUN apk add --update libintl && apk add --virtual build_deps gettext
COPY --from=builder /app/dist/spa ./dist
