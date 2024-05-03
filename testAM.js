import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager
    .addParameter("param", {description: "A parameter", last: true}, false)
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .setAbstract("A test program")
    .setMissingArgumentBehavior("Missing mandatory argument", null, false)
    .enableHelpParameter()

let result = manager.parseArguments(process.argv.slice(2));

//console.log(manager.makeHelp("test-parser"));

console.log(result);