import {basename} from 'path';
import {Parser, SingleArgumentParser, SingleOptionParser, SingleSwitchParser} from "./parseArguments.js";

function findPotentialNameInTriggers(sw){
    let dest;
    if (sw instanceof Array){
        let found_long_option = false;
        for (let sw_ of sw){
            if (sw_.startsWith("--")){
                dest = sw_.replace(/^-*/g, "");
                found_long_option = true;
            } else if (sw_.startsWith("-") && !found_long_option){
                dest = sw_.replace(/^-*/g, "");
            } else {
                dest = sw_;
                found_long_option = true;
            }
        }
    } else {
        if (sw.startsWith("--")){
            dest = sw.replace(/^-*/g, "");
        } else if (sw.startsWith("-")){
            dest = sw.replace(/^-*/g, "");
        } else {
            dest = sw;
        }
    }
    
    return dest;
}

export class MissingArgumentError extends Error {
    constructor(message){
        super(message);
        this.name = "MissingArgumentError";
    }
}

export class ArgumentsManager {
    /**
     * @type { {
     *  parser: Parser
     *  dest: string
     *  optional: boolean
     *  description: string
     *  hidden?: boolean
     * }[] }
     */
    #parameters = [];

    #abstract = "";

    #missingArgumentBehavior = {};

    setAbstract(abstract){
        this.#abstract = abstract;

        return this;
    }

    setMissingArgumentBehavior(message, errorCode, throw_ = true){
        this.#missingArgumentBehavior = {
            message,
            errorCode,
            throw_
        }

        return this;
    }

    /**
     * 
     * @param {string} dest 
     * @param {{description?: string}} options 
     * @param {boolean} optional 
     */
    addParameter(dest, options, optional = true){
        this.#parameters.push({
            parser: new SingleArgumentParser(),
            dest, 
            optional, 
            description: options.description
        })

        return this
    }

    /**
     * 
     * @param {string | string[]} sw 
     * @param {{dest?: string, description?: string}} options 
     */
    addSwitch(sw, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(sw);
        }

        this.#parameters.push({
            parser: new SingleSwitchParser(sw),
            dest,
            optional,
            description: options.description
        });

        return this;
    }

    /**
     * 
     * @param {string | string[]} sw 
     * @param {{dest?: string, description?: string}} options 
     */
    addOption(sw, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(sw);
        }

        this.#parameters.push({
            parser: new SingleOptionParser(sw),
            dest,
            optional,
            description: options.description
        });

        return this;
    }

    enableHelpParameter(){
        this.#parameters.push({
            parser: new (class extends Parser {
                #am;
                constructor(argumentsManager){
                    super();
                    this.#am = argumentsManager;
                }

                parse(args, i){
                    let arg = args[i];
                    if (arg == "-h" || arg == "--help"){
                        console.log(this.#am.makeHelp(basename(process.argv[0]) + " " + basename(process.argv[1])))
                        process.exit(0);
                    }
                }
            })(this),
            hidden: true
        })

        return this;
    }

    parseArguments(args, checkMissingNeededArgument = true){
        let result = {}

        for (let argIndex = 0; argIndex < args.length; argIndex++){
            /*if (namedArgumentsParsing){
                let [prop, value] = Parser.propertyAssignment(args[argIndex]);
                if (prop){
                    result[prop] = value;
                    continue;
                }    
            }*/
            for (let param of this.#parameters){
                let res = param.parser.parse(args, argIndex);
                if (res === true) {
                } else if (typeof res == "number"){
                    argIndex += res;
                } else {
                    continue;
                }
                break;
            }
        }

        for (let param of this.#parameters){
            let state = param.parser.getState();
            if (checkMissingNeededArgument && !param.optional && !state){
                if (this.#missingArgumentBehavior.message){
                    console.error(this.#missingArgumentBehavior.message, ":", param.parser.getUsageText(param.dest));
                }
                if (this.#missingArgumentBehavior.errorCode){
                    process.exit(this.#missingArgumentBehavior.errorCode);
                }
                if (this.#missingArgumentBehavior.throw_){
                    throw new MissingArgumentError(this.#missingArgumentBehavior.message ? this.#missingArgumentBehavior.message + " : " + param.parser.getUsageText(param.dest) : param.parser.getUsageText(param.dest));
                }

            }
            result[param.dest] = state;
        }

        return result;

    }

    makeUsageMessage(programName){
        let result = programName ? programName + " " : "";
        for (let p of this.#parameters){
            if (p.hidden) continue;
            result += p.optional ?
                `[${p.parser.getUsageText(p.dest)}] ` : 
                p.parser.getUsageText(p.dest) + " ";
        }

        return result;
    }

    makeHelp(programName){
        let result = "Usage : " + this.makeUsageMessage(programName) + "\n" + this.#abstract + "\n";
        for (let param of this.#parameters){
            if (param.hidden) continue;
            result += "\t" + param.parser.getUsageText(param.dest) + "\t: " + (param.description ?? "(undocumented)") + "\n";
        }
        return result;
    }
}