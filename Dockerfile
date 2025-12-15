# 1. Use Node 20 slim for a balance of size and compatibility
FROM node:20-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first to cache dependencies
COPY package*.json ./

# 4. Install dependencies
# We use --omit=dev to keep the image small
# We verify cache clean to ensure no phantom locks persist
RUN npm install --omit=dev && npm cache clean --force

# 5. Copy the rest of the application
COPY . .

# 6. Set the port environment variable (Fly.io sets this, but good practice to default)
ENV PORT=8080

# 7. Expose the port
EXPOSE 8080

# 8. Start the application
CMD ["npm", "start"]