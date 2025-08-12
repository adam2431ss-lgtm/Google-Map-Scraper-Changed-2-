# Use official Node.js LTS image
FROM node:20-bullseye-slim

# Install required packages and chromium
RUN apt-get update && apt-get install -y       ca-certificates       fonts-liberation       libappindicator3-1       libasound2       libatk1.0-0       libcups2       libdbus-1-3       libgdk-pixbuf2.0-0       libnspr4       libnss3       libxss1 \
libu2f-udev \
    libvulkan1 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \       wget       xdg-utils       gnupg       --no-install-recommends &&       rm -rf /var/lib/apt/lists/*

# Install chromium stable
RUN apt-get update && apt-get install -y chromium

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy app source
COPY . .

# Expose port
ENV PORT 8080
EXPOSE 8080

# Set CHROME_PATH for puppeteer
ENV CHROME_PATH=/usr/bin/chromium

CMD ["npm", "start"]
