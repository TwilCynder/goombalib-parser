export function argsLeft(args, i, needed){
    return i < args.length - needed;
}

/**
 * Base class used by parseArguments.
 * Child classes define a parse method that will either capture or leave each argument, 
 * and a getState method that returns the result of the parsing at the end.
 */
export class Parser {
    _state;

    constructor(){}

    /**
     * Given the arguments array and the current argument arrays, will add something to the state or not depending on if this argument is relevant to this parser.
     * Then returns either true if the argument shouldn't be handled by anyone else, false if it wasn't relevant to the parser and should be handled
     * by another parser, or a number n if the method handled the current argument but also the next n ones (see the getArg method), which should then be skipped 
     * @param {string[]} args 
     * @param {number} i 
     * @returns {number|boolean}
     */
    parse(args, i){}

    getState(){
        return this._state;
    }

    onMissingArgument(){
        throw "Missing argument"
    }


    /**
     * Returns a short string describing the basic syntax of each argument this parser is looking for.
     * @param {string} name the name associated with this instance of the Parser. See implementations of this method for good examples.
     * @returns {string | string[]}
     */
    getUsageDescription(name){
        return "Unknown parameter : " + name;
    }

    /**
     * Returns a short string describing the syntax for the arguments this parser is looking for, including indicators of optionality or repetition
     * @param {string} name the name associated with this instance of the Parser. See implementations of this method for good examples.
     * @param {boolean} optional whether this parser has been marked as optional or not, in it's use context
     * @returns {string | string[]}
     */
    getUsageText(name, optional){
        return this.getUsageDescription(name);
    }

    usageTextCustomHandleOptional(){
        return true;
    }

    /**
     * Returns the ith element in the args array, or handles the case where the requested index is out of bounds 
     * (typically, when parsing argument n° x you needed to read the next argument but that argument was not provided).
     * In that case, it calls the onMissingArgument method. Should that method throw an exception, this exception would be handled
     * by parseArguments ; that's the intended use for overloads of onMissingArgument, and the default implementation simply throws with "Missing Argument"
     * @param {string[]} args 
     * @param {number} i 
     */
    getArg(args, i){
        if (i >= args.length){
            this.onMissingArgument();
        }

        return args[i];
    }

    /**
     * If the argument is a property assignment (any string of form "this=that"), returns ["this", "that"]. 
     * If it is not, returns [false]  
     * Typical usage : let [prop, value] = Parser.propertyAssignment(arg) ; if (prop) ...
     * @param {string} arg 
     */
    static propertyAssignment(arg){
        let arr = arg.split(/=/g);
        if (arr.length == 2){
            return arr;
        }
        return [false];
    }
}

class NativeParser extends Parser {
    usageTextCustomHandleOptional(){
        return false;
    }
}

/**
 * Parser for parseArguments used to determine an output mode (output file, stdout) consumes the following arguments : 
 * - "-o" followed by a filename (meaning it will consume the next argument too) -> state will contain this filename in the "file" property
 * - "--stringified-output" : property "stdout" of the state will contain "string"
 * - "--log-output" : property "stdout" of the state will contain "log"
 */
export class OutputModeParser extends NativeParser {
    constructor(default_stdout_mode = null, default_file = null){
        super();
        this._state = {
            file: default_file,
            stdout: default_stdout_mode,
        }
    }

    parse(args, i) {
        switch(args[i]){
            case "-o": 
                if (!argsLeft(args, i, 1)) throw "Argument -o must be followed by a filename";
                this._state.file = args[i + 1];
                return 1;
            case "--stringified-output":
                this._state.stdout = "string";
                return true;
            case "--log-output":
                this._state.stdout = "log";
                return true;
        }
    
        return false;
    }

    getUsageDescription(){
        return "[-o file] [--stringified-output | --log-output]"
    }
}

/**
 * Parser for parseArguments that saves all argumements it received
 */
