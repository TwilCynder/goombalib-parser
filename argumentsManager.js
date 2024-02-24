import { SingleOptionParser } from "./parseArguments.js";

export class ArgumentsManager {
    #parsers = [];

    /**
     * 
     * @param {string | string[]} sw 
     * @param {{dest?: string, description?: string}} options 
     */
    addOption(sw, options, mandatory = false){
        let dest;

        if (options.dest){
            dest = options.dest
        } else if (sw instanceof Array){
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
            } else if (sw.startsWith("-") && !found_long_option){
                dest = sw.replace(/^-*/g, "");
            } else {
                dest = sw;
            }
        }

        this.#parsers.push({
            parser: new SingleOptionParser(),
            dest,
            mandatory,
            description: options.description
        })
    }

    makeUsageMessage(){
        
    }
}