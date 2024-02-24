import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager.addSwitch("-o", {dest: "option"})

let result = manager.parseArguments(process.argv.slice(2));

console.log(result);