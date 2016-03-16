## 连惯动画库Stage

**Stage**是一个简单的纯原生JavaScript连贯动画库，目标是能基于DOM节点中的动画配置信息，完成一些常见的动画效果，从而很大程度降低动画开发的成本。

---------
### Stage使用方法

#### 1. 首先加载动画库Stage，需要的文件stage.js，stage.css和stage.util.js。
``` javascript
<!DOCTYPE html>
<html>
<head>
  ...
  <link rel="stylesheet" href="path/to/stage.css">
</head>
<body>
  ...
  <script src="path/to/stage.util.js"></script>
  <script src="path/to/stage.js"></script>
</body>
</html>
```
上面加载的stage.util.js完成了一些常见的DOM以及样式操作。

#### 2. HTML内容。
``` javascript
<!-- 定义一个动画舞台，所有动画在其中进行 -->
<div id="stage">
  <!-- 定义一个动画场景 -->
  <div class="scene">
    <!-- 定义一个动画演员 -->
    <div class="actor">Actor 1</div>
    <div class="actor">Actor 2</div>
    <!-- 如果场景中有多个动画演员，继续添加 -->
    <div class="actor">Actor 3</div>
  </div>
  <!-- 定义第二个动画场景 -->
  <div class="scene">
    <div class="actor">Actor 1</div>
    ......
  </div>
  <!-- 如果需要多个动画场景，继续添加 -->
  <div class="scene">
    <div class="actor">Actor 1</div>
    ......
  </div>
</div>
```
#### 3. 初始化Stage：最好是挨着</body>标签。
``` javascript
<script type="text/javascript">
  var stage = new Stage(util("#stage"));
  // 开始播放动画
  stage.play();
</script>
</body>
```
如果不能写在HTML内容的后面，则需要在页面加载完成后再初始化。
``` javascript
<script type="text/javascript">
  window.onload = function() {
    ......
  }
</script>
```
#### 4. 完成。恭喜你，现在你的Stage应该已经能正常切换了，如果没有，你可以参考下这个实例。现在开始添加各种选项和参数丰富你的Stage。

### Stage参数配置

Stage是通过在DOM节点上添加额外的**animate-opts**属性来实现动画的控制。**animate-opts**的值遵循JSON标准格式要求。
#### 1. Stage的配置。
**可用参数列表：**
|参数名称 |参数说明                  | 参数类型 |可选值    | 默认值 |
|:-----:|:------------------------|:------:|:--------:| :----:|
|**noload** |动画舞台中是否使用加载页 | *boolean* |*true,false*| *false* |
|**loop** |动画舞台中场景是否可循环播放 | *boolean* |*true,false*| *false* |
|**bind** |是否绑定默认的鼠标swipe操作 | *boolean* |*true,false*| *true* |
|**sceneClass** |用于获取各个动画场景的class名称| *string* |*合法的CSS类名*| *"scene"* |

**使用方法示例：**
下面例子中定义了一个动画舞台，循环播放各个场景
``` javascript
<!-- 定义一个动画舞台，所有动画在其中进行 -->
<div id="stage" animate-opts='{"loop": true}'>
  ......
</div>
```
>动画舞台Stage默认已经绑定了鼠标的swipe操作（即*bind*参数默认为true），鼠标上下拖拽即可进行动画场景的切换。通过将*bind*参数设为false，可以取消这一默认绑定，此时可以通过动画舞台Stage对外提供的实例接口来灵活实现期望的动画场景切换效果。Stage类对外提供的实例接口如下表。
>|接口名称 |接口参数| 接口说明 |
>|:--------:|:-------|:------|
>|**cur** || 获取当前动画场景的索引，从0开始 |
>|**prev** |[index] | 向上切换到指定索引的动画场景，不指定index将默认切换到上一个动画场景 |
>|**next** |[index] | 向下切换到指定索引的动画场景，不指定index将默认切换到下一个动画场景 |
>|**play** |[direction]|可选参数为动画场景切换方向，控制当前场景和下一个场景将如何进入动画舞<br/>台，可取值为"prev"或"next"，如果不传递该参数的话，默认切换方向为"next"|

#### 2. Scene的配置。
**可用参数列表：**
|参数名称 |参数说明                        | 参数类型|可选值                  | 默认值  |
|:------:|:-----------------------------|:------:|:---------------------:|:------:|
|**dir**     |动画场景进行动画切换的方向        | *string*  |*"t2b","b2t","l2r","r2l"*| *"t2b"*  |
|**replay**  |动画场景切换时，演员动画是否重复播放| *boolean* |*true,false*            | *true*   |
|**effect**  |动画场景切换的动画效果            | *string*  |*见下面注释*             |*"Linear"*|
|**klass**|用于向动画场景添加样式的class名称| *string* |*合法的CSS类名*| *""* |
|**actorClass**|用于获取各个动画演员的class名称| *string* |*合法的CSS类名*| *"actor"* |
>动画效果*effect*主要包括：*Linear, Quart.{easeIn,,easeOut},easeInOut}, Back.{easeIn,easeOut,easeInOut}, Bounce.{easeIn,easeOut,easeInOut}, Elastic.{easeIn,easeOut,easeInOut}, 如果effect是以对象的形式给出的话，则可以给animate-opts参数中各属性添加自己的动画效果，比如"effect": {"default": "Back.easeOut", "opacity": "Linear", "scaleX": "Linear", "translateX": "Linear"}，对于未指定效果的参数则采用default指定的动画效果，如果未指定default效果，则采用线性效果*。

