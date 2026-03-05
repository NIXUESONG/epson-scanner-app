# Epson Scanner App 安装指南

## 📋 目录

1. [环境准备](#1-环境准备)
2. [安装Node.js](#2-安装nodejs)
3. [安装Java JDK](#3-安装java-jdk)
4. [安装Android Studio](#4-安装-android-studio)
5. [配置环境变量](#5-配置环境变量)
6. [安装项目依赖](#6-安装项目依赖)
7. [下载Epson SDK](#7-下载-epson-sdk)
8. [运行应用](#8-运行应用)
9. [常见问题](#9-常见问题)

---

## 1. 环境准备

### 系统要求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| 操作系统 | Windows 10 64位 / macOS 10.15 / Ubuntu 18.04 | Windows 11 / macOS 13 / Ubuntu 22.04 |
| 内存 | 8GB | 16GB 或更多 |
| 硬盘空间 | 20GB | 50GB 或更多 |
| CPU | 双核 | 四核或更多 |

### 需要安装的软件清单

1. **Node.js** (v18或更高版本) - JavaScript运行环境
2. **Java JDK 17** - Java开发工具包
3. **Android Studio** - 安卓开发IDE
4. **Git** - 版本控制工具

---

## 2. 安装Node.js

### Windows系统

**方法一：使用官方安装包（推荐新手）**

1. 访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS（长期支持版）** 安装包，选择 `.msi` 格式
3. 双击安装包，按照向导完成安装
4. 安装完成后，打开 **命令提示符** 或 **PowerShell**
5. 验证安装：
   ```bash
   node --version
   # 应显示 v18.x.x 或更高版本
   
   npm --version
   # 应显示 9.x.x 或更高版本
   ```

**方法二：使用Chocolatey包管理器**

```powershell
# 以管理员身份运行PowerShell
choco install nodejs-lts
```

### macOS系统

**方法一：使用官方安装包**

1. 访问 https://nodejs.org/
2. 下载 macOS 安装包（.pkg格式）
3. 双击安装包完成安装

**方法二：使用Homebrew（推荐）**

```bash
# 安装Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Node.js
brew install node@18
```

### Linux系统 (Ubuntu/Debian)

```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

---

## 3. 安装Java JDK

### Windows系统

**方法一：使用Oracle JDK（推荐）**

1. 访问 Oracle JDK 下载页面：https://www.oracle.com/java/technologies/downloads/#java17
2. 下载 **Windows x64 Installer**
3. 双击 `.exe` 安装包完成安装
4. 验证安装：
   ```bash
   java --version
   # 应显示 java 17.x.x
   ```

**方法二：使用OpenJDK（免费开源）**

1. 访问 https://adoptium.net/
2. 下载 **Eclipse Temurin 17 (LTS)** 版本
3. 运行安装程序

### macOS系统

```bash
# 使用Homebrew安装
brew install openjdk@17

# 创建符号链接
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### Linux系统

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# 验证
java --version
javac --version
```

---

## 4. 安装 Android Studio

### Windows系统

1. 访问 Android Studio 官网：https://developer.android.com/studio
2. 点击 **"Download Android Studio"** 下载
3. 接受条款后下载安装包（约1GB）
4. 双击 `.exe` 安装包
5. 安装向导中选择以下组件：
   - ✅ Android Studio
   - ✅ Android Virtual Device（安卓虚拟设备）
6. 选择安装路径（建议默认）
7. 等待安装完成

### macOS系统

1. 访问 https://developer.android.com/studio
2. 下载 `.dmg` 文件
3. 打开dmg文件，将Android Studio拖到Applications文件夹
4. 首次启动时，完成设置向导：
   - 选择 "Standard" 安装类型
   - 下载必要的SDK组件

### Linux系统

```bash
# 下载并解压
cd ~/Downloads
wget https://dl.google.com/dl/android/studio/ide-zips/2023.1.1.26/android-studio-2023.1.1.26-linux.tar.gz
tar -xzf android-studio-*.tar.gz
sudo mv android-studio /opt/

# 启动Android Studio
/opt/android-studio/bin/studio.sh
```

### Android Studio 初始设置

安装完成后，需要进行以下设置：

1. **启动Android Studio**，完成设置向导

2. **安装SDK**：
   - 打开 Android Studio
   - 点击 **More Actions** → **SDK Manager**
   - 或点击 **Tools** → **SDK Manager**
   - 在 **SDK Platforms** 标签页，勾选 **Android 13.0 (Tiramisu)** 或更高版本
   - 在 **SDK Tools** 标签页，确保勾选：
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android Emulator
     - ✅ Android SDK Platform-Tools
   - 点击 **Apply** 下载安装

3. **创建虚拟设备（模拟器）**：
   - 点击 **Tools** → **Device Manager**
   - 点击 **Create Device**
   - 选择一个手机型号（如 Pixel 6）
   - 选择系统镜像（推荐 API 33 或更高）
   - 完成创建

---

## 5. 配置环境变量

### Windows系统

1. **打开环境变量设置**：
   - 右键点击 **"此电脑"** → **"属性"**
   - 点击 **"高级系统设置"**
   - 点击 **"环境变量"**

2. **添加 ANDROID_HOME**：
   - 在 **"系统变量"** 区域，点击 **"新建"**
   - 变量名：`ANDROID_HOME`
   - 变量值：`C:\Users\你的用户名\AppData\Local\Android\Sdk`
   - 点击确定

3. **添加 JAVA_HOME**：
   - 变量名：`JAVA_HOME`
   - 变量值：`C:\Program Files\Java\jdk-17`（根据实际安装路径调整）

4. **编辑 Path 变量**：
   - 找到 **Path** 变量，点击 **"编辑"**
   - 添加以下路径：
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\emulator
     %ANDROID_HOME%\tools
     %ANDROID_HOME%\tools\bin
     %JAVA_HOME%\bin
     ```

5. **验证环境变量**：
   ```bash
   # 关闭所有命令行窗口，重新打开
   echo %ANDROID_HOME%
   echo %JAVA_HOME%
   
   adb version
   # 应显示 Android Debug Bridge version x.x.x
   ```

### macOS系统

编辑 `~/.zshrc` 或 `~/.bash_profile`：

```bash
# 打开配置文件
nano ~/.zshrc

# 添加以下内容
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

export JAVA_HOME=$(/usr/libexec/java_home)
export PATH=$JAVA_HOME/bin:$PATH

# 保存后刷新配置
source ~/.zshrc
```

### Linux系统

```bash
# 编辑配置文件
nano ~/.bashrc

# 添加以下内容
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# 刷新配置
source ~/.bashrc
```

---

## 6. 安装项目依赖

### 步骤详解

1. **打开命令行工具**：
   - Windows: 按 `Win + R`，输入 `cmd`，回车
   - macOS: 打开 **终端** 应用
   - Linux: 按 `Ctrl + Alt + T`

2. **进入项目目录**：
   ```bash
   cd /home/z/my-project/download/epson-scanner-app
   ```
   > 注意：根据您的实际项目位置调整路径

3. **安装依赖**：
   ```bash
   npm install
   ```
   
   或使用 yarn（更快）：
   ```bash
   # 先安装yarn（如果没有）
   npm install -g yarn
   
   # 然后安装依赖
   yarn install
   ```

4. **等待安装完成**：
   - 这个过程可能需要5-15分钟，取决于网络速度
   - 如果下载慢，可以设置国内镜像：
   ```bash
   # 设置npm淘宝镜像
   npm config set registry https://registry.npmmirror.com
   
   # 然后重新安装
   npm install
   ```

---

## 7. 下载 Epson SDK

### 获取SDK

1. **访问Epson开发者网站**：
   - 网址：https://epson.com/developers-products
   - 或：https://www.epson.com.sg/epsonscannersoftwaredevelopmentkit

2. **注册开发者账号**（如果需要）：
   - 点击 "Register" 或 "Sign Up"
   - 填写公司/个人信息
   - 等待审核通过

3. **下载SDK**：
   - 登录后，找到 **"Scanner Software Development Kit"**
   - 选择 **Android** 版本
   - 下载 SDK 压缩包（通常包含 .jar 文件和文档）

### 集成SDK到项目

1. **创建libs目录**：
   ```bash
   # 在项目根目录下创建
   mkdir -p android/app/libs
   ```

2. **复制SDK文件**：
   - 解压下载的SDK压缩包
   - 找到 `.jar` 文件（通常命名为 `epson-sdk-android.jar` 或类似）
   - 复制到 `android/app/libs/` 目录

3. **修改 build.gradle 配置**：

   打开 `android/app/build.gradle` 文件，在 `dependencies` 部分添加：
   
   ```gradle
   dependencies {
       // 其他依赖...
       
       // Epson Scanner SDK
       implementation files('libs/epson-sdk-android.jar')
   }
   ```

4. **同步Gradle**：
   - 打开 Android Studio
   - 打开项目中的 `android` 文件夹
   - 点击 **File** → **Sync Project with Gradle Files**

---

## 8. 运行应用

### 方法一：使用真实安卓手机（推荐）

1. **开启开发者选项**：
   - 打开手机 **设置**
   - 找到 **关于手机**
   - 连续点击 **版本号** 7次
   - 提示 "您已处于开发者模式"

2. **开启USB调试**：
   - 返回设置主界面
   - 找到 **开发者选项**（通常在"系统"或"更多设置"里）
   - 开启 **USB调试**
   - 开启 **USB安装**（如果有这个选项）

3. **连接手机**：
   - 使用USB数据线连接手机和电脑
   - 手机上弹出提示时，选择 **"允许USB调试"**

4. **验证连接**：
   ```bash
   adb devices
   # 应显示类似：
   # List of devices attached
   # ABC123456789    device
   ```

5. **运行应用**：
   ```bash
   cd /home/z/my-project/download/epson-scanner-app
   npx expo run:android
   ```

### 方法二：使用Android模拟器

1. **启动模拟器**：
   - 打开 Android Studio
   - 点击 **Tools** → **Device Manager**
   - 点击已创建的模拟器旁边的 **▶** 按钮启动

2. **等待模拟器启动**：
   - 首次启动可能需要1-2分钟
   - 等待直到看到安卓桌面

3. **运行应用**：
   ```bash
   cd /home/z/my-project/download/epson-scanner-app
   npx expo run:android
   ```

### 运行过程说明

运行 `npx expo run:android` 后，您会看到：

```
✔ Checking project configuration
✔ Installing dependencies
✔ Building app
✔ Installing app on device
✔ Starting app
```

这个过程可能需要：
- 首次运行：10-20分钟（需要下载和编译）
- 后续运行：1-3分钟

### 开发模式热重载

应用运行后：
- 修改代码会自动刷新应用
- 按 `r` 键手动刷新
- 按 `d` 键打开开发者菜单
- 按 `Ctrl + C` 停止运行

---

## 9. 常见问题

### Q1: `adb devices` 显示 unauthorized

**解决方案**：
1. 检查手机上是否有USB调试授权弹窗
2. 点击"始终允许"
3. 如果没有弹窗，尝试：
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Q2: SDK location not found

**解决方案**：
创建 `android/local.properties` 文件：
```properties
# Windows
sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk

# macOS
sdk.dir=/Users/你的用户名/Library/Android/sdk

# Linux
sdk.dir=/home/你的用户名/Android/Sdk
```

### Q3: Gradle build failed

**解决方案**：
```bash
# 清理构建缓存
cd android
./gradlew clean
cd ..

# 重新运行
npx expo run:android
```

### Q4: 无法连接到扫描仪

**解决方案**：
1. 确保手机和扫描仪连接到同一WiFi网络
2. 检查扫描仪是否开机
3. 尝试手动输入扫描仪IP地址
4. 检查路由器是否启用了AP隔离（需关闭）

### Q5: npm install 很慢或失败

**解决方案**：
```bash
# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 清除缓存
npm cache clean --force

# 重新安装
npm install
```

### Q6: 内存不足错误

**解决方案**：
编辑 `android/gradle.properties`：
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.daemon=true
```

---

## 📞 获取帮助

如果遇到问题：

1. **查看错误日志**：仔细阅读命令行输出的错误信息
2. **搜索解决方案**：将错误信息复制到搜索引擎
3. **官方文档**：
   - React Native: https://reactnative.dev/docs/troubleshooting
   - Expo: https://docs.expo.dev/troubleshooting/
   - Epson SDK: 随SDK下载的文档

---

## ✅ 安装检查清单

完成以下检查确认环境配置正确：

- [ ] Node.js 已安装 (`node --version` 显示 v18+)
- [ ] npm 已安装 (`npm --version` 显示 9+)
- [ ] Java JDK 已安装 (`java --version` 显示 17)
- [ ] ANDROID_HOME 环境变量已设置
- [ ] JAVA_HOME 环境变量已设置
- [ ] adb 命令可用 (`adb version` 正常显示)
- [ ] Android Studio 已安装并配置
- [ ] 模拟器或真机已连接 (`adb devices` 显示设备)
- [ ] 项目依赖已安装 (`npm install` 完成)
- [ ] Epson SDK 已集成到 android/app/libs/

全部完成后，运行 `npx expo run:android` 即可启动应用！
