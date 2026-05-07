FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["node", "dist/index.js"]
