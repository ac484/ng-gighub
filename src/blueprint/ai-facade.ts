// TODO: 实现 AI Facade（ai-facade）功能
// - 说明: 这是 AI Facade 的占位文件，后续应实现对 AI 后端（functions-ai / functions-ai-document 等）的统一封装
// - 目的: 提供清晰的接口以在 service 层调用，遵循三层架构 (UI -> Service -> Repository)
// - 注意: 不要在前端暴露任何敏感密钥；AI 调用应通过 Firebase Functions 完成

export type AIFacade = {
  // Example method signature — replace with concrete methods
  callModel?: (input: string) => Promise<string>;
};

export const aiFacade: AIFacade = {
  // TODO: implement facade methods that call backend Firebase Functions
  // e.g.
  // async callModel(input: string) {
  //   // call functions-ai via callable function or repository
  // }
};

// NOTE: This file was added to track a TODO per request. Please implement concrete methods
// and follow project conventions: inject(), Result pattern, and repository-only Firestore access.