export class AllArgumentsParser extends NativeParser {
    constructor(){
        super();
        this._state = [];
    }

    parse(args, i){
        this._state.push(args[i]);
        return true;
    }

    getUsageDescription(name){
        return `<${name}> ...`
    }
}

/**
 * Parser for parseArguments that saves a single argument (and returns it as its state)
 */
export class SingleArgumentParser extends NativeParser {
    #last

    /**
     * @param {boolean} last If false, will take the first argument and no other, if true, will take all arguments given to it and save the last one 
     */
    constructor(last, default_value = null){
        super();
        this.#last = last;
        this._state = default_value;
    }

    parse(args, i){
        if (!this._state || this.#last){
            this._state = args[i];
            return true;
        }
    }

    getUsageDescription(name){
        return `<${name}>`
    }
}

export class TriggerParser extends NativeParser {
    #trigger;

    /**
     * @param {string | string[]} trigger The argument, or a list of arguments, to look for
     */
    constructor(trigger){
        super();
        this.#trigger = trigger;
    }

    isTriggerArray(){
        return this.#trigger instanceof Array;
    }

    #detectTriggerSingle(arg){
        if (arg == this.#trigger){
            return true;
        }
    }

    #detectTriggerArray(arg){
        for (let sw of this.#trigger){
            if (arg == sw){
                return true;
            }
        }
    }

    detectTrigger(arg){
        return this.isTriggerArray() ? this.#detectTriggerArray(arg) : this.#detectTriggerSingle(arg);
    }

    getUsageDescription(){
        if (this.isTriggerArray()){
            let res = "";
            for (let i = 0; i < this.#trigger.length - 1; i++){
                res += this.#trigger[i] + "/";
            }
            return res + (this.#trigger.length > 0 ? this.#trigger.at(-1): "");
        } else {
            return this.#trigger;
        }
    }
}

/**
 * Parser for parseArguments that looks for a specific argument, and ultimately returns whether it was found or not (ideal for switches)
 */
export class SingleSwitchParser extends TriggerParser {
    /**
     * @param {string | string[]} trigger The argument, or a list of arguments, to look for
     */
    constructor(trigger){
        super(trigger);
        this._state = false;
    }

    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state = true;
            return true;
        }
    } 
}

/**
 * Parser for parseArguments that looks for a specific argument (generally an option starting with a -) and saves the next argument (ideal for arguments like "-f filename")
 */
export class SingleOptionParser extends TriggerParser {

    /**
     * @param {string | string[]} trigger The argument to look for
     */
    constructor(trigger, default_value = null){
        super(trigger);
        this._state = default_value;
    }

    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state = this.getArg(args, i + 1);;
            return 1;
        }
    } 

    getUsageDescription(name){
        return super.getUsageDescription() + ` <${name}>`;
    }

}

export class MultiOptionParser extends TriggerParser {
    /**
     * @param {string | string[]} trigger The argument to look for
     */
    constructor(trigger){
        super(trigger)
        this._state = [];
    }

    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state.push(this.getArg(args, i + 1));
            return 1;
        }
    }

    getUsageDescription(name){
        return super.getUsageDescription() + ` <${name}>`
    }

    getUsageText(name){
        return "(" + this.getUsageDescription(name) + ")...";
    }
}

export class CompositeOptionParser extends TriggerParser {
    #length;
    #optionsNames;

    /**
     * @param {string | string[]} trigger The argument to look for
     * @param {number} length 
     * @param {string[]} optionsNames
     */
    constructor(trigger, length, optionsNames = null){
        super(trigger);
        this._state = [];
        this.#length = length;
        this.#optionsNames = optionsNames;
    }
    
    /**
     * 
     * @param {string[]} args 
     * @param {number} i 
     */
    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state = args.slice(i + 1, i + this.#length + 1);
            return this.#length;
        }
    }

    getUsageDescription(name){
        let names = this.#optionsNames ?? Array(this.#length).fill(null).map((_, i) => name + "" + i);
        return super.getUsageDescription() + " " + names.map(name => `<${name}> `).join(" ");
    }
}

