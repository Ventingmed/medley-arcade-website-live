FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY config.json ./
COPY server.js ./
RUN mkdir -p /app/data && echo "Medley Arcade Authority 094 startup hotfix"
EXPOSE 10000
CMD ["node","server.js"]
