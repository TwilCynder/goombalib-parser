# NodeJS Arguments Parser(s)

This module provides various ways of easily parsing arguments given to a program (or any array of strings actually).  

## Install


```sh

npm add @twilcynder/arguments-parser

```

## Quick Start

You can parse arguments either by passing instances or various Parsers to the parseArguments() function, but the simplest solution is to use a single ArgumentsManager and its methods.

```js
import { ArgumentsManager } from "@twilcynder/arguments-parser";

let {parameter, switch, switch2, option, number, files, props} = new ArgumentsManager()
    .addParameter("parameter", {description: "A parameter"})
    .addSwitch("-s", {dest: "switch", description: "A Switch (mandatory)"})
    .addSwitch(["-S", "--switch2"], {dest: "switch", description: "Another switch (optional)"}, false)
    .addOption(["-o", "--option"], {description: "An Option"})
    .addOption(["-n", "--number"], {description: "Needs a number", type: "number"})
    .addMultiParameter("files")
    .setAbstract("A test program")
    .setMissingArgumentBehavior("Missing mandatory argument", null, false)
    .enableHelpParameter()
    .enablePropertyArguments("props")

    .parseProcessArguments()
```
```sh
    node test.js -s --option ye -n 12 prop=value file1 file2 * 
```

Basically, you add named parameters called "parsers", that will each take a value according to different behaviors (take any argument, check if a switch is present, etc).

Explanations for everything in these snippets below.

## Usage

### ArgumentsManager

The most basic way to use this library. An instance of ArgumentsManager can : 
- be configured with parsers, that will each handle different arguments
- parse a set of arguments with those parser

Each parser has a **destination**, which is a name that will be used to identify the result of that parser (whether a certain witch was found, the value of a certain parameter, etc). Parsing will always return an object / dictionnary, associating each destination name to its value. This means that using JavaScript's destructuring assigment, you can place them in variables like this 
```js
let {param1, param2} = new ArgumentsManager()
    .addParameter("param1")
    .addParameter("param2")
    //and then you parse, we'll see how in a minute
```

#### Configure

All these methods return the ArgumentsManager instance, which means you can chain them (`new ArgumentsManager().addOption().addParameter()...`)

##### Universal options

All the "add" methods take an "option" parameter, used to fine-tune the behavior of the added parser. There are some options that work on all parsers; only the options that are specific to each parser will be listed below.  

