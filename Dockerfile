FROM node:8.10
WORKDIR /code
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon
VOLUME /code/node_modules
COPY . .
EXPOSE 4000
