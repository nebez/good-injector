import { Container } from "../src/Index";
import { AsyncTest, Expect, Test, TestCase, TestFixture, FocusTest } from "alsatian";
import { Logger } from "./samples/logger/Logger";
import { ConsoleLogger } from "./samples/logger/ConsoleLogger";
import { ConsoleLoggerWithDependency } from "./samples/logger/ConsoleLoggerWithDependency";
import { ConsoleLoggerWithMethodDependency } from "./samples/logger/ConsoleLoggerWithMethodDependency";
import { Tool } from "./samples/logger/Tool";

@TestFixture("Logger samples tests")
export class LoggerSamplesTests {
    @AsyncTest("registered console logger should be console logger when resolved")
    public async loggerTest1() {
      let container = new Container();
      container.registerTransient(Logger, ConsoleLogger);

      let logger = await container.resolve(Logger);
      Expect(logger instanceof ConsoleLogger).toBe(true);
    }

    @AsyncTest("registered console logger can be used as console logger when resolved")
    public async loggerTest2() {
      let container = new Container();
      container.registerTransient(Logger, ConsoleLogger);

      let logger = await container.resolve(Logger);
      let testMethodResult = (<ConsoleLogger>logger).testMethod();
      Expect(testMethodResult).toBe("blubb");
    }

    @AsyncTest("logger with dependency should be console logger with dependency and work")
    public async loggerTest3() {
      let container = new Container();
      container.registerTransient(Logger, ConsoleLoggerWithDependency);
      container.registerTransient(Tool);

      let logger = await container.resolve(Logger);
      let testMethodResult = (<ConsoleLoggerWithDependency>logger).testMethod(); // uses injected "Tool" internally
      Expect(testMethodResult).toBe("42blubb");
    }

    @AsyncTest("logger with constructor dependency and method dependency should resolve dependencies and work")
    public async loggerTest4() {
      let container = new Container();
      container.registerTransient(ConsoleLoggerWithMethodDependency);
      container.registerTransient(Tool);

      let logger = await container.resolve(ConsoleLoggerWithMethodDependency);
      let testMethodResult = await container.invoke(logger, 'testMethod');
      Expect(testMethodResult).toBe("42blubb42");
    }

    @AsyncTest("logger with constructor dependency and method dependency should resolve dependencies while respecting resolution strategies and work")
    public async loggerTest5() {
      let container = new Container();
      container.registerTransient(ConsoleLoggerWithMethodDependency);
      container.registerSingletonFactory(Tool, () => {
        let counter = 0;
        return {
          help: () => (counter++).toString()
        }
      });

      let logger = await container.resolve(ConsoleLoggerWithMethodDependency);
      let testMethodResult = await container.invoke(logger, 'testMethod');
      Expect(testMethodResult).toBe("0blubb1");
    }
}
