FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM deps AS build
ARG VITE_API_URL=http://localhost:4000
ARG VITE_MQTT_URL=ws://localhost:9001
ARG VITE_REALTIME_MODE=mqtt
ARG VITE_ENABLE_MOCKS=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MQTT_URL=$VITE_MQTT_URL
ENV VITE_REALTIME_MODE=$VITE_REALTIME_MODE
ENV VITE_ENABLE_MOCKS=$VITE_ENABLE_MOCKS
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

