FROM node:slim as builder
LABEL maintainer="IITII <ccmejx@gmail.com>"
COPY . /pic_online
WORKDIR /pic_online
RUN npm i && \
apt clean
EXPOSE 3000
CMD ["npm","start"]