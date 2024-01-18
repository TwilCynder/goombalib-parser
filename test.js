import * as m from "./main.js";

///////Comment to trigger github workflow
console.log("This is Goomba Lib. Hello World !");

let [arg] = m.parseArguments(process.argv.slice(2), new m.SingleArgumentParser(true));
console.log(m.usageMessage("one-argument a-second-argument"));

console.log(arg);