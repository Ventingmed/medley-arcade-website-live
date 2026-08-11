FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js config.json ./
RUN mkdir -p /app/data
EXPOSE 10000
CMD ["node","server.js"]
