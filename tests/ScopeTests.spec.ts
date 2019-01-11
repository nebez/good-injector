import { Container } from "../src/Index";
import { AsyncTest, Expect, Test, TestCase, TestFixture } from "alsatian";
import { Child } from "./samples/scope/Child";
import { Parent } from "./samples/scope/Parent";
import { DerivedChild } from "./samples/scope/DerivedChild";
import { DerivedDerivedChild } from "./samples/scope/DerivedDerivedChild";

@TestFixture("Scope tests")
export class ScopeTests {
    @AsyncTest("when registered as transient should return new instances every time")
    public async scopeTest1() {
        let container = new Container();
        container.registerTransient(Child);

        let child1 = await container.resolve(Child);
        let child2 = container.resolve(Child);

        Expect(child1).not.toEqual(child2);
    }

    @AsyncTest("when registered as singleton should return the same instance every time")
    public async scopeTest2() {
        let container = new Container();
        container.registerSingleton(Child);

        let child1 = await container.resolve(Child);
        let child2 = await container.resolve(Child);

        Expect(child1).toEqual(child2);
    }

    @AsyncTest("resolving transient parent with transient child gets different child instances every time")
    public async scopeTest3() {
        let container = new Container();
        container.registerTransient(Parent);
        container.registerTransient(Child);

        let parent1 = await container.resolve(Parent);
        let parent2 = await container.resolve(Parent);

        Expect(parent1).not.toEqual(parent2);
        Expect(parent1.child).toBeDefined();
        Expect(parent1.child).not.toEqual(parent2.child);
    }

    @AsyncTest("resolving transient parent with singleton child gets same child instance every time")
    public async scopeTest4() {
        let container = new Container();
        container.registerTransient(Parent);
        container.registerSingleton(Child);

        let parent1 = await container.resolve(Parent);
        let parent2 = await container.resolve(Parent);

        Expect(parent1).not.toEqual(parent2);
        Expect(parent1.child).toBeDefined();
        Expect(parent1.child).toEqual(parent2.child);
    }

    @AsyncTest("resolving singleton parent with transient child gets same child instance every time")
    public async scopeTest5() {
        let container = new Container();

        // note: this is considered a logical error in many cases, because singletons should not rely on types that are registered transiently
        container.registerSingleton(Parent);
        container.registerTransient(Child);

        let parent1 = await container.resolve(Parent);
        let parent2 = await container.resolve(Parent);

        Expect(parent1).toEqual(parent2);
        Expect(parent1.child).toBeDefined();
        Expect(parent1.child).toEqual(parent2.child);
    }

    @AsyncTest("resolving registered instance should get the original instance")
    public async scopeTest6() {
        let container = new Container();

        let instance = new Child();
        container.registerInstance(Child, instance);

        let child1 = await container.resolve(Child);

        Expect(child1).toEqual(instance);
    }

    @AsyncTest("resolving registered instance should get the same instance every time")
    public async scopeTest7() {
        let container = new Container();

        let instance = new Child();
        container.registerInstance(Child, instance);

        let child1 = await container.resolve(Child);
        let child2 = await container.resolve(Child);

        Expect(child1).toEqual(child2);
    }

    @AsyncTest("resolving registered by factory should use the factory")
    public async scopeTest8() {
        let container = new Container();
        let wasCalled = false;

        let factory = () => {
            wasCalled = true;
            return new Child();
        };

        container.registerFactory(Child, factory);
        let child = container.resolve(Child);

        Expect(wasCalled).toBe(true);
    }

    @AsyncTest("resolving registered by factory should return the factory result")
    public async scopeTest9() {
        let container = new Container();
        let child = new Child();

        let factory = () => child;

        container.registerFactory(Child, factory);
        let child1 = await container.resolve(Child);

        Expect(child1).toEqual(child);
    }

    @AsyncTest("resolving registered by factory should return the factory result 2")
    public async scopeTest10() {
        let container = new Container();
        let child1 = new Child();
        let child2 = new Child();
        let flip = false;

        let factory = () => {
            flip = !flip;
            return flip ? child1 : child2;
        };

        container.registerFactory(Child, factory);
        let returnedChild1 = await container.resolve(Child);
        let returnedChild2 = await container.resolve(Child);
        let returnedChild3 = await container.resolve(Child);

        Expect(returnedChild1).not.toEqual(returnedChild2);
        Expect(returnedChild1).toEqual(returnedChild3);
        Expect(returnedChild1).toEqual(child1);
        Expect(returnedChild2).toEqual(child2);
    }

