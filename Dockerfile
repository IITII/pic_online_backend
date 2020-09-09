FROM node:slim as builder
LABEL maintainer="IITII <ccmejx@gmail.com>"
COPY . /pic_online_bk
WORKDIR /pic_online_bk

ENV PIC_DIR="/pic_dir" \
    PIC_BASE_DIR="pic_dir"

RUN npm install && \
mkdir /pic_dir && \
apt clean

EXPOSE 3000
CMD ["npm","start"]