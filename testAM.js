import { ArgumentsManager } from "./argumentsManager.js";

let manager = new ArgumentsManager();

manager
    .addParameter("param", {description: "A parameter", last: false}, false)
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .addOption(["-n", "--number"], {description: "Needs a number", type: "number"})
    .setAbstract("A test program")
    .addMultiParameter("files")
    .setMissingArgumentBehavior("Missing mandatory argument", null, false)
    .enableHelpParameter(false)
    .enablePropertyArguments("props")
    .parseProcessArguments()

let result = manager.parseArguments(process.argv.slice(2));

//console.log(manager.makeHelp("test-parser"));

console.log(result);

//node testAM.js -o oui -n 12 -s *