    @AsyncTest("registering a type-compatible factory as instance should result in an error")
    public async scopeTest11() {
        // explanation: the TypeScript compiler compares members to determine type compatibility on generics. This means that for simple types,
        // with specific members like "name" that can be found also on functions, type inference allows to pass in wrong types (see example "Child" below!)
        // => we can account for some of these cases by checking the type at runtime and throw
        // for more details, see: https://github.com/Microsoft/TypeScript/wiki/FAQ#why-is-astring-assignable-to-anumber-for-interface-at--
        let container = new Container();

        let factory = () => new Child();

        // note: wrongly used "registerInstance" instead of "registerFactory" here (-> i.e. typo)
        Expect(() => container.registerInstance(Child, factory)).toThrow();
    }

    @AsyncTest("registering a derived type as instance should resolve correctly")
    public async scopeTest12() {
        // this test is to make sure the runtime check tested by scopeTest11 does not break inheritance
        let container = new Container();
        container.registerInstance(Child, new DerivedChild());

        let resolvedChild = await container.resolve(Child);

        Expect(resolvedChild instanceof DerivedChild).toBe(true);
    }

    @AsyncTest("registering a type derived from a derviced type as instance should resolve correctly")
    public async scopeTest13() {
        // this test is to make sure the runtime check tested by scopeTest11 does not break inheritance
        let container = new Container();
        container.registerInstance(Child, new DerivedDerivedChild());

        let resolvedChild = await container.resolve(Child);

        Expect(resolvedChild instanceof DerivedDerivedChild).toBe(true);
    }

    @AsyncTest("resolving registered as singleton factory should use the factory")
    public async scopeTest14() {
        let container = new Container();
        let wasCalled = false;

        let factory = () => {
            wasCalled = true;
            return new Child();
        };

        container.registerSingletonFactory(Child, factory);
        let child = await container.resolve(Child);

        Expect(wasCalled).toBe(true);
    }

    @AsyncTest("resolving registered as singleton factory should return the factory result")
    public async scopeTest15() {
        let container = new Container();
        let child = new Child();

        let factory = () => child;

        container.registerSingletonFactory(Child, factory);
        let child1 = await container.resolve(Child);

        Expect(child1).toEqual(child);
    }

    @AsyncTest("resolving registered as singleton factory should return the same result every time")
    public async scopeTest16() {
        let container = new Container();

        // explicitly create new instance, but should only be called once later
        let factory = () => new Child();

        container.registerSingletonFactory(Child, factory);
        let child1 = await container.resolve(Child);
        let child2 = await container.resolve(Child);
        let child3 = await container.resolve(Child);

        Expect(child1).toEqual(child2);
        Expect(child1).toEqual(child3);
    }

    @AsyncTest("resolving an async registration should return the underlying resolved value")
    public async scopeTest17() {
        const timeout = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        let container = new Container();
        let child = new Child();

        let factory = async () => {
            await timeout(50);
            return child;
        }

        container.registerFactory(Child, factory);

        const child1 = container.resolve(Child);
        const child2 = await container.resolve(Child);

        Expect(child1 instanceof Promise).toBe(true);
        Expect(child2 instanceof Child).toBe(true);
    }

    @AsyncTest("resolving a transient registration with async dependency registrations should return only resolved dependencies")
    public async scopeTest18() {
        const timeout = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        let container = new Container();

        let factory = async () => {
            await timeout(50);
            return new Child();
        }

        container.registerTransient(Parent);
        container.registerFactory(Child, factory);

        let parent = await container.resolve(Parent);

        Expect(parent instanceof Parent).toBe(true);
        Expect(parent.child instanceof Child).toBe(true);
    }

    @AsyncTest("resolving multiple transient registration with async singleton dependencies should return the same instance resolved dependencies")
    public async scopeTest19() {
        const timeout = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        let container = new Container();

        let factory = async () => {
            await timeout(50);
            return new Child();
        }

        container.registerTransient(Parent);
        container.registerSingletonFactory(Child, factory);

        let [parent1, parent2, parent3] = await Promise.all([
            container.resolve(Parent),
            container.resolve(Parent),
            container.resolve(Parent),
        ]);

        Expect(parent1 == parent2).toBe(false);
        Expect(parent2 == parent3).toBe(false);
        Expect(parent1 == parent3).toBe(false);

        Expect(parent1.child == parent2.child).toBe(true);
        Expect(parent2.child == parent3.child).toBe(true);
        Expect(parent1.child == parent3.child).toBe(true);
    }
}
