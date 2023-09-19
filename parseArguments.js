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
            console.log("Parsing arg", argIndex, "with", parser);
            let res = parser.parse(args, argIndex);
            console.log("Result :", res)
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
        console.log("New arg index : ", argIndex, args.length);
    }

    return parsers.map( parser => parser.getState());
}

export class OutputModeParser extends Parser {
    constructor(){
        super();
        this._state = {
            file: null,
            stdout: null,
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