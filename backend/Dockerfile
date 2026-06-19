FROM node:20-alpine

# sharp needs these on alpine
RUN apk add --no-cache vips-dev

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

RUN mkdir -p uploads/profile_images uploads/documents uploads/resumes uploads/images logs

EXPOSE 4000
CMD ["node", "src/server.js"]
