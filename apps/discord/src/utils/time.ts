export function parseTime(str: string): number {
  const matches = str.matchAll(/(\d+) ?([dhms])/gi);
  let ms = 0;
  for (let x = matches.next(); !x.done; x = matches.next()) {
    const [, num, unit] = x.value;
    switch (unit.toLowerCase()) {
      case 'd':
        ms += Number(num) * 86400000;
        break;
      case 'h':
        ms += Number(num) * 3600000;
        break;
      case 'm':
        ms += Number(num) * 60000;
        break;
      case 's':
        ms += Number(num) * 1000;
        break;
    }
  }
  return ms;
}
