FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies including TypeScript
RUN npm install && npm install --save-dev typescript @types/react @types/node

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
