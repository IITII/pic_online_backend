# Flame Graph

* 因为默认的 `npm run dev` 用的是 `moleculer-runner`, 所以需要自己单独写一个 js 文件来启动服务, 并且在启动服务的时候加上 --prof 参数, 用来生成 v8 的 profile 文件
* 这里直接使用 0x 来生成 flame graph
* `0x -o test/unit/services/file.spec.js`

## 0x
https://github.com/davidmarkclements/0x

Installation:
```
npm install -g 0x
```
Usage:
```
0x -o index.js
```

> for pwsh users, switch to CMD at first or run with `npx` 
> 
```
npx 0x -o index.js
```

> 以下内容来自 moleculer 的 profiling.md  
> https://github.com/moleculerjs/moleculer/blob/master/docs/profiling.md?plain=1  
> 

# Profiling in NodeJS

1. Run app in profiler mode
   ```
   node --prof main.js
   ```

2. Convert isolate file to text
   ```
   node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > processed.txt
   ```

[More info](https://nodejs.org/en/docs/guides/simple-profiling/)

## Print optimizing

```
node --trace-opt index.js > trace.txt
```

With de-optimizing
```
node --trace-opt --trace-deopt index.js > trace.txt
```

More info: https://community.risingstack.com/how-to-find-node-js-performance-optimization-killers/

## Inspecting & Profiling in Chrome

`node --inspect --expose-gc benchmark/perf-runner.js`

## IR Hydra

http://mrale.ph/irhydra/2/

```
node --trace-hydrogen --trace-phase=Z --trace-deopt --code-comments --hydrogen-track-positions --redirect-code-traces --redirect-code-traces-to=code.asm index.js
```
## JSON parse/stringify

https://github.com/douglascrockford/JSON-js


## Flame graph

http://www.brendangregg.com/blog/2014-09-17/node-flame-graphs-on-linux.html
https://www.slideshare.net/brendangregg/blazing-performance-with-flame-graphs

For Windows: https://github.com/google/UIforETW/releases

### 0x
https://github.com/davidmarkclements/0x

Installation:
```
npm install -g 0x
```
Usage:
```
0x -o index.js
```

## Others

http://mrale.ph/blog/2011/12/18/v8-optimization-checklist.html

http://stackoverflow.com/a/31549736/129346

https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#52-the-object-being-iterated-is-not-a-simple-enumerable

https://jsperf.com/let-compound-assignment

https://gist.github.com/trevnorris/f0907b010c9d5e24ea97

## Memory leak

https://www.youtube.com/watch?v=taADm6ndvVo&list=PLz6xH_GrBpquZgdVzEX4Bix0oxHQlZfwm&index=8
