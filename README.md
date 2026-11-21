# 雨夜便利店街角

一个可拖拽旋转、滚轮缩放的三渲二微缩雨夜场景（Three.js）：亮着灯的便利店、窗里还有光的居酒屋、自动售货机、斑马线和红绿灯，雨一直在下。招牌和海报上的文字、墙面和地面的纹理都在运行时用代码生成，仓库里没有图片素材。

**在线访问**

- https://opus.kumiko1314.cn/rainy-konbini/ ：国内访问更稳，Three.js 与字体都放在自己的服务器上。
- https://lin-kumiko.github.io/rainy-konbini/ ：GitHub Pages，依赖 jsDelivr 与 Google Fonts。

## 操作

- 电脑：左键拖动旋转，滚轮缩放，右键拖动平移。
- 手机：单指拖动旋转，双指缩放、平移。竖屏会自动把镜头拉远，让整家店入画。
- 需要支持 WebGL2 的浏览器；不支持时会显示一行提示，而不是黑屏。
- 场景载入时有一个很小的载入提示，出第一帧后淡出；操作提示只在开头出现几秒。平时画面上没有任何界面元素。

## 本地运行

没有构建步骤，用任意静态服务器打开本目录即可（ES 模块不能直接用 `file://` 打开）：

```bash
npx serve .
# 或
python -m http.server 8000
```

## 结构

| 文件 | 内容 |
| --- | --- |
| `index.html` | 页面外壳：importmap（three 0.160.0）、字体、载入/操作/失败提示 |
| `js/main.js` | 入口：搭场景、打光、动画循环，并按帧耗时自动降低分辨率 |
| `js/core.js` | 渲染器、相机、控制器、共用 uniform、材质与静态几何合批 |
| `js/post.js` | 渲染管线：平面反射 → 法线/深度预通道 → 上色 → 描边 → 泛光 → 调色 |
| `js/ground.js` | 底座、道路、人行道、路面标线与湿地面反射 |
| `js/store.js` / `js/interior.js` | 便利店外壳、门窗、雨棚、招牌 / 店内货架、冷柜、收银台 |
| `js/street.js` / `js/town.js` | 街边设施（自动售货机、自行车、电线杆、红绿灯）/ 隔壁居酒屋与后巷 |
| `js/fx.js` / `js/glass.js` | 雨丝、水花、屋檐滴水、关东煮热气 / 玻璃上的雨滴 |
| `js/tex-store.js` / `js/tex-street.js` | 用 Canvas 画出来的招牌、海报、商品图集与地面纹理 |

## 备注

- 场景是确定性的：随机数用固定种子，每次加载的布局都一样。
- 字体 M PLUS Rounded 1c 与 Dela Gothic One（SIL OFL 1.1）只用于场景里的日文招牌。
