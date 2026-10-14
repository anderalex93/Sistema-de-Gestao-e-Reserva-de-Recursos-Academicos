# Front para o `docker compose up` local (#37): build do Vite servido por um nginx. Em produção
# o front vai para a Vercel (docs/deploy.md); esta imagem é para rodar o projeto inteiro rápido.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=http://localhost:8000/api/v1
ARG VITE_SITE_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL VITE_SITE_URL=$VITE_SITE_URL
RUN npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
