# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Προαιρετικό: σταθερό URL Grafana. Κενό = υπολογίζεται στον browser (<host>:3000).
ARG VUE_APP_GRAFANA_URL=
ENV VUE_APP_GRAFANA_URL=$VUE_APP_GRAFANA_URL
RUN npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
