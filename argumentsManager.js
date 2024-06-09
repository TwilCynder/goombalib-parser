import {basename} from 'path';
import {AllArgumentsParser, Parser, PropertiesParser, SingleArgumentParser, SingleOptionParser, SingleSwitchParser} from "./parseArguments.js";

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

const transforms = {
    number: (string) => {
        try {
            return parseInt(string);
        } catch (err) {
            throw "Expected a number";
        }
    }
}

export class MissingArgumentError extends Error {

    constructor(message, param){
        super((message ? message + " : " : "") + param.parser.getUsageText(param.dest));
        this.param = param;
        this.name = "MissingArgumentError";
    }

    getMissingArgumentUsageText(){
        return this.param.parser.getUsageText(this.param.dest);
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
     *  custom: ParsersList,
     *  singleArg: ParsersList,
     *  allProperties: ParsersList,
     *  allArgs: ParsersList
     * } }
     */
    #parameters = {
        option: [],
        switch: [],
        custom: [],
        singleArg: [],
        allProperties: [],
        allArgs: [],
    }

    #abstract = "";

    #missingArgumentBehavior = {throw_: true, message: null, errorCode: 0, log : false};

    setAbstract(abstract){
        this.#abstract = abstract;

        return this;
    }

    
    //next version : séparer le message du reste
    setMissingArgumentBehavior(message, errorCode, throw_ = true, log){
        this.#missingArgumentBehavior = {
            message,
            errorCode,
            throw_,
            log: log ?? !!message
        }

        return this;
    }

    /**
     * 
     * @param {string} dest 
     * @param {{description?: string, last?: any, default: string, type?: string}} options 
     * @param {boolean} optional 
     */
    addParameter(dest, options = {}, optional = true){
        this.#parameters.singleArg.push({
            parser: new SingleArgumentParser(options.last, options.default),
            dest, 
            optional, 
            transform: options.type ? transforms[options.type] : undefined,
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
     * @param {string | string[]} triggers 
     * @param {{dest?: string, description?: string}} options 
     */
    addSwitch(triggers, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(triggers);
        }

        this.#parameters.switch.push({
            parser: new SingleSwitchParser(triggers),
            dest,
            optional,
            description: options.description
        });

        return this;
    }

    /**
     * 
     * @param {string | string[]} triggers 
     * @param {{dest?: string, description?: string, default?: any, type?: string}} options 
     */
    addOption(triggers, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(triggers);
        }

        this.#parameters.option.push({
            parser: new SingleOptionParser(triggers, options.default),
            dest,
            optional,
            transform: options.type ? transforms[options.type] : undefined,
            description: options.description
        });

        return this;
    }

    addCustomParser(parser, dest, options = {}, optional = true){
        this.#parameters.custom.push({
            parser,
            dest,
            optional,
            description: options.description
        });

        return this;
    }

    enablePropertyArguments(dest = "properties", description){
        this.#parameters.option.push({
            parser: new PropertiesParser(),
            dest, 
            optional: true,
            description, 
        });

        return this;
    }

    enableHelpParameter(noEffect = false){
        this.#parameters.switch.push({
            parser: new (class extends Parser {
                #am;
                constructor(argumentsManager){
                    super();
                    this.#am = argumentsManager;
                    this._state = false;
                }

                parse(args, i){
                    let arg = args[i];
                    if (arg == "-h" || arg == "--help"){
                        if (!noEffect){
                            console.log(this.#am.makeHelp(basename(process.argv[0]) + " " + basename(process.argv[1])))
                            if (exit){
                                process.exit(0);
                            }
                        }

                        this._state = true;
                        return true;
                    }
                }


            })(this),
            hidden: true,
            optional: true,
            dest: "help"
        })

        return this;
    }

    getAllParameters(){
        return this.#parameters.switch
            .concat(this.#parameters.option)
            .concat(this.#parameters.custom)
            .concat(this.#parameters.allProperties)
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
            console.log("PARSING", argIndex);
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
                if (this.#missingArgumentBehavior.log){
                    console.error(this.#missingArgumentBehavior.message, ":", param.parser.getUsageText(param.dest));
                }
                if (this.#missingArgumentBehavior.errorCode){
                    process.exit(this.#missingArgumentBehavior.errorCode);
                }
                if (this.#missingArgumentBehavior.throw_){
                    throw new MissingArgumentError(this.#missingArgumentBehavior.message, param);
                }
            }
            if (param.transform){
                try {
                    state = param.transform(state);
                } catch (err){
                    console.error(`Error while parsing argument ${param.dest} : `, err);
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

    getHelp(programName){
        let result = "Usage : " + this.makeUsageMessage(programName) + "\n" + this.#abstract + "\n";
        for (let param of this.getAllParameters()){
            if (param.hidden) continue;
            result += "\t" + param.parser.getUsageText(param.dest) + "\t: " + (param.description ?? "(undocumented)") + "\n";
        }
        return result;
    }
}