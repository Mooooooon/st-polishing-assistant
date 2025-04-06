// 润色助手扩展 - 用于对角色回复进行润色处理

import { extension_settings, getContext, loadExtensionSettings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types, updateMessageBlock } from "../../../../script.js";

// 扩展名称和路径
const extensionName = "st-polishing-assistant";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const extensionSettings = extension_settings[extensionName];
const defaultSettings = {
  enabled: false,
};

// 加载扩展设置
async function loadSettings() {
  // 创建设置（如果不存在）
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // 更新UI中的设置
  $("#polishing_enabled").prop("checked", extension_settings[extensionName].enabled).trigger("input");
  updateStatusText();
}

// 更新状态文本
function updateStatusText() {
  const statusText = extension_settings[extensionName].enabled ? "已启用" : "未启用";
  $("#polishing_status_text").text(statusText);
}

// 当启用/禁用开关被切换时
function onEnabledInput(event) {
  const value = Boolean($(event.target).prop("checked"));
  extension_settings[extensionName].enabled = value;
  saveSettingsDebounced();
  updateStatusText();
  
  // 根据启用状态添加或移除事件监听器
  if (value) {
    console.log("[润色助手] 已启用消息监听");
    eventSource.on(event_types.MESSAGE_RECEIVED, handleIncomingMessage);
  } else {
    console.log("[润色助手] 已禁用消息监听");
    eventSource.removeListener(event_types.MESSAGE_RECEIVED, handleIncomingMessage);
  }
}

// 处理接收到的消息
function handleIncomingMessage(data) {
  // 确保扩展已启用
  if (!extension_settings[extensionName].enabled) return;

  // 获取当前对话上下文
  const context = getContext();
  if (context && context.chat) {
    // 获取最后一条消息的mes属性
    const lastMessage = context.chat[context.chat.length - 1];
    const messageId = context.chat.length - 1;

    // 提取<content>标签中的内容
    const contentMatch = lastMessage.mes.match(/<content>([\s\S]*?)<\/content>/);
    if (contentMatch) {
      console.log("[润色助手] Content标签内容:", contentMatch[1]);
      // 替换内容为test并更新消息
      lastMessage.mes = lastMessage.mes.replace(contentMatch[1], 'test');
      updateMessageBlock(messageId, lastMessage);
    }
  }
}

// 扩展加载时执行
jQuery(async () => {
  // 加载HTML设置界面
  const settingsHtml = await $.get(`${extensionFolderPath}/example.html`);
  $("#extensions_settings").append(settingsHtml);
  
  // 添加事件监听器
  $("#polishing_enabled").on("input", onEnabledInput);
  
  // 加载设置
  await loadSettings();
});
