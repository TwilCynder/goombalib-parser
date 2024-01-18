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
     * by another parser, or a number n if the method handled the current argument but also the next n ones, which should then be skipped 
     * @param {string[]} args 
     * @param {number} i 
     * @returns {number|boolean}
     */
    parse(args, i){}

    getState(){
        return this._state;
    }
}

/**
 * Parser for parseArguments used to determine an output mode (output file, stdout) consumes the following arguments : 
 * - "-o" followed by a filename (meaning it will consume the next argument too) -> state will contain this filename in the "file" property
 * - "--stringified-output" : property "stdout" of the state will contain "string"
 * - "--log-output" : property "stdout" of the state will contain "log"
 */
export class OutputModeParser extends Parser {
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
}

/**
 * Parser for parseArguments that saves a single argument (and returns it as its state)
 */
export class SingleArgumentParser extends Parser {
    #last

    /**
     * @param {boolean} last If false, will take the first argument and no other, if true, will take all arguments given to it and save the last one 
     */
    constructor(last){
        super()
        this.#last = last
    }

    parse(args, i){
        if (!this._state || this.#last){
            this._state = args[i];
            return true;
        }
    }
}

/**
 * Goes through all the given arguments and feeds them to each given Parser, then returns an array containing the final state of each Parser
 * @param {string[]} args 
 * @param  {...Parser} parsers 
 * @returns 
 */
export function parseArguments(args, ...parsers){
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
}

