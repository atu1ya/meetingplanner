# 1. Use Node 20 slim
FROM node:20-slim

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
# --omit=dev keeps it small
# npm cache clean ensures no bad data persists
RUN npm install --omit=dev && npm cache clean --force

# 5. Copy the rest of the application
COPY . .

# 6. Expose the port (matches your fly.toml)
EXPOSE 8080

# 7. Start the application
CMD ["npm", "start"]