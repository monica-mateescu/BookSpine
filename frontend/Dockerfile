# STAGE 1: Base 
FROM node:24-alpine AS base

WORKDIR /frontend

COPY package*.json ./

RUN npm ci && chown -R node:node /frontend

# STAGE 2: Development
FROM base AS development

COPY . .

EXPOSE 5173

USER node

CMD ["npm", "run", "dev", "--", "--host", "0.0.0"]

# STAGE 3: Build
FROM base AS build

COPY . .

ARG VITE_APP_SERVER_URL
ARG VITE_BASE_APP_URL
ARG VITE_TURNSTILE_SITE_KEY

ENV VITE_APP_SERVER_URL=$VITE_APP_SERVER_URL
ENV VITE_BASE_APP_URL=$VITE_BASE_APP_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

RUN npm run build

# STAGE 4: Production
FROM nginx:alpine AS production

COPY --from=build /frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 5173

USER nginx

CMD ["nginx", "-g", "daemon off;"]