# Use Node.js LTS
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Install Expo CLI globally
RUN npm install -g expo-cli

# Expose the default Expo port
EXPOSE 19000 19001 19002

# Start Expo
CMD ["expo", "start", "--tunnel"]
