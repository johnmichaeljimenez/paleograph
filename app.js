import { question } from 'readline-sync'
import { askLLM } from 'core-common'

const a = question("Input: ");
const b = await askLLM(a);

console.log(b);