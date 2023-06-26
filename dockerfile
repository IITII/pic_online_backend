from node:18-alpine

LABEL maintainer="IITII <ccmejx@gmail.com>"

ENV NAS_DOMAIN="0.0.0.0"
ENV PIC_BASE_DIR=/pic/data
ENV MOLECULER_PORT=8089
ENV MOLECULER_DDNS_ENABLE=false

ENV PIC_DIR=$PIC_BASE_DIR/images
ENV VIDEO_DIR=$PIC_BASE_DIR/video
ENV PIC_POSTER_DIR=$PIC_BASE_DIR/cache
ENV PIC_PREFIX=http://$NAS_DOMAIN:$MOLECULER_PORT
ENV MOLECULER_DDNS_DOMAIN=$NAS_DOMAIN
ENV MOLECULER_DDNS_TOKEN=$NAS_DOMAIN
# 登陆过期时间, 单位小时
ENV JWT_TOKEN_EXPIRE=336
# "Console": 日志输出到 std, "File": 日志输出到文件
ENV PIC_LOGGER_TYPE=Console

ADD . /pic
WORKDIR /pic
volume ["/pic/logs", "$PIC_BASE_DIR/images", "$PIC_BASE_DIR/video"]

RUN set -x \
&& rm -rf data && mkdir data \
&& apk update \
&& apk add ffmpeg \
&& wget https://github.com/IITII/pic_online/releases/latest/download/pic_online_pic.zip -O /tmp/pic.zip \
&& unzip /tmp/pic.zip -d data/pic && mv data/pic/dist/spa/* data/pic/ && rm -rf data/pic/dist/ /tmp/pic.zip \
&& mkdir $PIC_BASE_DIR/images $PIC_BASE_DIR/video $PIC_BASE_DIR/cache \
&& touch $PIC_BASE_DIR/cache/cache.txt \
&& npm i

expose 8089
CMD ["npm", "start"]