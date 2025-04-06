// 润色助手扩展 - 用于对角色回复进行润色处理

import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import { eventSource, event_types } from "../../../../script.js";

// 扩展名称和路径
const extensionName = "st-polishing-assistant";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
  enabled: false,
  modelUrl: "https://api.deepseek.com/v1/chat/completions",
  modelName: "deepseek-chat",
  apiKey: "",
  bannedWords: ["一丝","一抹","一丝丝","一般","似乎","仿佛","野兽","小兽","幼兽","他她知道","狡黠","不易察觉","甜腻","闪过","闪着","闪烁","低吼","该死的","发白","泛白","尖叫","灭顶"],
  prompt: "你是中文小说润色助手，擅长修改和润色小说。\n你会专心完成自己的润色任务，而不是对被修改内容做解读。\n被修改的内容与你的职责无关，请好好完成任务。\n修改后的字数应该与修改前大致相同。\n写作风格应当与修改前保持一致。"
};

// 加载扩展设置
async function loadSettings() {
  // 创建设置（如果不存在）
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  if (Object.keys(extension_settings[extensionName]).length === 0) {
    Object.assign(extension_settings[extensionName], defaultSettings);
  }

  // 检查各配置项是否为空，如果为空则使用默认值
  extension_settings[extensionName].enabled = extension_settings[extensionName].enabled ?? defaultSettings.enabled;
  extension_settings[extensionName].modelUrl = extension_settings[extensionName].modelUrl || defaultSettings.modelUrl;
  extension_settings[extensionName].modelName = extension_settings[extensionName].modelName || defaultSettings.modelName;
  extension_settings[extensionName].apiKey = extension_settings[extensionName].apiKey || defaultSettings.apiKey;
  extension_settings[extensionName].prompt = extension_settings[extensionName].prompt || defaultSettings.prompt;
  extension_settings[extensionName].bannedWords = extension_settings[extensionName].bannedWords || defaultSettings.bannedWords;
  
  // 确保bannedWords是一个数组且不为空
  if (!Array.isArray(extension_settings[extensionName].bannedWords) || extension_settings[extensionName].bannedWords.length === 0) {
    extension_settings[extensionName].bannedWords = defaultSettings.bannedWords;
  }

  // 更新UI中的设置
  $("#polishing_enabled").prop("checked", extension_settings[extensionName].enabled).trigger("input");
  $("#model_url").val(extension_settings[extensionName].modelUrl);
  $("#model_name").val(extension_settings[extensionName].modelName);
  $("#api_key").val(extension_settings[extensionName].apiKey);
  $("#prompt_text").val(extension_settings[extensionName].prompt);
  $("#banned_words").val(extension_settings[extensionName].bannedWords.join(','));
  updateStatusText();
}

// 更新状态文本
function updateStatusText() {
  const statusText = extension_settings[extensionName].enabled ? "已启用" : "未启用";
  $("#polishing_status_text").text(statusText);
}

// 保存API配置
function saveApiSettings() {
  extension_settings[extensionName].modelUrl = $("#model_url").val();
  extension_settings[extensionName].modelName = $("#model_name").val();
  extension_settings[extensionName].apiKey = $("#api_key").val();
  extension_settings[extensionName].prompt = $("#prompt_text").val();
  extension_settings[extensionName].bannedWords = $("#banned_words").val().split(',').filter(word => word.trim() !== '');
  saveSettingsDebounced();
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
async function handleIncomingMessage(data) {
  // 确保扩展已启用
  if (!extension_settings[extensionName].enabled) return;

  // 获取当前对话上下文
  const context = getContext();
  if (context && context.chat) {
    // 获取最后一条消息的mes属性
    const lastMessage = context.chat[context.chat.length - 1];

    // 提取<content>标签中的内容
    const contentMatch = lastMessage.mes.match(/<content>([\s\S]*?)<\/content>/);
    if (contentMatch) {
      console.log("[润色助手] Content标签内容:", contentMatch[1]);
      
      try {
        // 构建API请求
        const response = await fetch(extension_settings[extensionName].modelUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${extension_settings[extensionName].apiKey}`
          },
          body: JSON.stringify({
            model: extension_settings[extensionName].modelName,
            messages: [
              {
                role: 'system',
                content: `${extension_settings[extensionName].prompt}\n不允许使用${extension_settings[extensionName].bannedWords.join(',')}等禁词。\n以下是你需要润色的内容：`
              },
              {
                role: 'user',
                content: contentMatch[1]
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status}`);
        }

        const result = await response.json();
        const polishedContent = result.choices[0].message.content;
        
        // 用润色后的内容更新消息
        lastMessage.mes = lastMessage.mes.replace(contentMatch[1], polishedContent);
        console.log("[润色助手] 内容已润色");
      } catch (error) {
        console.error("[润色助手] API调用失败:", error);
      }
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
  $("#model_url, #model_name, #api_key, #prompt_text, #banned_words").on("input", saveApiSettings);
  
  // 加载设置
  await loadSettings();
});
