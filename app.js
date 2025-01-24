// 初始化舞台
const stage = new Konva.Stage({
  container: 'container',
  width: window.innerWidth,
  height: window.innerHeight,
});

// 创建主层和裁剪层
const mainLayer = new Konva.Layer();
const clippingLayer = new Konva.Layer({
  clip: {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  }
});
stage.add(mainLayer);
stage.add(clippingLayer);

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
  mainLayer.add(background);
  background.moveToBottom(); // 确保背景在最底层

  // 更新背景位置和大小的函数
  const updateBackground = () => {
    background.setAttrs({
      x: drawingArea.x(),
      y: drawingArea.y(),
      width: drawingArea.width(),
      height: drawingArea.height(),
    });
    // 更新裁剪区域
    clippingLayer.clip({
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
mainLayer.add(drawingArea);

// 创建一个全局的变换器
const tr = new Konva.Transformer({
  keepRatio: true,
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  // 设置变换器的样式
  borderStroke: '#000000',     // 边框颜色
  borderStrokeWidth: 2,        // 边框宽度
  anchorStroke: '#000000',     // 锚点边框颜色
  anchorFill: '#ffffff',       // 锚点填充颜色
  anchorSize: 10,              // 锚点大小
  padding: 5,                  // 与节点的间距
  rotateAnchorOffset: 20,      // 旋转锚点偏移
  borderDash: [5, 5],         // 虚线边框效果
  rotationSnaps: [0, 90, 180, 270], // 旋转时的吸附角度
  boundBoxFunc: function (oldBox, newBox) {
    return newBox;  // 允许变换超出工作区
  }
});
mainLayer.add(tr);

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
    mainLayer.draw();
  });

  anchor.on('mouseout touchend', function () {
    document.body.style.cursor = 'default';
    this.setAttrs({
      fill: 'black',
      shadowBlur: 0,
      shadowOpacity: 0,
    });
    mainLayer.draw();
  });

  // 根据位置设置拖拽约束
  anchor.on('dragmove', function () {
    const anchorPos = anchorPositions[i];
    const pos = stage.getPointerPosition();
    const layerPos = mainLayer.position();

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
  mainLayer.add(anchor);
});

// 更新作图区域大小
function updateDrawingArea() {
  const [top, right, bottom, left] = anchors;
  const gap = 3; // 与边缘的间距

  // 计算新的区域属性，考虑缩放因素
  const newAttrs = {
    x: left.x() + left.width() + gap,
    y: top.y() + top.height() + gap,
    width: right.x() - (left.x() + left.width() + gap * 2),
    height: bottom.y() - (top.y() + top.height() + gap * 2)
  };

  // 确保宽高不为负数且大于最小值
  if (newAttrs.width > 50 && newAttrs.height > 50) {
    drawingArea.setAttrs(newAttrs);

    // 更新裁剪区域
    clippingLayer.clip({
      x: drawingArea.x(),
      y: drawingArea.y(),
      width: drawingArea.width(),
      height: drawingArea.height(),
    });

    // 更新锚点位置，考虑缩放因素
    anchors.forEach((anchor, i) => {
      const pos = anchorPositions[i];
      const isVertical = pos.x === 0 || pos.x === 1;
      const width = isVertical ? 10 : 34;
      const height = isVertical ? 34 : 10;
      const scaledGap = gap / currentScale;

      let anchorX, anchorY;

      if (pos.x === 0) { // 左边
        anchorX = drawingArea.x() - (width + scaledGap);
      } else if (pos.x === 1) { // 右边
        anchorX = drawingArea.x() + drawingArea.width() + scaledGap;
      } else { // 中间
        anchorX = drawingArea.x() + pos.x * drawingArea.width() - width / 2;
      }

      if (pos.y === 0) { // 上边
        anchorY = drawingArea.y() - (height + scaledGap);
      } else if (pos.y === 1) { // 下边
        anchorY = drawingArea.y() + drawingArea.height() + scaledGap;
      } else { // 中间
        anchorY = drawingArea.y() + pos.y * drawingArea.height() - height / 2;
      }

      anchor.setAttrs({
        x: anchorX,
        y: anchorY,
        width: width,
        height: height,
        strokeWidth: 1 / currentScale, // 调整边框宽度
      });
    });

    // 更新变换器的样式
    tr.setAttrs({
      anchorSize: 10 * currentScale,
      strokeWidth: 2 * currentScale,
      padding: 5 * currentScale,
      rotateAnchorOffset: 20 * currentScale,
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

// 添加画布缩放功能
let scaleBy = 1.1;
let currentScale = 1;

stage.on('wheel', function (e) {
  e.evt.preventDefault();

  const oldScale = currentScale;
  const pointer = stage.getPointerPosition();
  const mousePointTo = {
    x: (pointer.x - mainLayer.x()) / oldScale,
    y: (pointer.y - mainLayer.y()) / oldScale,
  };

  // 检测是否为触控板的缩放手势
  const isZoomGesture = e.evt.ctrlKey || Math.abs(e.evt.deltaY) < Math.abs(e.evt.deltaX);

  if (isZoomGesture) {
    // 修改缩放方向：deltaY < 0 时放大，deltaY > 0 时缩小
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // 限制缩放范围
    currentScale = Math.min(Math.max(0.1, newScale), 5);

    const newPos = {
      x: pointer.x - mousePointTo.x * currentScale,
      y: pointer.y - mousePointTo.y * currentScale,
    };

    // 应用缩放和位置
    mainLayer.scale({ x: currentScale, y: currentScale });
    clippingLayer.scale({ x: currentScale, y: currentScale });

    mainLayer.position(newPos);
    clippingLayer.position(newPos);

    // 更新变换器的样式以适应缩放
    tr.setAttrs({
      anchorSize: 10 * currentScale,          // 锚点大小随缩放同向调整
      strokeWidth: 2 * currentScale,          // 边框宽度随缩放同向调整
      padding: 5 * currentScale,              // 内边距随缩放同向调整
      rotateAnchorOffset: 20 * currentScale,  // 旋转锚点偏移随缩放同向调整
    });

    // 重绘
    mainLayer.batchDraw();
    clippingLayer.batchDraw();
  }
});

// 更新拖拽逻辑，考虑缩放因素
stage.on('mousemove touchmove', function () {
  if (!isDragging) return;

  const newPos = stage.getPointerPosition();
  const dx = (newPos.x - lastPointerPosition.x);
  const dy = (newPos.y - lastPointerPosition.y);

  mainLayer.move({
    x: dx,
    y: dy,
  });
  clippingLayer.move({
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

// 处理图片上传
const fileInput = document.getElementById('fileInput');
const uploadButton = document.getElementById('uploadButton');

uploadButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', function (e) {
  const files = e.target.files;

  Array.from(files).forEach(file => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const imageObj = new Image();
      imageObj.src = event.target.result;

      imageObj.onload = function () {
        // 计算图片的初始大小，确保不会太大
        let imgWidth = imageObj.width;
        let imgHeight = imageObj.height;
        const maxSize = 200;

        if (imgWidth > maxSize || imgHeight > maxSize) {
          const scale = maxSize / Math.max(imgWidth, imgHeight);
          imgWidth *= scale;
          imgHeight *= scale;
        }

        // 计算图片在工作区域中心的位置
        const centerX = drawingArea.x() + drawingArea.width() / 2 - imgWidth / 2;
        const centerY = drawingArea.y() + drawingArea.height() / 2 - imgHeight / 2;

        const konvaImage = new Konva.Image({
          x: centerX,
          y: centerY,
          image: imageObj,
          width: imgWidth,
          height: imgHeight,
          draggable: true,
          name: 'uploadedImage' // 添加名称以便识别
        });

        // 将图片添加到裁剪层
        clippingLayer.add(konvaImage);

        // 为图片添加点击事件，选中时显示变换器
        konvaImage.on('click tap', function (e) {
          // 阻止事件冒泡，防止触发画布的点击事件
          e.cancelBubble = true;

          // 更新变换器的节点
          tr.nodes([konvaImage]);

          // 确保变换器在最上层
          tr.moveToTop();

          mainLayer.draw();
          clippingLayer.draw();
        });

        // 为图片添加变换事件
        konvaImage.on('transform', function () {
          // 更新图片属性
          const node = this;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // 重置比例并应用到尺寸，移除最小尺寸限制
          node.setAttrs({
            width: node.width() * scaleX,
            height: node.height() * scaleY,
            scaleX: 1,
            scaleY: 1
          });
        });

        // 重绘两个层
        mainLayer.draw();
        clippingLayer.draw();

        // 清除选择的文件
        fileInput.value = '';
      };
    };

    reader.readAsDataURL(file);
  });
});

// 点击空白处取消选择
stage.on('click tap', function (e) {
  // 只有当点击的是舞台或作图区域时才取消选择
  if (e.target === stage || e.target === drawingArea) {
    tr.nodes([]);
    mainLayer.draw();
    clippingLayer.draw();
  }
});

// 添加导出功能
const exportButton = document.getElementById('exportButton');

exportButton.addEventListener('click', () => {
  // 隐藏变换器和锚点
  tr.nodes([]);
  anchors.forEach(anchor => anchor.hide());

  // 创建一个临时的层来渲染导出内容
  const exportLayer = new Konva.Layer({
    x: clippingLayer.x(),
    y: clippingLayer.y(),
    scale: clippingLayer.scale(),
    clip: {
      x: drawingArea.x(),
      y: drawingArea.y(),
      width: drawingArea.width(),
      height: drawingArea.height(),
    }
  });

  // 复制工作区内的所有图片到导出层
  clippingLayer.children.forEach(child => {
    if (child instanceof Konva.Image) {
      const clone = child.clone();
      exportLayer.add(clone);
    }
  });

  // 添加背景
  const background = new Konva.Rect({
    x: drawingArea.x(),
    y: drawingArea.y(),
    width: drawingArea.width(),
    height: drawingArea.height(),
    fill: 'white',
  });
  exportLayer.add(background);
  background.moveToBottom();

  // 添加网格
  const gridRect = new Konva.Rect({
    x: drawingArea.x(),
    y: drawingArea.y(),
    width: drawingArea.width(),
    height: drawingArea.height(),
    fillPatternImage: gridPattern,
    fillPatternRepeat: 'repeat',
    fillPatternOffset: { x: 0, y: 0 },
    opacity: 0.7,
  });
  exportLayer.add(gridRect);
  gridRect.moveToBottom();

  // 将导出层添加到舞台
  stage.add(exportLayer);

  // 导出图片
  const dataURL = exportLayer.toDataURL({
    x: drawingArea.x(),
    y: drawingArea.y(),
    width: drawingArea.width(),
    height: drawingArea.height(),
    pixelRatio: 2, // 提高导出图片质量
  });

  // 创建下载链接
  const link = document.createElement('a');
  link.download = 'workspace-export.png';
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 清理：移除导出层并显示变换器和锚点
  exportLayer.destroy();
  anchors.forEach(anchor => anchor.show());
  mainLayer.draw();
  clippingLayer.draw();
}); 