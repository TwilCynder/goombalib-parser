import * as m from "./main.js";

///////Comment to trigger github workflow
console.log("This is Goomba Lib. Hello World !");

let [option, sw, arg, props] = m.parseArguments(process.argv.slice(2), new m.SingleOptionParser("-f") ,  new m.SingleSwitchParser("-d"), new m.SingleArgumentParser(false), 
    new m.PropertiesParser()
);
console.log(m.usageMessage("one-argument -d a-second-argument -f 1"));

console.log(option, sw, arg, props);


let result = m.parseArgumentsNamed(process.argv.slice(2), 
    {"file": new m.SingleOptionParser("-f") , "DDD": new m.SingleSwitchParser("-d"), "firstArg" : new m.SingleArgumentParser(false), 
    "properties" : new m.PropertiesParser()}, true
);

console.log(result);