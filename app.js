// 初始化舞台
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

// 创建可拖拽的层
const layer = new Konva.Layer();
stage.add(layer);

// 创建网格背景
const gridSize = 20; // 网格大小
const gridPattern = new Image();
gridPattern.onload = function () {
  // 创建背景矩形，与工作区域大小相同
  const background = new Konva.Rect({
    x: drawingArea.x(),
    y: drawingArea.y(),
    width: drawingArea.width(),
    height: drawingArea.height(),
    fillPatternImage: gridPattern,
    fillPatternRepeat: 'repeat',
    fillPatternOffset: { x: 0, y: 0 },
  });
  layer.add(background);
  background.moveToBottom(); // 确保背景在最底层

  // 更新背景位置和大小的函数
  const updateBackground = () => {
    background.setAttrs({
      x: drawingArea.x(),
      y: drawingArea.y(),
      width: drawingArea.width(),
      height: drawingArea.height(),
    });
  };

  // 在更新作图区域大小的函数中添加背景更新
  const originalUpdateDrawingArea = updateDrawingArea;
  updateDrawingArea = function () {
    originalUpdateDrawingArea();
    updateBackground();
  };
};

// 创建网格图案
const canvas = document.createElement('canvas');
canvas.width = gridSize;
canvas.height = gridSize;
const context = canvas.getContext('2d');

// 设置背景色
context.fillStyle = '#f0f0f0';
context.fillRect(0, 0, gridSize, gridSize);

// 绘制网格
context.strokeStyle = '#999999';
context.lineWidth = 1;
context.beginPath();
context.moveTo(0, 0);
context.lineTo(gridSize, 0);
context.moveTo(0, 0);
context.lineTo(0, gridSize);
context.stroke();

// 将canvas转换为图片
gridPattern.src = canvas.toDataURL();

// 创建作图区域
const drawingArea = new Konva.Rect({
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  fill: 'rgba(255, 255, 255, 0.7)',
  stroke: '#999',
  strokeWidth: 1,
  draggable: false,
});
layer.add(drawingArea);

// 加载示例图片
const imageObj = new Image();
imageObj.onload = function () {
  const image = new Konva.Image({
    x: 250,
    y: 200,
    image: imageObj,
    width: 100,
    height: 100,
    draggable: true,
  });
  layer.add(image);

  // 为图片添加变换功能
  image.on('transform', function () {
    image.setAttrs({
      width: image.width() * image.scaleX(),
      height: image.height() * image.scaleY(),
      scaleX: 1,
      scaleY: 1,
    });
  });

  // 添加变换器
  const tr = new Konva.Transformer({
    nodes: [image],
    keepRatio: true,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    // 设置变换器的样式
    borderStroke: '#000000',     // 边框颜色
    borderStrokeWidth: 2,        // 边框宽度
    anchorStroke: '#000000',     // 锚点边框颜色
    anchorFill: 'red',       // 锚点填充颜色
    anchorSize: 10,              // 锚点大小
    padding: 5,                  // 与节点的间距
    rotateAnchorOffset: 20,      // 旋转锚点偏移
    borderDash: [5, 5],         // 虚线边框效果
  });
  layer.add(tr);
};
imageObj.src = 'https://via.placeholder.com/150'; // 这里替换为实际的衣服图片URL

// 创建锚点
const anchors = [];
const anchorPositions = [
  { x: 0.5, y: 0 },   // 上中
  { x: 1, y: 0.5 },   // 右中
  { x: 0.5, y: 1 },   // 下中
  { x: 0, y: 0.5 },   // 左中
];