- **"default"** : specifies the default value retrurned by the parser is it did not catch anything (and was optional)
- **"description"** (string) : gives a description to the parser, used by the manual feature (see [the --help/-h parameter](#enablehelpparameter))

An additional common (as in, compatible with multiple parsers but not all) option is **"transform"** : this option allows you to convert the value saved by a parser before it is returned. 
- If its value is "number", the value will be converted to an integer (using parseInt)

##### .addParameter(dest, options = {}, optional = true)
Adds a **parameter** parser, that will simply take the value of an basic argument. A "basic argument" is defined as any argument that did not match any option or switch parser (see below) and is not a property (also see below)
The first argument is the destination name.  

Options can be : 
- "last" (boolean) : if false, this parser will take the first basic argument and then stop parsing anything. If true, this parser will take every argument and save the last. This means that any parameter parser added after this one will be unable to read anything, as a single argument cannot be saved by multiple parsers. 
- type (string) : 
  - "number" : value will be converted to a number (`NaN` if not convertible).

If "optional" is false, parsing methods will raise an error if this parser did not have anything to save.

This method supports the "transform" option (see [Universal Options](#universal-options))

##### .addMultiParameter(dest, options = {})
Works like the parameter parser, except instead of saving a single argument it will save all basic arguments that aren't a switch, option or property.

As a single argument cannot be saved by multiple parsers, any parameter parsers added after this method is called will be unable to parse anything.  

This parser does not take a "default" option, and simply returns an empty array if no arguments matched the conditions.  

This method supports the "transform" option (see [Universal Options](#universal-options)) ; keep in mind that it will work in a slightly special way, as the conversion will not be applied to the value of this parser directly (which is an array), but to all of its elements.

##### .addSwitch(triggers, options = {}, optional = true)
Adds a **switch** parser. This parser takes one or many "triggers", and ignores anything that is not exactly one of these triggers. Is one of the triggers is ever encountered, the value returned by this parser will be true ; if not, it will be false.  
The "triggers" parameter can either be a string or an array of strings.  

The destination name for this parser can be specified in the options (as "dest"), but if any of the triggers starts with "--", the rest of the trigger (i.e. the trigger without the initial "--" will be used as the destination name).

If "optional" is false, parsing methods will raise an error if none of the triggers were seen. Note that making a switch mandatory is very rarely relevant.

##### .addOption(triggers, options = {}, optional = true)
Adds an **option** parser. This parser takes one or many "triggers", and ignores anything that is not exactly one of these triggers. Is one of the triggers is ever encountered, the value of the *next argument* will be saved.  
The "triggers" parameter can either be a string or an array of strings.  

The destination name for this parser can be specified in the options (as "dest"), but if any of the triggers starts with "--", the rest of the trigger (i.e. the trigger without the initial "--" will be used as the destination name).

Options can be : 
- length : if above 1, this parser will save this amount of arguments after the trigger, and return them as an array

If "optional" is false, parsing methods will raise an error if none of the triggers were seen.

This method supports the "transform" option (see [Universal Options](#universal-options))

##### .addMultiOption(triggers, options = {}, optional = true)
Adds an **repeatable option** parser, which works just like the [option parser](#addoptiontriggers-options---optional--true), except it returns an array, saving a new element each time the trigger is found.  

To clarify : this is a parser that always returns an array. Each time the parsed argument is one of the triggers you specified as the first argument (either a string or an array of strings), the next argument is added to the array. 

This parser does not take a "default" option, and simply returns an empty array if the trigger was never seen.  

Options can be : 
- length : if above 1, this parser will save this amount of arguments after each occurence of the trigger, and return an array of arrays

This method supports the "transform" option (see [Universal Options](#universal-options)) ; keep in mind that it will work in a slightly special way, as the conversion will not be applied to the value of this parser directly (which is an array), but to all of its elements.

##### .enablePropertyArguments(dest = "properties", description)
Enables property arguments parsing. This means that all "property arguments", which are all the arguments of form `name=value` will be collected in a single object / dictionnary.  

**Example** : 
```js
let {props} = new ArgumentsManager()
    .enablePropertyArguments(props)
    .parseProcessArguments() //see below

console.log(props)
```
Running this propgram like this
```sh
node test.js prop1=foo prop2=bar
```
will produce the following result (content of the `props` variable)
```json
{"prop1": "foo", "prop2": "bar"}
```

Note that if you do not call this method, "property arguments" will just be treated as [basic arguments](#addparameterdest-options---optional--true)

##### .enableHelpParameter(noEffect) and .setAbstract(abstract)
Adds a special switch parser that detects either `-h` or `--help`.  
- If "noEffect" is `false`, when `-h` or `--help` are parsed it will display a help message ; the program will then exit with code 0.
- If it is `true`, the parser will simply behave like a normal switch parser, with `"help"` as the destination, allowing you to control more accurately what happens when the user requested help.  

This help message is composed of 
- A summary of all the parameters in the form of a "usage" string ("Usage : node program.js ...")
- Optionnaly, a short text configured with `setAbstract`
- A list of the parsers, with their description.  

##### .enableRecursiveResult(dest = "all")
If this method is called with a string parameter, the result object of the parsing will contain a property pointing to itself (with the name specified by "dest").  
This means that after running
```js
let {param1, param2, all} = new ArgumentsManager()
    //...
    .enableRecursiveResult()
    .parseProcessArguments()
```
the "all" variable will contain the whole result of .parseProcessArguments(), including itself.  
This is useful when you want to use the destructuring argument to assign the results to variables, but also keep the whole result object somewhere.  

##### .setMissingArgumentBehavior(message, errorCode, throw_ = true)
Configures the behavior of the parsing methods in case a mandatory argument is missing.  
- "message" (string) will set the text message displayed or raised, depending on the next arguments. Note that this message will be followed by " : " and the destination name of the parameter that's missing.  
- "errorCode" (number), if specified, will make the program exit with the given error code. 
- "throw" (boolean) sets whether an exception is raised if an argument is missing. Pointless if "errorCode" is specified, as the program will exit before anything can be raised.  
- "log" (boolean) sets whether the "message" is logged to stderr on if an argument is missing

#### .apply(func)
Calls "func" on the ArgumentsManager and returns it. The main purpose of this is that if you want to reuse the same parameters across different distances, you can write a function taking an ArgumentsManager and calling the above methods on it, and then use .apply to call this function as part of the methods chain.

```js
function config(am){
    am.addOption(    .addOption(["-o", "--output"], {
        description: "A file to save the output to. If not specified, the output will be sent to the std output."
    })
    .addSwitch(["-l", "--log"], {
        description: "Use to log the processed data (in a nice and pretty format) to the std output, the actual output is emitted"
    }))
}

//Without .apply

let manager = new ArgumentsManager();

config(manager)

manager
    .addParameter(...)
    .parseProgramArguments();

//with .apply

new ArgumentsManager()
    .apply(config)
    .addParameter(...)
    .parseProgramArguments();
```

#### Parse

After calling all the relevant configuration methods, and settings up what arguments you want to save in which destination, you can call on of these methods to parse arguments following your configuration.  

##### .parseArguments(args)
Parses any array of arguments ("args"). 

##### .parseProcessArguments()
Parses the arguments of the current process.