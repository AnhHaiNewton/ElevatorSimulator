FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV PORT=3001
EXPOSE 3001
CMD ["npm", "start"]
