const UNAVAILABLE_PATTERN = /未开放|暂不支持|敬请期待|开发中|not available|unavailable|coming soon|under development|unsupported/i;

export function isUnavailableMessage(message: string): boolean {
  return UNAVAILABLE_PATTERN.test(message);
}
