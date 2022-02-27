export function spinWords(words: string): string {
  const resultArr = words.split(" ").map(word => word.length >= 5 ? word.split("").reverse().join("") : word);
  
  return resultArr.join(" ");
}