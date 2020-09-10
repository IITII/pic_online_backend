# pic_online_backend
> Backend for pic_online  

* Front: [pic_online](https://github.com/IITII/pic_online)
* Backend: [pic_online_backend](https://github.com/IITII/pic_online_backend)

### Project setup
```bash
npm install
```

### Start
```bash
npm start
```

### Project structure

```
pic_online
├── controllers // visit controllers
├── lib         
├── logs        // logger file
├── middlewares // middlewares
├── models      // data
├── public      // website file
│   ├── dist
│   ├── public
│   └── src
└── routes      // routes
```

### Config

> All configure in `./models/config.js` 
> Note: it will auto-add '/' after `bsae_dir` if it does not end with '/'  

|    Param    |                          Default                           |                  Description                  |
| :---------: | :--------------------------------------------------------: | :-------------------------------------------: |
|    port     |                           `3000`                           |             Server Listening port             |
|   pic_dir   | `process.env.PIC_DIR or path.resolve(__dirname, '../tmp')` |                  images dir                   |
|  base_dir   |   `process.env.PIC_BASE_DIR or 'http://localhost/pic/'`    | A dir path or url or anything you want to add |
|     log     |                             -                              |               logger configure                |
| log.logName |                        `Pic_Online`                        |                  logger name                  |
| log.logPath |        `path.resolve(__dirname, '../logs/log.log')`        |             logger file save path             |
    

### Debug

> All logs will save to `./logs/log.log`  