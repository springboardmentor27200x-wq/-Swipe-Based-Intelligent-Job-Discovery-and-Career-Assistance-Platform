FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Build-time API URL for the production bundle. Vite inlines
# import.meta.env.* at build time, so this must be passed as a Docker build
# arg (docker build --build-arg VITE_API_BASE_URL=...) — an env var set only
# at container runtime would have no effect on an already-built bundle.
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
