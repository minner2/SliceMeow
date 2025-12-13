# ✂️ SliceMeow 切图喵

一款简洁优雅的在线图片切割工具，专为精灵图、九宫格等图片资源的快速切分而设计。

🔗 **在线体验**: [https://minner2.github.io/SliceMeow/](https://minner2.github.io/SliceMeow/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 特性

- 🖼️ **可视化编辑** - 拖拽切割线，实时预览切割效果
- 📐 **灵活配置** - 支持自定义行列数、间距大小
- 🔒 **隐私安全** - 所有处理均在浏览器本地完成，图片不会上传到服务器
- 📦 **批量导出** - 一键打包下载所有切片为 ZIP 文件
- 🎨 **暗色主题** - 精心设计的深色界面，舒适护眼
- 📱 **响应式设计** - 支持桌面端和移动端使用

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

1. **上传图片** - 拖拽或点击上传需要切割的图片
2. **配置网格** - 调整行列数，拖动切割线到精确位置，设置间距
3. **导出切片** - 预览切割结果，单独下载或批量打包

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
│   └── ResultGallery.tsx   # 结果展示
├── services/
│   └── imageProcessing.ts  # 图片处理逻辑
└── types.ts                # 类型定义
```

## 📄 License

MIT License © 2024
