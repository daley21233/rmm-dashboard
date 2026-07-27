FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Explicitly install TypeScript
RUN npm install --save-dev typescript @types/react @types/node

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
