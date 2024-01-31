import * as m from "./main.js";

///////Comment to trigger github workflow
console.log("This is Goomba Lib. Hello World !");

let [option, sw, arg] = m.parseArguments(process.argv.slice(2), new m.SingleOptionParser("-f") ,  new m.SingleSwitchParser("-d"), new m.SingleArgumentParser(false),);
console.log(m.usageMessage("one-argument -d a-second-argument -f 1"));

console.log(option, sw, arg);