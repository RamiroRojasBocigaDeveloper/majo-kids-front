# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm ci

# Copia el código fuente
COPY . .

# Compila para producción
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copia la configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia los archivos compilados del build anterior
COPY --from=builder /app/dist/majo-kids-front/browser /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Inicia nginx
CMD ["nginx", "-g", "daemon off;"]
