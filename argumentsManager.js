import {basename} from 'path';
import {AllArgumentsParser, CompositeOptionParser, MultiCompositeOptionParser, MultiOptionParser, Parser, PropertiesParser, SingleArgumentParser, SingleOptionParser, SingleSwitchParser} from "./parseArguments.js";

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
            return !!string ? parseInt(string) : string;
        } catch (err) {
            throw "Expected a number";
        }
    }
}

function missingParamsUsageText(params){
    return params.reduce((str, param) => (str + param.parser.getUsageText(param.dest) + ", "), "").slice(0, -2)
}

function makeHelpLine(usageText, description){
    return "\t" + usageText + "\t: " + (description ?? "(undocumented)") + "\n";
}

export class MissingArgumentError extends Error {

    constructor(message, missingParams, argumentsManager){
        super((message ? message + " : " : "") + missingParamsUsageText(missingParams));
        this.missingParams = missingParams;
        this.name = "MissingArgumentError";
        this.argumentsManager = argumentsManager;
    }

    getMissingArgumentUsageText(){
        return missingParamsUsageText(this.missingParams)
    }
}

export class ArgumentsManager {
    /**
     * @typedef {{
     *  parser: Parser
     *  dest: string
     *  optional: boolean
     *  description: string | string[]
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
            transform: options.type ? transforms[options.type] : undefined,
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
     * @param {{dest?: string, description?: string, default?: any, type?: string, length: number, optionsNames: string[]}} options 
     */
    addOption(triggers, options = {}, optional = true){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(triggers);
        }

        this.#parameters.option.push({
            parser: options.length > 1 ? new CompositeOptionParser(triggers, options.length, options.optionsNames) : new SingleOptionParser(triggers, options.default),
            dest,
            optional,
            transform: options.type ? transforms[options.type] : undefined,
            description: options.description
        });

        return this;
    }

    /**
     * 
     * @param {string | string[]} triggers 
     * @param {{dest?: string, description?: string, default?: any, type?: string, length: number, optionsNames: string[]}} options 
     */
    addMultiOption(triggers, options = {}){
        let dest;

        if (options.dest){
            dest = options.dest;
        } else {
            dest = findPotentialNameInTriggers(triggers);
        }

        this.#parameters.option.push({
            parser: options.length > 1 ? new MultiCompositeOptionParser(triggers, options.length, options.optionsNames) : new MultiOptionParser(triggers),
            dest,
            optional: true,
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
                /** @type {ArgumentsManager} */
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
                            console.log(this.#am.getHelp(basename(process.argv[0]) + " " + basename(process.argv[1])))
                            process.exit(0);
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

    /**
     * 
     * @param {(mgr: ArgumentsManager) => void} f 
     */
    apply(f){
        f(this);

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

        let missingArguments = [];
        for (let param of allParams){
            let state = param.parser.getState();
            if (checkMissingNeededArgument && !param.optional && !state){
                missingArguments.push(param);
            }
            if (param.transform){
                try {
                    if (state instanceof Array){
                        state = state.map(elem => param.transform(elem))
                    } else {
                        state = param.transform(state);
                    }                    
                } catch (err){
                    console.error(`Error while parsing argument ${param.dest} : `, err);
                }
            }
            result[param.dest] = state;
        }

        if (missingArguments.length > 0){
            if (this.#missingArgumentBehavior.log){

                console.log(missingArguments.reduce((str, param) => (str + param.parser.getUsageText(param.dest) + ", "), ""))

                console.error(this.#missingArgumentBehavior.message, ":", 
                    missingParamsUsageText(missingArguments));

                console.error("Usage : node", this.makeUsageMessage())
            }
            if (this.#missingArgumentBehavior.errorCode){
                process.exit(this.#missingArgumentBehavior.errorCode);
            }
            if (this.#missingArgumentBehavior.throw_){
                throw new MissingArgumentError(this.#missingArgumentBehavior.message, missingArguments);
            }
        }

        return result;
    }

    parseProcessArguments(checkMissingNeededArgument){
        return this.parseArguments(process.argv.slice(2));
    }

    makeUsageMessage(programName = process.argv[1].split('\\').pop().split('/').pop()){
        let result = programName ? programName + " " : "";
        for (let p of this.getAllParameters()){
            if (p.hidden) continue;

            let usageText = p.parser.getUsageText(p.dest, p.optional);

            if (typeof usageText == "string"){
                result += p.optional && p.parser.usageTextCustomHandleOptional() ?
                `[${usageText}] ` : 
                usageText;
            } else if (usageText instanceof Array){
                result += p.optional && p.parser.usageTextCustomHandleOptional() ?
                    usageText.map(elt => `[${elt}]`).join(" ") : 
                    usageText.join(" ");
            }
            result += " "
        }

        return result;
    }

    getHelp(programName){
        let result = "Usage : " + this.makeUsageMessage(programName) + "\n" + this.#abstract + "\n";
        for (let param of this.getAllParameters()){
            if (param.hidden) continue;

            let usageText = param.parser.getUsageDescription(param.dest, param.optional);
            let description = param.description ?? param.parser.getDefaultDescription();

            if (typeof usageText == "string"){
                result += makeHelpLine(usageText, description)
            } else if (usageText instanceof Array){
                if (description instanceof Array){
                    for (let i = 0; i < usageText.length; i++){
                        result += makeHelpLine(usageText[i], description[i]);
                    }
                } else {
                    result += makeHelpLine(usageText.join(","), description);
                }
            }
            
        }
        return result;
    }
}