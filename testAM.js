import { ArgumentsManager } from "./argumentsManager.js";
import { TriggerParser } from "./parseArguments.js";

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

    getUsageDescription(){
        return ["-c", "-C"];
    }

    getUsageText(){
        return ["[-c]", "[-C]"]
    }
}

function config(am){
    am
        .addOption(["-O", "--option2"], {description: "An Option"})
        .addOption(["-N", "--number2"], {description: "Needs a number", type: "number"})
}

let manager = new ArgumentsManager();

manager
    .addParameter("param", {description: "A parameter", last: false}, false)
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"}, false)
    .addOption(["-n", "--number"], {description: "Needs a number", type: "number"})
    .addMultiOption("-m", {description: "Option you can use multiple times"})
    .addMultiOption("--mn", {description: "A multi-option number", type: "number"})
    .addOption(["-p", "--composite"], {description: "An option composed of two separate arguments", length: 3, optionsNames: ["opt1", "opt2", "opt3"]})
    .setAbstract("A test program")
    .addMultiParameter("files")
    .addCustomParser(new CountParser("-c"), "count", {description: ["Counts how many -c in the args", "same"]}, true)
    .apply(config)
    .setMissingArgumentBehavior("Missing mandatory argument(s)", null, false)
    .enableHelpParameter(false)
    .enablePropertyArguments("props")

let result = manager.parseProcessArguments();

//console.log(manager.makeHelp("test-parser"));

console.log(result);

//node testAM.js -m aa -p A B C -o oui -m bb -n 12 -s * -m cc