anchorPositions.forEach((pos, i) => {
  // 根据位置决定是否为竖直方向
  const isVertical = pos.x === 0 || pos.x === 1;
  const width = isVertical ? 10 : 34;  // 竖直时宽度变小
  const height = isVertical ? 34 : 10; // 竖直时高度变大
  const gap = 3; // 与边缘的间距

  // 计算锚点位置，考虑间距
  let anchorX, anchorY;

  if (pos.x === 0) { // 左边
    anchorX = drawingArea.x() - (width + gap);
  } else if (pos.x === 1) { // 右边
    anchorX = drawingArea.x() + drawingArea.width() + gap;
  } else { // 中间
    anchorX = drawingArea.x() + pos.x * drawingArea.width() - width / 2;
  }

  if (pos.y === 0) { // 上边
    anchorY = drawingArea.y() - (height + gap);
  } else if (pos.y === 1) { // 下边
    anchorY = drawingArea.y() + drawingArea.height() + gap;
  } else { // 中间
    anchorY = drawingArea.y() + pos.y * drawingArea.height() - height / 2;
  }

  const anchor = new Konva.Rect({
    x: anchorX,
    y: anchorY,
    width: width,
    height: height,
    cornerRadius: 8,
    fill: 'black',
    stroke: 'white',
    strokeWidth: 1,
    draggable: true,
    opacity: 1,
  });

  // 添加鼠标悬停效果
  anchor.on('mouseover touchstart', function () {
    document.body.style.cursor = 'pointer';
    this.setAttrs({
      fill: '#444444',  // 变为浅一点的灰色
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 0 },
      shadowOpacity: 0.3,
    });
    layer.draw();
  });

  anchor.on('mouseout touchend', function () {
    document.body.style.cursor = 'default';
    this.setAttrs({
      fill: 'black',
      shadowBlur: 0,
      shadowOpacity: 0,
    });
    layer.draw();
  });

  // 根据位置设置拖拽约束
  anchor.on('dragmove', function () {
    const anchorPos = anchorPositions[i];
    const pos = stage.getPointerPosition();
    const layerPos = layer.position();

    if (anchorPos.x === 0.5) {  // 上下锚点
      // 保持水平位置不变
      this.x(drawingArea.x() + drawingArea.width() / 2 - 12);
      // 允许垂直拖动，考虑层的偏移
      const adjustedPosY = pos.y - layerPos.y;
      if (anchorPos.y === 0) {
        // 上边锚点：无限制
        this.y(adjustedPosY - this.height() / 2);
      } else {
        // 下边锚点：只限制最小高度
        const minY = drawingArea.y() + 50;
        this.y(Math.max(minY, adjustedPosY - this.height() / 2));
      }
    } else if (anchorPos.y === 0.5) {  // 左右锚点
      // 保持垂直位置不变
      this.y(drawingArea.y() + drawingArea.height() / 2 - 12);
      // 允许水平拖动，考虑层的偏移
      const adjustedPosX = pos.x - layerPos.x;
      if (anchorPos.x === 0) {
        // 左边锚点：无限制
        this.x(adjustedPosX - this.width() / 2);
      } else {
        // 右边锚点：只限制最小宽度
        const minX = drawingArea.x() + 50;
        this.x(Math.max(minX, adjustedPosX - this.width() / 2));
      }
    }
    updateDrawingArea();
  });

  anchors.push(anchor);
  layer.add(anchor);
});

// 更新作图区域大小
function updateDrawingArea() {
  const [top, right, bottom, left] = anchors;
  const gap = 3; // 与边缘的间距

  // 计算新的区域属性
  const newAttrs = {
    x: left.x() + left.width() + gap,
    y: top.y() + top.height() + gap,
    width: right.x() - (left.x() + left.width() + gap * 2),
    height: bottom.y() - (top.y() + top.height() + gap * 2)
  };

  // 确保宽高不为负数且大于最小值
  if (newAttrs.width > 50 && newAttrs.height > 50) {
    drawingArea.setAttrs(newAttrs);

    // 更新锚点位置
    anchors.forEach((anchor, i) => {
      const pos = anchorPositions[i];
      const isVertical = pos.x === 0 || pos.x === 1;
      const width = isVertical ? 16 : 24;
      const height = isVertical ? 24 : 16;

      if (pos.x === 0.5) {  // 上下锚点
        anchor.x(drawingArea.x() + drawingArea.width() / 2 - 12);
      }
      if (pos.y === 0.5) {  // 左右锚点
        anchor.y(drawingArea.y() + drawingArea.height() / 2 - 12);
      }
    });
  }
}

// 实现画布拖拽
let isDragging = false;
let lastPointerPosition = { x: 0, y: 0 };

stage.on('mousedown touchstart', function (e) {
  if (e.target === stage) {
    isDragging = true;
    lastPointerPosition = stage.getPointerPosition();
  }
});

stage.on('mousemove touchmove', function () {
  if (!isDragging) return;

  const newPos = stage.getPointerPosition();
  const dx = newPos.x - lastPointerPosition.x;
  const dy = newPos.y - lastPointerPosition.y;

  layer.move({
    x: dx,
    y: dy,
  });

  lastPointerPosition = newPos;
});

stage.on('mouseup touchend', function () {
  isDragging = false;
});

// 自适应窗口大小
window.addEventListener('resize', function () {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
}); 