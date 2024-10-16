export function roundTo2Decimals(str: any) {
  const num = parseFloat(str);

  return Math.round(num * 100) / 100;
}

export function match_all(reg: RegExp, content: string): any[]{
  let result: any[] = [];
  let match: any;
  while ((match = reg.exec(content)) !== null) {
    result.push(match);
  }
  
  return result;
}