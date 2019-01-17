import { SupportsInjection } from "../../../src/Index";
import { Logger } from "./Logger";
import { Tool } from "./Tool";

@SupportsInjection
export class ConsoleLoggerWithMethodDependency {
    public tool: Tool;

    public constructor(tool: Tool) {
        this.tool = tool;
    }

    @SupportsInjection
    public testMethod(secondTool: Tool): string {
        return this.tool.help() + "blubb" + secondTool.help();
    }

    protected writeMessage(message: string): void {
        // tslint:disable-next-line:no-console
        console.log(message);
    }
}
