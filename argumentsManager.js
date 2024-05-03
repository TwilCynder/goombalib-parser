import {basename} from 'path';
import {AllArgumentsParser, Parser, SingleArgumentParser, SingleOptionParser, SingleSwitchParser} from "./parseArguments.js";

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
     * @typedef {{
     *  parser: Parser
     *  dest: string
     *  optional: boolean
     *  description: string
     *  hidden?: boolean
     * }[]} ParsersList 
     */

    /**
     * @type { {
     *  option: ParsersList,
     *  switch: ParsersList,
     *  singleArg: ParsersList,
     *  allArgs: ParsersList
     * } }
     */
    #parameters = {
        option: [],
        switch: [],
        singleArg: [],
        allArgs: []
    }

    #abstract = "";

    #missingArgumentBehavior = {throw_: true};

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
     * @param {{description?: string, last?: any}} options 
     * @param {boolean} optional 
     */
    addParameter(dest, options = {}, optional = true){
        this.#parameters.singleArg.push({
            parser: new SingleArgumentParser(options.last),
            dest, 
            optional, 
            description: options.description
        });

        return this;
    }

    addMultiParameter(dest, options = {}){
        this.#parameters.allArgs.push({
            parser: new AllArgumentsParser(),
            dest, 
            optional: true,
            description: options.description
        });

        return this;
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

        this.#parameters.switch.push({
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
     * @param {{dest?: string, description?: string, default?: any}} options 
     */
    addOption(sw, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(sw);
        }

        this.#parameters.option.push({
            parser: new SingleOptionParser(sw, options.default),
            dest,
            optional,
            description: options.description
        });

        return this;
    }

    enableHelpParameter(){
        this.#parameters.switch.push({
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
            hidden: true,
            optional: true
        })

        return this;
    }

    getAllParameters(){
        return this.#parameters.switch
            .concat(this.#parameters.option)
            .concat(this.#parameters.singleArg)
            .concat(this.#parameters.allArgs)
    }

    parseArguments(args, checkMissingNeededArgument = true){
        let result = {}

        let allParams = this.getAllParameters();

        for (let argIndex = 0; argIndex < args.length; argIndex++){
            /*if (namedArgumentsParsing){
                let [prop, value] = Parser.propertyAssignment(args[argIndex]);
                if (prop){
                    result[prop] = value;
                    continue;
                }    
            }*/
            for (let param of allParams){
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

        for (let param of allParams){
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

    parseProcessArguments(checkMissingNeededArgument){
        return this.parseArguments(process.argv.slice(2));
    }

    makeUsageMessage(programName){
        let result = programName ? programName + " " : "";
        for (let p of this.getAllParameters()){
            if (p.hidden) continue;
            result += p.optional ?
                `[${p.parser.getUsageText(p.dest)}] ` : 
                p.parser.getUsageText(p.dest) + " ";
        }

        return result;
    }

    makeHelp(programName){
        let result = "Usage : " + this.makeUsageMessage(programName) + "\n" + this.#abstract + "\n";
        for (let param of this.getAllParameters()){
            if (param.hidden) continue;
            result += "\t" + param.parser.getUsageText(param.dest) + "\t: " + (param.description ?? "(undocumented)") + "\n";
        }
        return result;
    }
}