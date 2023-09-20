export function argsLeft(args, i, needed){
    return i < args.length - needed;
}

export class Parser {
    _state;

    constructor(){}

    parse(){}

    getState(){
        return this._state;
    }
}

export function parseArguments(args, ...parsers){
    for (let argIndex = 0; argIndex < args.length;){
        for (let parser of parsers){
            let res = parser.parse(args, argIndex);
            if (res === true) {
                break;
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