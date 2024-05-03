import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager
    .addParameter("param", {description: "A parameter", last: false}, false)
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .setAbstract("A test program")
    .addMultiParameter("files")
    .setMissingArgumentBehavior("Missing mandatory argument", null, false)
    .enableHelpParameter()
    .enablePropertyArguments("props")

let result = manager.parseArguments(process.argv.slice(2));

//console.log(manager.makeHelp("test-parser"));

console.log(result);