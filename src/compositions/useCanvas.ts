import { nextTick, ref, onMounted, Ref } from "vue";
// import { throttle } from "throttle-and-debounce";

function throttle(this: any, fn: Function, delay: number) {
  let timer = null; // 把变量放函数里面，避免全局污染
  let flag = false;
  let that = this;
  return function () {
    if (flag) return;
    flag = true;
    let arg = arguments; // 此处为fn函数的参数
    timer = setTimeout(() => {
      fn.apply(that, arg);
      flag = false;
    }, delay);
  };
}

type StrokeStyleProp = string | CanvasGradient | CanvasPattern;

interface PathProp {
  width?: string | number;
  color?: StrokeStyleProp;
  x?: any;
  y?: any;
}

export default function useCanvas(myCanvasRef: Ref<HTMLCanvasElement>) {
  const initCanvasSize = () => {
    myCanvasRef.value.width = document.documentElement.clientWidth;
    myCanvasRef.value.height = document.documentElement.clientHeight;
  };
  // @ts-ignore
  let myCanvasCtx: CanvasRenderingContext2D = {};

  const clearRect = () => {
    myCanvasCtx.clearRect(
      0,
      0,
      myCanvasRef.value.width,
      myCanvasRef.value.height
    );
  };

  onMounted(() => {
    myCanvasCtx = myCanvasRef.value.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    nextTick(() => {
      myCanvasCtx.lineJoin = "round"; //线条与线条间接合处的样式;
      myCanvasCtx.lineCap = "round"; //线条末端样式
    });
    initCanvasSize();
    window.onresize = initCanvasSize;
  });

  let isDrawing = false; // 播放的时候通过变量打断动画

  let path: PathProp[] = []; //绘画数组 第一个是宽度，颜色，第二是起点，第三第四等等是贝塞尔曲线的点，最后一个是终点；

  let lineWidth = ref("10"); //画笔宽度
  let strokeColor = ref("rgba(0,0,0,0.6)"); // 画笔颜色
  const stack: Array<Array<PathProp>> = []; // 绘画堆栈 存放path数组
  
  const revoke = () => {
    stack.pop();
    drawLine();
  };
  const clear = () => {
    stack.splice(0);
    clearRect();
  };
  const drawLine = () => {
    clearRect();
    stack.forEach((path: PathProp[]) => {
      path.forEach((value, index, array) => {
        if (index === 0) {
          // 该路径样式
          myCanvasCtx.lineWidth = value.width as number;
          myCanvasCtx.strokeStyle = value.color as StrokeStyleProp;
        } else if (index === 1) {
          // 该路径第一个点
          myCanvasCtx.beginPath();
          myCanvasCtx.moveTo(value.x, value.y);
          myCanvasCtx.lineTo(value.x, value.y);
        } else {
          // 贝塞尔曲线优化
          let x1 = array[index - 1].x,
            y1 = array[index - 1].y,
            x2 = value.x,
            y2 = value.y;
          let x3 = x1 / 2 + x2 / 2,
            y3 = y1 / 2 + y2 / 2;
          myCanvasCtx.quadraticCurveTo(x1, y1, x3, y3);
        }
        if (index === path.length - 1) {
          myCanvasCtx.lineTo(value.x, value.y);
          myCanvasCtx.stroke();
        }
      });
    });
  };

  // 鼠标事件
  const handleMousedown = (e: MouseEvent) => {
    isDrawing = true;
    let x = e.clientX,
      y = e.clientY;
    path.push({ width: lineWidth.value, color: strokeColor.value });
    path.push({ x, y });
    stack.push(path);
    drawLine();
    myCanvasRef.value.addEventListener("mousemove", handleMousemove, {
      passive: true,
    });
    myCanvasRef.value.addEventListener("mouseup", handleMouseup);
  };
  const handleMousemoveCb = (e: MouseEvent) => {
    let x = e.clientX,
      y = e.clientY;
    if (isDistanceAllowed(path, x, y)) {
      path.push({ x, y });
      drawLine();
    }
  };
  const handleMousemove = throttle(handleMousemoveCb, 8);
  const handleMouseup = () => {
    isDrawing = false;
    path = [];
    myCanvasRef.value.removeEventListener("mousemove", handleMousemove);
    myCanvasRef.value.removeEventListener("mouseup", handleMouseup);
  };

  // 触摸事件
  const handleTouchstart = (e: TouchEvent) => {
    e.preventDefault();
    isDrawing = true;
    let x = e.touches[0].clientX,
      y = e.touches[0].clientY;
    path.push({ width: lineWidth.value, color: strokeColor.value });
    path.push({ x, y });
    stack.push(path);
    drawLine();
    myCanvasRef.value.addEventListener("touchmove", handleTouchmove);
    myCanvasRef.value.addEventListener("touchend", handleTouchend);
  };
  const handleTouchmoveCb = (e: TouchEvent) => {
    e.preventDefault();
    let x = e.touches[0].clientX,
      y = e.touches[0].clientY;
    if (isDistanceAllowed(path, x, y)) {
      path.push({ x, y });
      drawLine();
    }
  };
  const handleTouchmove = throttle(handleTouchmoveCb, 8);
  const handleTouchend = (e: TouchEvent) => {
    e.preventDefault();
    isDrawing = false;
    path = [];
    myCanvasRef.value.removeEventListener("touchmove", handleTouchmove);
    myCanvasRef.value.removeEventListener("touchend", handleTouchend);
  };

  const downloadPng = () => {
    const anchor = document.createElement("a");
    anchor.href = myCanvasRef.value.toDataURL("image/png");
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/iphone|android|ipad/)) anchor.target = "_blank";
    else anchor.download = "图片";
    anchor.click();
  };

  const play = () => {
    const taskList = stack.flat(); //扁平化
    const totalStep = taskList.length;
    let currentStep = 0;
    const animate = () => {
      currentStep += 1;
      clearRect();
      for (let i = 0; i < currentStep; i++) {
        const currentDot = taskList[i];
        if (currentDot.width) {
          myCanvasCtx.lineWidth = currentDot.width as number;
          myCanvasCtx.strokeStyle = currentDot.color as StrokeStyleProp;
        } else {
          const lastDot = taskList[i - 1],
            nextDot = taskList[i + 1];
          if (lastDot.width) {
            // 当前点为该路径起点
            myCanvasCtx.beginPath();
            myCanvasCtx.moveTo(currentDot.x, currentDot.y);
            myCanvasCtx.lineTo(currentDot.x, currentDot.y);
          } else {
            let x1 = lastDot.x,
              y1 = lastDot.y,
              x2 = currentDot.x,
              y2 = currentDot.y;
            let x3 = x1 / 2 + x2 / 2,
              y3 = y1 / 2 + y2 / 2;
            myCanvasCtx.quadraticCurveTo(x1, y1, x3, y3);
          }
          if (i === currentStep - 1 || nextDot.width) {
            // 当前点为该路径终点
            myCanvasCtx.lineTo(currentDot.x, currentDot.y);
            myCanvasCtx.stroke();
          }
        }
      }

      // 动画打断
      if (isDrawing) return drawLine();

      if (currentStep < totalStep) requestAnimationFrame(animate);
    };

    if (totalStep) requestAnimationFrame(animate);
  };

  // 判断两个点是否太靠近 太近的点不要
  function isDistanceAllowed(path:PathProp[], x:any, y:any) {
    const min = 8;
    const latestX = path[path.length - 1].x;
    const latestY = path[path.length - 1].y;
    return Math.abs(x - latestX) >= min || Math.abs(y - latestY) >= min;
  }
  return {
    lineWidth,
    strokeColor,
    handleMousedown,
    handleTouchstart,
    revoke,
    clear,
    downloadPng,
    play,
  };
}
