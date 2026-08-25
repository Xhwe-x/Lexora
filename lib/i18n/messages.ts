import type { Locale } from "./config";

const zhCN = {
  "brand.tagline": "用主动回忆真正掌握词汇",
  "locale.switcherLabel": "切换界面语言",
  "locale.zh": "中文",
  "locale.en": "EN",
  "common.check": "检查",
  "common.continue": "继续",
  "common.retry": "重试",
  "common.working": "处理中…",
  "common.close": "关闭",
  "common.unavailable": "暂不可用",
  "navigation.learn": "学习",
  "navigation.leaderboard": "排行榜",
  "navigation.quests": "任务",
  "navigation.shop": "商店",
} as const;

type MessageKey = keyof typeof zhCN;
type Dictionary = Record<MessageKey, string>;
type LooseDictionaries = Record<Locale, Record<string, string>>;

const en: Dictionary = {
  "brand.tagline": "Master vocabulary through active recall",
  "locale.switcherLabel": "Switch interface language",
  "locale.zh": "中文",
  "locale.en": "EN",
  "common.check": "Check",
  "common.continue": "Continue",
  "common.retry": "Retry",
  "common.working": "Working…",
  "common.close": "Close",
  "common.unavailable": "Unavailable",
  "navigation.learn": "Learn",
  "navigation.leaderboard": "Leaderboard",
  "navigation.quests": "Quests",
  "navigation.shop": "Shop",
};

export const messages = {
  "zh-CN": zhCN,
  en,
} satisfies Record<Locale, Dictionary>;

export type { MessageKey };

export function translate(
  locale: Locale,
  key: string,
  dictionaries: LooseDictionaries = messages
) {
  return dictionaries[locale]?.[key] ?? dictionaries["zh-CN"]?.[key] ?? key;
}
