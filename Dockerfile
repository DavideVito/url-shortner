FROM ubuntu:latest

RUN apt-get update

RUN apt-get -y install nodejs 

RUN apt-get -y install npm 

RUN apt-get clean

ENV PORT=8080

EXPOSE 8080

COPY . .

RUN npm install

CMD ["node", "index.js"]