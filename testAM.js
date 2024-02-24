import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager
    .addSwitch("-s", {dest: "option"}, true)
    .addOption(["-o", "--option"]);

let result = manager.parseArguments(process.argv.slice(2));

console.log(manager.makeUsageMessage("test-parser"));

console.log(result);