export class MultiCompositeOptionParser extends TriggerParser {
    #length;
    #optionsNames;

    /**
     * @param {string | string[]} trigger The argument to look for
     * @param {number} length 
     * @param {string[]} optionsNames
     */
    constructor(trigger, length, optionsNames = null){
        super(trigger);
        this._state = [];
        this.#length = length;
        this.#optionsNames = optionsNames;
    }

    /**
     * 
     * @param {string[]} args 
     * @param {number} i 
     */
    parse(args, i){
        if (this.detectTrigger(args[i])){
            this._state.push(args.slice(i + 1, i + this.#length + 1));
            return this.#length;
        }
    }

    getUsageDescription(name){
        let names = this.#optionsNames ?? Array(this.#length).fill(null).map((_, i) => name + "" + i);
        return super.getUsageDescription() + " " + names.map(name => `<${name}> `).join(" ")
    }

    getUsageText(name){
        "(" + this.getUsageDescription(name) + ")...";
    }
}

export class SinglePropertyParser extends NativeParser {
    #propName;

    constructor(propName, default_value = null){
        super();
        this.#propName = propName;
        this._state = default_value;
    }

    parse(args, i){
        let [prop, value] = NativeParser.propertyAssignment(args[i]);
        if (prop && prop == this.#propName){
            this._state = value;
        }
    }

    getUsageDescription(name){
        return this.#propName + "=<" + name + ">";
    }
}

/**
 * Parser for parseArguments that takes all "propery assignment" arguments (of form "string1=string2"), 
 * and returns an object with all these pairs as key-values.  
 */

export class PropertiesParser extends NativeParser {
    constructor(){
        super();
        this._state = {};
    } 

    parse(args, i){
        let [prop, value] = NativeParser.propertyAssignment(args[i]);
        if (prop){
            this._state[prop] = value;
            return true;
        }
    }

    getUsageDescription(name){
        return "(additional configuration properties) propName=value";
    }
}

/**
 * 
 * @param {string[]} args 
 * @param {{}} parsers 
 * @param {boolean} namedArgumentsParsing
 */
export function parseArgumentsNamed(args, parsers, namedArgumentsParsing){
    try {
        let result = {}

        let parsers_ = Object.values(parsers);
        for (let argIndex = 0; argIndex < args.length; argIndex++){
            if (namedArgumentsParsing){
                let [prop, value] = NativeParser.propertyAssignment(args[argIndex]);
                if (prop){
                    result[prop] = value;
                    continue;
                }    
            }
            for (let parser of parsers_){
                let res = parser.parse(args, argIndex);
                if (res === true) {
                } else if (typeof res == "number"){
                    argIndex += res;
                } else {
                    continue;
                }
                break;
            }
        }
    
        for (let k in parsers){
            result[k] = parsers[k].getState();
        }

        return result;
    } catch (err){
        console.error("Could not parse arguments : ", err);
        return {};
    }
}

/**
 * Goes through all the given arguments and feeds them to each given Parser, then returns an array containing the final state of each Parser
 * @param {string[]} args 
 * @param  {...NativeParser} parsers 
 * @returns 
 */
export function parseArguments(args, ...parsers){

    try {
        for (let argIndex = 0; argIndex < args.length;){
            for (let parser of parsers){
                
    
                let res = parser.parse(args, argIndex);
                if (res === true) {
                } else if (typeof res == "number"){
                    argIndex += res;
                } else {
                    continue;
                }
                break;
            }
            argIndex++;
        }
    
        return parsers.map( parser => parser.getState());
    } catch (err){
        console.error("Could not parse arguments : ", err);
        return [];
    }
}

export function parseProcessArguments(...parsers){
    return parseArguments(process.argv.slice(2))
}