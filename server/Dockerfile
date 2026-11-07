FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV HOST=0.0.0.0
EXPOSE 8787
CMD ["node","index.js"]
