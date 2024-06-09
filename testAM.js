import { ArgumentsManager } from "./argumentsManager.js";
import { Parser, TriggerParser } from "./parseArguments.js";

class CountParser extends TriggerParser {
    constructor(trigger){
        super(trigger)
        this._state = 0;
    }

    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state++;
            return true;
        }
    }
}

let manager = new ArgumentsManager();

manager
    .addParameter("param", {description: "A parameter", last: false}, false)
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .addOption(["-n", "--number"], {description: "Needs a number", type: "number"})
    .setAbstract("A test program")
    .addMultiParameter("files")
    .addCustomParser(new CountParser("-c"), "count", {description: "Counts how many -c in the args"}, true)
    .setMissingArgumentBehavior("Missing mandatory argument", null, false)
    .enableHelpParameter(false)
    .enablePropertyArguments("props")

let result = manager.parseProcessArguments();

//console.log(manager.makeHelp("test-parser"));

console.log(result);

//node testAM.js -o oui -n 12 -s *