**使用方法示例： **
下面例子中动画舞台上定义了一个动画场景，动画场景按照从左至右进入舞台，动画效果是*Bounce.easeOut*。
``` javascript
<!-- 定义一个动画舞台，所有动画在其中进行 -->
<div id="stage" animate-opts='{"noload": true, "replay": false}'>
  <!-- 定义一个动画场景 -->
  <div class="scene" animate-opts='{"dir": "l2r", "effect": "Bounce.easeOut"}'>
    <!-- 定义一个动画演员 -->
    <div class="actor">Actor 1</div>
    <div class="actor">Actor 2</div>
    <!-- 如果场景中有多个动画演员，继续添加 -->
    <div class="actor">Actor 3</div>
  </div>
  ......
</div>
```
#### 3. Actor的配置。
**可用参数列表：**
|参数名称     |参数说明                        | 参数类型|可选值                  | 默认值  |
|:----------:|:-----------------------------|:--------:|:-------------------:|:------:|
|**dir**     |动画演员进行动画切换的方向        | *string* |*"t2b","b2t","l2r","r2l"*| "t2b"  |
|**effect**  |动画演员切换的动画效果            | *string* |*见下面注释*           |*"Linear"*|
|**translateX** |与动画演员最终位置的水平方向的偏移，可用于设置动<br/>画演员水平方向的初始位置不设置的话，默认会按照*dir*<br/>的设置方向从视口外开始动画| *number* |*整型或浮点数值* | *0* |
|**translateY** |与动画演员最终位置的竖直方向的偏移，可用于设置动<br/>画演员竖直方向的初始位置不设置的话，默认会按照*dir*<br/>的设置方向从视口外开始动画| *number* |*整型或浮点数值* | *0* |
|**rotate** |与动画演员最终位置角度的偏移，可用于设置动画演员<br/>的初始角度| *number* |*整型或浮点数值* | *0* |
|**duration**|动画演员的动画持续时间            | *number* |*整型(单位毫秒)*           |*1000*    |
|**delay**   |动画场景动画完成多久后，当前动员演员才能开始动画| *number*|*整型(单位毫秒)*|*0*|
|**fadeIn**  |动画演员是否以淡入效果进入动画场景  | *boolean* |*true,false* |*false*|
|**zoomIn**  |动画演员是否以zoomIn效果进入动画场景  | *boolean* |*true,false* |*false*|
|**endStyle**|动画演员动画结束后添加样式的名称    | *string*  |*合法的CSS类名* |*""*|
|**klass**|用于向动画演员添加样式的class名称| *string*  |*合法的CSS类名*| *""* |
>动画效果*effect*主要包括：*Linear, Quart.{easeIn,,easeOut},easeInOut}, Back.{easeIn,easeOut,easeInOut}, Bounce.{easeIn,easeOut,easeInOut}, Elastic.{easeIn,easeOut,easeInOut}, 如果effect是以对象的形式给出的话，则可以给animate-opts参数中各属性添加自己的动画效果，比如"effect": {"default": "Back.easeOut", "opacity": "Linear", "scaleX": "Linear", "translateX": "Linear"}，对于未指定效果的参数则采用default指定的动画效果，如果未指定default效果，则采用线性效果*。

**使用方法示例： **
下面例子中动画场景里定义了三个动画演员，第一个演员，以zoomIn形式进入场景，默认效果为线性*Linear*，动画持续时间*600ms*，第二个动画以*Bounce.easeOut*的效果，从左至右进入场景，默认动画持续时间为*1000ms*，第三个演员，以淡入的动画效果进入场景，并且需等待前一个动画开始*1500ms*后才能开始动画。
``` javascript
<!-- 定义一个动画舞台，所有动画在其中进行 -->
<div id="stage" animate-opts='{"noload": true, "replay": false}'>
  <!-- 定义一个动画场景 -->
  <div class="scene" animate-opts='{"effect": "Bounce.easeOut"}'>
    <!-- 定义一个动画演员 -->
    <div class="actor" animate-opts='{"zoomIn": true, "duration": 600}'>Actor 1</div>
    <div class="actor" animate-opts='{"dir":"l2r", "effect": "Bounce.easeOut"}'>Actor 2</div>
    <!-- 如果场景中有多个动画演员，继续添加 -->
    <div class="actor" animate-opts='{"fadeIn": true, "delay": 1500}'>Actor 3</div>
  </div>
  ......
</div>
```
---------
### 反馈与建议
感谢阅读这份Stage动画框架的帮助文档。使用过程中如有任何问题，请联系作者。
- Email：<llwanghong@gmail.com>
