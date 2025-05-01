FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production && npm install @azure/identity @azure/keyvault-secrets
COPY . .

# === 修正箇所 ===
RUN mkdir -p /home/site/certs && chmod 755 /home/site/certs
COPY certs/bot-certificate.pfx /home/site/certs/
RUN chmod 644 /home/site/certs/bot-certificate.pfx

EXPOSE 3978
CMD ["node", "index.js"]

