import * as m from "./main.js";

///////Comment to trigger github workflow
console.log("This is Goomba Lib. Hello World !");

let [option, sw, arg, props, ntest, otherArgs] = m.parseArguments(process.argv.slice(2), new m.SingleOptionParser("-f") ,  new m.SingleSwitchParser("-d"), new m.SingleArgumentParser(false), 
    new m.PropertiesParser(), new m.SingleOptionParser(["-n", "--ntest"]), new m.AllArgumentsParser()
);
//node test.js A -f file oui yes p=Test haha *

console.log(option, sw, arg, props, ntest, otherArgs);


let result = m.parseArgumentsNamed(process.argv.slice(2), 
    {"file": new m.SingleOptionParser("-f") , "DDD": new m.SingleSwitchParser("-d"), "firstArg" : new m.SingleArgumentParser(false), 
    "properties" : new m.PropertiesParser()}, true
);

console.log(result);