
# STAGE 1: Base 
FROM node:24-alpine AS base

WORKDIR /backend

COPY package*.json ./

RUN npm ci

# STAGE 2: Development
FROM base AS development

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "run", "dev"]

# STAGE 3: Build
FROM base AS build

COPY . .

RUN npm run build

# STAGE 4: Production
FROM node:24-alpine AS production

WORKDIR /backend

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=build /backend/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/app.js"]