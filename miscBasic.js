/* Very basic functions */
import {basename} from 'path'
import { argv } from 'process'

export function usageMessage(argsDesc){
    return "Usage : " + basename(argv[0]) + " " + basename(argv[1]) + " " + argsDesc;
}