# SillyTavern 润色助手扩展 (Polishing Assistant)

这个扩展用于在SillyTavern中接收角色回复后，将消息发送给其他模型进行润色处理，以提高回复质量。

## 功能特点

- 监听角色回复消息
- 提供简单的开关控制界面
- 支持将消息发送给其他模型进行润色（开发中）

## 安装方法

1. 下载此扩展到SillyTavern的`public/scripts/extensions/third-party/`目录下
2. 重启SillyTavern
3. 在扩展设置中启用"润色助手"

## 使用说明

1. 在SillyTavern的扩展设置中找到"润色助手"部分
2. 勾选"启用润色助手"复选框
3. 开始与角色对话
4. 当收到角色回复时，扩展会自动捕获消息（目前仅在控制台输出）

## 开发计划

- 添加选择润色模型的功能
- 实现消息发送给外部模型的功能
- 添加润色结果的显示和应用

## 系统要求

- SillyTavern最新版本

## 支持与贡献

如有问题或建议，请在GitHub上提交issue或pull request。

## 许可证

MIT License
