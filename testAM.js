import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .addParameter("param", {description: "A parameter"}, false)
    .setAbstract("A test program")
    .setMissingArgumentBehavior("Missing mandatory argument", null, true);

let result = manager.parseArguments(process.argv.slice(2));

console.log(manager.makeHelp("test-parser"));

console.log(result);