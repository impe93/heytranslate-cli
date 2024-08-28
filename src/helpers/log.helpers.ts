export function redLog(str: string) {
  console.error("\x1b[31m%s\x1b[0m", str);
}

export function greenLog(str: string) {
  console.error("\x1b[32m%s\x1b[0m", str);
}
