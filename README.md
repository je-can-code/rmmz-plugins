# J's Land of Plugins

This project is a test bed for all plugins I am actively developing/maintaining.

### Building

There are a plethora of `npm run` commands to choose from to build.

Consider reviewing the `package.json` to see what is current.

> Each command executes my custom hand-written build tools designed to ease the process of writing RMMZ plugins.
> These tools can be found in `/src/build-tools` and include some amount of documentation inside each file.

Executing one of the build commands, such as `npm run build:crit` will result in combining all files found
under `/src/plugins/crit`.

Executing one of the build commands that are the core of a plugin, such as `npm run build:jabs`, will only
result in combining all files found under `/src/plugins/jabs/base`. Each extension will need to be built
independently since technically they are separate plugins.