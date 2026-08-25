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
  "common.login": "登录",
  "common.sourceCode": "源代码",
  "common.points": "经验值",
  "common.hearts": "红心",
  "common.skipToContent": "跳到主要内容",
  "common.openMenu": "打开导航菜单",
  "marketing.headline": "把单词练到能回忆、能拼写、能使用",
  "marketing.getStarted": "开始学习",
  "marketing.existingAccount": "我已有账号",
  "marketing.previewTitle": "公开预览模式",
  "marketing.previewBadge": "预览",
  "marketing.previewDescription":
    "在 .env.local 配置 Clerk 后即可登录并开始课程。",
  "marketing.bannerTitle": "词汇核心 MVP：",
  "marketing.bannerBody":
    "在 CET-4 Demo 中学习并复习 abandon、available 和 maintain。",
  "promo.title": "升级到 Lexora Pro",
  "promo.description": "获得无限红心和更多学习能力。",
  "promo.action": "立即升级",
  "quests.title": "任务",
  "quests.viewAll": "查看全部",
  "quests.earn": "赚取",
  "languages.croatian": "克罗地亚语",
  "languages.spanish": "西班牙语",
  "languages.french": "法语",
  "languages.italian": "意大利语",
  "languages.japanese": "日语",
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
  "common.login": "Log in",
  "common.sourceCode": "Source code",
  "common.points": "Points",
  "common.hearts": "Hearts",
  "common.skipToContent": "Skip to main content",
  "common.openMenu": "Open navigation menu",
  "marketing.headline": "Build vocabulary you can recall, type, and use",
  "marketing.getStarted": "Get started",
  "marketing.existingAccount": "I already have an account",
  "marketing.previewTitle": "Public preview mode",
  "marketing.previewBadge": "Preview",
  "marketing.previewDescription":
    "Configure Clerk in .env.local to sign in and start lessons.",
  "marketing.bannerTitle": "Vocabulary Core MVP:",
  "marketing.bannerBody":
    "Learn and review abandon, available, and maintain in the CET-4 demo.",
  "promo.title": "Upgrade to Lexora Pro",
  "promo.description": "Get unlimited Hearts and more learning tools.",
  "promo.action": "Upgrade now",
  "quests.title": "Quests",
  "quests.viewAll": "View all",
  "quests.earn": "Earn",
  "languages.croatian": "Croatian",
  "languages.spanish": "Spanish",
  "languages.french": "French",
  "languages.italian": "Italian",
  "languages.japanese": "Japanese",
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
