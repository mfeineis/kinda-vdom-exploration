/*
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * This shim allows elements written in, or compiled to, ES5 to work on native
 * implementations of Custom Elements v1. It sets new.target to the value of
 * this.constructor so that the native HTMLElement constructor can access the
 * current under-construction element's definition.
 */
(function() {
  if (
    // No Reflect, no classes, no need for shim because native custom elements
    // require ES2015 classes or Reflect.
    window.Reflect === undefined ||
    window.customElements === undefined ||
    // The webcomponentsjs custom elements polyfill doesn't require
    // ES2015-compatible construction (`super()` or `Reflect.construct`).
    window.customElements.hasOwnProperty('polyfillWrapFlushCallback')
  ) {
    return;
  }

    //const _apply = Function.call.bind(Function.apply)

    //const Call = function (F, V) {
    //    var args = arguments.length > 2 ? arguments[2] : [];
    //    //if (!ES.IsCallable(F)) {
    //    //    throw new TypeError(F + ' is not a function');
    //    //}
    //    return _apply(F, V, args);
    //};
    //const Construct = function (C, args, newTarget, isES6internal) {
    //    var target = typeof newTarget === 'undefined' ? C : newTarget;

    //    //if (!isES6internal && Reflect.construct) {
    //    //    // Try to use Reflect.construct if available
    //    //    return Reflect.construct(C, args, target);
    //    //}
    //    // OK, we have to fake it.  This will only work if the
    //    // C.[[ConstructorKind]] == "base" -- but that's the only
    //    // kind we can make in ES5 code anyway.

    //    // OrdinaryCreateFromConstructor(target, "%ObjectPrototype%")
    //    var proto = target.prototype;
    //    //if (!ES.TypeIsObject(proto)) {
    //    //    proto = Object.prototype;
    //    //}
    //    var obj = Object.create(proto);
    //    // Call the constructor.
    //    var result = Call(C, obj, args);
    //    //return ES.TypeIsObject(result) ? result : obj;
    //    return result;
    //};
    ////function MyPromise(exec) {
    ////    var promise = new Promise(exec);
    ////    Object.setPrototypeOf(promise, MyPromise.prototype);
    ////    // ...
    ////    return promise;
    ////}
    ////Object.setPrototypeOf(MyPromise, Promise);
    ////MyPromise.prototype = Object.create(Promise.prototype, {
    ////    constructor: { value: MyPromise }
    ////});

    //const Reflect = {
    //    // New operator in a functional form.
    //    construct: function construct(constructor, args) {
    //        //if (!ES.IsConstructor(constructor)) {
    //        //    throw new TypeError('First argument must be a constructor.');
    //        //}
    //        var newTarget = arguments.length > 2 ? arguments[2] : constructor;
    //        //if (!ES.IsConstructor(newTarget)) {
    //        //    throw new TypeError('new.target must be a constructor.');
    //        //}
    //        return Construct(constructor, args, newTarget, 'internal');
    //    },
    //};

    const BuiltInHTMLElement = HTMLElement;
    window.HTMLElement = function HTMLElement() {
        return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
    };
    HTMLElement.prototype = BuiltInHTMLElement.prototype;
    HTMLElement.prototype.constructor = HTMLElement;
    Object.setPrototypeOf(HTMLElement, BuiltInHTMLElement);
})();



     {

         //function CLASS() { return Reflect.construct(HTMLElement, [], this.__proto__.constructor); };
         //Object.setPrototypeOf(CLASS.prototype, HTMLElement.prototype);
         //Object.setPrototypeOf(CLASS, HTMLElement);

         //customElements.define("test-elem", CLASS);
         //const test = document.createElement("test-elem");
         //test.setAttribute("what", "is the matrix?");
         //test.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test);


         //const ES5Element = function() {}
         //customElements.define('es5-element', ES5Element)
         //Reflect.construct(HTMLElement, [], ES5Element)

         function MyPromise(x) {
             var self = new Promise(x);
             Object.setPrototypeOf(self, MyPromise.prototype);
             return self;
         }
         Object.setPrototypeOf(MyPromise.prototype, Promise.prototype);

         new MyPromise(function (resolve) {
             resolve({ blubb: "bla" });
         }).then(function (it) {
             console.log("MyPromise::then", it);
         });

         function MyEl() {
             return Reflect.construct(HTMLElement, [], this.constructor);
         }

         MyEl.prototype = Object.create(HTMLElement.prototype);
         MyEl.prototype.constructor = MyEl;
         Object.setPrototypeOf(MyEl, HTMLElement);

         //function MyEl() {
         //    HTMLElement.call(this);
         //}
         //MyEl.prototype = Object.create(HTMLElement.prototype);
         //MyEl.prototype.constructor = MyEl;
         //Object.setPrototypeOf(MyEl, HTMLElement);

         MyEl.prototype.connectedCallback = function() {
             this.innerHTML = 'Hello world';
         };
         customElements.define('my-el', MyEl);
         const test8 = document.createElement("my-el");
         test8.setAttribute("what", "is the matrix?");
         test8.setAttribute("unobserved", "agents!");
         document.body.appendChild(test8);


         //var hasReflect = typeof Reflect === 'object',
         //    sPO = Object.setPrototypeOf ||
         //          function (o, p) { o.__proto__ = p; return o; },
         //      construct = hasReflect &&
         //                  Reflect.construct ||
         //                  function (Super, args, Constructor) {
         //                      [].unshift.call(args, Super);
         //                      var C = Super.bind.apply(Super, args);
         //                      return sPO(new C, Constructor.prototype);
         //                  };

         //function Elem(x) {
         //    return construct(HTMLElement, arguments, this.constructor);
         //}
         //customElements.define("x-elem", Elem);
         //const test7 = document.createElement("x-elem");
         //test7.setAttribute("what", "is the matrix?");
         //test7.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test7);




         //function Elem(x) {
         //    var self = Object.create(HTMLElement.prototype);
         //    Object.setPrototypeOf(self, Elem.prototype);
         //    return self;
         //}
         //Object.setPrototypeOf(Elem.prototype, HTMLElement.prototype);
         //Object.setPrototypeOf(Elem, HTMLElement);

         //customElements.define("x-elem", Elem);
         //const test6 = document.createElement("x-elem");
         //test6.setAttribute("what", "is the matrix?");
         //test6.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test6);



         //function MyPromise() {
         //    return Reflect.construct(Promise, Array.from(arguments), this.__proto__.constructor);
         //}
         //Object.setPrototypeOf(MyPromise.prototype, Promise.prototype);
         //Object.setPrototypeOf(MyPromise, Promise);
         //function CLASS() { return Reflect.construct(HTMLElement, [], this.__proto__.constructor); };
         //Object.setPrototypeOf(CLASS.prototype, HTMLElement.prototype);
         //Object.setPrototypeOf(CLASS, HTMLElement);

         ////MyPromise.prototype = Promise.prototype;
         //MyPromise.prototype.constructor = MyPromise;
         //MyPromise.prototype.__proto__ = Promise.prototype;
         //MyPromise.__proto__ = Promise;
         //Object.setPrototypeOf(MyPromise, Promise);

         //new MyPromise(function (resolve) {
         //    resolve({ blubb: "bla" });
         //}).then(function (it) {
         //    console.log("MyPromise::then", it);
         //});


         //const ES5Element = function () {
         //}
         //customElements.define('es5-element', ES5Element)
         //Reflect.construct(HTMLElement, [], ES5Element)

         //const test4 = document.createElement("es5-element");
         //test4.setAttribute("class", "classy");
         //test4.setAttribute("what", "is the matrix?");
         //test4.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test4);


         //const BuiltInHTMLElement = HTMLElement;
         //function BaseElement() {
         //    return Reflect.construct(BuiltInHTMLElement, [], this.constructor);
         //};
         //BaseElement.prototype = BuiltInHTMLElement.prototype;
         //BaseElement.prototype.constructor = BaseElement;
         //Object.setPrototypeOf(BaseElement, BuiltInHTMLElement);


         //customElements.define("base-element", BaseElement);
         //const test3 = document.createElement("base-element");
         //test3.setAttribute("class", "classy");
         //test3.setAttribute("what", "is the matrix?");
         //test3.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test3);




         //function MyCustomElement() {
         //    return Reflect.construct(HTMLElement, [], MyCustomElement);
         //}
         //MyCustomElement.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
         //    alert(newValue);
         //}
         //MyCustomElement.observedAttributes = ['class'];
         //MyCustomElement.prototype.__proto__ = HTMLElement.prototype;
         //MyCustomElement.__proto__ = HTMLElement;

         //customElements.define('my-custom-element', MyCustomElement);
         //const test2 = document.createElement("my-custom-element");
         //test2.setAttribute("class", "classy");
         //test2.setAttribute("what", "is the matrix?");
         //test2.setAttribute("unobserved", "agents!");
         //document.body.appendChild(test2);

         //function MyEl() {
         //    return Reflect.construct(HTMLElement, [], this.constructor);
         //}

         //MyEl.prototype = Object.create(HTMLElement.prototype);
         //MyEl.prototype.constructor = MyEl;
         //Object.setPrototypeOf(MyEl, HTMLElement);

         //MyEl.prototype.connectedCallback = function() {
         //    this.innerHTML = 'Hello world';
         //};
         //customElements.define('my-el', MyEl);

         //const myEl = document.createElement("ay-test");
         //myEl.setAttribute("what", "is the matrix?");
         //myEl.setAttribute("unobserved", "agents!");
         //document.body.appendChild(myEl);


         //function Test() {
         //    const instance = Reflect.construct(HTMLElement, [], this.constructor);
         //    //Object.setPrototypeOf(this, Test.prototype);

         //    //HTMLElement.prototype.constructor.apply(this, arguments);
         //    console.log("Test::ctor", instance);
         //    return instance;
         //}
         //Object.setPrototypeOf(Test, HTMLElement);
         //Test.observedAttributes = ["what"];
         //Test.prototype = Object.create(HTMLElement.prototype, {
         //    constructor: { value: Test },
         //});
         //Test.prototype.constructor = Test;
         ////Test.prototype.adoptedCallback = function adoptedChanged() {
         ////    console.log("Test::adoptedCallback", arguments, this);
         ////};
         ////Test.prototype.attributeChangedCallback = function attributeChanged() {
         ////    console.log("Test::attributeChangedCallback", arguments, this);
         ////};
         ////Test.prototype.createdCallback = function created() {
         ////    console.log("Test::createdCallback", arguments, this);
         ////};
         ////Test.prototype.connectedCallback = function connected() {
         ////    console.log("Test::connectedCallback", arguments, this);
         ////};
         ////Test.prototype.disconnectedCallback = function disconnected() {
         ////    console.log("Test::disconnectedCallback", arguments, this);
         ////};
         //customElements.define("ay-test", Test);

         //const it = document.createElement("ay-test");
         //it.setAttribute("what", "is the matrix?");
         //it.setAttribute("unobserved", "agents!");
         //document.body.appendChild(it);

     }
