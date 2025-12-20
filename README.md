# ✂️ SliceMeow 切图喵

一款简洁优雅的在线图片切割与拼图工具，支持自由切割图片、二次切割、切图合成 GIF、多图拼接。

🔗 **在线体验**: [https://minner2.github.io/SliceMeow/](https://minner2.github.io/SliceMeow/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📸 预览

![拼图工具](doc/image.png)

![编辑切图](doc/image1.png)

![切图结果](doc/image2.png)

![合成GIF](doc/image3.png)

---

## ✨ 特性

### 🖼️ 图片切割

- **可视化编辑** - 拖拽切割线，实时预览切割效果
- **灵活配置** - 支持自定义行列数、间距大小
- **二次切割** - 对已切割的切片进行再次切割
- **手动裁剪** - 支持对单个切片进行精确裁剪
- **GIF 合成** - 将切片合成为 GIF 动画，可调节帧率和循环方式

### 🧩 拼图工具

- **多图拼接** - 支持多张图片拼接成一张
- **剪贴板粘贴** - 按 Ctrl+V 直接从剪贴板粘贴图片
- **文件上传** - 支持批量上传多张图片
- **拖拽排序** - 拖动调整图片顺序
- **布局调整** - 自定义列数（1-6 列）和间距（0-32px）
- **适配模式** - 三种模式处理不同尺寸图片：
  - 裁剪填充：图片填满格子，超出部分居中裁剪
  - 保持比例：完整显示图片，保持原始比例
  - 拉伸填充：强制拉伸到格子大小

### 🔒 隐私与体验

- **本地处理** - 所有图片处理均在浏览器本地完成，不上传服务器
- **批量导出** - 一键打包下载所有切片为 ZIP 文件
- **暗色主题** - 精心设计的深色界面，舒适护眼
- **响应式设计** - 支持桌面端和移动端使用

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/minner2/SliceMeow.git
cd SliceMeow

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📖 使用方法

### 图片切割

1. **上传图片** - 拖拽或点击上传需要切割的图片
2. **配置网格** - 调整行列数，拖动切割线到精确位置，设置间距
3. **导出切片** - 预览切割结果，单独下载或批量打包 ZIP
4. **GIF 合成** - 选择切片合成 GIF 动画

### 拼图工具

1. **添加图片** - 点击"上传图片"或按 Ctrl+V 粘贴
2. **调整布局** - 设置列数和间距，拖拽调整图片顺序
3. **选择适配** - 根据图片尺寸选择合适的适配模式
4. **导出拼图** - 点击"导出拼图"下载 PNG

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite 6
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **导出**: JSZip + FileSaver

## 📁 项目结构

```
├── App.tsx                 # 主应用组件
├── components/
│   ├── FileUpload.tsx      # 文件上传组件
│   ├── GridEditor.tsx      # 网格编辑器
│   ├── ResultGallery.tsx   # 切片结果展示
│   └── PuzzleEditor.tsx    # 拼图编辑器
├── services/
│   └── imageProcessing.ts  # 图片处理逻辑
└── types.ts                # 类型定义
```

## 📄 License

MIT License © 2024
