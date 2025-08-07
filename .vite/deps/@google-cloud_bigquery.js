import {
  require_crypto
} from "./chunk-7K3IHR3B.js";
import {
  require_assert,
  require_browser,
  require_http,
  require_https,
  require_net,
  require_tls,
  require_url
} from "./chunk-BXXMIAW5.js";
import {
  require_buffer
} from "./chunk-V7DC6FS6.js";
import {
  __commonJS,
  __privateAdd,
  __privateGet,
  __privateMethod,
  __privateSet,
  __publicField
} from "./chunk-JVFZ3OZP.js";

// node_modules/@google-cloud/common/node_modules/@google-cloud/promisify/build/src/index.js
var require_src = __commonJS({
  "node_modules/@google-cloud/common/node_modules/@google-cloud/promisify/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.promisify = promisify;
    exports.promisifyAll = promisifyAll;
    exports.callbackify = callbackify;
    exports.callbackifyAll = callbackifyAll;
    function promisify(originalMethod, options) {
      if (originalMethod.promisified_) {
        return originalMethod;
      }
      options = options || {};
      const slice = Array.prototype.slice;
      const wrapper = function() {
        let last;
        for (last = arguments.length - 1; last >= 0; last--) {
          const arg = arguments[last];
          if (typeof arg === "undefined") {
            continue;
          }
          if (typeof arg !== "function") {
            break;
          }
          return originalMethod.apply(this, arguments);
        }
        const args = slice.call(arguments, 0, last + 1);
        let PromiseCtor = Promise;
        if (this && this.Promise) {
          PromiseCtor = this.Promise;
        }
        return new PromiseCtor((resolve, reject) => {
          args.push((...args2) => {
            const callbackArgs = slice.call(args2);
            const err = callbackArgs.shift();
            if (err) {
              return reject(err);
            }
            if (options.singular && callbackArgs.length === 1) {
              resolve(callbackArgs[0]);
            } else {
              resolve(callbackArgs);
            }
          });
          originalMethod.apply(this, args);
        });
      };
      wrapper.promisified_ = true;
      return wrapper;
    }
    function promisifyAll(Class, options) {
      const exclude = options && options.exclude || [];
      const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
      const methods = ownPropertyNames.filter((methodName) => {
        return !exclude.includes(methodName) && typeof Class.prototype[methodName] === "function" && // is it a function?
        !/(^_|(Stream|_)|promise$)|^constructor$/.test(methodName);
      });
      methods.forEach((methodName) => {
        const originalMethod = Class.prototype[methodName];
        if (!originalMethod.promisified_) {
          Class.prototype[methodName] = exports.promisify(originalMethod, options);
        }
      });
    }
    function callbackify(originalMethod) {
      if (originalMethod.callbackified_) {
        return originalMethod;
      }
      const wrapper = function() {
        if (typeof arguments[arguments.length - 1] !== "function") {
          return originalMethod.apply(this, arguments);
        }
        const cb = Array.prototype.pop.call(arguments);
        originalMethod.apply(this, arguments).then(
          // tslint:disable-next-line:no-any
          (res) => {
            res = Array.isArray(res) ? res : [res];
            cb(null, ...res);
          },
          (err) => cb(err)
        );
      };
      wrapper.callbackified_ = true;
      return wrapper;
    }
    function callbackifyAll(Class, options) {
      const exclude = options && options.exclude || [];
      const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
      const methods = ownPropertyNames.filter((methodName) => {
        return !exclude.includes(methodName) && typeof Class.prototype[methodName] === "function" && // is it a function?
        !/^_|(Stream|_)|^constructor$/.test(methodName);
      });
      methods.forEach((methodName) => {
        const originalMethod = Class.prototype[methodName];
        if (!originalMethod.callbackified_) {
          Class.prototype[methodName] = exports.callbackify(originalMethod);
        }
      });
    }
  }
});

// node_modules/@google-cloud/common/node_modules/arrify/index.js
var require_arrify = __commonJS({
  "node_modules/@google-cloud/common/node_modules/arrify/index.js"(exports, module) {
    "use strict";
    var arrify = (value) => {
      if (value === null || value === void 0) {
        return [];
      }
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        return [value];
      }
      if (typeof value[Symbol.iterator] === "function") {
        return [...value];
      }
      return [value];
    };
    module.exports = arrify;
  }
});

// browser-external:events
var require_events = __commonJS({
  "browser-external:events"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "events" has been externalized for browser compatibility. Cannot access "events.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/extend/index.js
var require_extend = __commonJS({
  "node_modules/extend/index.js"(exports, module) {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;
    var defineProperty = Object.defineProperty;
    var gOPD = Object.getOwnPropertyDescriptor;
    var isArray = function isArray2(arr) {
      if (typeof Array.isArray === "function") {
        return Array.isArray(arr);
      }
      return toStr.call(arr) === "[object Array]";
    };
    var isPlainObject = function isPlainObject2(obj) {
      if (!obj || toStr.call(obj) !== "[object Object]") {
        return false;
      }
      var hasOwnConstructor = hasOwn.call(obj, "constructor");
      var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, "isPrototypeOf");
      if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
        return false;
      }
      var key;
      for (key in obj) {
      }
      return typeof key === "undefined" || hasOwn.call(obj, key);
    };
    var setProperty = function setProperty2(target, options) {
      if (defineProperty && options.name === "__proto__") {
        defineProperty(target, options.name, {
          enumerable: true,
          configurable: true,
          value: options.newValue,
          writable: true
        });
      } else {
        target[options.name] = options.newValue;
      }
    };
    var getProperty = function getProperty2(obj, name) {
      if (name === "__proto__") {
        if (!hasOwn.call(obj, name)) {
          return void 0;
        } else if (gOPD) {
          return gOPD(obj, name).value;
        }
      }
      return obj[name];
    };
    module.exports = function extend() {
      var options, name, src, copy, copyIsArray, clone;
      var target = arguments[0];
      var i = 1;
      var length = arguments.length;
      var deep = false;
      if (typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        i = 2;
      }
      if (target == null || typeof target !== "object" && typeof target !== "function") {
        target = {};
      }
      for (; i < length; ++i) {
        options = arguments[i];
        if (options != null) {
          for (name in options) {
            src = getProperty(target, name);
            copy = getProperty(options, name);
            if (target !== copy) {
              if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                if (copyIsArray) {
                  copyIsArray = false;
                  clone = src && isArray(src) ? src : [];
                } else {
                  clone = src && isPlainObject(src) ? src : {};
                }
                setProperty(target, { name, newValue: extend(deep, clone, copy) });
              } else if (typeof copy !== "undefined") {
                setProperty(target, { name, newValue: copy });
              }
            }
          }
        }
      }
      return target;
    };
  }
});

// browser-external:stream
var require_stream = __commonJS({
  "browser-external:stream"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "stream" has been externalized for browser compatibility. Cannot access "stream.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/@google-cloud/projectify/build/src/index.js
var require_src2 = __commonJS({
  "node_modules/@google-cloud/projectify/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingProjectIdError = exports.replaceProjectIdToken = void 0;
    var stream_1 = require_stream();
    function replaceProjectIdToken(value, projectId) {
      if (Array.isArray(value)) {
        value = value.map((v) => replaceProjectIdToken(v, projectId));
      }
      if (value !== null && typeof value === "object" && !(value instanceof Buffer) && !(value instanceof stream_1.Stream) && typeof value.hasOwnProperty === "function") {
        for (const opt in value) {
          if (value.hasOwnProperty(opt)) {
            value[opt] = replaceProjectIdToken(value[opt], projectId);
          }
        }
      }
      if (typeof value === "string" && value.indexOf("{{projectId}}") > -1) {
        if (!projectId || projectId === "{{projectId}}") {
          throw new MissingProjectIdError();
        }
        value = value.replace(/{{projectId}}/g, projectId);
      }
      return value;
    }
    exports.replaceProjectIdToken = replaceProjectIdToken;
    var MissingProjectIdError = class extends Error {
      constructor() {
        super(...arguments);
        this.message = `Sorry, we cannot connect to Cloud Services without a project
    ID. You may specify one with an environment variable named
    "GOOGLE_CLOUD_PROJECT".`.replace(/ +/g, " ");
      }
    };
    exports.MissingProjectIdError = MissingProjectIdError;
  }
});

// node_modules/html-entities/dist/commonjs/named-references.js
var require_named_references = __commonJS({
  "node_modules/html-entities/dist/commonjs/named-references.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.namedReferences = exports.bodyRegExps = void 0;
    var pairDivider = "~";
    var blockDivider = "~~";
    function generateNamedReferences(input, prev) {
      var entities = {};
      var characters = {};
      var blocks = input.split(blockDivider);
      var isOptionalBlock = false;
      for (var i = 0; blocks.length > i; i++) {
        var entries = blocks[i].split(pairDivider);
        for (var j = 0; j < entries.length; j += 2) {
          var entity = entries[j];
          var character = entries[j + 1];
          var fullEntity = "&" + entity + ";";
          entities[fullEntity] = character;
          if (isOptionalBlock) {
            entities["&" + entity] = character;
          }
          characters[character] = fullEntity;
        }
        isOptionalBlock = true;
      }
      return prev ? { entities: __assign(__assign({}, entities), prev.entities), characters: __assign(__assign({}, characters), prev.characters) } : { entities, characters };
    }
    exports.bodyRegExps = {
      xml: /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,
      html4: /&notin;|&(?:nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|ucirc|uuml|yacute|thorn|yuml|quot|amp|lt|gt|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,
      html5: /&centerdot;|&copysr;|&divideontimes;|&gtcc;|&gtcir;|&gtdot;|&gtlPar;|&gtquest;|&gtrapprox;|&gtrarr;|&gtrdot;|&gtreqless;|&gtreqqless;|&gtrless;|&gtrsim;|&ltcc;|&ltcir;|&ltdot;|&lthree;|&ltimes;|&ltlarr;|&ltquest;|&ltrPar;|&ltri;|&ltrie;|&ltrif;|&notin;|&notinE;|&notindot;|&notinva;|&notinvb;|&notinvc;|&notni;|&notniva;|&notnivb;|&notnivc;|&parallel;|&timesb;|&timesbar;|&timesd;|&(?:AElig|AMP|Aacute|Acirc|Agrave|Aring|Atilde|Auml|COPY|Ccedil|ETH|Eacute|Ecirc|Egrave|Euml|GT|Iacute|Icirc|Igrave|Iuml|LT|Ntilde|Oacute|Ocirc|Ograve|Oslash|Otilde|Ouml|QUOT|REG|THORN|Uacute|Ucirc|Ugrave|Uuml|Yacute|aacute|acirc|acute|aelig|agrave|amp|aring|atilde|auml|brvbar|ccedil|cedil|cent|copy|curren|deg|divide|eacute|ecirc|egrave|eth|euml|frac12|frac14|frac34|gt|iacute|icirc|iexcl|igrave|iquest|iuml|laquo|lt|macr|micro|middot|nbsp|not|ntilde|oacute|ocirc|ograve|ordf|ordm|oslash|otilde|ouml|para|plusmn|pound|quot|raquo|reg|sect|shy|sup1|sup2|sup3|szlig|thorn|times|uacute|ucirc|ugrave|uml|uuml|yacute|yen|yuml|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g
    };
    exports.namedReferences = {};
    exports.namedReferences["xml"] = generateNamedReferences(`lt~<~gt~>~quot~"~apos~'~amp~&`);
    exports.namedReferences["html4"] = generateNamedReferences(`apos~'~OElig~Œ~oelig~œ~Scaron~Š~scaron~š~Yuml~Ÿ~circ~ˆ~tilde~˜~ensp~ ~emsp~ ~thinsp~ ~zwnj~‌~zwj~‍~lrm~‎~rlm~‏~ndash~–~mdash~—~lsquo~‘~rsquo~’~sbquo~‚~ldquo~“~rdquo~”~bdquo~„~dagger~†~Dagger~‡~permil~‰~lsaquo~‹~rsaquo~›~euro~€~fnof~ƒ~Alpha~Α~Beta~Β~Gamma~Γ~Delta~Δ~Epsilon~Ε~Zeta~Ζ~Eta~Η~Theta~Θ~Iota~Ι~Kappa~Κ~Lambda~Λ~Mu~Μ~Nu~Ν~Xi~Ξ~Omicron~Ο~Pi~Π~Rho~Ρ~Sigma~Σ~Tau~Τ~Upsilon~Υ~Phi~Φ~Chi~Χ~Psi~Ψ~Omega~Ω~alpha~α~beta~β~gamma~γ~delta~δ~epsilon~ε~zeta~ζ~eta~η~theta~θ~iota~ι~kappa~κ~lambda~λ~mu~μ~nu~ν~xi~ξ~omicron~ο~pi~π~rho~ρ~sigmaf~ς~sigma~σ~tau~τ~upsilon~υ~phi~φ~chi~χ~psi~ψ~omega~ω~thetasym~ϑ~upsih~ϒ~piv~ϖ~bull~•~hellip~…~prime~′~Prime~″~oline~‾~frasl~⁄~weierp~℘~image~ℑ~real~ℜ~trade~™~alefsym~ℵ~larr~←~uarr~↑~rarr~→~darr~↓~harr~↔~crarr~↵~lArr~⇐~uArr~⇑~rArr~⇒~dArr~⇓~hArr~⇔~forall~∀~part~∂~exist~∃~empty~∅~nabla~∇~isin~∈~notin~∉~ni~∋~prod~∏~sum~∑~minus~−~lowast~∗~radic~√~prop~∝~infin~∞~ang~∠~and~∧~or~∨~cap~∩~cup~∪~int~∫~there4~∴~sim~∼~cong~≅~asymp~≈~ne~≠~equiv~≡~le~≤~ge~≥~sub~⊂~sup~⊃~nsub~⊄~sube~⊆~supe~⊇~oplus~⊕~otimes~⊗~perp~⊥~sdot~⋅~lceil~⌈~rceil~⌉~lfloor~⌊~rfloor~⌋~lang~〈~rang~〉~loz~◊~spades~♠~clubs~♣~hearts~♥~diams~♦~~nbsp~ ~iexcl~¡~cent~¢~pound~£~curren~¤~yen~¥~brvbar~¦~sect~§~uml~¨~copy~©~ordf~ª~laquo~«~not~¬~shy~­~reg~®~macr~¯~deg~°~plusmn~±~sup2~²~sup3~³~acute~´~micro~µ~para~¶~middot~·~cedil~¸~sup1~¹~ordm~º~raquo~»~frac14~¼~frac12~½~frac34~¾~iquest~¿~Agrave~À~Aacute~Á~Acirc~Â~Atilde~Ã~Auml~Ä~Aring~Å~AElig~Æ~Ccedil~Ç~Egrave~È~Eacute~É~Ecirc~Ê~Euml~Ë~Igrave~Ì~Iacute~Í~Icirc~Î~Iuml~Ï~ETH~Ð~Ntilde~Ñ~Ograve~Ò~Oacute~Ó~Ocirc~Ô~Otilde~Õ~Ouml~Ö~times~×~Oslash~Ø~Ugrave~Ù~Uacute~Ú~Ucirc~Û~Uuml~Ü~Yacute~Ý~THORN~Þ~szlig~ß~agrave~à~aacute~á~acirc~â~atilde~ã~auml~ä~aring~å~aelig~æ~ccedil~ç~egrave~è~eacute~é~ecirc~ê~euml~ë~igrave~ì~iacute~í~icirc~î~iuml~ï~eth~ð~ntilde~ñ~ograve~ò~oacute~ó~ocirc~ô~otilde~õ~ouml~ö~divide~÷~oslash~ø~ugrave~ù~uacute~ú~ucirc~û~uuml~ü~yacute~ý~thorn~þ~yuml~ÿ~quot~"~amp~&~lt~<~gt~>`);
    exports.namedReferences["html5"] = generateNamedReferences('Abreve~Ă~Acy~А~Afr~𝔄~Amacr~Ā~And~⩓~Aogon~Ą~Aopf~𝔸~ApplyFunction~⁡~Ascr~𝒜~Assign~≔~Backslash~∖~Barv~⫧~Barwed~⌆~Bcy~Б~Because~∵~Bernoullis~ℬ~Bfr~𝔅~Bopf~𝔹~Breve~˘~Bscr~ℬ~Bumpeq~≎~CHcy~Ч~Cacute~Ć~Cap~⋒~CapitalDifferentialD~ⅅ~Cayleys~ℭ~Ccaron~Č~Ccirc~Ĉ~Cconint~∰~Cdot~Ċ~Cedilla~¸~CenterDot~·~Cfr~ℭ~CircleDot~⊙~CircleMinus~⊖~CirclePlus~⊕~CircleTimes~⊗~ClockwiseContourIntegral~∲~CloseCurlyDoubleQuote~”~CloseCurlyQuote~’~Colon~∷~Colone~⩴~Congruent~≡~Conint~∯~ContourIntegral~∮~Copf~ℂ~Coproduct~∐~CounterClockwiseContourIntegral~∳~Cross~⨯~Cscr~𝒞~Cup~⋓~CupCap~≍~DD~ⅅ~DDotrahd~⤑~DJcy~Ђ~DScy~Ѕ~DZcy~Џ~Darr~↡~Dashv~⫤~Dcaron~Ď~Dcy~Д~Del~∇~Dfr~𝔇~DiacriticalAcute~´~DiacriticalDot~˙~DiacriticalDoubleAcute~˝~DiacriticalGrave~`~DiacriticalTilde~˜~Diamond~⋄~DifferentialD~ⅆ~Dopf~𝔻~Dot~¨~DotDot~⃜~DotEqual~≐~DoubleContourIntegral~∯~DoubleDot~¨~DoubleDownArrow~⇓~DoubleLeftArrow~⇐~DoubleLeftRightArrow~⇔~DoubleLeftTee~⫤~DoubleLongLeftArrow~⟸~DoubleLongLeftRightArrow~⟺~DoubleLongRightArrow~⟹~DoubleRightArrow~⇒~DoubleRightTee~⊨~DoubleUpArrow~⇑~DoubleUpDownArrow~⇕~DoubleVerticalBar~∥~DownArrow~↓~DownArrowBar~⤓~DownArrowUpArrow~⇵~DownBreve~̑~DownLeftRightVector~⥐~DownLeftTeeVector~⥞~DownLeftVector~↽~DownLeftVectorBar~⥖~DownRightTeeVector~⥟~DownRightVector~⇁~DownRightVectorBar~⥗~DownTee~⊤~DownTeeArrow~↧~Downarrow~⇓~Dscr~𝒟~Dstrok~Đ~ENG~Ŋ~Ecaron~Ě~Ecy~Э~Edot~Ė~Efr~𝔈~Element~∈~Emacr~Ē~EmptySmallSquare~◻~EmptyVerySmallSquare~▫~Eogon~Ę~Eopf~𝔼~Equal~⩵~EqualTilde~≂~Equilibrium~⇌~Escr~ℰ~Esim~⩳~Exists~∃~ExponentialE~ⅇ~Fcy~Ф~Ffr~𝔉~FilledSmallSquare~◼~FilledVerySmallSquare~▪~Fopf~𝔽~ForAll~∀~Fouriertrf~ℱ~Fscr~ℱ~GJcy~Ѓ~Gammad~Ϝ~Gbreve~Ğ~Gcedil~Ģ~Gcirc~Ĝ~Gcy~Г~Gdot~Ġ~Gfr~𝔊~Gg~⋙~Gopf~𝔾~GreaterEqual~≥~GreaterEqualLess~⋛~GreaterFullEqual~≧~GreaterGreater~⪢~GreaterLess~≷~GreaterSlantEqual~⩾~GreaterTilde~≳~Gscr~𝒢~Gt~≫~HARDcy~Ъ~Hacek~ˇ~Hat~^~Hcirc~Ĥ~Hfr~ℌ~HilbertSpace~ℋ~Hopf~ℍ~HorizontalLine~─~Hscr~ℋ~Hstrok~Ħ~HumpDownHump~≎~HumpEqual~≏~IEcy~Е~IJlig~Ĳ~IOcy~Ё~Icy~И~Idot~İ~Ifr~ℑ~Im~ℑ~Imacr~Ī~ImaginaryI~ⅈ~Implies~⇒~Int~∬~Integral~∫~Intersection~⋂~InvisibleComma~⁣~InvisibleTimes~⁢~Iogon~Į~Iopf~𝕀~Iscr~ℐ~Itilde~Ĩ~Iukcy~І~Jcirc~Ĵ~Jcy~Й~Jfr~𝔍~Jopf~𝕁~Jscr~𝒥~Jsercy~Ј~Jukcy~Є~KHcy~Х~KJcy~Ќ~Kcedil~Ķ~Kcy~К~Kfr~𝔎~Kopf~𝕂~Kscr~𝒦~LJcy~Љ~Lacute~Ĺ~Lang~⟪~Laplacetrf~ℒ~Larr~↞~Lcaron~Ľ~Lcedil~Ļ~Lcy~Л~LeftAngleBracket~⟨~LeftArrow~←~LeftArrowBar~⇤~LeftArrowRightArrow~⇆~LeftCeiling~⌈~LeftDoubleBracket~⟦~LeftDownTeeVector~⥡~LeftDownVector~⇃~LeftDownVectorBar~⥙~LeftFloor~⌊~LeftRightArrow~↔~LeftRightVector~⥎~LeftTee~⊣~LeftTeeArrow~↤~LeftTeeVector~⥚~LeftTriangle~⊲~LeftTriangleBar~⧏~LeftTriangleEqual~⊴~LeftUpDownVector~⥑~LeftUpTeeVector~⥠~LeftUpVector~↿~LeftUpVectorBar~⥘~LeftVector~↼~LeftVectorBar~⥒~Leftarrow~⇐~Leftrightarrow~⇔~LessEqualGreater~⋚~LessFullEqual~≦~LessGreater~≶~LessLess~⪡~LessSlantEqual~⩽~LessTilde~≲~Lfr~𝔏~Ll~⋘~Lleftarrow~⇚~Lmidot~Ŀ~LongLeftArrow~⟵~LongLeftRightArrow~⟷~LongRightArrow~⟶~Longleftarrow~⟸~Longleftrightarrow~⟺~Longrightarrow~⟹~Lopf~𝕃~LowerLeftArrow~↙~LowerRightArrow~↘~Lscr~ℒ~Lsh~↰~Lstrok~Ł~Lt~≪~Map~⤅~Mcy~М~MediumSpace~ ~Mellintrf~ℳ~Mfr~𝔐~MinusPlus~∓~Mopf~𝕄~Mscr~ℳ~NJcy~Њ~Nacute~Ń~Ncaron~Ň~Ncedil~Ņ~Ncy~Н~NegativeMediumSpace~​~NegativeThickSpace~​~NegativeThinSpace~​~NegativeVeryThinSpace~​~NestedGreaterGreater~≫~NestedLessLess~≪~NewLine~\n~Nfr~𝔑~NoBreak~⁠~NonBreakingSpace~ ~Nopf~ℕ~Not~⫬~NotCongruent~≢~NotCupCap~≭~NotDoubleVerticalBar~∦~NotElement~∉~NotEqual~≠~NotEqualTilde~≂̸~NotExists~∄~NotGreater~≯~NotGreaterEqual~≱~NotGreaterFullEqual~≧̸~NotGreaterGreater~≫̸~NotGreaterLess~≹~NotGreaterSlantEqual~⩾̸~NotGreaterTilde~≵~NotHumpDownHump~≎̸~NotHumpEqual~≏̸~NotLeftTriangle~⋪~NotLeftTriangleBar~⧏̸~NotLeftTriangleEqual~⋬~NotLess~≮~NotLessEqual~≰~NotLessGreater~≸~NotLessLess~≪̸~NotLessSlantEqual~⩽̸~NotLessTilde~≴~NotNestedGreaterGreater~⪢̸~NotNestedLessLess~⪡̸~NotPrecedes~⊀~NotPrecedesEqual~⪯̸~NotPrecedesSlantEqual~⋠~NotReverseElement~∌~NotRightTriangle~⋫~NotRightTriangleBar~⧐̸~NotRightTriangleEqual~⋭~NotSquareSubset~⊏̸~NotSquareSubsetEqual~⋢~NotSquareSuperset~⊐̸~NotSquareSupersetEqual~⋣~NotSubset~⊂⃒~NotSubsetEqual~⊈~NotSucceeds~⊁~NotSucceedsEqual~⪰̸~NotSucceedsSlantEqual~⋡~NotSucceedsTilde~≿̸~NotSuperset~⊃⃒~NotSupersetEqual~⊉~NotTilde~≁~NotTildeEqual~≄~NotTildeFullEqual~≇~NotTildeTilde~≉~NotVerticalBar~∤~Nscr~𝒩~Ocy~О~Odblac~Ő~Ofr~𝔒~Omacr~Ō~Oopf~𝕆~OpenCurlyDoubleQuote~“~OpenCurlyQuote~‘~Or~⩔~Oscr~𝒪~Otimes~⨷~OverBar~‾~OverBrace~⏞~OverBracket~⎴~OverParenthesis~⏜~PartialD~∂~Pcy~П~Pfr~𝔓~PlusMinus~±~Poincareplane~ℌ~Popf~ℙ~Pr~⪻~Precedes~≺~PrecedesEqual~⪯~PrecedesSlantEqual~≼~PrecedesTilde~≾~Product~∏~Proportion~∷~Proportional~∝~Pscr~𝒫~Qfr~𝔔~Qopf~ℚ~Qscr~𝒬~RBarr~⤐~Racute~Ŕ~Rang~⟫~Rarr~↠~Rarrtl~⤖~Rcaron~Ř~Rcedil~Ŗ~Rcy~Р~Re~ℜ~ReverseElement~∋~ReverseEquilibrium~⇋~ReverseUpEquilibrium~⥯~Rfr~ℜ~RightAngleBracket~⟩~RightArrow~→~RightArrowBar~⇥~RightArrowLeftArrow~⇄~RightCeiling~⌉~RightDoubleBracket~⟧~RightDownTeeVector~⥝~RightDownVector~⇂~RightDownVectorBar~⥕~RightFloor~⌋~RightTee~⊢~RightTeeArrow~↦~RightTeeVector~⥛~RightTriangle~⊳~RightTriangleBar~⧐~RightTriangleEqual~⊵~RightUpDownVector~⥏~RightUpTeeVector~⥜~RightUpVector~↾~RightUpVectorBar~⥔~RightVector~⇀~RightVectorBar~⥓~Rightarrow~⇒~Ropf~ℝ~RoundImplies~⥰~Rrightarrow~⇛~Rscr~ℛ~Rsh~↱~RuleDelayed~⧴~SHCHcy~Щ~SHcy~Ш~SOFTcy~Ь~Sacute~Ś~Sc~⪼~Scedil~Ş~Scirc~Ŝ~Scy~С~Sfr~𝔖~ShortDownArrow~↓~ShortLeftArrow~←~ShortRightArrow~→~ShortUpArrow~↑~SmallCircle~∘~Sopf~𝕊~Sqrt~√~Square~□~SquareIntersection~⊓~SquareSubset~⊏~SquareSubsetEqual~⊑~SquareSuperset~⊐~SquareSupersetEqual~⊒~SquareUnion~⊔~Sscr~𝒮~Star~⋆~Sub~⋐~Subset~⋐~SubsetEqual~⊆~Succeeds~≻~SucceedsEqual~⪰~SucceedsSlantEqual~≽~SucceedsTilde~≿~SuchThat~∋~Sum~∑~Sup~⋑~Superset~⊃~SupersetEqual~⊇~Supset~⋑~TRADE~™~TSHcy~Ћ~TScy~Ц~Tab~	~Tcaron~Ť~Tcedil~Ţ~Tcy~Т~Tfr~𝔗~Therefore~∴~ThickSpace~  ~ThinSpace~ ~Tilde~∼~TildeEqual~≃~TildeFullEqual~≅~TildeTilde~≈~Topf~𝕋~TripleDot~⃛~Tscr~𝒯~Tstrok~Ŧ~Uarr~↟~Uarrocir~⥉~Ubrcy~Ў~Ubreve~Ŭ~Ucy~У~Udblac~Ű~Ufr~𝔘~Umacr~Ū~UnderBar~_~UnderBrace~⏟~UnderBracket~⎵~UnderParenthesis~⏝~Union~⋃~UnionPlus~⊎~Uogon~Ų~Uopf~𝕌~UpArrow~↑~UpArrowBar~⤒~UpArrowDownArrow~⇅~UpDownArrow~↕~UpEquilibrium~⥮~UpTee~⊥~UpTeeArrow~↥~Uparrow~⇑~Updownarrow~⇕~UpperLeftArrow~↖~UpperRightArrow~↗~Upsi~ϒ~Uring~Ů~Uscr~𝒰~Utilde~Ũ~VDash~⊫~Vbar~⫫~Vcy~В~Vdash~⊩~Vdashl~⫦~Vee~⋁~Verbar~‖~Vert~‖~VerticalBar~∣~VerticalLine~|~VerticalSeparator~❘~VerticalTilde~≀~VeryThinSpace~ ~Vfr~𝔙~Vopf~𝕍~Vscr~𝒱~Vvdash~⊪~Wcirc~Ŵ~Wedge~⋀~Wfr~𝔚~Wopf~𝕎~Wscr~𝒲~Xfr~𝔛~Xopf~𝕏~Xscr~𝒳~YAcy~Я~YIcy~Ї~YUcy~Ю~Ycirc~Ŷ~Ycy~Ы~Yfr~𝔜~Yopf~𝕐~Yscr~𝒴~ZHcy~Ж~Zacute~Ź~Zcaron~Ž~Zcy~З~Zdot~Ż~ZeroWidthSpace~​~Zfr~ℨ~Zopf~ℤ~Zscr~𝒵~abreve~ă~ac~∾~acE~∾̳~acd~∿~acy~а~af~⁡~afr~𝔞~aleph~ℵ~amacr~ā~amalg~⨿~andand~⩕~andd~⩜~andslope~⩘~andv~⩚~ange~⦤~angle~∠~angmsd~∡~angmsdaa~⦨~angmsdab~⦩~angmsdac~⦪~angmsdad~⦫~angmsdae~⦬~angmsdaf~⦭~angmsdag~⦮~angmsdah~⦯~angrt~∟~angrtvb~⊾~angrtvbd~⦝~angsph~∢~angst~Å~angzarr~⍼~aogon~ą~aopf~𝕒~ap~≈~apE~⩰~apacir~⩯~ape~≊~apid~≋~approx~≈~approxeq~≊~ascr~𝒶~ast~*~asympeq~≍~awconint~∳~awint~⨑~bNot~⫭~backcong~≌~backepsilon~϶~backprime~‵~backsim~∽~backsimeq~⋍~barvee~⊽~barwed~⌅~barwedge~⌅~bbrk~⎵~bbrktbrk~⎶~bcong~≌~bcy~б~becaus~∵~because~∵~bemptyv~⦰~bepsi~϶~bernou~ℬ~beth~ℶ~between~≬~bfr~𝔟~bigcap~⋂~bigcirc~◯~bigcup~⋃~bigodot~⨀~bigoplus~⨁~bigotimes~⨂~bigsqcup~⨆~bigstar~★~bigtriangledown~▽~bigtriangleup~△~biguplus~⨄~bigvee~⋁~bigwedge~⋀~bkarow~⤍~blacklozenge~⧫~blacksquare~▪~blacktriangle~▴~blacktriangledown~▾~blacktriangleleft~◂~blacktriangleright~▸~blank~␣~blk12~▒~blk14~░~blk34~▓~block~█~bne~=⃥~bnequiv~≡⃥~bnot~⌐~bopf~𝕓~bot~⊥~bottom~⊥~bowtie~⋈~boxDL~╗~boxDR~╔~boxDl~╖~boxDr~╓~boxH~═~boxHD~╦~boxHU~╩~boxHd~╤~boxHu~╧~boxUL~╝~boxUR~╚~boxUl~╜~boxUr~╙~boxV~║~boxVH~╬~boxVL~╣~boxVR~╠~boxVh~╫~boxVl~╢~boxVr~╟~boxbox~⧉~boxdL~╕~boxdR~╒~boxdl~┐~boxdr~┌~boxh~─~boxhD~╥~boxhU~╨~boxhd~┬~boxhu~┴~boxminus~⊟~boxplus~⊞~boxtimes~⊠~boxuL~╛~boxuR~╘~boxul~┘~boxur~└~boxv~│~boxvH~╪~boxvL~╡~boxvR~╞~boxvh~┼~boxvl~┤~boxvr~├~bprime~‵~breve~˘~bscr~𝒷~bsemi~⁏~bsim~∽~bsime~⋍~bsol~\\~bsolb~⧅~bsolhsub~⟈~bullet~•~bump~≎~bumpE~⪮~bumpe~≏~bumpeq~≏~cacute~ć~capand~⩄~capbrcup~⩉~capcap~⩋~capcup~⩇~capdot~⩀~caps~∩︀~caret~⁁~caron~ˇ~ccaps~⩍~ccaron~č~ccirc~ĉ~ccups~⩌~ccupssm~⩐~cdot~ċ~cemptyv~⦲~centerdot~·~cfr~𝔠~chcy~ч~check~✓~checkmark~✓~cir~○~cirE~⧃~circeq~≗~circlearrowleft~↺~circlearrowright~↻~circledR~®~circledS~Ⓢ~circledast~⊛~circledcirc~⊚~circleddash~⊝~cire~≗~cirfnint~⨐~cirmid~⫯~cirscir~⧂~clubsuit~♣~colon~:~colone~≔~coloneq~≔~comma~,~commat~@~comp~∁~compfn~∘~complement~∁~complexes~ℂ~congdot~⩭~conint~∮~copf~𝕔~coprod~∐~copysr~℗~cross~✗~cscr~𝒸~csub~⫏~csube~⫑~csup~⫐~csupe~⫒~ctdot~⋯~cudarrl~⤸~cudarrr~⤵~cuepr~⋞~cuesc~⋟~cularr~↶~cularrp~⤽~cupbrcap~⩈~cupcap~⩆~cupcup~⩊~cupdot~⊍~cupor~⩅~cups~∪︀~curarr~↷~curarrm~⤼~curlyeqprec~⋞~curlyeqsucc~⋟~curlyvee~⋎~curlywedge~⋏~curvearrowleft~↶~curvearrowright~↷~cuvee~⋎~cuwed~⋏~cwconint~∲~cwint~∱~cylcty~⌭~dHar~⥥~daleth~ℸ~dash~‐~dashv~⊣~dbkarow~⤏~dblac~˝~dcaron~ď~dcy~д~dd~ⅆ~ddagger~‡~ddarr~⇊~ddotseq~⩷~demptyv~⦱~dfisht~⥿~dfr~𝔡~dharl~⇃~dharr~⇂~diam~⋄~diamond~⋄~diamondsuit~♦~die~¨~digamma~ϝ~disin~⋲~div~÷~divideontimes~⋇~divonx~⋇~djcy~ђ~dlcorn~⌞~dlcrop~⌍~dollar~$~dopf~𝕕~dot~˙~doteq~≐~doteqdot~≑~dotminus~∸~dotplus~∔~dotsquare~⊡~doublebarwedge~⌆~downarrow~↓~downdownarrows~⇊~downharpoonleft~⇃~downharpoonright~⇂~drbkarow~⤐~drcorn~⌟~drcrop~⌌~dscr~𝒹~dscy~ѕ~dsol~⧶~dstrok~đ~dtdot~⋱~dtri~▿~dtrif~▾~duarr~⇵~duhar~⥯~dwangle~⦦~dzcy~џ~dzigrarr~⟿~eDDot~⩷~eDot~≑~easter~⩮~ecaron~ě~ecir~≖~ecolon~≕~ecy~э~edot~ė~ee~ⅇ~efDot~≒~efr~𝔢~eg~⪚~egs~⪖~egsdot~⪘~el~⪙~elinters~⏧~ell~ℓ~els~⪕~elsdot~⪗~emacr~ē~emptyset~∅~emptyv~∅~emsp13~ ~emsp14~ ~eng~ŋ~eogon~ę~eopf~𝕖~epar~⋕~eparsl~⧣~eplus~⩱~epsi~ε~epsiv~ϵ~eqcirc~≖~eqcolon~≕~eqsim~≂~eqslantgtr~⪖~eqslantless~⪕~equals~=~equest~≟~equivDD~⩸~eqvparsl~⧥~erDot~≓~erarr~⥱~escr~ℯ~esdot~≐~esim~≂~excl~!~expectation~ℰ~exponentiale~ⅇ~fallingdotseq~≒~fcy~ф~female~♀~ffilig~ﬃ~fflig~ﬀ~ffllig~ﬄ~ffr~𝔣~filig~ﬁ~fjlig~fj~flat~♭~fllig~ﬂ~fltns~▱~fopf~𝕗~fork~⋔~forkv~⫙~fpartint~⨍~frac13~⅓~frac15~⅕~frac16~⅙~frac18~⅛~frac23~⅔~frac25~⅖~frac35~⅗~frac38~⅜~frac45~⅘~frac56~⅚~frac58~⅝~frac78~⅞~frown~⌢~fscr~𝒻~gE~≧~gEl~⪌~gacute~ǵ~gammad~ϝ~gap~⪆~gbreve~ğ~gcirc~ĝ~gcy~г~gdot~ġ~gel~⋛~geq~≥~geqq~≧~geqslant~⩾~ges~⩾~gescc~⪩~gesdot~⪀~gesdoto~⪂~gesdotol~⪄~gesl~⋛︀~gesles~⪔~gfr~𝔤~gg~≫~ggg~⋙~gimel~ℷ~gjcy~ѓ~gl~≷~glE~⪒~gla~⪥~glj~⪤~gnE~≩~gnap~⪊~gnapprox~⪊~gne~⪈~gneq~⪈~gneqq~≩~gnsim~⋧~gopf~𝕘~grave~`~gscr~ℊ~gsim~≳~gsime~⪎~gsiml~⪐~gtcc~⪧~gtcir~⩺~gtdot~⋗~gtlPar~⦕~gtquest~⩼~gtrapprox~⪆~gtrarr~⥸~gtrdot~⋗~gtreqless~⋛~gtreqqless~⪌~gtrless~≷~gtrsim~≳~gvertneqq~≩︀~gvnE~≩︀~hairsp~ ~half~½~hamilt~ℋ~hardcy~ъ~harrcir~⥈~harrw~↭~hbar~ℏ~hcirc~ĥ~heartsuit~♥~hercon~⊹~hfr~𝔥~hksearow~⤥~hkswarow~⤦~hoarr~⇿~homtht~∻~hookleftarrow~↩~hookrightarrow~↪~hopf~𝕙~horbar~―~hscr~𝒽~hslash~ℏ~hstrok~ħ~hybull~⁃~hyphen~‐~ic~⁣~icy~и~iecy~е~iff~⇔~ifr~𝔦~ii~ⅈ~iiiint~⨌~iiint~∭~iinfin~⧜~iiota~℩~ijlig~ĳ~imacr~ī~imagline~ℐ~imagpart~ℑ~imath~ı~imof~⊷~imped~Ƶ~in~∈~incare~℅~infintie~⧝~inodot~ı~intcal~⊺~integers~ℤ~intercal~⊺~intlarhk~⨗~intprod~⨼~iocy~ё~iogon~į~iopf~𝕚~iprod~⨼~iscr~𝒾~isinE~⋹~isindot~⋵~isins~⋴~isinsv~⋳~isinv~∈~it~⁢~itilde~ĩ~iukcy~і~jcirc~ĵ~jcy~й~jfr~𝔧~jmath~ȷ~jopf~𝕛~jscr~𝒿~jsercy~ј~jukcy~є~kappav~ϰ~kcedil~ķ~kcy~к~kfr~𝔨~kgreen~ĸ~khcy~х~kjcy~ќ~kopf~𝕜~kscr~𝓀~lAarr~⇚~lAtail~⤛~lBarr~⤎~lE~≦~lEg~⪋~lHar~⥢~lacute~ĺ~laemptyv~⦴~lagran~ℒ~langd~⦑~langle~⟨~lap~⪅~larrb~⇤~larrbfs~⤟~larrfs~⤝~larrhk~↩~larrlp~↫~larrpl~⤹~larrsim~⥳~larrtl~↢~lat~⪫~latail~⤙~late~⪭~lates~⪭︀~lbarr~⤌~lbbrk~❲~lbrace~{~lbrack~[~lbrke~⦋~lbrksld~⦏~lbrkslu~⦍~lcaron~ľ~lcedil~ļ~lcub~{~lcy~л~ldca~⤶~ldquor~„~ldrdhar~⥧~ldrushar~⥋~ldsh~↲~leftarrow~←~leftarrowtail~↢~leftharpoondown~↽~leftharpoonup~↼~leftleftarrows~⇇~leftrightarrow~↔~leftrightarrows~⇆~leftrightharpoons~⇋~leftrightsquigarrow~↭~leftthreetimes~⋋~leg~⋚~leq~≤~leqq~≦~leqslant~⩽~les~⩽~lescc~⪨~lesdot~⩿~lesdoto~⪁~lesdotor~⪃~lesg~⋚︀~lesges~⪓~lessapprox~⪅~lessdot~⋖~lesseqgtr~⋚~lesseqqgtr~⪋~lessgtr~≶~lesssim~≲~lfisht~⥼~lfr~𝔩~lg~≶~lgE~⪑~lhard~↽~lharu~↼~lharul~⥪~lhblk~▄~ljcy~љ~ll~≪~llarr~⇇~llcorner~⌞~llhard~⥫~lltri~◺~lmidot~ŀ~lmoust~⎰~lmoustache~⎰~lnE~≨~lnap~⪉~lnapprox~⪉~lne~⪇~lneq~⪇~lneqq~≨~lnsim~⋦~loang~⟬~loarr~⇽~lobrk~⟦~longleftarrow~⟵~longleftrightarrow~⟷~longmapsto~⟼~longrightarrow~⟶~looparrowleft~↫~looparrowright~↬~lopar~⦅~lopf~𝕝~loplus~⨭~lotimes~⨴~lowbar~_~lozenge~◊~lozf~⧫~lpar~(~lparlt~⦓~lrarr~⇆~lrcorner~⌟~lrhar~⇋~lrhard~⥭~lrtri~⊿~lscr~𝓁~lsh~↰~lsim~≲~lsime~⪍~lsimg~⪏~lsqb~[~lsquor~‚~lstrok~ł~ltcc~⪦~ltcir~⩹~ltdot~⋖~lthree~⋋~ltimes~⋉~ltlarr~⥶~ltquest~⩻~ltrPar~⦖~ltri~◃~ltrie~⊴~ltrif~◂~lurdshar~⥊~luruhar~⥦~lvertneqq~≨︀~lvnE~≨︀~mDDot~∺~male~♂~malt~✠~maltese~✠~map~↦~mapsto~↦~mapstodown~↧~mapstoleft~↤~mapstoup~↥~marker~▮~mcomma~⨩~mcy~м~measuredangle~∡~mfr~𝔪~mho~℧~mid~∣~midast~*~midcir~⫰~minusb~⊟~minusd~∸~minusdu~⨪~mlcp~⫛~mldr~…~mnplus~∓~models~⊧~mopf~𝕞~mp~∓~mscr~𝓂~mstpos~∾~multimap~⊸~mumap~⊸~nGg~⋙̸~nGt~≫⃒~nGtv~≫̸~nLeftarrow~⇍~nLeftrightarrow~⇎~nLl~⋘̸~nLt~≪⃒~nLtv~≪̸~nRightarrow~⇏~nVDash~⊯~nVdash~⊮~nacute~ń~nang~∠⃒~nap~≉~napE~⩰̸~napid~≋̸~napos~ŉ~napprox~≉~natur~♮~natural~♮~naturals~ℕ~nbump~≎̸~nbumpe~≏̸~ncap~⩃~ncaron~ň~ncedil~ņ~ncong~≇~ncongdot~⩭̸~ncup~⩂~ncy~н~neArr~⇗~nearhk~⤤~nearr~↗~nearrow~↗~nedot~≐̸~nequiv~≢~nesear~⤨~nesim~≂̸~nexist~∄~nexists~∄~nfr~𝔫~ngE~≧̸~nge~≱~ngeq~≱~ngeqq~≧̸~ngeqslant~⩾̸~nges~⩾̸~ngsim~≵~ngt~≯~ngtr~≯~nhArr~⇎~nharr~↮~nhpar~⫲~nis~⋼~nisd~⋺~niv~∋~njcy~њ~nlArr~⇍~nlE~≦̸~nlarr~↚~nldr~‥~nle~≰~nleftarrow~↚~nleftrightarrow~↮~nleq~≰~nleqq~≦̸~nleqslant~⩽̸~nles~⩽̸~nless~≮~nlsim~≴~nlt~≮~nltri~⋪~nltrie~⋬~nmid~∤~nopf~𝕟~notinE~⋹̸~notindot~⋵̸~notinva~∉~notinvb~⋷~notinvc~⋶~notni~∌~notniva~∌~notnivb~⋾~notnivc~⋽~npar~∦~nparallel~∦~nparsl~⫽⃥~npart~∂̸~npolint~⨔~npr~⊀~nprcue~⋠~npre~⪯̸~nprec~⊀~npreceq~⪯̸~nrArr~⇏~nrarr~↛~nrarrc~⤳̸~nrarrw~↝̸~nrightarrow~↛~nrtri~⋫~nrtrie~⋭~nsc~⊁~nsccue~⋡~nsce~⪰̸~nscr~𝓃~nshortmid~∤~nshortparallel~∦~nsim~≁~nsime~≄~nsimeq~≄~nsmid~∤~nspar~∦~nsqsube~⋢~nsqsupe~⋣~nsubE~⫅̸~nsube~⊈~nsubset~⊂⃒~nsubseteq~⊈~nsubseteqq~⫅̸~nsucc~⊁~nsucceq~⪰̸~nsup~⊅~nsupE~⫆̸~nsupe~⊉~nsupset~⊃⃒~nsupseteq~⊉~nsupseteqq~⫆̸~ntgl~≹~ntlg~≸~ntriangleleft~⋪~ntrianglelefteq~⋬~ntriangleright~⋫~ntrianglerighteq~⋭~num~#~numero~№~numsp~ ~nvDash~⊭~nvHarr~⤄~nvap~≍⃒~nvdash~⊬~nvge~≥⃒~nvgt~>⃒~nvinfin~⧞~nvlArr~⤂~nvle~≤⃒~nvlt~<⃒~nvltrie~⊴⃒~nvrArr~⤃~nvrtrie~⊵⃒~nvsim~∼⃒~nwArr~⇖~nwarhk~⤣~nwarr~↖~nwarrow~↖~nwnear~⤧~oS~Ⓢ~oast~⊛~ocir~⊚~ocy~о~odash~⊝~odblac~ő~odiv~⨸~odot~⊙~odsold~⦼~ofcir~⦿~ofr~𝔬~ogon~˛~ogt~⧁~ohbar~⦵~ohm~Ω~oint~∮~olarr~↺~olcir~⦾~olcross~⦻~olt~⧀~omacr~ō~omid~⦶~ominus~⊖~oopf~𝕠~opar~⦷~operp~⦹~orarr~↻~ord~⩝~order~ℴ~orderof~ℴ~origof~⊶~oror~⩖~orslope~⩗~orv~⩛~oscr~ℴ~osol~⊘~otimesas~⨶~ovbar~⌽~par~∥~parallel~∥~parsim~⫳~parsl~⫽~pcy~п~percnt~%~period~.~pertenk~‱~pfr~𝔭~phiv~ϕ~phmmat~ℳ~phone~☎~pitchfork~⋔~planck~ℏ~planckh~ℎ~plankv~ℏ~plus~+~plusacir~⨣~plusb~⊞~pluscir~⨢~plusdo~∔~plusdu~⨥~pluse~⩲~plussim~⨦~plustwo~⨧~pm~±~pointint~⨕~popf~𝕡~pr~≺~prE~⪳~prap~⪷~prcue~≼~pre~⪯~prec~≺~precapprox~⪷~preccurlyeq~≼~preceq~⪯~precnapprox~⪹~precneqq~⪵~precnsim~⋨~precsim~≾~primes~ℙ~prnE~⪵~prnap~⪹~prnsim~⋨~profalar~⌮~profline~⌒~profsurf~⌓~propto~∝~prsim~≾~prurel~⊰~pscr~𝓅~puncsp~ ~qfr~𝔮~qint~⨌~qopf~𝕢~qprime~⁗~qscr~𝓆~quaternions~ℍ~quatint~⨖~quest~?~questeq~≟~rAarr~⇛~rAtail~⤜~rBarr~⤏~rHar~⥤~race~∽̱~racute~ŕ~raemptyv~⦳~rangd~⦒~range~⦥~rangle~⟩~rarrap~⥵~rarrb~⇥~rarrbfs~⤠~rarrc~⤳~rarrfs~⤞~rarrhk~↪~rarrlp~↬~rarrpl~⥅~rarrsim~⥴~rarrtl~↣~rarrw~↝~ratail~⤚~ratio~∶~rationals~ℚ~rbarr~⤍~rbbrk~❳~rbrace~}~rbrack~]~rbrke~⦌~rbrksld~⦎~rbrkslu~⦐~rcaron~ř~rcedil~ŗ~rcub~}~rcy~р~rdca~⤷~rdldhar~⥩~rdquor~”~rdsh~↳~realine~ℛ~realpart~ℜ~reals~ℝ~rect~▭~rfisht~⥽~rfr~𝔯~rhard~⇁~rharu~⇀~rharul~⥬~rhov~ϱ~rightarrow~→~rightarrowtail~↣~rightharpoondown~⇁~rightharpoonup~⇀~rightleftarrows~⇄~rightleftharpoons~⇌~rightrightarrows~⇉~rightsquigarrow~↝~rightthreetimes~⋌~ring~˚~risingdotseq~≓~rlarr~⇄~rlhar~⇌~rmoust~⎱~rmoustache~⎱~rnmid~⫮~roang~⟭~roarr~⇾~robrk~⟧~ropar~⦆~ropf~𝕣~roplus~⨮~rotimes~⨵~rpar~)~rpargt~⦔~rppolint~⨒~rrarr~⇉~rscr~𝓇~rsh~↱~rsqb~]~rsquor~’~rthree~⋌~rtimes~⋊~rtri~▹~rtrie~⊵~rtrif~▸~rtriltri~⧎~ruluhar~⥨~rx~℞~sacute~ś~sc~≻~scE~⪴~scap~⪸~sccue~≽~sce~⪰~scedil~ş~scirc~ŝ~scnE~⪶~scnap~⪺~scnsim~⋩~scpolint~⨓~scsim~≿~scy~с~sdotb~⊡~sdote~⩦~seArr~⇘~searhk~⤥~searr~↘~searrow~↘~semi~;~seswar~⤩~setminus~∖~setmn~∖~sext~✶~sfr~𝔰~sfrown~⌢~sharp~♯~shchcy~щ~shcy~ш~shortmid~∣~shortparallel~∥~sigmav~ς~simdot~⩪~sime~≃~simeq~≃~simg~⪞~simgE~⪠~siml~⪝~simlE~⪟~simne~≆~simplus~⨤~simrarr~⥲~slarr~←~smallsetminus~∖~smashp~⨳~smeparsl~⧤~smid~∣~smile~⌣~smt~⪪~smte~⪬~smtes~⪬︀~softcy~ь~sol~/~solb~⧄~solbar~⌿~sopf~𝕤~spadesuit~♠~spar~∥~sqcap~⊓~sqcaps~⊓︀~sqcup~⊔~sqcups~⊔︀~sqsub~⊏~sqsube~⊑~sqsubset~⊏~sqsubseteq~⊑~sqsup~⊐~sqsupe~⊒~sqsupset~⊐~sqsupseteq~⊒~squ~□~square~□~squarf~▪~squf~▪~srarr~→~sscr~𝓈~ssetmn~∖~ssmile~⌣~sstarf~⋆~star~☆~starf~★~straightepsilon~ϵ~straightphi~ϕ~strns~¯~subE~⫅~subdot~⪽~subedot~⫃~submult~⫁~subnE~⫋~subne~⊊~subplus~⪿~subrarr~⥹~subset~⊂~subseteq~⊆~subseteqq~⫅~subsetneq~⊊~subsetneqq~⫋~subsim~⫇~subsub~⫕~subsup~⫓~succ~≻~succapprox~⪸~succcurlyeq~≽~succeq~⪰~succnapprox~⪺~succneqq~⪶~succnsim~⋩~succsim~≿~sung~♪~supE~⫆~supdot~⪾~supdsub~⫘~supedot~⫄~suphsol~⟉~suphsub~⫗~suplarr~⥻~supmult~⫂~supnE~⫌~supne~⊋~supplus~⫀~supset~⊃~supseteq~⊇~supseteqq~⫆~supsetneq~⊋~supsetneqq~⫌~supsim~⫈~supsub~⫔~supsup~⫖~swArr~⇙~swarhk~⤦~swarr~↙~swarrow~↙~swnwar~⤪~target~⌖~tbrk~⎴~tcaron~ť~tcedil~ţ~tcy~т~tdot~⃛~telrec~⌕~tfr~𝔱~therefore~∴~thetav~ϑ~thickapprox~≈~thicksim~∼~thkap~≈~thksim~∼~timesb~⊠~timesbar~⨱~timesd~⨰~tint~∭~toea~⤨~top~⊤~topbot~⌶~topcir~⫱~topf~𝕥~topfork~⫚~tosa~⤩~tprime~‴~triangle~▵~triangledown~▿~triangleleft~◃~trianglelefteq~⊴~triangleq~≜~triangleright~▹~trianglerighteq~⊵~tridot~◬~trie~≜~triminus~⨺~triplus~⨹~trisb~⧍~tritime~⨻~trpezium~⏢~tscr~𝓉~tscy~ц~tshcy~ћ~tstrok~ŧ~twixt~≬~twoheadleftarrow~↞~twoheadrightarrow~↠~uHar~⥣~ubrcy~ў~ubreve~ŭ~ucy~у~udarr~⇅~udblac~ű~udhar~⥮~ufisht~⥾~ufr~𝔲~uharl~↿~uharr~↾~uhblk~▀~ulcorn~⌜~ulcorner~⌜~ulcrop~⌏~ultri~◸~umacr~ū~uogon~ų~uopf~𝕦~uparrow~↑~updownarrow~↕~upharpoonleft~↿~upharpoonright~↾~uplus~⊎~upsi~υ~upuparrows~⇈~urcorn~⌝~urcorner~⌝~urcrop~⌎~uring~ů~urtri~◹~uscr~𝓊~utdot~⋰~utilde~ũ~utri~▵~utrif~▴~uuarr~⇈~uwangle~⦧~vArr~⇕~vBar~⫨~vBarv~⫩~vDash~⊨~vangrt~⦜~varepsilon~ϵ~varkappa~ϰ~varnothing~∅~varphi~ϕ~varpi~ϖ~varpropto~∝~varr~↕~varrho~ϱ~varsigma~ς~varsubsetneq~⊊︀~varsubsetneqq~⫋︀~varsupsetneq~⊋︀~varsupsetneqq~⫌︀~vartheta~ϑ~vartriangleleft~⊲~vartriangleright~⊳~vcy~в~vdash~⊢~vee~∨~veebar~⊻~veeeq~≚~vellip~⋮~verbar~|~vert~|~vfr~𝔳~vltri~⊲~vnsub~⊂⃒~vnsup~⊃⃒~vopf~𝕧~vprop~∝~vrtri~⊳~vscr~𝓋~vsubnE~⫋︀~vsubne~⊊︀~vsupnE~⫌︀~vsupne~⊋︀~vzigzag~⦚~wcirc~ŵ~wedbar~⩟~wedge~∧~wedgeq~≙~wfr~𝔴~wopf~𝕨~wp~℘~wr~≀~wreath~≀~wscr~𝓌~xcap~⋂~xcirc~◯~xcup~⋃~xdtri~▽~xfr~𝔵~xhArr~⟺~xharr~⟷~xlArr~⟸~xlarr~⟵~xmap~⟼~xnis~⋻~xodot~⨀~xopf~𝕩~xoplus~⨁~xotime~⨂~xrArr~⟹~xrarr~⟶~xscr~𝓍~xsqcup~⨆~xuplus~⨄~xutri~△~xvee~⋁~xwedge~⋀~yacy~я~ycirc~ŷ~ycy~ы~yfr~𝔶~yicy~ї~yopf~𝕪~yscr~𝓎~yucy~ю~zacute~ź~zcaron~ž~zcy~з~zdot~ż~zeetrf~ℨ~zfr~𝔷~zhcy~ж~zigrarr~⇝~zopf~𝕫~zscr~𝓏~~AMP~&~COPY~©~GT~>~LT~<~QUOT~"~REG~®', exports.namedReferences["html4"]);
  }
});

// node_modules/html-entities/dist/commonjs/numeric-unicode-map.js
var require_numeric_unicode_map = __commonJS({
  "node_modules/html-entities/dist/commonjs/numeric-unicode-map.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.numericUnicodeMap = void 0;
    exports.numericUnicodeMap = {
      0: 65533,
      128: 8364,
      130: 8218,
      131: 402,
      132: 8222,
      133: 8230,
      134: 8224,
      135: 8225,
      136: 710,
      137: 8240,
      138: 352,
      139: 8249,
      140: 338,
      142: 381,
      145: 8216,
      146: 8217,
      147: 8220,
      148: 8221,
      149: 8226,
      150: 8211,
      151: 8212,
      152: 732,
      153: 8482,
      154: 353,
      155: 8250,
      156: 339,
      158: 382,
      159: 376
    };
  }
});

// node_modules/html-entities/dist/commonjs/surrogate-pairs.js
var require_surrogate_pairs = __commonJS({
  "node_modules/html-entities/dist/commonjs/surrogate-pairs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.highSurrogateTo = exports.highSurrogateFrom = exports.getCodePoint = exports.fromCodePoint = void 0;
    exports.fromCodePoint = String.fromCodePoint || function(astralCodePoint) {
      return String.fromCharCode(Math.floor((astralCodePoint - 65536) / 1024) + 55296, (astralCodePoint - 65536) % 1024 + 56320);
    };
    exports.getCodePoint = String.prototype.codePointAt ? function(input, position) {
      return input.codePointAt(position);
    } : function(input, position) {
      return (input.charCodeAt(position) - 55296) * 1024 + input.charCodeAt(position + 1) - 56320 + 65536;
    };
    exports.highSurrogateFrom = 55296;
    exports.highSurrogateTo = 56319;
  }
});

// node_modules/html-entities/dist/commonjs/index.js
var require_commonjs = __commonJS({
  "node_modules/html-entities/dist/commonjs/index.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.encode = encode;
    exports.decodeEntity = decodeEntity;
    exports.decode = decode;
    var named_references_js_1 = require_named_references();
    var numeric_unicode_map_js_1 = require_numeric_unicode_map();
    var surrogate_pairs_js_1 = require_surrogate_pairs();
    var allNamedReferences = __assign(__assign({}, named_references_js_1.namedReferences), { all: named_references_js_1.namedReferences.html5 });
    var encodeRegExps = {
      specialChars: /[<>'"&]/g,
      nonAscii: /[<>'"&\u0080-\uD7FF\uE000-\uFFFF\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g,
      nonAsciiPrintable: /[<>'"&\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g,
      nonAsciiPrintableOnly: /[\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g,
      extensive: /[\x01-\x0c\x0e-\x1f\x21-\x2c\x2e-\x2f\x3a-\x40\x5b-\x60\x7b-\x7d\x7f-\uD7FF\uE000-\uFFFF\uDC00-\uDFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g
    };
    var defaultEncodeOptions = {
      mode: "specialChars",
      level: "all",
      numeric: "decimal"
    };
    function encode(text, _a) {
      var _b = _a === void 0 ? defaultEncodeOptions : _a, _c = _b.mode, mode = _c === void 0 ? "specialChars" : _c, _d = _b.numeric, numeric = _d === void 0 ? "decimal" : _d, _e = _b.level, level = _e === void 0 ? "all" : _e;
      if (!text) {
        return "";
      }
      var encodeRegExp = encodeRegExps[mode];
      var references = allNamedReferences[level].characters;
      var isHex = numeric === "hexadecimal";
      return String.prototype.replace.call(text, encodeRegExp, function(input) {
        var result = references[input];
        if (!result) {
          var code = input.length > 1 ? (0, surrogate_pairs_js_1.getCodePoint)(input, 0) : input.charCodeAt(0);
          result = (isHex ? "&#x" + code.toString(16) : "&#" + code) + ";";
        }
        return result;
      });
    }
    var defaultDecodeOptions = {
      scope: "body",
      level: "all"
    };
    var strict = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
    var attribute = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;
    var baseDecodeRegExps = {
      xml: {
        strict,
        attribute,
        body: named_references_js_1.bodyRegExps.xml
      },
      html4: {
        strict,
        attribute,
        body: named_references_js_1.bodyRegExps.html4
      },
      html5: {
        strict,
        attribute,
        body: named_references_js_1.bodyRegExps.html5
      }
    };
    var decodeRegExps = __assign(__assign({}, baseDecodeRegExps), { all: baseDecodeRegExps.html5 });
    var fromCharCode = String.fromCharCode;
    var outOfBoundsChar = fromCharCode(65533);
    var defaultDecodeEntityOptions = {
      level: "all"
    };
    function getDecodedEntity(entity, references, isAttribute, isStrict) {
      var decodeResult = entity;
      var decodeEntityLastChar = entity[entity.length - 1];
      if (isAttribute && decodeEntityLastChar === "=") {
        decodeResult = entity;
      } else if (isStrict && decodeEntityLastChar !== ";") {
        decodeResult = entity;
      } else {
        var decodeResultByReference = references[entity];
        if (decodeResultByReference) {
          decodeResult = decodeResultByReference;
        } else if (entity[0] === "&" && entity[1] === "#") {
          var decodeSecondChar = entity[2];
          var decodeCode = decodeSecondChar == "x" || decodeSecondChar == "X" ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
          decodeResult = decodeCode >= 1114111 ? outOfBoundsChar : decodeCode > 65535 ? (0, surrogate_pairs_js_1.fromCodePoint)(decodeCode) : fromCharCode(numeric_unicode_map_js_1.numericUnicodeMap[decodeCode] || decodeCode);
        }
      }
      return decodeResult;
    }
    function decodeEntity(entity, _a) {
      var _b = _a === void 0 ? defaultDecodeEntityOptions : _a, _c = _b.level, level = _c === void 0 ? "all" : _c;
      if (!entity) {
        return "";
      }
      return getDecodedEntity(entity, allNamedReferences[level].entities, false, false);
    }
    function decode(text, _a) {
      var _b = _a === void 0 ? defaultDecodeOptions : _a, _c = _b.level, level = _c === void 0 ? "all" : _c, _d = _b.scope, scope = _d === void 0 ? level === "xml" ? "strict" : "body" : _d;
      if (!text) {
        return "";
      }
      var decodeRegExp = decodeRegExps[level][scope];
      var references = allNamedReferences[level].entities;
      var isAttribute = scope === "attribute";
      var isStrict = scope === "strict";
      return text.replace(decodeRegExp, function(entity) {
        return getDecodedEntity(entity, references, isAttribute, isStrict);
      });
    }
  }
});

// browser-external:child_process
var require_child_process = __commonJS({
  "browser-external:child_process"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "child_process" has been externalized for browser compatibility. Cannot access "child_process.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// browser-external:fs
var require_fs = __commonJS({
  "browser-external:fs"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "fs" has been externalized for browser compatibility. Cannot access "fs.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/gaxios/package.json
var require_package = __commonJS({
  "node_modules/gaxios/package.json"(exports, module) {
    module.exports = {
      name: "gaxios",
      version: "7.1.1",
      description: "A simple common HTTP client specifically for Google APIs and services.",
      main: "build/cjs/src/index.js",
      types: "build/cjs/src/index.d.ts",
      files: [
        "build/"
      ],
      exports: {
        ".": {
          import: {
            types: "./build/esm/src/index.d.ts",
            default: "./build/esm/src/index.js"
          },
          require: {
            types: "./build/cjs/src/index.d.ts",
            default: "./build/cjs/src/index.js"
          }
        }
      },
      scripts: {
        lint: "gts check --no-inline-config",
        test: "c8 mocha build/esm/test",
        "presystem-test": "npm run compile",
        "system-test": "mocha build/esm/system-test --timeout 80000",
        compile: "tsc -b ./tsconfig.json ./tsconfig.cjs.json && node utils/enable-esm.mjs",
        fix: "gts fix",
        prepare: "npm run compile",
        pretest: "npm run compile",
        webpack: "webpack",
        "prebrowser-test": "npm run compile",
        "browser-test": "node build/browser-test/browser-test-runner.js",
        docs: "jsdoc -c .jsdoc.js",
        "docs-test": "linkinator docs",
        "predocs-test": "npm run docs",
        "samples-test": "cd samples/ && npm link ../ && npm test && cd ../",
        prelint: "cd samples; npm link ../; npm install",
        clean: "gts clean"
      },
      repository: "googleapis/gaxios",
      keywords: [
        "google"
      ],
      engines: {
        node: ">=18"
      },
      author: "Google, LLC",
      license: "Apache-2.0",
      devDependencies: {
        "@babel/plugin-proposal-private-methods": "^7.18.6",
        "@types/cors": "^2.8.6",
        "@types/express": "^5.0.0",
        "@types/extend": "^3.0.1",
        "@types/mocha": "^10.0.10",
        "@types/multiparty": "4.2.1",
        "@types/mv": "^2.1.0",
        "@types/ncp": "^2.0.1",
        "@types/node": "^22.0.0",
        "@types/sinon": "^17.0.0",
        "@types/tmp": "0.2.6",
        assert: "^2.0.0",
        browserify: "^17.0.0",
        c8: "^10.0.0",
        cors: "^2.8.5",
        express: "^5.0.0",
        gts: "^6.0.0",
        "is-docker": "^3.0.0",
        jsdoc: "^4.0.0",
        "jsdoc-fresh": "^4.0.0",
        "jsdoc-region-tag": "^3.0.0",
        karma: "^6.0.0",
        "karma-chrome-launcher": "^3.0.0",
        "karma-coverage": "^2.0.0",
        "karma-firefox-launcher": "^2.0.0",
        "karma-mocha": "^2.0.0",
        "karma-remap-coverage": "^0.1.5",
        "karma-sourcemap-loader": "^0.4.0",
        "karma-webpack": "^5.0.1",
        linkinator: "^6.1.2",
        mocha: "^11.1.0",
        multiparty: "^4.2.1",
        mv: "^2.1.1",
        ncp: "^2.0.0",
        nock: "^14.0.0-beta.13",
        "null-loader": "^4.0.0",
        "pack-n-play": "^3.0.0",
        puppeteer: "^24.0.0",
        sinon: "^20.0.0",
        "stream-browserify": "^3.0.0",
        tmp: "0.2.3",
        "ts-loader": "^9.5.2",
        typescript: "^5.8.3",
        webpack: "^5.35.0",
        "webpack-cli": "^6.0.1"
      },
      dependencies: {
        extend: "^3.0.2",
        "https-proxy-agent": "^7.0.1",
        "node-fetch": "^3.3.2"
      }
    };
  }
});

// node_modules/gaxios/build/cjs/src/util.cjs
var require_util = __commonJS({
  "node_modules/gaxios/build/cjs/src/util.cjs"(exports, module) {
    "use strict";
    var pkg = require_package();
    module.exports = { pkg };
  }
});

// node_modules/gaxios/build/cjs/src/common.js
var require_common = __commonJS({
  "node_modules/gaxios/build/cjs/src/common.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GaxiosError = exports.GAXIOS_ERROR_SYMBOL = void 0;
    exports.defaultErrorRedactor = defaultErrorRedactor;
    var extend_1 = __importDefault(require_extend());
    var util_cjs_1 = __importDefault(require_util());
    var pkg = util_cjs_1.default.pkg;
    exports.GAXIOS_ERROR_SYMBOL = Symbol.for(`${pkg.name}-gaxios-error`);
    var _a;
    var GaxiosError = class _GaxiosError extends Error {
      constructor(message, config, response, cause) {
        var _a2, _b;
        super(message, { cause });
        __publicField(this, "config");
        __publicField(this, "response");
        /**
         * An error code.
         * Can be a system error code, DOMException error name, or any error's 'code' property where it is a `string`.
         *
         * It is only a `number` when the cause is sourced from an API-level error (AIP-193).
         *
         * @see {@link https://nodejs.org/api/errors.html#errorcode error.code}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names DOMException#error_names}
         * @see {@link https://google.aip.dev/193#http11json-representation AIP-193}
         *
         * @example
         * 'ECONNRESET'
         *
         * @example
         * 'TimeoutError'
         *
         * @example
         * 500
         */
        __publicField(this, "code");
        /**
         * An HTTP Status code.
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response/status Response#status}
         *
         * @example
         * 500
         */
        __publicField(this, "status");
        /**
         * @deprecated use {@link GaxiosError.cause} instead.
         *
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause Error#cause}
         *
         * @privateRemarks
         *
         * We will want to remove this property later as the modern `cause` property is better suited
         * for displaying and relaying nested errors. Keeping this here makes the resulting
         * error log larger than it needs to be.
         *
         */
        __publicField(this, "error");
        /**
         * Support `instanceof` operator for `GaxiosError` across builds/duplicated files.
         *
         * @see {@link GAXIOS_ERROR_SYMBOL}
         * @see {@link GaxiosError[Symbol.hasInstance]}
         * @see {@link https://github.com/microsoft/TypeScript/issues/13965#issuecomment-278570200}
         * @see {@link https://stackoverflow.com/questions/46618852/require-and-instanceof}
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/@@hasInstance#reverting_to_default_instanceof_behavior}
         */
        __publicField(this, _a, pkg.version);
        this.config = config;
        this.response = response;
        this.error = cause instanceof Error ? cause : void 0;
        this.config = (0, extend_1.default)(true, {}, config);
        if (this.response) {
          this.response.config = (0, extend_1.default)(true, {}, this.response.config);
        }
        if (this.response) {
          try {
            this.response.data = translateData(
              this.config.responseType,
              // workaround for `node-fetch`'s `.data` deprecation...
              ((_a2 = this.response) == null ? void 0 : _a2.bodyUsed) ? (_b = this.response) == null ? void 0 : _b.data : void 0
            );
          } catch {
          }
          this.status = this.response.status;
        }
        if (cause instanceof DOMException) {
          this.code = cause.name;
        } else if (cause && typeof cause === "object" && "code" in cause && (typeof cause.code === "string" || typeof cause.code === "number")) {
          this.code = cause.code;
        }
      }
      /**
       * Support `instanceof` operator for `GaxiosError` across builds/duplicated files.
       *
       * @see {@link GAXIOS_ERROR_SYMBOL}
       * @see {@link GaxiosError[GAXIOS_ERROR_SYMBOL]}
       */
      static [(_a = exports.GAXIOS_ERROR_SYMBOL, Symbol.hasInstance)](instance) {
        if (instance && typeof instance === "object" && exports.GAXIOS_ERROR_SYMBOL in instance && instance[exports.GAXIOS_ERROR_SYMBOL] === pkg.version) {
          return true;
        }
        return Function.prototype[Symbol.hasInstance].call(_GaxiosError, instance);
      }
      /**
       * An AIP-193 conforming error extractor.
       *
       * @see {@link https://google.aip.dev/193#http11json-representation AIP-193}
       *
       * @internal
       * @expiremental
       *
       * @param res the response object
       * @returns the extracted error information
       */
      static extractAPIErrorFromResponse(res, defaultErrorMessage = "The request failed") {
        let message = defaultErrorMessage;
        if (typeof res.data === "string") {
          message = res.data;
        }
        if (res.data && typeof res.data === "object" && "error" in res.data && res.data.error && !res.ok) {
          if (typeof res.data.error === "string") {
            return {
              message: res.data.error,
              code: res.status,
              status: res.statusText
            };
          }
          if (typeof res.data.error === "object") {
            message = "message" in res.data.error && typeof res.data.error.message === "string" ? res.data.error.message : message;
            const status = "status" in res.data.error && typeof res.data.error.status === "string" ? res.data.error.status : res.statusText;
            const code = "code" in res.data.error && typeof res.data.error.code === "number" ? res.data.error.code : res.status;
            if ("errors" in res.data.error && Array.isArray(res.data.error.errors)) {
              const errorMessages = [];
              for (const e of res.data.error.errors) {
                if (typeof e === "object" && "message" in e && typeof e.message === "string") {
                  errorMessages.push(e.message);
                }
              }
              return Object.assign({
                message: errorMessages.join("\n") || message,
                code,
                status
              }, res.data.error);
            }
            return Object.assign({
              message,
              code,
              status
            }, res.data.error);
          }
        }
        return {
          message,
          code: res.status,
          status: res.statusText
        };
      }
    };
    exports.GaxiosError = GaxiosError;
    function translateData(responseType, data) {
      switch (responseType) {
        case "stream":
          return data;
        case "json":
          return JSON.parse(JSON.stringify(data));
        case "arraybuffer":
          return JSON.parse(Buffer.from(data).toString("utf8"));
        case "blob":
          return JSON.parse(data.text());
        default:
          return data;
      }
    }
    function defaultErrorRedactor(data) {
      const REDACT = "<<REDACTED> - See `errorRedactor` option in `gaxios` for configuration>.";
      function redactHeaders(headers) {
        if (!headers)
          return;
        headers.forEach((_, key) => {
          if (/^authentication$/i.test(key) || /^authorization$/i.test(key) || /secret/i.test(key))
            headers.set(key, REDACT);
        });
      }
      function redactString(obj, key) {
        if (typeof obj === "object" && obj !== null && typeof obj[key] === "string") {
          const text = obj[key];
          if (/grant_type=/i.test(text) || /assertion=/i.test(text) || /secret/i.test(text)) {
            obj[key] = REDACT;
          }
        }
      }
      function redactObject(obj) {
        if (!obj || typeof obj !== "object") {
          return;
        } else if (obj instanceof FormData || obj instanceof URLSearchParams || // support `node-fetch` FormData/URLSearchParams
        "forEach" in obj && "set" in obj) {
          obj.forEach((_, key) => {
            if (["grant_type", "assertion"].includes(key) || /secret/.test(key)) {
              obj.set(key, REDACT);
            }
          });
        } else {
          if ("grant_type" in obj) {
            obj["grant_type"] = REDACT;
          }
          if ("assertion" in obj) {
            obj["assertion"] = REDACT;
          }
          if ("client_secret" in obj) {
            obj["client_secret"] = REDACT;
          }
        }
      }
      if (data.config) {
        redactHeaders(data.config.headers);
        redactString(data.config, "data");
        redactObject(data.config.data);
        redactString(data.config, "body");
        redactObject(data.config.body);
        if (data.config.url.searchParams.has("token")) {
          data.config.url.searchParams.set("token", REDACT);
        }
        if (data.config.url.searchParams.has("client_secret")) {
          data.config.url.searchParams.set("client_secret", REDACT);
        }
      }
      if (data.response) {
        defaultErrorRedactor({ config: data.response.config });
        redactHeaders(data.response.headers);
        if (data.response.bodyUsed) {
          redactString(data.response, "data");
          redactObject(data.response.data);
        }
      }
      return data;
    }
  }
});

// node_modules/gaxios/build/cjs/src/retry.js
var require_retry = __commonJS({
  "node_modules/gaxios/build/cjs/src/retry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRetryConfig = getRetryConfig;
    async function getRetryConfig(err) {
      let config = getConfig(err);
      if (!err || !err.config || !config && !err.config.retry) {
        return { shouldRetry: false };
      }
      config = config || {};
      config.currentRetryAttempt = config.currentRetryAttempt || 0;
      config.retry = config.retry === void 0 || config.retry === null ? 3 : config.retry;
      config.httpMethodsToRetry = config.httpMethodsToRetry || [
        "GET",
        "HEAD",
        "PUT",
        "OPTIONS",
        "DELETE"
      ];
      config.noResponseRetries = config.noResponseRetries === void 0 || config.noResponseRetries === null ? 2 : config.noResponseRetries;
      config.retryDelayMultiplier = config.retryDelayMultiplier ? config.retryDelayMultiplier : 2;
      config.timeOfFirstRequest = config.timeOfFirstRequest ? config.timeOfFirstRequest : Date.now();
      config.totalTimeout = config.totalTimeout ? config.totalTimeout : Number.MAX_SAFE_INTEGER;
      config.maxRetryDelay = config.maxRetryDelay ? config.maxRetryDelay : Number.MAX_SAFE_INTEGER;
      const retryRanges = [
        // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
        // 1xx - Retry (Informational, request still processing)
        // 2xx - Do not retry (Success)
        // 3xx - Do not retry (Redirect)
        // 4xx - Do not retry (Client errors)
        // 408 - Retry ("Request Timeout")
        // 429 - Retry ("Too Many Requests")
        // 5xx - Retry (Server errors)
        [100, 199],
        [408, 408],
        [429, 429],
        [500, 599]
      ];
      config.statusCodesToRetry = config.statusCodesToRetry || retryRanges;
      err.config.retryConfig = config;
      const shouldRetryFn = config.shouldRetry || shouldRetryRequest;
      if (!await shouldRetryFn(err)) {
        return { shouldRetry: false, config: err.config };
      }
      const delay = getNextRetryDelay(config);
      err.config.retryConfig.currentRetryAttempt += 1;
      const backoff = config.retryBackoff ? config.retryBackoff(err, delay) : new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      if (config.onRetryAttempt) {
        await config.onRetryAttempt(err);
      }
      await backoff;
      return { shouldRetry: true, config: err.config };
    }
    function shouldRetryRequest(err) {
      var _a, _b;
      const config = getConfig(err);
      if (((_a = err.config.signal) == null ? void 0 : _a.aborted) && err.code !== "TimeoutError" || err.code === "AbortError") {
        return false;
      }
      if (!config || config.retry === 0) {
        return false;
      }
      if (!err.response && (config.currentRetryAttempt || 0) >= config.noResponseRetries) {
        return false;
      }
      if (!config.httpMethodsToRetry || !config.httpMethodsToRetry.includes(((_b = err.config.method) == null ? void 0 : _b.toUpperCase()) || "GET")) {
        return false;
      }
      if (err.response && err.response.status) {
        let isInRange = false;
        for (const [min, max] of config.statusCodesToRetry) {
          const status = err.response.status;
          if (status >= min && status <= max) {
            isInRange = true;
            break;
          }
        }
        if (!isInRange) {
          return false;
        }
      }
      config.currentRetryAttempt = config.currentRetryAttempt || 0;
      if (config.currentRetryAttempt >= config.retry) {
        return false;
      }
      return true;
    }
    function getConfig(err) {
      if (err && err.config && err.config.retryConfig) {
        return err.config.retryConfig;
      }
      return;
    }
    function getNextRetryDelay(config) {
      const retryDelay = config.currentRetryAttempt ? 0 : config.retryDelay ?? 100;
      const calculatedDelay = retryDelay + (Math.pow(config.retryDelayMultiplier, config.currentRetryAttempt) - 1) / 2 * 1e3;
      const maxAllowableDelay = config.totalTimeout - (Date.now() - config.timeOfFirstRequest);
      return Math.min(calculatedDelay, maxAllowableDelay, config.maxRetryDelay);
    }
  }
});

// node_modules/gaxios/build/cjs/src/interceptor.js
var require_interceptor = __commonJS({
  "node_modules/gaxios/build/cjs/src/interceptor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GaxiosInterceptorManager = void 0;
    var GaxiosInterceptorManager = class extends Set {
    };
    exports.GaxiosInterceptorManager = GaxiosInterceptorManager;
  }
});

// node_modules/gaxios/build/cjs/src/gaxios.js
var require_gaxios = __commonJS({
  "node_modules/gaxios/build/cjs/src/gaxios.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Gaxios = void 0;
    var extend_1 = __importDefault(require_extend());
    var https_1 = require_https();
    var common_js_1 = require_common();
    var retry_js_1 = require_retry();
    var stream_1 = require_stream();
    var interceptor_js_1 = require_interceptor();
    var randomUUID = async () => {
      var _a2;
      return ((_a2 = globalThis.crypto) == null ? void 0 : _a2.randomUUID()) || (await import("./crypto-RAPUIXII.js")).randomUUID();
    };
    var _Gaxios_instances, urlMayUseProxy_fn, applyRequestInterceptors_fn, applyResponseInterceptors_fn, prepareRequest_fn, appendTimeoutToSignal_fn, _proxyAgent, _fetch, _Gaxios_static, getProxyAgent_fn, getFetch_fn;
    var Gaxios = class {
      /**
       * The Gaxios class is responsible for making HTTP requests.
       * @param defaults The default set of options to be used for this instance.
       */
      constructor(defaults) {
        __privateAdd(this, _Gaxios_instances);
        __publicField(this, "agentCache", /* @__PURE__ */ new Map());
        /**
         * Default HTTP options that will be used for every HTTP request.
         */
        __publicField(this, "defaults");
        /**
         * Interceptors
         */
        __publicField(this, "interceptors");
        this.defaults = defaults || {};
        this.interceptors = {
          request: new interceptor_js_1.GaxiosInterceptorManager(),
          response: new interceptor_js_1.GaxiosInterceptorManager()
        };
      }
      /**
       * A {@link fetch `fetch`} compliant API for {@link Gaxios}.
       *
       * @remarks
       *
       * This is useful as a drop-in replacement for `fetch` API usage.
       *
       * @example
       *
       * ```ts
       * const gaxios = new Gaxios();
       * const myFetch: typeof fetch = (...args) => gaxios.fetch(...args);
       * await myFetch('https://example.com');
       * ```
       *
       * @param args `fetch` API or `Gaxios#request` parameters
       * @returns the {@link Response} with Gaxios-added properties
       */
      fetch(...args) {
        const input = args[0];
        const init = args[1];
        let url = void 0;
        const headers = new Headers();
        if (typeof input === "string") {
          url = new URL(input);
        } else if (input instanceof URL) {
          url = input;
        } else if (input && input.url) {
          url = new URL(input.url);
        }
        if (input && typeof input === "object" && "headers" in input) {
          _a.mergeHeaders(headers, input.headers);
        }
        if (init) {
          _a.mergeHeaders(headers, new Headers(init.headers));
        }
        if (typeof input === "object" && !(input instanceof URL)) {
          return this.request({ ...init, ...input, headers, url });
        } else {
          return this.request({ ...init, headers, url });
        }
      }
      /**
       * Perform an HTTP request with the given options.
       * @param opts Set of HTTP options that will be used for this HTTP request.
       */
      async request(opts = {}) {
        let prepared = await __privateMethod(this, _Gaxios_instances, prepareRequest_fn).call(this, opts);
        prepared = await __privateMethod(this, _Gaxios_instances, applyRequestInterceptors_fn).call(this, prepared);
        return __privateMethod(this, _Gaxios_instances, applyResponseInterceptors_fn).call(this, this._request(prepared));
      }
      async _defaultAdapter(config) {
        var _a2, _b;
        const fetchImpl = config.fetchImplementation || this.defaults.fetchImplementation || await __privateMethod(_a2 = _a, _Gaxios_static, getFetch_fn).call(_a2);
        const preparedOpts = { ...config };
        delete preparedOpts.data;
        const res = await fetchImpl(config.url, preparedOpts);
        const data = await this.getResponseData(config, res);
        if (!((_b = Object.getOwnPropertyDescriptor(res, "data")) == null ? void 0 : _b.configurable)) {
          Object.defineProperties(res, {
            data: {
              configurable: true,
              writable: true,
              enumerable: true,
              value: data
            }
          });
        }
        return Object.assign(res, { config, data });
      }
      /**
       * Internal, retryable version of the `request` method.
       * @param opts Set of HTTP options that will be used for this HTTP request.
       */
      async _request(opts) {
        var _a2;
        try {
          let translatedResponse;
          if (opts.adapter) {
            translatedResponse = await opts.adapter(opts, this._defaultAdapter.bind(this));
          } else {
            translatedResponse = await this._defaultAdapter(opts);
          }
          if (!opts.validateStatus(translatedResponse.status)) {
            if (opts.responseType === "stream") {
              const response = [];
              for await (const chunk of opts.data ?? []) {
                response.push(chunk);
              }
              translatedResponse.data = response;
            }
            const errorInfo = common_js_1.GaxiosError.extractAPIErrorFromResponse(translatedResponse, `Request failed with status code ${translatedResponse.status}`);
            throw new common_js_1.GaxiosError(errorInfo == null ? void 0 : errorInfo.message, opts, translatedResponse, errorInfo);
          }
          return translatedResponse;
        } catch (e) {
          let err;
          if (e instanceof common_js_1.GaxiosError) {
            err = e;
          } else if (e instanceof Error) {
            err = new common_js_1.GaxiosError(e.message, opts, void 0, e);
          } else {
            err = new common_js_1.GaxiosError("Unexpected Gaxios Error", opts, void 0, e);
          }
          const { shouldRetry, config } = await (0, retry_js_1.getRetryConfig)(err);
          if (shouldRetry && config) {
            err.config.retryConfig.currentRetryAttempt = config.retryConfig.currentRetryAttempt;
            opts.retryConfig = (_a2 = err.config) == null ? void 0 : _a2.retryConfig;
            __privateMethod(this, _Gaxios_instances, appendTimeoutToSignal_fn).call(this, opts);
            return this._request(opts);
          }
          if (opts.errorRedactor) {
            opts.errorRedactor(err);
          }
          throw err;
        }
      }
      async getResponseData(opts, res) {
        var _a2;
        if (opts.maxContentLength && res.headers.has("content-length") && opts.maxContentLength < Number.parseInt(((_a2 = res.headers) == null ? void 0 : _a2.get("content-length")) || "")) {
          throw new common_js_1.GaxiosError("Response's `Content-Length` is over the limit.", opts, Object.assign(res, { config: opts }));
        }
        switch (opts.responseType) {
          case "stream":
            return res.body;
          case "json":
            return res.json();
          case "arraybuffer":
            return res.arrayBuffer();
          case "blob":
            return res.blob();
          case "text":
            return res.text();
          default:
            return this.getResponseDataFromContentType(res);
        }
      }
      /**
       * By default, throw for any non-2xx status code
       * @param status status code from the HTTP response
       */
      validateStatus(status) {
        return status >= 200 && status < 300;
      }
      /**
       * Attempts to parse a response by looking at the Content-Type header.
       * @param {Response} response the HTTP response.
       * @returns a promise that resolves to the response data.
       */
      async getResponseDataFromContentType(response) {
        let contentType = response.headers.get("Content-Type");
        if (contentType === null) {
          return response.text();
        }
        contentType = contentType.toLowerCase();
        if (contentType.includes("application/json")) {
          let data = await response.text();
          try {
            data = JSON.parse(data);
          } catch {
          }
          return data;
        } else if (contentType.match(/^text\//)) {
          return response.text();
        } else {
          return response.blob();
        }
      }
      /**
       * Creates an async generator that yields the pieces of a multipart/related request body.
       * This implementation follows the spec: https://www.ietf.org/rfc/rfc2387.txt. However, recursive
       * multipart/related requests are not currently supported.
       *
       * @param {GaxioMultipartOptions[]} multipartOptions the pieces to turn into a multipart/related body.
       * @param {string} boundary the boundary string to be placed between each part.
       */
      async *getMultipartRequest(multipartOptions, boundary) {
        const finale = `--${boundary}--`;
        for (const currentPart of multipartOptions) {
          const partContentType = currentPart.headers.get("Content-Type") || "application/octet-stream";
          const preamble = `--${boundary}\r
Content-Type: ${partContentType}\r
\r
`;
          yield preamble;
          if (typeof currentPart.content === "string") {
            yield currentPart.content;
          } else {
            yield* currentPart.content;
          }
          yield "\r\n";
        }
        yield finale;
      }
      /**
       * Merges headers.
       * If the base headers do not exist a new `Headers` object will be returned.
       *
       * @remarks
       *
       * Using this utility can be helpful when the headers are not known to exist:
       * - if they exist as `Headers`, that instance will be used
       *   - it improves performance and allows users to use their existing references to their `Headers`
       * - if they exist in another form (`HeadersInit`), they will be used to create a new `Headers` object
       * - if the base headers do not exist a new `Headers` object will be created
       *
       * @param base headers to append/overwrite to
       * @param append headers to append/overwrite with
       * @returns the base headers instance with merged `Headers`
       */
      static mergeHeaders(base, ...append) {
        base = base instanceof Headers ? base : new Headers(base);
        for (const headers of append) {
          const add = headers instanceof Headers ? headers : new Headers(headers);
          add.forEach((value, key) => {
            key === "set-cookie" ? base.append(key, value) : base.set(key, value);
          });
        }
        return base;
      }
    };
    _Gaxios_instances = new WeakSet();
    urlMayUseProxy_fn = function(url, noProxy = []) {
      var _a2;
      const candidate = new URL(url);
      const noProxyList = [...noProxy];
      const noProxyEnvList = ((_a2 = process.env.NO_PROXY ?? process.env.no_proxy) == null ? void 0 : _a2.split(",")) || [];
      for (const rule of noProxyEnvList) {
        noProxyList.push(rule.trim());
      }
      for (const rule of noProxyList) {
        if (rule instanceof RegExp) {
          if (rule.test(candidate.toString())) {
            return false;
          }
        } else if (rule instanceof URL) {
          if (rule.origin === candidate.origin) {
            return false;
          }
        } else if (rule.startsWith("*.") || rule.startsWith(".")) {
          const cleanedRule = rule.replace(/^\*\./, ".");
          if (candidate.hostname.endsWith(cleanedRule)) {
            return false;
          }
        } else if (rule === candidate.origin || rule === candidate.hostname || rule === candidate.href) {
          return false;
        }
      }
      return true;
    };
    applyRequestInterceptors_fn = async function(options) {
      let promiseChain = Promise.resolve(options);
      for (const interceptor of this.interceptors.request.values()) {
        if (interceptor) {
          promiseChain = promiseChain.then(interceptor.resolved, interceptor.rejected);
        }
      }
      return promiseChain;
    };
    applyResponseInterceptors_fn = async function(response) {
      let promiseChain = Promise.resolve(response);
      for (const interceptor of this.interceptors.response.values()) {
        if (interceptor) {
          promiseChain = promiseChain.then(interceptor.resolved, interceptor.rejected);
        }
      }
      return promiseChain;
    };
    prepareRequest_fn = async function(options) {
      var _a2, _b, _c, _d, _e, _f, _g, _h;
      const preparedHeaders = new Headers(this.defaults.headers);
      _a.mergeHeaders(preparedHeaders, options.headers);
      const opts = (0, extend_1.default)(true, {}, this.defaults, options);
      if (!opts.url) {
        throw new Error("URL is required.");
      }
      if (opts.baseURL) {
        opts.url = new URL(opts.url, opts.baseURL);
      }
      opts.url = new URL(opts.url);
      if (opts.params) {
        if (opts.paramsSerializer) {
          let additionalQueryParams = opts.paramsSerializer(opts.params);
          if (additionalQueryParams.startsWith("?")) {
            additionalQueryParams = additionalQueryParams.slice(1);
          }
          const prefix = opts.url.toString().includes("?") ? "&" : "?";
          opts.url = opts.url + prefix + additionalQueryParams;
        } else {
          const url = opts.url instanceof URL ? opts.url : new URL(opts.url);
          for (const [key, value] of new URLSearchParams(opts.params)) {
            url.searchParams.append(key, value);
          }
          opts.url = url;
        }
      }
      if (typeof options.maxContentLength === "number") {
        opts.size = options.maxContentLength;
      }
      if (typeof options.maxRedirects === "number") {
        opts.follow = options.maxRedirects;
      }
      const shouldDirectlyPassData = typeof opts.data === "string" || opts.data instanceof ArrayBuffer || opts.data instanceof Blob || // Node 18 does not have a global `File` object
      globalThis.File && opts.data instanceof File || opts.data instanceof FormData || opts.data instanceof stream_1.Readable || opts.data instanceof ReadableStream || opts.data instanceof String || opts.data instanceof URLSearchParams || ArrayBuffer.isView(opts.data) || // `Buffer` (Node.js), `DataView`, `TypedArray`
      /**
       * @deprecated `node-fetch` or another third-party's request types
       */
      ["Blob", "File", "FormData"].includes(((_b = (_a2 = opts.data) == null ? void 0 : _a2.constructor) == null ? void 0 : _b.name) || "");
      if ((_c = opts.multipart) == null ? void 0 : _c.length) {
        const boundary = await randomUUID();
        preparedHeaders.set("content-type", `multipart/related; boundary=${boundary}`);
        opts.body = stream_1.Readable.from(this.getMultipartRequest(opts.multipart, boundary));
      } else if (shouldDirectlyPassData) {
        opts.body = opts.data;
      } else if (typeof opts.data === "object") {
        if (preparedHeaders.get("Content-Type") === "application/x-www-form-urlencoded") {
          opts.body = opts.paramsSerializer ? opts.paramsSerializer(opts.data) : new URLSearchParams(opts.data);
        } else {
          if (!preparedHeaders.has("content-type")) {
            preparedHeaders.set("content-type", "application/json");
          }
          opts.body = JSON.stringify(opts.data);
        }
      } else if (opts.data) {
        opts.body = opts.data;
      }
      opts.validateStatus = opts.validateStatus || this.validateStatus;
      opts.responseType = opts.responseType || "unknown";
      if (!preparedHeaders.has("accept") && opts.responseType === "json") {
        preparedHeaders.set("accept", "application/json");
      }
      const proxy = opts.proxy || ((_d = process == null ? void 0 : process.env) == null ? void 0 : _d.HTTPS_PROXY) || ((_e = process == null ? void 0 : process.env) == null ? void 0 : _e.https_proxy) || ((_f = process == null ? void 0 : process.env) == null ? void 0 : _f.HTTP_PROXY) || ((_g = process == null ? void 0 : process.env) == null ? void 0 : _g.http_proxy);
      if (opts.agent) {
      } else if (proxy && __privateMethod(this, _Gaxios_instances, urlMayUseProxy_fn).call(this, opts.url, opts.noProxy)) {
        const HttpsProxyAgent = await __privateMethod(_h = _a, _Gaxios_static, getProxyAgent_fn).call(_h);
        if (this.agentCache.has(proxy)) {
          opts.agent = this.agentCache.get(proxy);
        } else {
          opts.agent = new HttpsProxyAgent(proxy, {
            cert: opts.cert,
            key: opts.key
          });
          this.agentCache.set(proxy, opts.agent);
        }
      } else if (opts.cert && opts.key) {
        if (this.agentCache.has(opts.key)) {
          opts.agent = this.agentCache.get(opts.key);
        } else {
          opts.agent = new https_1.Agent({
            cert: opts.cert,
            key: opts.key
          });
          this.agentCache.set(opts.key, opts.agent);
        }
      }
      if (typeof opts.errorRedactor !== "function" && opts.errorRedactor !== false) {
        opts.errorRedactor = common_js_1.defaultErrorRedactor;
      }
      if (opts.body && !("duplex" in opts)) {
        opts.duplex = "half";
      }
      __privateMethod(this, _Gaxios_instances, appendTimeoutToSignal_fn).call(this, opts);
      return Object.assign(opts, {
        headers: preparedHeaders,
        url: opts.url instanceof URL ? opts.url : new URL(opts.url)
      });
    };
    appendTimeoutToSignal_fn = function(opts) {
      if (opts.timeout) {
        const timeoutSignal = AbortSignal.timeout(opts.timeout);
        if (opts.signal && !opts.signal.aborted) {
          opts.signal = AbortSignal.any([opts.signal, timeoutSignal]);
        } else {
          opts.signal = timeoutSignal;
        }
      }
    };
    _proxyAgent = new WeakMap();
    _fetch = new WeakMap();
    _Gaxios_static = new WeakSet();
    getProxyAgent_fn = async function() {
      __privateGet(this, _proxyAgent) || __privateSet(this, _proxyAgent, (await import("./dist-VKMZGGRX.js")).HttpsProxyAgent);
      return __privateGet(this, _proxyAgent);
    };
    getFetch_fn = async function() {
      const hasWindow = typeof window !== "undefined" && !!window;
      __privateGet(this, _fetch) || __privateSet(this, _fetch, hasWindow ? window.fetch : (await import("./src-OZQ55KOP.js")).default);
      return __privateGet(this, _fetch);
    };
    __privateAdd(Gaxios, _Gaxios_static);
    /**
     * A cache for the lazily-loaded proxy agent.
     *
     * Should use {@link Gaxios[#getProxyAgent]} to retrieve.
     */
    // using `import` to dynamically import the types here
    __privateAdd(Gaxios, _proxyAgent);
    /**
     * A cache for the lazily-loaded fetch library.
     *
     * Should use {@link Gaxios[#getFetch]} to retrieve.
     */
    //
    __privateAdd(Gaxios, _fetch);
    exports.Gaxios = Gaxios;
    _a = Gaxios;
  }
});

// node_modules/gaxios/build/cjs/src/index.js
var require_src3 = __commonJS({
  "node_modules/gaxios/build/cjs/src/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.instance = exports.Gaxios = exports.GaxiosError = void 0;
    exports.request = request;
    var gaxios_js_1 = require_gaxios();
    Object.defineProperty(exports, "Gaxios", { enumerable: true, get: function() {
      return gaxios_js_1.Gaxios;
    } });
    var common_js_1 = require_common();
    Object.defineProperty(exports, "GaxiosError", { enumerable: true, get: function() {
      return common_js_1.GaxiosError;
    } });
    __exportStar(require_interceptor(), exports);
    exports.instance = new gaxios_js_1.Gaxios();
    async function request(opts) {
      return exports.instance.request(opts);
    }
  }
});

// node_modules/bignumber.js/bignumber.js
var require_bignumber = __commonJS({
  "node_modules/bignumber.js/bignumber.js"(exports, module) {
    (function(globalObject) {
      "use strict";
      var BigNumber, isNumeric = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i, mathceil = Math.ceil, mathfloor = Math.floor, bignumberError = "[BigNumber Error] ", tooManyDigits = bignumberError + "Number primitive has more than 15 significant digits: ", BASE = 1e14, LOG_BASE = 14, MAX_SAFE_INTEGER = 9007199254740991, POWS_TEN = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13], SQRT_BASE = 1e7, MAX = 1e9;
      function clone(configObject) {
        var div, convertBase, parseNumeric, P = BigNumber2.prototype = { constructor: BigNumber2, toString: null, valueOf: null }, ONE = new BigNumber2(1), DECIMAL_PLACES = 20, ROUNDING_MODE = 4, TO_EXP_NEG = -7, TO_EXP_POS = 21, MIN_EXP = -1e7, MAX_EXP = 1e7, CRYPTO = false, MODULO_MODE = 1, POW_PRECISION = 0, FORMAT = {
          prefix: "",
          groupSize: 3,
          secondaryGroupSize: 0,
          groupSeparator: ",",
          decimalSeparator: ".",
          fractionGroupSize: 0,
          fractionGroupSeparator: " ",
          // non-breaking space
          suffix: ""
        }, ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz", alphabetHasNormalDecimalDigits = true;
        function BigNumber2(v, b) {
          var alphabet, c, caseChanged, e, i, isNum, len, str, x = this;
          if (!(x instanceof BigNumber2)) return new BigNumber2(v, b);
          if (b == null) {
            if (v && v._isBigNumber === true) {
              x.s = v.s;
              if (!v.c || v.e > MAX_EXP) {
                x.c = x.e = null;
              } else if (v.e < MIN_EXP) {
                x.c = [x.e = 0];
              } else {
                x.e = v.e;
                x.c = v.c.slice();
              }
              return;
            }
            if ((isNum = typeof v == "number") && v * 0 == 0) {
              x.s = 1 / v < 0 ? (v = -v, -1) : 1;
              if (v === ~~v) {
                for (e = 0, i = v; i >= 10; i /= 10, e++) ;
                if (e > MAX_EXP) {
                  x.c = x.e = null;
                } else {
                  x.e = e;
                  x.c = [v];
                }
                return;
              }
              str = String(v);
            } else {
              if (!isNumeric.test(str = String(v))) return parseNumeric(x, str, isNum);
              x.s = str.charCodeAt(0) == 45 ? (str = str.slice(1), -1) : 1;
            }
            if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
            if ((i = str.search(/e/i)) > 0) {
              if (e < 0) e = i;
              e += +str.slice(i + 1);
              str = str.substring(0, i);
            } else if (e < 0) {
              e = str.length;
            }
          } else {
            intCheck(b, 2, ALPHABET.length, "Base");
            if (b == 10 && alphabetHasNormalDecimalDigits) {
              x = new BigNumber2(v);
              return round(x, DECIMAL_PLACES + x.e + 1, ROUNDING_MODE);
            }
            str = String(v);
            if (isNum = typeof v == "number") {
              if (v * 0 != 0) return parseNumeric(x, str, isNum, b);
              x.s = 1 / v < 0 ? (str = str.slice(1), -1) : 1;
              if (BigNumber2.DEBUG && str.replace(/^0\.0*|\./, "").length > 15) {
                throw Error(tooManyDigits + v);
              }
            } else {
              x.s = str.charCodeAt(0) === 45 ? (str = str.slice(1), -1) : 1;
            }
            alphabet = ALPHABET.slice(0, b);
            e = i = 0;
            for (len = str.length; i < len; i++) {
              if (alphabet.indexOf(c = str.charAt(i)) < 0) {
                if (c == ".") {
                  if (i > e) {
                    e = len;
                    continue;
                  }
                } else if (!caseChanged) {
                  if (str == str.toUpperCase() && (str = str.toLowerCase()) || str == str.toLowerCase() && (str = str.toUpperCase())) {
                    caseChanged = true;
                    i = -1;
                    e = 0;
                    continue;
                  }
                }
                return parseNumeric(x, String(v), isNum, b);
              }
            }
            isNum = false;
            str = convertBase(str, b, 10, x.s);
            if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
            else e = str.length;
          }
          for (i = 0; str.charCodeAt(i) === 48; i++) ;
          for (len = str.length; str.charCodeAt(--len) === 48; ) ;
          if (str = str.slice(i, ++len)) {
            len -= i;
            if (isNum && BigNumber2.DEBUG && len > 15 && (v > MAX_SAFE_INTEGER || v !== mathfloor(v))) {
              throw Error(tooManyDigits + x.s * v);
            }
            if ((e = e - i - 1) > MAX_EXP) {
              x.c = x.e = null;
            } else if (e < MIN_EXP) {
              x.c = [x.e = 0];
            } else {
              x.e = e;
              x.c = [];
              i = (e + 1) % LOG_BASE;
              if (e < 0) i += LOG_BASE;
              if (i < len) {
                if (i) x.c.push(+str.slice(0, i));
                for (len -= LOG_BASE; i < len; ) {
                  x.c.push(+str.slice(i, i += LOG_BASE));
                }
                i = LOG_BASE - (str = str.slice(i)).length;
              } else {
                i -= len;
              }
              for (; i--; str += "0") ;
              x.c.push(+str);
            }
          } else {
            x.c = [x.e = 0];
          }
        }
        BigNumber2.clone = clone;
        BigNumber2.ROUND_UP = 0;
        BigNumber2.ROUND_DOWN = 1;
        BigNumber2.ROUND_CEIL = 2;
        BigNumber2.ROUND_FLOOR = 3;
        BigNumber2.ROUND_HALF_UP = 4;
        BigNumber2.ROUND_HALF_DOWN = 5;
        BigNumber2.ROUND_HALF_EVEN = 6;
        BigNumber2.ROUND_HALF_CEIL = 7;
        BigNumber2.ROUND_HALF_FLOOR = 8;
        BigNumber2.EUCLID = 9;
        BigNumber2.config = BigNumber2.set = function(obj) {
          var p, v;
          if (obj != null) {
            if (typeof obj == "object") {
              if (obj.hasOwnProperty(p = "DECIMAL_PLACES")) {
                v = obj[p];
                intCheck(v, 0, MAX, p);
                DECIMAL_PLACES = v;
              }
              if (obj.hasOwnProperty(p = "ROUNDING_MODE")) {
                v = obj[p];
                intCheck(v, 0, 8, p);
                ROUNDING_MODE = v;
              }
              if (obj.hasOwnProperty(p = "EXPONENTIAL_AT")) {
                v = obj[p];
                if (v && v.pop) {
                  intCheck(v[0], -MAX, 0, p);
                  intCheck(v[1], 0, MAX, p);
                  TO_EXP_NEG = v[0];
                  TO_EXP_POS = v[1];
                } else {
                  intCheck(v, -MAX, MAX, p);
                  TO_EXP_NEG = -(TO_EXP_POS = v < 0 ? -v : v);
                }
              }
              if (obj.hasOwnProperty(p = "RANGE")) {
                v = obj[p];
                if (v && v.pop) {
                  intCheck(v[0], -MAX, -1, p);
                  intCheck(v[1], 1, MAX, p);
                  MIN_EXP = v[0];
                  MAX_EXP = v[1];
                } else {
                  intCheck(v, -MAX, MAX, p);
                  if (v) {
                    MIN_EXP = -(MAX_EXP = v < 0 ? -v : v);
                  } else {
                    throw Error(bignumberError + p + " cannot be zero: " + v);
                  }
                }
              }
              if (obj.hasOwnProperty(p = "CRYPTO")) {
                v = obj[p];
                if (v === !!v) {
                  if (v) {
                    if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
                      CRYPTO = v;
                    } else {
                      CRYPTO = !v;
                      throw Error(bignumberError + "crypto unavailable");
                    }
                  } else {
                    CRYPTO = v;
                  }
                } else {
                  throw Error(bignumberError + p + " not true or false: " + v);
                }
              }
              if (obj.hasOwnProperty(p = "MODULO_MODE")) {
                v = obj[p];
                intCheck(v, 0, 9, p);
                MODULO_MODE = v;
              }
              if (obj.hasOwnProperty(p = "POW_PRECISION")) {
                v = obj[p];
                intCheck(v, 0, MAX, p);
                POW_PRECISION = v;
              }
              if (obj.hasOwnProperty(p = "FORMAT")) {
                v = obj[p];
                if (typeof v == "object") FORMAT = v;
                else throw Error(bignumberError + p + " not an object: " + v);
              }
              if (obj.hasOwnProperty(p = "ALPHABET")) {
                v = obj[p];
                if (typeof v == "string" && !/^.?$|[+\-.\s]|(.).*\1/.test(v)) {
                  alphabetHasNormalDecimalDigits = v.slice(0, 10) == "0123456789";
                  ALPHABET = v;
                } else {
                  throw Error(bignumberError + p + " invalid: " + v);
                }
              }
            } else {
              throw Error(bignumberError + "Object expected: " + obj);
            }
          }
          return {
            DECIMAL_PLACES,
            ROUNDING_MODE,
            EXPONENTIAL_AT: [TO_EXP_NEG, TO_EXP_POS],
            RANGE: [MIN_EXP, MAX_EXP],
            CRYPTO,
            MODULO_MODE,
            POW_PRECISION,
            FORMAT,
            ALPHABET
          };
        };
        BigNumber2.isBigNumber = function(v) {
          if (!v || v._isBigNumber !== true) return false;
          if (!BigNumber2.DEBUG) return true;
          var i, n, c = v.c, e = v.e, s = v.s;
          out: if ({}.toString.call(c) == "[object Array]") {
            if ((s === 1 || s === -1) && e >= -MAX && e <= MAX && e === mathfloor(e)) {
              if (c[0] === 0) {
                if (e === 0 && c.length === 1) return true;
                break out;
              }
              i = (e + 1) % LOG_BASE;
              if (i < 1) i += LOG_BASE;
              if (String(c[0]).length == i) {
                for (i = 0; i < c.length; i++) {
                  n = c[i];
                  if (n < 0 || n >= BASE || n !== mathfloor(n)) break out;
                }
                if (n !== 0) return true;
              }
            }
          } else if (c === null && e === null && (s === null || s === 1 || s === -1)) {
            return true;
          }
          throw Error(bignumberError + "Invalid BigNumber: " + v);
        };
        BigNumber2.maximum = BigNumber2.max = function() {
          return maxOrMin(arguments, -1);
        };
        BigNumber2.minimum = BigNumber2.min = function() {
          return maxOrMin(arguments, 1);
        };
        BigNumber2.random = function() {
          var pow2_53 = 9007199254740992;
          var random53bitInt = Math.random() * pow2_53 & 2097151 ? function() {
            return mathfloor(Math.random() * pow2_53);
          } : function() {
            return (Math.random() * 1073741824 | 0) * 8388608 + (Math.random() * 8388608 | 0);
          };
          return function(dp) {
            var a, b, e, k, v, i = 0, c = [], rand = new BigNumber2(ONE);
            if (dp == null) dp = DECIMAL_PLACES;
            else intCheck(dp, 0, MAX);
            k = mathceil(dp / LOG_BASE);
            if (CRYPTO) {
              if (crypto.getRandomValues) {
                a = crypto.getRandomValues(new Uint32Array(k *= 2));
                for (; i < k; ) {
                  v = a[i] * 131072 + (a[i + 1] >>> 11);
                  if (v >= 9e15) {
                    b = crypto.getRandomValues(new Uint32Array(2));
                    a[i] = b[0];
                    a[i + 1] = b[1];
                  } else {
                    c.push(v % 1e14);
                    i += 2;
                  }
                }
                i = k / 2;
              } else if (crypto.randomBytes) {
                a = crypto.randomBytes(k *= 7);
                for (; i < k; ) {
                  v = (a[i] & 31) * 281474976710656 + a[i + 1] * 1099511627776 + a[i + 2] * 4294967296 + a[i + 3] * 16777216 + (a[i + 4] << 16) + (a[i + 5] << 8) + a[i + 6];
                  if (v >= 9e15) {
                    crypto.randomBytes(7).copy(a, i);
                  } else {
                    c.push(v % 1e14);
                    i += 7;
                  }
                }
                i = k / 7;
              } else {
                CRYPTO = false;
                throw Error(bignumberError + "crypto unavailable");
              }
            }
            if (!CRYPTO) {
              for (; i < k; ) {
                v = random53bitInt();
                if (v < 9e15) c[i++] = v % 1e14;
              }
            }
            k = c[--i];
            dp %= LOG_BASE;
            if (k && dp) {
              v = POWS_TEN[LOG_BASE - dp];
              c[i] = mathfloor(k / v) * v;
            }
            for (; c[i] === 0; c.pop(), i--) ;
            if (i < 0) {
              c = [e = 0];
            } else {
              for (e = -1; c[0] === 0; c.splice(0, 1), e -= LOG_BASE) ;
              for (i = 1, v = c[0]; v >= 10; v /= 10, i++) ;
              if (i < LOG_BASE) e -= LOG_BASE - i;
            }
            rand.e = e;
            rand.c = c;
            return rand;
          };
        }();
        BigNumber2.sum = function() {
          var i = 1, args = arguments, sum = new BigNumber2(args[0]);
          for (; i < args.length; ) sum = sum.plus(args[i++]);
          return sum;
        };
        convertBase = /* @__PURE__ */ function() {
          var decimal = "0123456789";
          function toBaseOut(str, baseIn, baseOut, alphabet) {
            var j, arr = [0], arrL, i = 0, len = str.length;
            for (; i < len; ) {
              for (arrL = arr.length; arrL--; arr[arrL] *= baseIn) ;
              arr[0] += alphabet.indexOf(str.charAt(i++));
              for (j = 0; j < arr.length; j++) {
                if (arr[j] > baseOut - 1) {
                  if (arr[j + 1] == null) arr[j + 1] = 0;
                  arr[j + 1] += arr[j] / baseOut | 0;
                  arr[j] %= baseOut;
                }
              }
            }
            return arr.reverse();
          }
          return function(str, baseIn, baseOut, sign, callerIsToString) {
            var alphabet, d, e, k, r, x, xc, y, i = str.indexOf("."), dp = DECIMAL_PLACES, rm = ROUNDING_MODE;
            if (i >= 0) {
              k = POW_PRECISION;
              POW_PRECISION = 0;
              str = str.replace(".", "");
              y = new BigNumber2(baseIn);
              x = y.pow(str.length - i);
              POW_PRECISION = k;
              y.c = toBaseOut(
                toFixedPoint(coeffToString(x.c), x.e, "0"),
                10,
                baseOut,
                decimal
              );
              y.e = y.c.length;
            }
            xc = toBaseOut(str, baseIn, baseOut, callerIsToString ? (alphabet = ALPHABET, decimal) : (alphabet = decimal, ALPHABET));
            e = k = xc.length;
            for (; xc[--k] == 0; xc.pop()) ;
            if (!xc[0]) return alphabet.charAt(0);
            if (i < 0) {
              --e;
            } else {
              x.c = xc;
              x.e = e;
              x.s = sign;
              x = div(x, y, dp, rm, baseOut);
              xc = x.c;
              r = x.r;
              e = x.e;
            }
            d = e + dp + 1;
            i = xc[d];
            k = baseOut / 2;
            r = r || d < 0 || xc[d + 1] != null;
            r = rm < 4 ? (i != null || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : i > k || i == k && (rm == 4 || r || rm == 6 && xc[d - 1] & 1 || rm == (x.s < 0 ? 8 : 7));
            if (d < 1 || !xc[0]) {
              str = r ? toFixedPoint(alphabet.charAt(1), -dp, alphabet.charAt(0)) : alphabet.charAt(0);
            } else {
              xc.length = d;
              if (r) {
                for (--baseOut; ++xc[--d] > baseOut; ) {
                  xc[d] = 0;
                  if (!d) {
                    ++e;
                    xc = [1].concat(xc);
                  }
                }
              }
              for (k = xc.length; !xc[--k]; ) ;
              for (i = 0, str = ""; i <= k; str += alphabet.charAt(xc[i++])) ;
              str = toFixedPoint(str, e, alphabet.charAt(0));
            }
            return str;
          };
        }();
        div = /* @__PURE__ */ function() {
          function multiply(x, k, base) {
            var m, temp, xlo, xhi, carry = 0, i = x.length, klo = k % SQRT_BASE, khi = k / SQRT_BASE | 0;
            for (x = x.slice(); i--; ) {
              xlo = x[i] % SQRT_BASE;
              xhi = x[i] / SQRT_BASE | 0;
              m = khi * xlo + xhi * klo;
              temp = klo * xlo + m % SQRT_BASE * SQRT_BASE + carry;
              carry = (temp / base | 0) + (m / SQRT_BASE | 0) + khi * xhi;
              x[i] = temp % base;
            }
            if (carry) x = [carry].concat(x);
            return x;
          }
          function compare2(a, b, aL, bL) {
            var i, cmp;
            if (aL != bL) {
              cmp = aL > bL ? 1 : -1;
            } else {
              for (i = cmp = 0; i < aL; i++) {
                if (a[i] != b[i]) {
                  cmp = a[i] > b[i] ? 1 : -1;
                  break;
                }
              }
            }
            return cmp;
          }
          function subtract(a, b, aL, base) {
            var i = 0;
            for (; aL--; ) {
              a[aL] -= i;
              i = a[aL] < b[aL] ? 1 : 0;
              a[aL] = i * base + a[aL] - b[aL];
            }
            for (; !a[0] && a.length > 1; a.splice(0, 1)) ;
          }
          return function(x, y, dp, rm, base) {
            var cmp, e, i, more, n, prod, prodL, q, qc, rem, remL, rem0, xi, xL, yc0, yL, yz, s = x.s == y.s ? 1 : -1, xc = x.c, yc = y.c;
            if (!xc || !xc[0] || !yc || !yc[0]) {
              return new BigNumber2(
                // Return NaN if either NaN, or both Infinity or 0.
                !x.s || !y.s || (xc ? yc && xc[0] == yc[0] : !yc) ? NaN : (
                  // Return ±0 if x is ±0 or y is ±Infinity, or return ±Infinity as y is ±0.
                  xc && xc[0] == 0 || !yc ? s * 0 : s / 0
                )
              );
            }
            q = new BigNumber2(s);
            qc = q.c = [];
            e = x.e - y.e;
            s = dp + e + 1;
            if (!base) {
              base = BASE;
              e = bitFloor(x.e / LOG_BASE) - bitFloor(y.e / LOG_BASE);
              s = s / LOG_BASE | 0;
            }
            for (i = 0; yc[i] == (xc[i] || 0); i++) ;
            if (yc[i] > (xc[i] || 0)) e--;
            if (s < 0) {
              qc.push(1);
              more = true;
            } else {
              xL = xc.length;
              yL = yc.length;
              i = 0;
              s += 2;
              n = mathfloor(base / (yc[0] + 1));
              if (n > 1) {
                yc = multiply(yc, n, base);
                xc = multiply(xc, n, base);
                yL = yc.length;
                xL = xc.length;
              }
              xi = yL;
              rem = xc.slice(0, yL);
              remL = rem.length;
              for (; remL < yL; rem[remL++] = 0) ;
              yz = yc.slice();
              yz = [0].concat(yz);
              yc0 = yc[0];
              if (yc[1] >= base / 2) yc0++;
              do {
                n = 0;
                cmp = compare2(yc, rem, yL, remL);
                if (cmp < 0) {
                  rem0 = rem[0];
                  if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
                  n = mathfloor(rem0 / yc0);
                  if (n > 1) {
                    if (n >= base) n = base - 1;
                    prod = multiply(yc, n, base);
                    prodL = prod.length;
                    remL = rem.length;
                    while (compare2(prod, rem, prodL, remL) == 1) {
                      n--;
                      subtract(prod, yL < prodL ? yz : yc, prodL, base);
                      prodL = prod.length;
                      cmp = 1;
                    }
                  } else {
                    if (n == 0) {
                      cmp = n = 1;
                    }
                    prod = yc.slice();
                    prodL = prod.length;
                  }
                  if (prodL < remL) prod = [0].concat(prod);
                  subtract(rem, prod, remL, base);
                  remL = rem.length;
                  if (cmp == -1) {
                    while (compare2(yc, rem, yL, remL) < 1) {
                      n++;
                      subtract(rem, yL < remL ? yz : yc, remL, base);
                      remL = rem.length;
                    }
                  }
                } else if (cmp === 0) {
                  n++;
                  rem = [0];
                }
                qc[i++] = n;
                if (rem[0]) {
                  rem[remL++] = xc[xi] || 0;
                } else {
                  rem = [xc[xi]];
                  remL = 1;
                }
              } while ((xi++ < xL || rem[0] != null) && s--);
              more = rem[0] != null;
              if (!qc[0]) qc.splice(0, 1);
            }
            if (base == BASE) {
              for (i = 1, s = qc[0]; s >= 10; s /= 10, i++) ;
              round(q, dp + (q.e = i + e * LOG_BASE - 1) + 1, rm, more);
            } else {
              q.e = e;
              q.r = +more;
            }
            return q;
          };
        }();
        function format(n, i, rm, id) {
          var c0, e, ne, len, str;
          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);
          if (!n.c) return n.toString();
          c0 = n.c[0];
          ne = n.e;
          if (i == null) {
            str = coeffToString(n.c);
            str = id == 1 || id == 2 && (ne <= TO_EXP_NEG || ne >= TO_EXP_POS) ? toExponential(str, ne) : toFixedPoint(str, ne, "0");
          } else {
            n = round(new BigNumber2(n), i, rm);
            e = n.e;
            str = coeffToString(n.c);
            len = str.length;
            if (id == 1 || id == 2 && (i <= e || e <= TO_EXP_NEG)) {
              for (; len < i; str += "0", len++) ;
              str = toExponential(str, e);
            } else {
              i -= ne + (id === 2 && e > ne);
              str = toFixedPoint(str, e, "0");
              if (e + 1 > len) {
                if (--i > 0) for (str += "."; i--; str += "0") ;
              } else {
                i += e - len;
                if (i > 0) {
                  if (e + 1 == len) str += ".";
                  for (; i--; str += "0") ;
                }
              }
            }
          }
          return n.s < 0 && c0 ? "-" + str : str;
        }
        function maxOrMin(args, n) {
          var k, y, i = 1, x = new BigNumber2(args[0]);
          for (; i < args.length; i++) {
            y = new BigNumber2(args[i]);
            if (!y.s || (k = compare(x, y)) === n || k === 0 && x.s === n) {
              x = y;
            }
          }
          return x;
        }
        function normalise(n, c, e) {
          var i = 1, j = c.length;
          for (; !c[--j]; c.pop()) ;
          for (j = c[0]; j >= 10; j /= 10, i++) ;
          if ((e = i + e * LOG_BASE - 1) > MAX_EXP) {
            n.c = n.e = null;
          } else if (e < MIN_EXP) {
            n.c = [n.e = 0];
          } else {
            n.e = e;
            n.c = c;
          }
          return n;
        }
        parseNumeric = /* @__PURE__ */ function() {
          var basePrefix = /^(-?)0([xbo])(?=\w[\w.]*$)/i, dotAfter = /^([^.]+)\.$/, dotBefore = /^\.([^.]+)$/, isInfinityOrNaN = /^-?(Infinity|NaN)$/, whitespaceOrPlus = /^\s*\+(?=[\w.])|^\s+|\s+$/g;
          return function(x, str, isNum, b) {
            var base, s = isNum ? str : str.replace(whitespaceOrPlus, "");
            if (isInfinityOrNaN.test(s)) {
              x.s = isNaN(s) ? null : s < 0 ? -1 : 1;
            } else {
              if (!isNum) {
                s = s.replace(basePrefix, function(m, p1, p2) {
                  base = (p2 = p2.toLowerCase()) == "x" ? 16 : p2 == "b" ? 2 : 8;
                  return !b || b == base ? p1 : m;
                });
                if (b) {
                  base = b;
                  s = s.replace(dotAfter, "$1").replace(dotBefore, "0.$1");
                }
                if (str != s) return new BigNumber2(s, base);
              }
              if (BigNumber2.DEBUG) {
                throw Error(bignumberError + "Not a" + (b ? " base " + b : "") + " number: " + str);
              }
              x.s = null;
            }
            x.c = x.e = null;
          };
        }();
        function round(x, sd, rm, r) {
          var d, i, j, k, n, ni, rd, xc = x.c, pows10 = POWS_TEN;
          if (xc) {
            out: {
              for (d = 1, k = xc[0]; k >= 10; k /= 10, d++) ;
              i = sd - d;
              if (i < 0) {
                i += LOG_BASE;
                j = sd;
                n = xc[ni = 0];
                rd = mathfloor(n / pows10[d - j - 1] % 10);
              } else {
                ni = mathceil((i + 1) / LOG_BASE);
                if (ni >= xc.length) {
                  if (r) {
                    for (; xc.length <= ni; xc.push(0)) ;
                    n = rd = 0;
                    d = 1;
                    i %= LOG_BASE;
                    j = i - LOG_BASE + 1;
                  } else {
                    break out;
                  }
                } else {
                  n = k = xc[ni];
                  for (d = 1; k >= 10; k /= 10, d++) ;
                  i %= LOG_BASE;
                  j = i - LOG_BASE + d;
                  rd = j < 0 ? 0 : mathfloor(n / pows10[d - j - 1] % 10);
                }
              }
              r = r || sd < 0 || // Are there any non-zero digits after the rounding digit?
              // The expression  n % pows10[d - j - 1]  returns all digits of n to the right
              // of the digit at j, e.g. if n is 908714 and j is 2, the expression gives 714.
              xc[ni + 1] != null || (j < 0 ? n : n % pows10[d - j - 1]);
              r = rm < 4 ? (rd || r) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || r || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
              (i > 0 ? j > 0 ? n / pows10[d - j] : 0 : xc[ni - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
              if (sd < 1 || !xc[0]) {
                xc.length = 0;
                if (r) {
                  sd -= x.e + 1;
                  xc[0] = pows10[(LOG_BASE - sd % LOG_BASE) % LOG_BASE];
                  x.e = -sd || 0;
                } else {
                  xc[0] = x.e = 0;
                }
                return x;
              }
              if (i == 0) {
                xc.length = ni;
                k = 1;
                ni--;
              } else {
                xc.length = ni + 1;
                k = pows10[LOG_BASE - i];
                xc[ni] = j > 0 ? mathfloor(n / pows10[d - j] % pows10[j]) * k : 0;
              }
              if (r) {
                for (; ; ) {
                  if (ni == 0) {
                    for (i = 1, j = xc[0]; j >= 10; j /= 10, i++) ;
                    j = xc[0] += k;
                    for (k = 1; j >= 10; j /= 10, k++) ;
                    if (i != k) {
                      x.e++;
                      if (xc[0] == BASE) xc[0] = 1;
                    }
                    break;
                  } else {
                    xc[ni] += k;
                    if (xc[ni] != BASE) break;
                    xc[ni--] = 0;
                    k = 1;
                  }
                }
              }
              for (i = xc.length; xc[--i] === 0; xc.pop()) ;
            }
            if (x.e > MAX_EXP) {
              x.c = x.e = null;
            } else if (x.e < MIN_EXP) {
              x.c = [x.e = 0];
            }
          }
          return x;
        }
        function valueOf(n) {
          var str, e = n.e;
          if (e === null) return n.toString();
          str = coeffToString(n.c);
          str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(str, e) : toFixedPoint(str, e, "0");
          return n.s < 0 ? "-" + str : str;
        }
        P.absoluteValue = P.abs = function() {
          var x = new BigNumber2(this);
          if (x.s < 0) x.s = 1;
          return x;
        };
        P.comparedTo = function(y, b) {
          return compare(this, new BigNumber2(y, b));
        };
        P.decimalPlaces = P.dp = function(dp, rm) {
          var c, n, v, x = this;
          if (dp != null) {
            intCheck(dp, 0, MAX);
            if (rm == null) rm = ROUNDING_MODE;
            else intCheck(rm, 0, 8);
            return round(new BigNumber2(x), dp + x.e + 1, rm);
          }
          if (!(c = x.c)) return null;
          n = ((v = c.length - 1) - bitFloor(this.e / LOG_BASE)) * LOG_BASE;
          if (v = c[v]) for (; v % 10 == 0; v /= 10, n--) ;
          if (n < 0) n = 0;
          return n;
        };
        P.dividedBy = P.div = function(y, b) {
          return div(this, new BigNumber2(y, b), DECIMAL_PLACES, ROUNDING_MODE);
        };
        P.dividedToIntegerBy = P.idiv = function(y, b) {
          return div(this, new BigNumber2(y, b), 0, 1);
        };
        P.exponentiatedBy = P.pow = function(n, m) {
          var half, isModExp, i, k, more, nIsBig, nIsNeg, nIsOdd, y, x = this;
          n = new BigNumber2(n);
          if (n.c && !n.isInteger()) {
            throw Error(bignumberError + "Exponent not an integer: " + valueOf(n));
          }
          if (m != null) m = new BigNumber2(m);
          nIsBig = n.e > 14;
          if (!x.c || !x.c[0] || x.c[0] == 1 && !x.e && x.c.length == 1 || !n.c || !n.c[0]) {
            y = new BigNumber2(Math.pow(+valueOf(x), nIsBig ? n.s * (2 - isOdd(n)) : +valueOf(n)));
            return m ? y.mod(m) : y;
          }
          nIsNeg = n.s < 0;
          if (m) {
            if (m.c ? !m.c[0] : !m.s) return new BigNumber2(NaN);
            isModExp = !nIsNeg && x.isInteger() && m.isInteger();
            if (isModExp) x = x.mod(m);
          } else if (n.e > 9 && (x.e > 0 || x.e < -1 || (x.e == 0 ? x.c[0] > 1 || nIsBig && x.c[1] >= 24e7 : x.c[0] < 8e13 || nIsBig && x.c[0] <= 9999975e7))) {
            k = x.s < 0 && isOdd(n) ? -0 : 0;
            if (x.e > -1) k = 1 / k;
            return new BigNumber2(nIsNeg ? 1 / k : k);
          } else if (POW_PRECISION) {
            k = mathceil(POW_PRECISION / LOG_BASE + 2);
          }
          if (nIsBig) {
            half = new BigNumber2(0.5);
            if (nIsNeg) n.s = 1;
            nIsOdd = isOdd(n);
          } else {
            i = Math.abs(+valueOf(n));
            nIsOdd = i % 2;
          }
          y = new BigNumber2(ONE);
          for (; ; ) {
            if (nIsOdd) {
              y = y.times(x);
              if (!y.c) break;
              if (k) {
                if (y.c.length > k) y.c.length = k;
              } else if (isModExp) {
                y = y.mod(m);
              }
            }
            if (i) {
              i = mathfloor(i / 2);
              if (i === 0) break;
              nIsOdd = i % 2;
            } else {
              n = n.times(half);
              round(n, n.e + 1, 1);
              if (n.e > 14) {
                nIsOdd = isOdd(n);
              } else {
                i = +valueOf(n);
                if (i === 0) break;
                nIsOdd = i % 2;
              }
            }
            x = x.times(x);
            if (k) {
              if (x.c && x.c.length > k) x.c.length = k;
            } else if (isModExp) {
              x = x.mod(m);
            }
          }
          if (isModExp) return y;
          if (nIsNeg) y = ONE.div(y);
          return m ? y.mod(m) : k ? round(y, POW_PRECISION, ROUNDING_MODE, more) : y;
        };
        P.integerValue = function(rm) {
          var n = new BigNumber2(this);
          if (rm == null) rm = ROUNDING_MODE;
          else intCheck(rm, 0, 8);
          return round(n, n.e + 1, rm);
        };
        P.isEqualTo = P.eq = function(y, b) {
          return compare(this, new BigNumber2(y, b)) === 0;
        };
        P.isFinite = function() {
          return !!this.c;
        };
        P.isGreaterThan = P.gt = function(y, b) {
          return compare(this, new BigNumber2(y, b)) > 0;
        };
        P.isGreaterThanOrEqualTo = P.gte = function(y, b) {
          return (b = compare(this, new BigNumber2(y, b))) === 1 || b === 0;
        };
        P.isInteger = function() {
          return !!this.c && bitFloor(this.e / LOG_BASE) > this.c.length - 2;
        };
        P.isLessThan = P.lt = function(y, b) {
          return compare(this, new BigNumber2(y, b)) < 0;
        };
        P.isLessThanOrEqualTo = P.lte = function(y, b) {
          return (b = compare(this, new BigNumber2(y, b))) === -1 || b === 0;
        };
        P.isNaN = function() {
          return !this.s;
        };
        P.isNegative = function() {
          return this.s < 0;
        };
        P.isPositive = function() {
          return this.s > 0;
        };
        P.isZero = function() {
          return !!this.c && this.c[0] == 0;
        };
        P.minus = function(y, b) {
          var i, j, t, xLTy, x = this, a = x.s;
          y = new BigNumber2(y, b);
          b = y.s;
          if (!a || !b) return new BigNumber2(NaN);
          if (a != b) {
            y.s = -b;
            return x.plus(y);
          }
          var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
          if (!xe || !ye) {
            if (!xc || !yc) return xc ? (y.s = -b, y) : new BigNumber2(yc ? x : NaN);
            if (!xc[0] || !yc[0]) {
              return yc[0] ? (y.s = -b, y) : new BigNumber2(xc[0] ? x : (
                // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
                ROUNDING_MODE == 3 ? -0 : 0
              ));
            }
          }
          xe = bitFloor(xe);
          ye = bitFloor(ye);
          xc = xc.slice();
          if (a = xe - ye) {
            if (xLTy = a < 0) {
              a = -a;
              t = xc;
            } else {
              ye = xe;
              t = yc;
            }
            t.reverse();
            for (b = a; b--; t.push(0)) ;
            t.reverse();
          } else {
            j = (xLTy = (a = xc.length) < (b = yc.length)) ? a : b;
            for (a = b = 0; b < j; b++) {
              if (xc[b] != yc[b]) {
                xLTy = xc[b] < yc[b];
                break;
              }
            }
          }
          if (xLTy) {
            t = xc;
            xc = yc;
            yc = t;
            y.s = -y.s;
          }
          b = (j = yc.length) - (i = xc.length);
          if (b > 0) for (; b--; xc[i++] = 0) ;
          b = BASE - 1;
          for (; j > a; ) {
            if (xc[--j] < yc[j]) {
              for (i = j; i && !xc[--i]; xc[i] = b) ;
              --xc[i];
              xc[j] += BASE;
            }
            xc[j] -= yc[j];
          }
          for (; xc[0] == 0; xc.splice(0, 1), --ye) ;
          if (!xc[0]) {
            y.s = ROUNDING_MODE == 3 ? -1 : 1;
            y.c = [y.e = 0];
            return y;
          }
          return normalise(y, xc, ye);
        };
        P.modulo = P.mod = function(y, b) {
          var q, s, x = this;
          y = new BigNumber2(y, b);
          if (!x.c || !y.s || y.c && !y.c[0]) {
            return new BigNumber2(NaN);
          } else if (!y.c || x.c && !x.c[0]) {
            return new BigNumber2(x);
          }
          if (MODULO_MODE == 9) {
            s = y.s;
            y.s = 1;
            q = div(x, y, 0, 3);
            y.s = s;
            q.s *= s;
          } else {
            q = div(x, y, 0, MODULO_MODE);
          }
          y = x.minus(q.times(y));
          if (!y.c[0] && MODULO_MODE == 1) y.s = x.s;
          return y;
        };
        P.multipliedBy = P.times = function(y, b) {
          var c, e, i, j, k, m, xcL, xlo, xhi, ycL, ylo, yhi, zc, base, sqrtBase, x = this, xc = x.c, yc = (y = new BigNumber2(y, b)).c;
          if (!xc || !yc || !xc[0] || !yc[0]) {
            if (!x.s || !y.s || xc && !xc[0] && !yc || yc && !yc[0] && !xc) {
              y.c = y.e = y.s = null;
            } else {
              y.s *= x.s;
              if (!xc || !yc) {
                y.c = y.e = null;
              } else {
                y.c = [0];
                y.e = 0;
              }
            }
            return y;
          }
          e = bitFloor(x.e / LOG_BASE) + bitFloor(y.e / LOG_BASE);
          y.s *= x.s;
          xcL = xc.length;
          ycL = yc.length;
          if (xcL < ycL) {
            zc = xc;
            xc = yc;
            yc = zc;
            i = xcL;
            xcL = ycL;
            ycL = i;
          }
          for (i = xcL + ycL, zc = []; i--; zc.push(0)) ;
          base = BASE;
          sqrtBase = SQRT_BASE;
          for (i = ycL; --i >= 0; ) {
            c = 0;
            ylo = yc[i] % sqrtBase;
            yhi = yc[i] / sqrtBase | 0;
            for (k = xcL, j = i + k; j > i; ) {
              xlo = xc[--k] % sqrtBase;
              xhi = xc[k] / sqrtBase | 0;
              m = yhi * xlo + xhi * ylo;
              xlo = ylo * xlo + m % sqrtBase * sqrtBase + zc[j] + c;
              c = (xlo / base | 0) + (m / sqrtBase | 0) + yhi * xhi;
              zc[j--] = xlo % base;
            }
            zc[j] = c;
          }
          if (c) {
            ++e;
          } else {
            zc.splice(0, 1);
          }
          return normalise(y, zc, e);
        };
        P.negated = function() {
          var x = new BigNumber2(this);
          x.s = -x.s || null;
          return x;
        };
        P.plus = function(y, b) {
          var t, x = this, a = x.s;
          y = new BigNumber2(y, b);
          b = y.s;
          if (!a || !b) return new BigNumber2(NaN);
          if (a != b) {
            y.s = -b;
            return x.minus(y);
          }
          var xe = x.e / LOG_BASE, ye = y.e / LOG_BASE, xc = x.c, yc = y.c;
          if (!xe || !ye) {
            if (!xc || !yc) return new BigNumber2(a / 0);
            if (!xc[0] || !yc[0]) return yc[0] ? y : new BigNumber2(xc[0] ? x : a * 0);
          }
          xe = bitFloor(xe);
          ye = bitFloor(ye);
          xc = xc.slice();
          if (a = xe - ye) {
            if (a > 0) {
              ye = xe;
              t = yc;
            } else {
              a = -a;
              t = xc;
            }
            t.reverse();
            for (; a--; t.push(0)) ;
            t.reverse();
          }
          a = xc.length;
          b = yc.length;
          if (a - b < 0) {
            t = yc;
            yc = xc;
            xc = t;
            b = a;
          }
          for (a = 0; b; ) {
            a = (xc[--b] = xc[b] + yc[b] + a) / BASE | 0;
            xc[b] = BASE === xc[b] ? 0 : xc[b] % BASE;
          }
          if (a) {
            xc = [a].concat(xc);
            ++ye;
          }
          return normalise(y, xc, ye);
        };
        P.precision = P.sd = function(sd, rm) {
          var c, n, v, x = this;
          if (sd != null && sd !== !!sd) {
            intCheck(sd, 1, MAX);
            if (rm == null) rm = ROUNDING_MODE;
            else intCheck(rm, 0, 8);
            return round(new BigNumber2(x), sd, rm);
          }
          if (!(c = x.c)) return null;
          v = c.length - 1;
          n = v * LOG_BASE + 1;
          if (v = c[v]) {
            for (; v % 10 == 0; v /= 10, n--) ;
            for (v = c[0]; v >= 10; v /= 10, n++) ;
          }
          if (sd && x.e + 1 > n) n = x.e + 1;
          return n;
        };
        P.shiftedBy = function(k) {
          intCheck(k, -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER);
          return this.times("1e" + k);
        };
        P.squareRoot = P.sqrt = function() {
          var m, n, r, rep, t, x = this, c = x.c, s = x.s, e = x.e, dp = DECIMAL_PLACES + 4, half = new BigNumber2("0.5");
          if (s !== 1 || !c || !c[0]) {
            return new BigNumber2(!s || s < 0 && (!c || c[0]) ? NaN : c ? x : 1 / 0);
          }
          s = Math.sqrt(+valueOf(x));
          if (s == 0 || s == 1 / 0) {
            n = coeffToString(c);
            if ((n.length + e) % 2 == 0) n += "0";
            s = Math.sqrt(+n);
            e = bitFloor((e + 1) / 2) - (e < 0 || e % 2);
            if (s == 1 / 0) {
              n = "5e" + e;
            } else {
              n = s.toExponential();
              n = n.slice(0, n.indexOf("e") + 1) + e;
            }
            r = new BigNumber2(n);
          } else {
            r = new BigNumber2(s + "");
          }
          if (r.c[0]) {
            e = r.e;
            s = e + dp;
            if (s < 3) s = 0;
            for (; ; ) {
              t = r;
              r = half.times(t.plus(div(x, t, dp, 1)));
              if (coeffToString(t.c).slice(0, s) === (n = coeffToString(r.c)).slice(0, s)) {
                if (r.e < e) --s;
                n = n.slice(s - 3, s + 1);
                if (n == "9999" || !rep && n == "4999") {
                  if (!rep) {
                    round(t, t.e + DECIMAL_PLACES + 2, 0);
                    if (t.times(t).eq(x)) {
                      r = t;
                      break;
                    }
                  }
                  dp += 4;
                  s += 4;
                  rep = 1;
                } else {
                  if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
                    round(r, r.e + DECIMAL_PLACES + 2, 1);
                    m = !r.times(r).eq(x);
                  }
                  break;
                }
              }
            }
          }
          return round(r, r.e + DECIMAL_PLACES + 1, ROUNDING_MODE, m);
        };
        P.toExponential = function(dp, rm) {
          if (dp != null) {
            intCheck(dp, 0, MAX);
            dp++;
          }
          return format(this, dp, rm, 1);
        };
        P.toFixed = function(dp, rm) {
          if (dp != null) {
            intCheck(dp, 0, MAX);
            dp = dp + this.e + 1;
          }
          return format(this, dp, rm);
        };
        P.toFormat = function(dp, rm, format2) {
          var str, x = this;
          if (format2 == null) {
            if (dp != null && rm && typeof rm == "object") {
              format2 = rm;
              rm = null;
            } else if (dp && typeof dp == "object") {
              format2 = dp;
              dp = rm = null;
            } else {
              format2 = FORMAT;
            }
          } else if (typeof format2 != "object") {
            throw Error(bignumberError + "Argument not an object: " + format2);
          }
          str = x.toFixed(dp, rm);
          if (x.c) {
            var i, arr = str.split("."), g1 = +format2.groupSize, g2 = +format2.secondaryGroupSize, groupSeparator = format2.groupSeparator || "", intPart = arr[0], fractionPart = arr[1], isNeg = x.s < 0, intDigits = isNeg ? intPart.slice(1) : intPart, len = intDigits.length;
            if (g2) {
              i = g1;
              g1 = g2;
              g2 = i;
              len -= i;
            }
            if (g1 > 0 && len > 0) {
              i = len % g1 || g1;
              intPart = intDigits.substr(0, i);
              for (; i < len; i += g1) intPart += groupSeparator + intDigits.substr(i, g1);
              if (g2 > 0) intPart += groupSeparator + intDigits.slice(i);
              if (isNeg) intPart = "-" + intPart;
            }
            str = fractionPart ? intPart + (format2.decimalSeparator || "") + ((g2 = +format2.fractionGroupSize) ? fractionPart.replace(
              new RegExp("\\d{" + g2 + "}\\B", "g"),
              "$&" + (format2.fractionGroupSeparator || "")
            ) : fractionPart) : intPart;
          }
          return (format2.prefix || "") + str + (format2.suffix || "");
        };
        P.toFraction = function(md) {
          var d, d0, d1, d2, e, exp, n, n0, n1, q, r, s, x = this, xc = x.c;
          if (md != null) {
            n = new BigNumber2(md);
            if (!n.isInteger() && (n.c || n.s !== 1) || n.lt(ONE)) {
              throw Error(bignumberError + "Argument " + (n.isInteger() ? "out of range: " : "not an integer: ") + valueOf(n));
            }
          }
          if (!xc) return new BigNumber2(x);
          d = new BigNumber2(ONE);
          n1 = d0 = new BigNumber2(ONE);
          d1 = n0 = new BigNumber2(ONE);
          s = coeffToString(xc);
          e = d.e = s.length - x.e - 1;
          d.c[0] = POWS_TEN[(exp = e % LOG_BASE) < 0 ? LOG_BASE + exp : exp];
          md = !md || n.comparedTo(d) > 0 ? e > 0 ? d : n1 : n;
          exp = MAX_EXP;
          MAX_EXP = 1 / 0;
          n = new BigNumber2(s);
          n0.c[0] = 0;
          for (; ; ) {
            q = div(n, d, 0, 1);
            d2 = d0.plus(q.times(d1));
            if (d2.comparedTo(md) == 1) break;
            d0 = d1;
            d1 = d2;
            n1 = n0.plus(q.times(d2 = n1));
            n0 = d2;
            d = n.minus(q.times(d2 = d));
            n = d2;
          }
          d2 = div(md.minus(d0), d1, 0, 1);
          n0 = n0.plus(d2.times(n1));
          d0 = d0.plus(d2.times(d1));
          n0.s = n1.s = x.s;
          e = e * 2;
          r = div(n1, d1, e, ROUNDING_MODE).minus(x).abs().comparedTo(
            div(n0, d0, e, ROUNDING_MODE).minus(x).abs()
          ) < 1 ? [n1, d1] : [n0, d0];
          MAX_EXP = exp;
          return r;
        };
        P.toNumber = function() {
          return +valueOf(this);
        };
        P.toPrecision = function(sd, rm) {
          if (sd != null) intCheck(sd, 1, MAX);
          return format(this, sd, rm, 2);
        };
        P.toString = function(b) {
          var str, n = this, s = n.s, e = n.e;
          if (e === null) {
            if (s) {
              str = "Infinity";
              if (s < 0) str = "-" + str;
            } else {
              str = "NaN";
            }
          } else {
            if (b == null) {
              str = e <= TO_EXP_NEG || e >= TO_EXP_POS ? toExponential(coeffToString(n.c), e) : toFixedPoint(coeffToString(n.c), e, "0");
            } else if (b === 10 && alphabetHasNormalDecimalDigits) {
              n = round(new BigNumber2(n), DECIMAL_PLACES + e + 1, ROUNDING_MODE);
              str = toFixedPoint(coeffToString(n.c), n.e, "0");
            } else {
              intCheck(b, 2, ALPHABET.length, "Base");
              str = convertBase(toFixedPoint(coeffToString(n.c), e, "0"), 10, b, s, true);
            }
            if (s < 0 && n.c[0]) str = "-" + str;
          }
          return str;
        };
        P.valueOf = P.toJSON = function() {
          return valueOf(this);
        };
        P._isBigNumber = true;
        if (configObject != null) BigNumber2.set(configObject);
        return BigNumber2;
      }
      function bitFloor(n) {
        var i = n | 0;
        return n > 0 || n === i ? i : i - 1;
      }
      function coeffToString(a) {
        var s, z, i = 1, j = a.length, r = a[0] + "";
        for (; i < j; ) {
          s = a[i++] + "";
          z = LOG_BASE - s.length;
          for (; z--; s = "0" + s) ;
          r += s;
        }
        for (j = r.length; r.charCodeAt(--j) === 48; ) ;
        return r.slice(0, j + 1 || 1);
      }
      function compare(x, y) {
        var a, b, xc = x.c, yc = y.c, i = x.s, j = y.s, k = x.e, l = y.e;
        if (!i || !j) return null;
        a = xc && !xc[0];
        b = yc && !yc[0];
        if (a || b) return a ? b ? 0 : -j : i;
        if (i != j) return i;
        a = i < 0;
        b = k == l;
        if (!xc || !yc) return b ? 0 : !xc ^ a ? 1 : -1;
        if (!b) return k > l ^ a ? 1 : -1;
        j = (k = xc.length) < (l = yc.length) ? k : l;
        for (i = 0; i < j; i++) if (xc[i] != yc[i]) return xc[i] > yc[i] ^ a ? 1 : -1;
        return k == l ? 0 : k > l ^ a ? 1 : -1;
      }
      function intCheck(n, min, max, name) {
        if (n < min || n > max || n !== mathfloor(n)) {
          throw Error(bignumberError + (name || "Argument") + (typeof n == "number" ? n < min || n > max ? " out of range: " : " not an integer: " : " not a primitive number: ") + String(n));
        }
      }
      function isOdd(n) {
        var k = n.c.length - 1;
        return bitFloor(n.e / LOG_BASE) == k && n.c[k] % 2 != 0;
      }
      function toExponential(str, e) {
        return (str.length > 1 ? str.charAt(0) + "." + str.slice(1) : str) + (e < 0 ? "e" : "e+") + e;
      }
      function toFixedPoint(str, e, z) {
        var len, zs;
        if (e < 0) {
          for (zs = z + "."; ++e; zs += z) ;
          str = zs + str;
        } else {
          len = str.length;
          if (++e > len) {
            for (zs = z, e -= len; --e; zs += z) ;
            str += zs;
          } else if (e < len) {
            str = str.slice(0, e) + "." + str.slice(e);
          }
        }
        return str;
      }
      BigNumber = clone();
      BigNumber["default"] = BigNumber.BigNumber = BigNumber;
      if (typeof define == "function" && define.amd) {
        define(function() {
          return BigNumber;
        });
      } else if (typeof module != "undefined" && module.exports) {
        module.exports = BigNumber;
      } else {
        if (!globalObject) {
          globalObject = typeof self != "undefined" && self ? self : window;
        }
        globalObject.BigNumber = BigNumber;
      }
    })(exports);
  }
});

// node_modules/json-bigint/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/json-bigint/lib/stringify.js"(exports, module) {
    var BigNumber = require_bignumber();
    var JSON2 = module.exports;
    (function() {
      "use strict";
      function f(n) {
        return n < 10 ? "0" + n : n;
      }
      var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
        // table of character substitutions
        "\b": "\\b",
        "	": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
      }, rep;
      function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
          var c = meta[a];
          return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
      }
      function str(key, holder) {
        var i, k, v, length, mind = gap, partial, value = holder[key], isBigNumber = value != null && (value instanceof BigNumber || BigNumber.isBigNumber(value));
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
          value = value.toJSON(key);
        }
        if (typeof rep === "function") {
          value = rep.call(holder, key, value);
        }
        switch (typeof value) {
          case "string":
            if (isBigNumber) {
              return value;
            } else {
              return quote(value);
            }
          case "number":
            return isFinite(value) ? String(value) : "null";
          case "boolean":
          case "null":
          case "bigint":
            return String(value);
          case "object":
            if (!value) {
              return "null";
            }
            gap += indent;
            partial = [];
            if (Object.prototype.toString.apply(value) === "[object Array]") {
              length = value.length;
              for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || "null";
              }
              v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
              gap = mind;
              return v;
            }
            if (rep && typeof rep === "object") {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                if (typeof rep[i] === "string") {
                  k = rep[i];
                  v = str(k, value);
                  if (v) {
                    partial.push(quote(k) + (gap ? ": " : ":") + v);
                  }
                }
              }
            } else {
              Object.keys(value).forEach(function(k2) {
                var v2 = str(k2, value);
                if (v2) {
                  partial.push(quote(k2) + (gap ? ": " : ":") + v2);
                }
              });
            }
            v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
      }
      if (typeof JSON2.stringify !== "function") {
        JSON2.stringify = function(value, replacer, space) {
          var i;
          gap = "";
          indent = "";
          if (typeof space === "number") {
            for (i = 0; i < space; i += 1) {
              indent += " ";
            }
          } else if (typeof space === "string") {
            indent = space;
          }
          rep = replacer;
          if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
            throw new Error("JSON.stringify");
          }
          return str("", { "": value });
        };
      }
    })();
  }
});

// node_modules/json-bigint/lib/parse.js
var require_parse = __commonJS({
  "node_modules/json-bigint/lib/parse.js"(exports, module) {
    var BigNumber = null;
    var suspectProtoRx = /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
    var suspectConstructorRx = /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;
    var json_parse = function(options) {
      "use strict";
      var _options = {
        strict: false,
        // not being strict means do not generate syntax errors for "duplicate key"
        storeAsString: false,
        // toggles whether the values should be stored as BigNumber (default) or a string
        alwaysParseAsBig: false,
        // toggles whether all numbers should be Big
        useNativeBigInt: false,
        // toggles whether to use native BigInt instead of bignumber.js
        protoAction: "error",
        constructorAction: "error"
      };
      if (options !== void 0 && options !== null) {
        if (options.strict === true) {
          _options.strict = true;
        }
        if (options.storeAsString === true) {
          _options.storeAsString = true;
        }
        _options.alwaysParseAsBig = options.alwaysParseAsBig === true ? options.alwaysParseAsBig : false;
        _options.useNativeBigInt = options.useNativeBigInt === true ? options.useNativeBigInt : false;
        if (typeof options.constructorAction !== "undefined") {
          if (options.constructorAction === "error" || options.constructorAction === "ignore" || options.constructorAction === "preserve") {
            _options.constructorAction = options.constructorAction;
          } else {
            throw new Error(
              `Incorrect value for constructorAction option, must be "error", "ignore" or undefined but passed ${options.constructorAction}`
            );
          }
        }
        if (typeof options.protoAction !== "undefined") {
          if (options.protoAction === "error" || options.protoAction === "ignore" || options.protoAction === "preserve") {
            _options.protoAction = options.protoAction;
          } else {
            throw new Error(
              `Incorrect value for protoAction option, must be "error", "ignore" or undefined but passed ${options.protoAction}`
            );
          }
        }
      }
      var at, ch, escapee = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "	"
      }, text, error = function(m) {
        throw {
          name: "SyntaxError",
          message: m,
          at,
          text
        };
      }, next = function(c) {
        if (c && c !== ch) {
          error("Expected '" + c + "' instead of '" + ch + "'");
        }
        ch = text.charAt(at);
        at += 1;
        return ch;
      }, number = function() {
        var number2, string2 = "";
        if (ch === "-") {
          string2 = "-";
          next("-");
        }
        while (ch >= "0" && ch <= "9") {
          string2 += ch;
          next();
        }
        if (ch === ".") {
          string2 += ".";
          while (next() && ch >= "0" && ch <= "9") {
            string2 += ch;
          }
        }
        if (ch === "e" || ch === "E") {
          string2 += ch;
          next();
          if (ch === "-" || ch === "+") {
            string2 += ch;
            next();
          }
          while (ch >= "0" && ch <= "9") {
            string2 += ch;
            next();
          }
        }
        number2 = +string2;
        if (!isFinite(number2)) {
          error("Bad number");
        } else {
          if (BigNumber == null) BigNumber = require_bignumber();
          if (string2.length > 15)
            return _options.storeAsString ? string2 : _options.useNativeBigInt ? BigInt(string2) : new BigNumber(string2);
          else
            return !_options.alwaysParseAsBig ? number2 : _options.useNativeBigInt ? BigInt(number2) : new BigNumber(number2);
        }
      }, string = function() {
        var hex, i, string2 = "", uffff;
        if (ch === '"') {
          var startAt = at;
          while (next()) {
            if (ch === '"') {
              if (at - 1 > startAt) string2 += text.substring(startAt, at - 1);
              next();
              return string2;
            }
            if (ch === "\\") {
              if (at - 1 > startAt) string2 += text.substring(startAt, at - 1);
              next();
              if (ch === "u") {
                uffff = 0;
                for (i = 0; i < 4; i += 1) {
                  hex = parseInt(next(), 16);
                  if (!isFinite(hex)) {
                    break;
                  }
                  uffff = uffff * 16 + hex;
                }
                string2 += String.fromCharCode(uffff);
              } else if (typeof escapee[ch] === "string") {
                string2 += escapee[ch];
              } else {
                break;
              }
              startAt = at;
            }
          }
        }
        error("Bad string");
      }, white = function() {
        while (ch && ch <= " ") {
          next();
        }
      }, word = function() {
        switch (ch) {
          case "t":
            next("t");
            next("r");
            next("u");
            next("e");
            return true;
          case "f":
            next("f");
            next("a");
            next("l");
            next("s");
            next("e");
            return false;
          case "n":
            next("n");
            next("u");
            next("l");
            next("l");
            return null;
        }
        error("Unexpected '" + ch + "'");
      }, value, array = function() {
        var array2 = [];
        if (ch === "[") {
          next("[");
          white();
          if (ch === "]") {
            next("]");
            return array2;
          }
          while (ch) {
            array2.push(value());
            white();
            if (ch === "]") {
              next("]");
              return array2;
            }
            next(",");
            white();
          }
        }
        error("Bad array");
      }, object = function() {
        var key, object2 = /* @__PURE__ */ Object.create(null);
        if (ch === "{") {
          next("{");
          white();
          if (ch === "}") {
            next("}");
            return object2;
          }
          while (ch) {
            key = string();
            white();
            next(":");
            if (_options.strict === true && Object.hasOwnProperty.call(object2, key)) {
              error('Duplicate key "' + key + '"');
            }
            if (suspectProtoRx.test(key) === true) {
              if (_options.protoAction === "error") {
                error("Object contains forbidden prototype property");
              } else if (_options.protoAction === "ignore") {
                value();
              } else {
                object2[key] = value();
              }
            } else if (suspectConstructorRx.test(key) === true) {
              if (_options.constructorAction === "error") {
                error("Object contains forbidden constructor property");
              } else if (_options.constructorAction === "ignore") {
                value();
              } else {
                object2[key] = value();
              }
            } else {
              object2[key] = value();
            }
            white();
            if (ch === "}") {
              next("}");
              return object2;
            }
            next(",");
            white();
          }
        }
        error("Bad object");
      };
      value = function() {
        white();
        switch (ch) {
          case "{":
            return object();
          case "[":
            return array();
          case '"':
            return string();
          case "-":
            return number();
          default:
            return ch >= "0" && ch <= "9" ? number() : word();
        }
      };
      return function(source, reviver) {
        var result;
        text = source + "";
        at = 0;
        ch = " ";
        result = value();
        white();
        if (ch) {
          error("Syntax error");
        }
        return typeof reviver === "function" ? function walk(holder, key) {
          var k, v, value2 = holder[key];
          if (value2 && typeof value2 === "object") {
            Object.keys(value2).forEach(function(k2) {
              v = walk(value2, k2);
              if (v !== void 0) {
                value2[k2] = v;
              } else {
                delete value2[k2];
              }
            });
          }
          return reviver.call(holder, key, value2);
        }({ "": result }, "") : result;
      };
    };
    module.exports = json_parse;
  }
});

// node_modules/json-bigint/index.js
var require_json_bigint = __commonJS({
  "node_modules/json-bigint/index.js"(exports, module) {
    var json_stringify = require_stringify().stringify;
    var json_parse = require_parse();
    module.exports = function(options) {
      return {
        parse: json_parse(options),
        stringify: json_stringify
      };
    };
    module.exports.parse = json_parse();
    module.exports.stringify = json_stringify;
  }
});

// browser-external:os
var require_os = __commonJS({
  "browser-external:os"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "os" has been externalized for browser compatibility. Cannot access "os.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/gcp-metadata/build/src/gcp-residency.js
var require_gcp_residency = __commonJS({
  "node_modules/gcp-metadata/build/src/gcp-residency.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GCE_LINUX_BIOS_PATHS = void 0;
    exports.isGoogleCloudServerless = isGoogleCloudServerless;
    exports.isGoogleComputeEngineLinux = isGoogleComputeEngineLinux;
    exports.isGoogleComputeEngineMACAddress = isGoogleComputeEngineMACAddress;
    exports.isGoogleComputeEngine = isGoogleComputeEngine;
    exports.detectGCPResidency = detectGCPResidency;
    var fs_1 = require_fs();
    var os_1 = require_os();
    exports.GCE_LINUX_BIOS_PATHS = {
      BIOS_DATE: "/sys/class/dmi/id/bios_date",
      BIOS_VENDOR: "/sys/class/dmi/id/bios_vendor"
    };
    var GCE_MAC_ADDRESS_REGEX = /^42:01/;
    function isGoogleCloudServerless() {
      const isGFEnvironment = process.env.CLOUD_RUN_JOB || process.env.FUNCTION_NAME || process.env.K_SERVICE;
      return !!isGFEnvironment;
    }
    function isGoogleComputeEngineLinux() {
      if ((0, os_1.platform)() !== "linux")
        return false;
      try {
        (0, fs_1.statSync)(exports.GCE_LINUX_BIOS_PATHS.BIOS_DATE);
        const biosVendor = (0, fs_1.readFileSync)(exports.GCE_LINUX_BIOS_PATHS.BIOS_VENDOR, "utf8");
        return /Google/.test(biosVendor);
      } catch {
        return false;
      }
    }
    function isGoogleComputeEngineMACAddress() {
      const interfaces = (0, os_1.networkInterfaces)();
      for (const item of Object.values(interfaces)) {
        if (!item)
          continue;
        for (const { mac } of item) {
          if (GCE_MAC_ADDRESS_REGEX.test(mac)) {
            return true;
          }
        }
      }
      return false;
    }
    function isGoogleComputeEngine() {
      return isGoogleComputeEngineLinux() || isGoogleComputeEngineMACAddress();
    }
    function detectGCPResidency() {
      return isGoogleCloudServerless() || isGoogleComputeEngine();
    }
  }
});

// browser-external:process
var require_process = __commonJS({
  "browser-external:process"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "process" has been externalized for browser compatibility. Cannot access "process.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// browser-external:util
var require_util2 = __commonJS({
  "browser-external:util"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "util" has been externalized for browser compatibility. Cannot access "util.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/google-logging-utils/build/src/colours.js
var require_colours = __commonJS({
  "node_modules/google-logging-utils/build/src/colours.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Colours = void 0;
    var Colours = class _Colours {
      /**
       * @param stream The stream (e.g. process.stderr)
       * @returns true if the stream should have colourization enabled
       */
      static isEnabled(stream) {
        return stream && // May happen in browsers.
        stream.isTTY && (typeof stream.getColorDepth === "function" ? stream.getColorDepth() > 2 : true);
      }
      static refresh() {
        _Colours.enabled = _Colours.isEnabled(process === null || process === void 0 ? void 0 : process.stderr);
        if (!this.enabled) {
          _Colours.reset = "";
          _Colours.bright = "";
          _Colours.dim = "";
          _Colours.red = "";
          _Colours.green = "";
          _Colours.yellow = "";
          _Colours.blue = "";
          _Colours.magenta = "";
          _Colours.cyan = "";
          _Colours.white = "";
          _Colours.grey = "";
        } else {
          _Colours.reset = "\x1B[0m";
          _Colours.bright = "\x1B[1m";
          _Colours.dim = "\x1B[2m";
          _Colours.red = "\x1B[31m";
          _Colours.green = "\x1B[32m";
          _Colours.yellow = "\x1B[33m";
          _Colours.blue = "\x1B[34m";
          _Colours.magenta = "\x1B[35m";
          _Colours.cyan = "\x1B[36m";
          _Colours.white = "\x1B[37m";
          _Colours.grey = "\x1B[90m";
        }
      }
    };
    exports.Colours = Colours;
    Colours.enabled = false;
    Colours.reset = "";
    Colours.bright = "";
    Colours.dim = "";
    Colours.red = "";
    Colours.green = "";
    Colours.yellow = "";
    Colours.blue = "";
    Colours.magenta = "";
    Colours.cyan = "";
    Colours.white = "";
    Colours.grey = "";
    Colours.refresh();
  }
});

// node_modules/google-logging-utils/build/src/logging-utils.js
var require_logging_utils = __commonJS({
  "node_modules/google-logging-utils/build/src/logging-utils.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.env = exports.DebugLogBackendBase = exports.placeholder = exports.AdhocDebugLogger = exports.LogSeverity = void 0;
    exports.getNodeBackend = getNodeBackend;
    exports.getDebugBackend = getDebugBackend;
    exports.getStructuredBackend = getStructuredBackend;
    exports.setBackend = setBackend;
    exports.log = log;
    var events_1 = require_events();
    var process2 = __importStar(require_process());
    var util = __importStar(require_util2());
    var colours_1 = require_colours();
    var LogSeverity;
    (function(LogSeverity2) {
      LogSeverity2["DEFAULT"] = "DEFAULT";
      LogSeverity2["DEBUG"] = "DEBUG";
      LogSeverity2["INFO"] = "INFO";
      LogSeverity2["WARNING"] = "WARNING";
      LogSeverity2["ERROR"] = "ERROR";
    })(LogSeverity || (exports.LogSeverity = LogSeverity = {}));
    var AdhocDebugLogger = class extends events_1.EventEmitter {
      /**
       * @param upstream The backend will pass a function that will be
       *   called whenever our logger function is invoked.
       */
      constructor(namespace, upstream) {
        super();
        this.namespace = namespace;
        this.upstream = upstream;
        this.func = Object.assign(this.invoke.bind(this), {
          // Also add an instance pointer back to us.
          instance: this,
          // And pull over the EventEmitter functionality.
          on: (event, listener) => this.on(event, listener)
        });
        this.func.debug = (...args) => this.invokeSeverity(LogSeverity.DEBUG, ...args);
        this.func.info = (...args) => this.invokeSeverity(LogSeverity.INFO, ...args);
        this.func.warn = (...args) => this.invokeSeverity(LogSeverity.WARNING, ...args);
        this.func.error = (...args) => this.invokeSeverity(LogSeverity.ERROR, ...args);
        this.func.sublog = (namespace2) => log(namespace2, this.func);
      }
      invoke(fields, ...args) {
        if (this.upstream) {
          try {
            this.upstream(fields, ...args);
          } catch (e) {
          }
        }
        try {
          this.emit("log", fields, args);
        } catch (e) {
        }
      }
      invokeSeverity(severity, ...args) {
        this.invoke({ severity }, ...args);
      }
    };
    exports.AdhocDebugLogger = AdhocDebugLogger;
    exports.placeholder = new AdhocDebugLogger("", () => {
    }).func;
    var DebugLogBackendBase = class {
      constructor() {
        var _a;
        this.cached = /* @__PURE__ */ new Map();
        this.filters = [];
        this.filtersSet = false;
        let nodeFlag = (_a = process2.env[exports.env.nodeEnables]) !== null && _a !== void 0 ? _a : "*";
        if (nodeFlag === "all") {
          nodeFlag = "*";
        }
        this.filters = nodeFlag.split(",");
      }
      log(namespace, fields, ...args) {
        try {
          if (!this.filtersSet) {
            this.setFilters();
            this.filtersSet = true;
          }
          let logger = this.cached.get(namespace);
          if (!logger) {
            logger = this.makeLogger(namespace);
            this.cached.set(namespace, logger);
          }
          logger(fields, ...args);
        } catch (e) {
          console.error(e);
        }
      }
    };
    exports.DebugLogBackendBase = DebugLogBackendBase;
    var NodeBackend = class extends DebugLogBackendBase {
      constructor() {
        super(...arguments);
        this.enabledRegexp = /.*/g;
      }
      isEnabled(namespace) {
        return this.enabledRegexp.test(namespace);
      }
      makeLogger(namespace) {
        if (!this.enabledRegexp.test(namespace)) {
          return () => {
          };
        }
        return (fields, ...args) => {
          var _a;
          const nscolour = `${colours_1.Colours.green}${namespace}${colours_1.Colours.reset}`;
          const pid = `${colours_1.Colours.yellow}${process2.pid}${colours_1.Colours.reset}`;
          let level;
          switch (fields.severity) {
            case LogSeverity.ERROR:
              level = `${colours_1.Colours.red}${fields.severity}${colours_1.Colours.reset}`;
              break;
            case LogSeverity.INFO:
              level = `${colours_1.Colours.magenta}${fields.severity}${colours_1.Colours.reset}`;
              break;
            case LogSeverity.WARNING:
              level = `${colours_1.Colours.yellow}${fields.severity}${colours_1.Colours.reset}`;
              break;
            default:
              level = (_a = fields.severity) !== null && _a !== void 0 ? _a : LogSeverity.DEFAULT;
              break;
          }
          const msg = util.formatWithOptions({ colors: colours_1.Colours.enabled }, ...args);
          const filteredFields = Object.assign({}, fields);
          delete filteredFields.severity;
          const fieldsJson = Object.getOwnPropertyNames(filteredFields).length ? JSON.stringify(filteredFields) : "";
          const fieldsColour = fieldsJson ? `${colours_1.Colours.grey}${fieldsJson}${colours_1.Colours.reset}` : "";
          console.error("%s [%s|%s] %s%s", pid, nscolour, level, msg, fieldsJson ? ` ${fieldsColour}` : "");
        };
      }
      // Regexp patterns below are from here:
      // https://github.com/nodejs/node/blob/c0aebed4b3395bd65d54b18d1fd00f071002ac20/lib/internal/util/debuglog.js#L36
      setFilters() {
        const totalFilters = this.filters.join(",");
        const regexp = totalFilters.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^");
        this.enabledRegexp = new RegExp(`^${regexp}$`, "i");
      }
    };
    function getNodeBackend() {
      return new NodeBackend();
    }
    var DebugBackend = class extends DebugLogBackendBase {
      constructor(pkg) {
        super();
        this.debugPkg = pkg;
      }
      makeLogger(namespace) {
        const debugLogger = this.debugPkg(namespace);
        return (fields, ...args) => {
          debugLogger(args[0], ...args.slice(1));
        };
      }
      setFilters() {
        var _a;
        const existingFilters = (_a = process2.env["NODE_DEBUG"]) !== null && _a !== void 0 ? _a : "";
        process2.env["NODE_DEBUG"] = `${existingFilters}${existingFilters ? "," : ""}${this.filters.join(",")}`;
      }
    };
    function getDebugBackend(debugPkg) {
      return new DebugBackend(debugPkg);
    }
    var StructuredBackend = class extends DebugLogBackendBase {
      constructor(upstream) {
        var _a;
        super();
        this.upstream = (_a = upstream) !== null && _a !== void 0 ? _a : void 0;
      }
      makeLogger(namespace) {
        var _a;
        const debugLogger = (_a = this.upstream) === null || _a === void 0 ? void 0 : _a.makeLogger(namespace);
        return (fields, ...args) => {
          var _a2;
          const severity = (_a2 = fields.severity) !== null && _a2 !== void 0 ? _a2 : LogSeverity.INFO;
          const json = Object.assign({
            severity,
            message: util.format(...args)
          }, fields);
          const jsonString = JSON.stringify(json);
          if (debugLogger) {
            debugLogger(fields, jsonString);
          } else {
            console.log("%s", jsonString);
          }
        };
      }
      setFilters() {
        var _a;
        (_a = this.upstream) === null || _a === void 0 ? void 0 : _a.setFilters();
      }
    };
    function getStructuredBackend(upstream) {
      return new StructuredBackend(upstream);
    }
    exports.env = {
      /**
       * Filter wildcards specific to the Node syntax, and similar to the built-in
       * utils.debuglog() environment variable. If missing, disables logging.
       */
      nodeEnables: "GOOGLE_SDK_NODE_LOGGING"
    };
    var loggerCache = /* @__PURE__ */ new Map();
    var cachedBackend = void 0;
    function setBackend(backend) {
      cachedBackend = backend;
      loggerCache.clear();
    }
    function log(namespace, parent) {
      if (!cachedBackend) {
        const enablesFlag = process2.env[exports.env.nodeEnables];
        if (!enablesFlag) {
          return exports.placeholder;
        }
      }
      if (!namespace) {
        return exports.placeholder;
      }
      if (parent) {
        namespace = `${parent.instance.namespace}:${namespace}`;
      }
      const existing = loggerCache.get(namespace);
      if (existing) {
        return existing.func;
      }
      if (cachedBackend === null) {
        return exports.placeholder;
      } else if (cachedBackend === void 0) {
        cachedBackend = getNodeBackend();
      }
      const logger = (() => {
        let previousBackend = void 0;
        const newLogger = new AdhocDebugLogger(namespace, (fields, ...args) => {
          if (previousBackend !== cachedBackend) {
            if (cachedBackend === null) {
              return;
            } else if (cachedBackend === void 0) {
              cachedBackend = getNodeBackend();
            }
            previousBackend = cachedBackend;
          }
          cachedBackend === null || cachedBackend === void 0 ? void 0 : cachedBackend.log(namespace, fields, ...args);
        });
        return newLogger;
      })();
      loggerCache.set(namespace, logger);
      return logger.func;
    }
  }
});

// node_modules/google-logging-utils/build/src/index.js
var require_src4 = __commonJS({
  "node_modules/google-logging-utils/build/src/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_logging_utils(), exports);
  }
});

// node_modules/gcp-metadata/build/src/index.js
var require_src5 = __commonJS({
  "node_modules/gcp-metadata/build/src/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
      var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o2) {
          var ar = [];
          for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
          return ar;
        };
        return ownKeys(o);
      };
      return function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        }
        __setModuleDefault(result, mod);
        return result;
      };
    }();
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gcpResidencyCache = exports.METADATA_SERVER_DETECTION = exports.HEADERS = exports.HEADER_VALUE = exports.HEADER_NAME = exports.SECONDARY_HOST_ADDRESS = exports.HOST_ADDRESS = exports.BASE_PATH = void 0;
    exports.instance = instance;
    exports.project = project;
    exports.universe = universe;
    exports.bulk = bulk;
    exports.isAvailable = isAvailable;
    exports.resetIsAvailableCache = resetIsAvailableCache;
    exports.getGCPResidency = getGCPResidency;
    exports.setGCPResidency = setGCPResidency;
    exports.requestTimeout = requestTimeout;
    var gaxios_1 = require_src3();
    var jsonBigint = require_json_bigint();
    var gcp_residency_1 = require_gcp_residency();
    var logger = __importStar(require_src4());
    exports.BASE_PATH = "/computeMetadata/v1";
    exports.HOST_ADDRESS = "http://169.254.169.254";
    exports.SECONDARY_HOST_ADDRESS = "http://metadata.google.internal.";
    exports.HEADER_NAME = "Metadata-Flavor";
    exports.HEADER_VALUE = "Google";
    exports.HEADERS = Object.freeze({ [exports.HEADER_NAME]: exports.HEADER_VALUE });
    var log = logger.log("gcp-metadata");
    exports.METADATA_SERVER_DETECTION = Object.freeze({
      "assume-present": "don't try to ping the metadata server, but assume it's present",
      none: "don't try to ping the metadata server, but don't try to use it either",
      "bios-only": "treat the result of a BIOS probe as canonical (don't fall back to pinging)",
      "ping-only": "skip the BIOS probe, and go straight to pinging"
    });
    function getBaseUrl(baseUrl) {
      if (!baseUrl) {
        baseUrl = process.env.GCE_METADATA_IP || process.env.GCE_METADATA_HOST || exports.HOST_ADDRESS;
      }
      if (!/^https?:\/\//.test(baseUrl)) {
        baseUrl = `http://${baseUrl}`;
      }
      return new URL(exports.BASE_PATH, baseUrl).href;
    }
    function validate(options) {
      Object.keys(options).forEach((key) => {
        switch (key) {
          case "params":
          case "property":
          case "headers":
            break;
          case "qs":
            throw new Error("'qs' is not a valid configuration option. Please use 'params' instead.");
          default:
            throw new Error(`'${key}' is not a valid configuration option.`);
        }
      });
    }
    async function metadataAccessor(type, options = {}, noResponseRetries = 3, fastFail = false) {
      const headers = new Headers(exports.HEADERS);
      let metadataKey = "";
      let params = {};
      if (typeof type === "object") {
        const metadataAccessor2 = type;
        new Headers(metadataAccessor2.headers).forEach((value, key) => headers.set(key, value));
        metadataKey = metadataAccessor2.metadataKey;
        params = metadataAccessor2.params || params;
        noResponseRetries = metadataAccessor2.noResponseRetries || noResponseRetries;
        fastFail = metadataAccessor2.fastFail || fastFail;
      } else {
        metadataKey = type;
      }
      if (typeof options === "string") {
        metadataKey += `/${options}`;
      } else {
        validate(options);
        if (options.property) {
          metadataKey += `/${options.property}`;
        }
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
        params = options.params || params;
      }
      const requestMethod = fastFail ? fastFailMetadataRequest : gaxios_1.request;
      const req = {
        url: `${getBaseUrl()}/${metadataKey}`,
        headers,
        retryConfig: { noResponseRetries },
        params,
        responseType: "text",
        timeout: requestTimeout()
      };
      log.info("instance request %j", req);
      const res = await requestMethod(req);
      log.info("instance metadata is %s", res.data);
      const metadataFlavor = res.headers.get(exports.HEADER_NAME);
      if (metadataFlavor !== exports.HEADER_VALUE) {
        throw new RangeError(`Invalid response from metadata service: incorrect ${exports.HEADER_NAME} header. Expected '${exports.HEADER_VALUE}', got ${metadataFlavor ? `'${metadataFlavor}'` : "no header"}`);
      }
      if (typeof res.data === "string") {
        try {
          return jsonBigint.parse(res.data);
        } catch {
        }
      }
      return res.data;
    }
    async function fastFailMetadataRequest(options) {
      var _a;
      const secondaryOptions = {
        ...options,
        url: (_a = options.url) == null ? void 0 : _a.toString().replace(getBaseUrl(), getBaseUrl(exports.SECONDARY_HOST_ADDRESS))
      };
      const r1 = (0, gaxios_1.request)(options);
      const r2 = (0, gaxios_1.request)(secondaryOptions);
      return Promise.any([r1, r2]);
    }
    function instance(options) {
      return metadataAccessor("instance", options);
    }
    function project(options) {
      return metadataAccessor("project", options);
    }
    function universe(options) {
      return metadataAccessor("universe", options);
    }
    async function bulk(properties) {
      const r = {};
      await Promise.all(properties.map((item) => {
        return (async () => {
          const res = await metadataAccessor(item);
          const key = item.metadataKey;
          r[key] = res;
        })();
      }));
      return r;
    }
    function detectGCPAvailableRetries() {
      return process.env.DETECT_GCP_RETRIES ? Number(process.env.DETECT_GCP_RETRIES) : 0;
    }
    var cachedIsAvailableResponse;
    async function isAvailable() {
      if (process.env.METADATA_SERVER_DETECTION) {
        const value = process.env.METADATA_SERVER_DETECTION.trim().toLocaleLowerCase();
        if (!(value in exports.METADATA_SERVER_DETECTION)) {
          throw new RangeError(`Unknown \`METADATA_SERVER_DETECTION\` env variable. Got \`${value}\`, but it should be \`${Object.keys(exports.METADATA_SERVER_DETECTION).join("`, `")}\`, or unset`);
        }
        switch (value) {
          case "assume-present":
            return true;
          case "none":
            return false;
          case "bios-only":
            return getGCPResidency();
          case "ping-only":
        }
      }
      try {
        if (cachedIsAvailableResponse === void 0) {
          cachedIsAvailableResponse = metadataAccessor(
            "instance",
            void 0,
            detectGCPAvailableRetries(),
            // If the default HOST_ADDRESS has been overridden, we should not
            // make an effort to try SECONDARY_HOST_ADDRESS (as we are likely in
            // a non-GCP environment):
            !(process.env.GCE_METADATA_IP || process.env.GCE_METADATA_HOST)
          );
        }
        await cachedIsAvailableResponse;
        return true;
      } catch (e) {
        const err = e;
        if (process.env.DEBUG_AUTH) {
          console.info(err);
        }
        if (err.type === "request-timeout") {
          return false;
        }
        if (err.response && err.response.status === 404) {
          return false;
        } else {
          if (!(err.response && err.response.status === 404) && // A warning is emitted if we see an unexpected err.code, or err.code
          // is not populated:
          (!err.code || ![
            "EHOSTDOWN",
            "EHOSTUNREACH",
            "ENETUNREACH",
            "ENOENT",
            "ENOTFOUND",
            "ECONNREFUSED"
          ].includes(err.code.toString()))) {
            let code = "UNKNOWN";
            if (err.code)
              code = err.code.toString();
            process.emitWarning(`received unexpected error = ${err.message} code = ${code}`, "MetadataLookupWarning");
          }
          return false;
        }
      }
    }
    function resetIsAvailableCache() {
      cachedIsAvailableResponse = void 0;
    }
    exports.gcpResidencyCache = null;
    function getGCPResidency() {
      if (exports.gcpResidencyCache === null) {
        setGCPResidency();
      }
      return exports.gcpResidencyCache;
    }
    function setGCPResidency(value = null) {
      exports.gcpResidencyCache = value !== null ? value : (0, gcp_residency_1.detectGCPResidency)();
    }
    function requestTimeout() {
      return getGCPResidency() ? 0 : 3e3;
    }
    __exportStar(require_gcp_residency(), exports);
  }
});

// browser-external:path
var require_path = __commonJS({
  "browser-external:path"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "path" has been externalized for browser compatibility. Cannot access "path.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/google-auth-library/build/src/crypto/shared.js
var require_shared = __commonJS({
  "node_modules/google-auth-library/build/src/crypto/shared.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromArrayBufferToHex = fromArrayBufferToHex;
    function fromArrayBufferToHex(arrayBuffer) {
      const byteArray = Array.from(new Uint8Array(arrayBuffer));
      return byteArray.map((byte) => {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    }
  }
});

// node_modules/google-auth-library/build/src/crypto/browser/crypto.js
var require_crypto2 = __commonJS({
  "node_modules/google-auth-library/build/src/crypto/browser/crypto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserCrypto = void 0;
    var base64js = require_base64_js();
    var shared_1 = require_shared();
    var BrowserCrypto = class _BrowserCrypto {
      constructor() {
        if (typeof window === "undefined" || window.crypto === void 0 || window.crypto.subtle === void 0) {
          throw new Error("SubtleCrypto not found. Make sure it's an https:// website.");
        }
      }
      async sha256DigestBase64(str) {
        const inputBuffer = new TextEncoder().encode(str);
        const outputBuffer = await window.crypto.subtle.digest("SHA-256", inputBuffer);
        return base64js.fromByteArray(new Uint8Array(outputBuffer));
      }
      randomBytesBase64(count) {
        const array = new Uint8Array(count);
        window.crypto.getRandomValues(array);
        return base64js.fromByteArray(array);
      }
      static padBase64(base64) {
        while (base64.length % 4 !== 0) {
          base64 += "=";
        }
        return base64;
      }
      async verify(pubkey, data, signature) {
        const algo = {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
        const dataArray = new TextEncoder().encode(data);
        const signatureArray = base64js.toByteArray(_BrowserCrypto.padBase64(signature));
        const cryptoKey = await window.crypto.subtle.importKey("jwk", pubkey, algo, true, ["verify"]);
        const result = await window.crypto.subtle.verify(algo, cryptoKey, signatureArray, dataArray);
        return result;
      }
      async sign(privateKey, data) {
        const algo = {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
        const dataArray = new TextEncoder().encode(data);
        const cryptoKey = await window.crypto.subtle.importKey("jwk", privateKey, algo, true, ["sign"]);
        const result = await window.crypto.subtle.sign(algo, cryptoKey, dataArray);
        return base64js.fromByteArray(new Uint8Array(result));
      }
      decodeBase64StringUtf8(base64) {
        const uint8array = base64js.toByteArray(_BrowserCrypto.padBase64(base64));
        const result = new TextDecoder().decode(uint8array);
        return result;
      }
      encodeBase64StringUtf8(text) {
        const uint8array = new TextEncoder().encode(text);
        const result = base64js.fromByteArray(uint8array);
        return result;
      }
      /**
       * Computes the SHA-256 hash of the provided string.
       * @param str The plain text string to hash.
       * @return A promise that resolves with the SHA-256 hash of the provided
       *   string in hexadecimal encoding.
       */
      async sha256DigestHex(str) {
        const inputBuffer = new TextEncoder().encode(str);
        const outputBuffer = await window.crypto.subtle.digest("SHA-256", inputBuffer);
        return (0, shared_1.fromArrayBufferToHex)(outputBuffer);
      }
      /**
       * Computes the HMAC hash of a message using the provided crypto key and the
       * SHA-256 algorithm.
       * @param key The secret crypto key in utf-8 or ArrayBuffer format.
       * @param msg The plain text message.
       * @return A promise that resolves with the HMAC-SHA256 hash in ArrayBuffer
       *   format.
       */
      async signWithHmacSha256(key, msg) {
        const rawKey = typeof key === "string" ? key : String.fromCharCode(...new Uint16Array(key));
        const enc = new TextEncoder();
        const cryptoKey = await window.crypto.subtle.importKey("raw", enc.encode(rawKey), {
          name: "HMAC",
          hash: {
            name: "SHA-256"
          }
        }, false, ["sign"]);
        return window.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
      }
    };
    exports.BrowserCrypto = BrowserCrypto;
  }
});

// node_modules/google-auth-library/build/src/crypto/node/crypto.js
var require_crypto3 = __commonJS({
  "node_modules/google-auth-library/build/src/crypto/node/crypto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeCrypto = void 0;
    var crypto2 = require_crypto();
    var NodeCrypto = class {
      async sha256DigestBase64(str) {
        return crypto2.createHash("sha256").update(str).digest("base64");
      }
      randomBytesBase64(count) {
        return crypto2.randomBytes(count).toString("base64");
      }
      async verify(pubkey, data, signature) {
        const verifier = crypto2.createVerify("RSA-SHA256");
        verifier.update(data);
        verifier.end();
        return verifier.verify(pubkey, signature, "base64");
      }
      async sign(privateKey, data) {
        const signer = crypto2.createSign("RSA-SHA256");
        signer.update(data);
        signer.end();
        return signer.sign(privateKey, "base64");
      }
      decodeBase64StringUtf8(base64) {
        return Buffer.from(base64, "base64").toString("utf-8");
      }
      encodeBase64StringUtf8(text) {
        return Buffer.from(text, "utf-8").toString("base64");
      }
      /**
       * Computes the SHA-256 hash of the provided string.
       * @param str The plain text string to hash.
       * @return A promise that resolves with the SHA-256 hash of the provided
       *   string in hexadecimal encoding.
       */
      async sha256DigestHex(str) {
        return crypto2.createHash("sha256").update(str).digest("hex");
      }
      /**
       * Computes the HMAC hash of a message using the provided crypto key and the
       * SHA-256 algorithm.
       * @param key The secret crypto key in utf-8 or ArrayBuffer format.
       * @param msg The plain text message.
       * @return A promise that resolves with the HMAC-SHA256 hash in ArrayBuffer
       *   format.
       */
      async signWithHmacSha256(key, msg) {
        const cryptoKey = typeof key === "string" ? key : toBuffer(key);
        return toArrayBuffer(crypto2.createHmac("sha256", cryptoKey).update(msg).digest());
      }
    };
    exports.NodeCrypto = NodeCrypto;
    function toArrayBuffer(buffer) {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
    function toBuffer(arrayBuffer) {
      return Buffer.from(arrayBuffer);
    }
  }
});

// node_modules/google-auth-library/build/src/crypto/crypto.js
var require_crypto4 = __commonJS({
  "node_modules/google-auth-library/build/src/crypto/crypto.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createCrypto = createCrypto;
    exports.hasBrowserCrypto = hasBrowserCrypto;
    var crypto_1 = require_crypto2();
    var crypto_2 = require_crypto3();
    __exportStar(require_shared(), exports);
    function createCrypto() {
      if (hasBrowserCrypto()) {
        return new crypto_1.BrowserCrypto();
      }
      return new crypto_2.NodeCrypto();
    }
    function hasBrowserCrypto() {
      return typeof window !== "undefined" && typeof window.crypto !== "undefined" && typeof window.crypto.subtle !== "undefined";
    }
  }
});

// browser-external:querystring
var require_querystring = __commonJS({
  "browser-external:querystring"(exports, module) {
    module.exports = Object.create(new Proxy({}, {
      get(_, key) {
        if (key !== "__esModule" && key !== "__proto__" && key !== "constructor" && key !== "splice") {
          console.warn(`Module "querystring" has been externalized for browser compatibility. Cannot access "querystring.${key}" in client code. See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.`);
        }
      }
    }));
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = require_buffer();
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer2.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/google-auth-library/build/src/util.js
var require_util3 = __commonJS({
  "node_modules/google-auth-library/build/src/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LRUCache = void 0;
    exports.snakeToCamel = snakeToCamel;
    exports.originalOrCamelOptions = originalOrCamelOptions;
    exports.removeUndefinedValuesInObject = removeUndefinedValuesInObject;
    exports.isValidFile = isValidFile;
    exports.getWellKnownCertificateConfigFileLocation = getWellKnownCertificateConfigFileLocation;
    var fs = require_fs();
    var os = require_os();
    var path = require_path();
    var WELL_KNOWN_CERTIFICATE_CONFIG_FILE = "certificate_config.json";
    var CLOUDSDK_CONFIG_DIRECTORY = "gcloud";
    function snakeToCamel(str) {
      return str.replace(/([_][^_])/g, (match) => match.slice(1).toUpperCase());
    }
    function originalOrCamelOptions(obj) {
      function get(key) {
        const o = obj || {};
        return o[key] ?? o[snakeToCamel(key)];
      }
      return { get };
    }
    var _cache, _LRUCache_instances, moveToEnd_fn, evict_fn;
    var LRUCache = class {
      constructor(options) {
        __privateAdd(this, _LRUCache_instances);
        __publicField(this, "capacity");
        /**
         * Maps are in order. Thus, the older item is the first item.
         *
         * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map}
         */
        __privateAdd(this, _cache, /* @__PURE__ */ new Map());
        __publicField(this, "maxAge");
        this.capacity = options.capacity;
        this.maxAge = options.maxAge;
      }
      /**
       * Add an item to the cache.
       *
       * @param key the key to upsert
       * @param value the value of the key
       */
      set(key, value) {
        __privateMethod(this, _LRUCache_instances, moveToEnd_fn).call(this, key, value);
        __privateMethod(this, _LRUCache_instances, evict_fn).call(this);
      }
      /**
       * Get an item from the cache.
       *
       * @param key the key to retrieve
       */
      get(key) {
        const item = __privateGet(this, _cache).get(key);
        if (!item)
          return;
        __privateMethod(this, _LRUCache_instances, moveToEnd_fn).call(this, key, item.value);
        __privateMethod(this, _LRUCache_instances, evict_fn).call(this);
        return item.value;
      }
    };
    _cache = new WeakMap();
    _LRUCache_instances = new WeakSet();
    /**
     * Moves the key to the end of the cache.
     *
     * @param key the key to move
     * @param value the value of the key
     */
    moveToEnd_fn = function(key, value) {
      __privateGet(this, _cache).delete(key);
      __privateGet(this, _cache).set(key, {
        value,
        lastAccessed: Date.now()
      });
    };
    /**
     * Maintain the cache based on capacity and TTL.
     */
    evict_fn = function() {
      const cutoffDate = this.maxAge ? Date.now() - this.maxAge : 0;
      let oldestItem = __privateGet(this, _cache).entries().next();
      while (!oldestItem.done && (__privateGet(this, _cache).size > this.capacity || // too many
      oldestItem.value[1].lastAccessed < cutoffDate)) {
        __privateGet(this, _cache).delete(oldestItem.value[0]);
        oldestItem = __privateGet(this, _cache).entries().next();
      }
    };
    exports.LRUCache = LRUCache;
    function removeUndefinedValuesInObject(object) {
      Object.entries(object).forEach(([key, value]) => {
        if (value === void 0 || value === "undefined") {
          delete object[key];
        }
      });
      return object;
    }
    async function isValidFile(filePath) {
      try {
        const stats = await fs.promises.lstat(filePath);
        return stats.isFile();
      } catch (e) {
        return false;
      }
    }
    function getWellKnownCertificateConfigFileLocation() {
      const configDir = process.env.CLOUDSDK_CONFIG || (_isWindows() ? path.join(process.env.APPDATA || "", CLOUDSDK_CONFIG_DIRECTORY) : path.join(process.env.HOME || "", ".config", CLOUDSDK_CONFIG_DIRECTORY));
      return path.join(configDir, WELL_KNOWN_CERTIFICATE_CONFIG_FILE);
    }
    function _isWindows() {
      return os.platform().startsWith("win");
    }
  }
});

// node_modules/google-auth-library/package.json
var require_package2 = __commonJS({
  "node_modules/google-auth-library/package.json"(exports, module) {
    module.exports = {
      name: "google-auth-library",
      version: "10.2.1",
      author: "Google Inc.",
      description: "Google APIs Authentication Client Library for Node.js",
      engines: {
        node: ">=18"
      },
      main: "./build/src/index.js",
      types: "./build/src/index.d.ts",
      repository: "googleapis/google-auth-library-nodejs.git",
      keywords: [
        "google",
        "api",
        "google apis",
        "client",
        "client library"
      ],
      dependencies: {
        "base64-js": "^1.3.0",
        "ecdsa-sig-formatter": "^1.0.11",
        gaxios: "^7.0.0",
        "gcp-metadata": "^7.0.0",
        "google-logging-utils": "^1.0.0",
        gtoken: "^8.0.0",
        jws: "^4.0.0"
      },
      devDependencies: {
        "@types/base64-js": "^1.2.5",
        "@types/jws": "^3.1.0",
        "@types/mocha": "^10.0.10",
        "@types/mv": "^2.1.0",
        "@types/ncp": "^2.0.1",
        "@types/node": "^22.0.0",
        "@types/sinon": "^17.0.0",
        "assert-rejects": "^1.0.0",
        c8: "^10.0.0",
        codecov: "^3.0.2",
        gts: "^6.0.0",
        "is-docker": "^3.0.0",
        jsdoc: "^4.0.0",
        "jsdoc-fresh": "^4.0.0",
        "jsdoc-region-tag": "^3.0.0",
        karma: "^6.0.0",
        "karma-chrome-launcher": "^3.0.0",
        "karma-coverage": "^2.0.0",
        "karma-firefox-launcher": "^2.0.0",
        "karma-mocha": "^2.0.0",
        "karma-sourcemap-loader": "^0.4.0",
        "karma-webpack": "^5.0.1",
        keypair: "^1.0.4",
        linkinator: "^6.1.2",
        mocha: "^11.1.0",
        mv: "^2.1.1",
        ncp: "^2.0.0",
        nock: "14.0.5",
        "null-loader": "^4.0.0",
        puppeteer: "^24.0.0",
        sinon: "^21.0.0",
        "ts-loader": "^8.0.0",
        typescript: "5.8.2",
        webpack: "^5.21.2",
        "webpack-cli": "^4.0.0"
      },
      files: [
        "build/src",
        "!build/src/**/*.map"
      ],
      scripts: {
        test: "c8 mocha build/test",
        clean: "gts clean",
        prepare: "npm run compile",
        lint: "gts check --no-inline-config",
        compile: "tsc -p .",
        fix: "gts fix",
        pretest: "npm run compile -- --sourceMap",
        docs: "jsdoc -c .jsdoc.js",
        "samples-setup": "cd samples/ && npm link ../ && npm run setup && cd ../",
        "samples-test": "cd samples/ && npm link ../ && npm test && cd ../",
        "system-test": "mocha build/system-test --timeout 60000",
        "presystem-test": "npm run compile -- --sourceMap",
        webpack: "webpack",
        "browser-test": "karma start",
        "docs-test": "linkinator docs",
        "predocs-test": "npm run docs",
        prelint: "cd samples; npm link ../; npm install"
      },
      license: "Apache-2.0"
    };
  }
});

// node_modules/google-auth-library/build/src/shared.cjs
var require_shared2 = __commonJS({
  "node_modules/google-auth-library/build/src/shared.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USER_AGENT = exports.PRODUCT_NAME = exports.pkg = void 0;
    var pkg = require_package2();
    exports.pkg = pkg;
    var PRODUCT_NAME = "google-api-nodejs-client";
    exports.PRODUCT_NAME = PRODUCT_NAME;
    var USER_AGENT = `${PRODUCT_NAME}/${pkg.version}`;
    exports.USER_AGENT = USER_AGENT;
  }
});

// node_modules/google-auth-library/build/src/auth/authclient.js
var require_authclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/authclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthClient = exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS = exports.DEFAULT_UNIVERSE = void 0;
    var events_1 = require_events();
    var gaxios_1 = require_src3();
    var util_1 = require_util3();
    var google_logging_utils_1 = require_src4();
    var shared_cjs_1 = require_shared2();
    exports.DEFAULT_UNIVERSE = "googleapis.com";
    exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS = 5 * 60 * 1e3;
    var _AuthClient = class _AuthClient extends events_1.EventEmitter {
      constructor(opts = {}) {
        super();
        __publicField(this, "apiKey");
        __publicField(this, "projectId");
        /**
         * The quota project ID. The quota project can be used by client libraries for the billing purpose.
         * See {@link https://cloud.google.com/docs/quota Working with quotas}
         */
        __publicField(this, "quotaProjectId");
        /**
         * The {@link Gaxios `Gaxios`} instance used for making requests.
         */
        __publicField(this, "transporter");
        __publicField(this, "credentials", {});
        __publicField(this, "eagerRefreshThresholdMillis", exports.DEFAULT_EAGER_REFRESH_THRESHOLD_MILLIS);
        __publicField(this, "forceRefreshOnFailure", false);
        __publicField(this, "universeDomain", exports.DEFAULT_UNIVERSE);
        const options = (0, util_1.originalOrCamelOptions)(opts);
        this.apiKey = opts.apiKey;
        this.projectId = options.get("project_id") ?? null;
        this.quotaProjectId = options.get("quota_project_id");
        this.credentials = options.get("credentials") ?? {};
        this.universeDomain = options.get("universe_domain") ?? exports.DEFAULT_UNIVERSE;
        this.transporter = opts.transporter ?? new gaxios_1.Gaxios(opts.transporterOptions);
        if (options.get("useAuthRequestParameters") !== false) {
          this.transporter.interceptors.request.add(_AuthClient.DEFAULT_REQUEST_INTERCEPTOR);
          this.transporter.interceptors.response.add(_AuthClient.DEFAULT_RESPONSE_INTERCEPTOR);
        }
        if (opts.eagerRefreshThresholdMillis) {
          this.eagerRefreshThresholdMillis = opts.eagerRefreshThresholdMillis;
        }
        this.forceRefreshOnFailure = opts.forceRefreshOnFailure ?? false;
      }
      /**
       * A {@link fetch `fetch`} compliant API for {@link AuthClient}.
       *
       * @see {@link AuthClient.request} for the classic method.
       *
       * @remarks
       *
       * This is useful as a drop-in replacement for `fetch` API usage.
       *
       * @example
       *
       * ```ts
       * const authClient = new AuthClient();
       * const fetchWithAuthClient: typeof fetch = (...args) => authClient.fetch(...args);
       * await fetchWithAuthClient('https://example.com');
       * ```
       *
       * @param args `fetch` API or {@link Gaxios.fetch `Gaxios#fetch`} parameters
       * @returns the {@link GaxiosResponse} with Gaxios-added properties
       */
      fetch(...args) {
        const input = args[0];
        const init = args[1];
        let url = void 0;
        const headers = new Headers();
        if (typeof input === "string") {
          url = new URL(input);
        } else if (input instanceof URL) {
          url = input;
        } else if (input && input.url) {
          url = new URL(input.url);
        }
        if (input && typeof input === "object" && "headers" in input) {
          gaxios_1.Gaxios.mergeHeaders(headers, input.headers);
        }
        if (init) {
          gaxios_1.Gaxios.mergeHeaders(headers, new Headers(init.headers));
        }
        if (typeof input === "object" && !(input instanceof URL)) {
          return this.request({ ...init, ...input, headers, url });
        } else {
          return this.request({ ...init, headers, url });
        }
      }
      /**
       * Sets the auth credentials.
       */
      setCredentials(credentials) {
        this.credentials = credentials;
      }
      /**
       * Append additional headers, e.g., x-goog-user-project, shared across the
       * classes inheriting AuthClient. This method should be used by any method
       * that overrides getRequestMetadataAsync(), which is a shared helper for
       * setting request information in both gRPC and HTTP API calls.
       *
       * @param headers object to append additional headers to.
       */
      addSharedMetadataHeaders(headers) {
        if (!headers.has("x-goog-user-project") && // don't override a value the user sets.
        this.quotaProjectId) {
          headers.set("x-goog-user-project", this.quotaProjectId);
        }
        return headers;
      }
      /**
       * Adds the `x-goog-user-project` and `authorization` headers to the target Headers
       * object, if they exist on the source.
       *
       * @param target the headers to target
       * @param source the headers to source from
       * @returns the target headers
       */
      addUserProjectAndAuthHeaders(target, source) {
        const xGoogUserProject = source.get("x-goog-user-project");
        const authorizationHeader = source.get("authorization");
        if (xGoogUserProject) {
          target.set("x-goog-user-project", xGoogUserProject);
        }
        if (authorizationHeader) {
          target.set("authorization", authorizationHeader);
        }
        return target;
      }
      /**
       * Sets the method name that is making a Gaxios request, so that logging may tag
       * log lines with the operation.
       * @param config A Gaxios request config
       * @param methodName The method name making the call
       */
      static setMethodName(config, methodName) {
        try {
          const symbols = config;
          symbols[_AuthClient.RequestMethodNameSymbol] = methodName;
        } catch (e) {
        }
      }
      /**
       * Retry config for Auth-related requests.
       *
       * @remarks
       *
       * This is not a part of the default {@link AuthClient.transporter transporter/gaxios}
       * config as some downstream APIs would prefer if customers explicitly enable retries,
       * such as GCS.
       */
      static get RETRY_CONFIG() {
        return {
          retry: true,
          retryConfig: {
            httpMethodsToRetry: ["GET", "PUT", "POST", "HEAD", "OPTIONS", "DELETE"]
          }
        };
      }
    };
    /**
     * Symbols that can be added to GaxiosOptions to specify the method name that is
     * making an RPC call, for logging purposes, as well as a string ID that can be
     * used to correlate calls and responses.
     */
    __publicField(_AuthClient, "RequestMethodNameSymbol", Symbol("request method name"));
    __publicField(_AuthClient, "RequestLogIdSymbol", Symbol("request log id"));
    __publicField(_AuthClient, "log", (0, google_logging_utils_1.log)("auth"));
    __publicField(_AuthClient, "DEFAULT_REQUEST_INTERCEPTOR", {
      resolved: async (config) => {
        if (!config.headers.has("x-goog-api-client")) {
          const nodeVersion = process.version.replace(/^v/, "");
          config.headers.set("x-goog-api-client", `gl-node/${nodeVersion}`);
        }
        const userAgent = config.headers.get("User-Agent");
        if (!userAgent) {
          config.headers.set("User-Agent", shared_cjs_1.USER_AGENT);
        } else if (!userAgent.includes(`${shared_cjs_1.PRODUCT_NAME}/`)) {
          config.headers.set("User-Agent", `${userAgent} ${shared_cjs_1.USER_AGENT}`);
        }
        try {
          const symbols = config;
          const methodName = symbols[_AuthClient.RequestMethodNameSymbol];
          const logId = `${Math.floor(Math.random() * 1e3)}`;
          symbols[_AuthClient.RequestLogIdSymbol] = logId;
          const logObject = {
            url: config.url,
            headers: config.headers
          };
          if (methodName) {
            _AuthClient.log.info("%s [%s] request %j", methodName, logId, logObject);
          } else {
            _AuthClient.log.info("[%s] request %j", logId, logObject);
          }
        } catch (e) {
        }
        return config;
      }
    });
    __publicField(_AuthClient, "DEFAULT_RESPONSE_INTERCEPTOR", {
      resolved: async (response) => {
        try {
          const symbols = response.config;
          const methodName = symbols[_AuthClient.RequestMethodNameSymbol];
          const logId = symbols[_AuthClient.RequestLogIdSymbol];
          if (methodName) {
            _AuthClient.log.info("%s [%s] response %j", methodName, logId, response.data);
          } else {
            _AuthClient.log.info("[%s] response %j", logId, response.data);
          }
        } catch (e) {
        }
        return response;
      },
      rejected: async (error) => {
        var _a, _b;
        try {
          const symbols = error.config;
          const methodName = symbols[_AuthClient.RequestMethodNameSymbol];
          const logId = symbols[_AuthClient.RequestLogIdSymbol];
          if (methodName) {
            _AuthClient.log.info("%s [%s] error %j", methodName, logId, (_a = error.response) == null ? void 0 : _a.data);
          } else {
            _AuthClient.log.error("[%s] error %j", logId, (_b = error.response) == null ? void 0 : _b.data);
          }
        } catch (e) {
        }
        throw error;
      }
    });
    var AuthClient = _AuthClient;
    exports.AuthClient = AuthClient;
  }
});

// node_modules/google-auth-library/build/src/auth/loginticket.js
var require_loginticket = __commonJS({
  "node_modules/google-auth-library/build/src/auth/loginticket.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoginTicket = void 0;
    var LoginTicket = class {
      /**
       * Create a simple class to extract user ID from an ID Token
       *
       * @param {string} env Envelope of the jwt
       * @param {TokenPayload} pay Payload of the jwt
       * @constructor
       */
      constructor(env, pay) {
        __publicField(this, "envelope");
        __publicField(this, "payload");
        this.envelope = env;
        this.payload = pay;
      }
      getEnvelope() {
        return this.envelope;
      }
      getPayload() {
        return this.payload;
      }
      /**
       * Create a simple class to extract user ID from an ID Token
       *
       * @return The user ID
       */
      getUserId() {
        const payload = this.getPayload();
        if (payload && payload.sub) {
          return payload.sub;
        }
        return null;
      }
      /**
       * Returns attributes from the login ticket.  This can contain
       * various information about the user session.
       *
       * @return The envelope and payload
       */
      getAttributes() {
        return { envelope: this.getEnvelope(), payload: this.getPayload() };
      }
    };
    exports.LoginTicket = LoginTicket;
  }
});

// node_modules/google-auth-library/build/src/auth/oauth2client.js
var require_oauth2client = __commonJS({
  "node_modules/google-auth-library/build/src/auth/oauth2client.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OAuth2Client = exports.ClientAuthentication = exports.CertificateFormat = exports.CodeChallengeMethod = void 0;
    var gaxios_1 = require_src3();
    var querystring = require_querystring();
    var stream = require_stream();
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util_1 = require_util3();
    var crypto_1 = require_crypto4();
    var authclient_1 = require_authclient();
    var loginticket_1 = require_loginticket();
    var CodeChallengeMethod;
    (function(CodeChallengeMethod2) {
      CodeChallengeMethod2["Plain"] = "plain";
      CodeChallengeMethod2["S256"] = "S256";
    })(CodeChallengeMethod || (exports.CodeChallengeMethod = CodeChallengeMethod = {}));
    var CertificateFormat;
    (function(CertificateFormat2) {
      CertificateFormat2["PEM"] = "PEM";
      CertificateFormat2["JWK"] = "JWK";
    })(CertificateFormat || (exports.CertificateFormat = CertificateFormat = {}));
    var ClientAuthentication;
    (function(ClientAuthentication2) {
      ClientAuthentication2["ClientSecretPost"] = "ClientSecretPost";
      ClientAuthentication2["ClientSecretBasic"] = "ClientSecretBasic";
      ClientAuthentication2["None"] = "None";
    })(ClientAuthentication || (exports.ClientAuthentication = ClientAuthentication = {}));
    var _OAuth2Client = class _OAuth2Client extends authclient_1.AuthClient {
      /**
       * An OAuth2 Client for Google APIs.
       *
       * @param options The OAuth2 Client Options. Passing an `clientId` directly is **@DEPRECATED**.
       * @param clientSecret **@DEPRECATED**. Provide a {@link OAuth2ClientOptions `OAuth2ClientOptions`} object in the first parameter instead.
       * @param redirectUri **@DEPRECATED**. Provide a {@link OAuth2ClientOptions `OAuth2ClientOptions`} object in the first parameter instead.
       */
      constructor(options = {}, clientSecret, redirectUri) {
        var _a;
        super(typeof options === "object" ? options : {});
        __publicField(this, "redirectUri");
        __publicField(this, "certificateCache", {});
        __publicField(this, "certificateExpiry", null);
        __publicField(this, "certificateCacheFormat", CertificateFormat.PEM);
        __publicField(this, "refreshTokenPromises", /* @__PURE__ */ new Map());
        __publicField(this, "endpoints");
        __publicField(this, "issuers");
        __publicField(this, "clientAuthentication");
        // TODO: refactor tests to make this private
        __publicField(this, "_clientId");
        // TODO: refactor tests to make this private
        __publicField(this, "_clientSecret");
        __publicField(this, "refreshHandler");
        if (typeof options !== "object") {
          options = {
            clientId: options,
            clientSecret,
            redirectUri
          };
        }
        this._clientId = options.clientId || options.client_id;
        this._clientSecret = options.clientSecret || options.client_secret;
        this.redirectUri = options.redirectUri || ((_a = options.redirect_uris) == null ? void 0 : _a[0]);
        this.endpoints = {
          tokenInfoUrl: "https://oauth2.googleapis.com/tokeninfo",
          oauth2AuthBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
          oauth2TokenUrl: "https://oauth2.googleapis.com/token",
          oauth2RevokeUrl: "https://oauth2.googleapis.com/revoke",
          oauth2FederatedSignonPemCertsUrl: "https://www.googleapis.com/oauth2/v1/certs",
          oauth2FederatedSignonJwkCertsUrl: "https://www.googleapis.com/oauth2/v3/certs",
          oauth2IapPublicKeyUrl: "https://www.gstatic.com/iap/verify/public_key",
          ...options.endpoints
        };
        this.clientAuthentication = options.clientAuthentication || ClientAuthentication.ClientSecretPost;
        this.issuers = options.issuers || [
          "accounts.google.com",
          "https://accounts.google.com",
          this.universeDomain
        ];
      }
      /**
       * Generates URL for consent page landing.
       * @param opts Options.
       * @return URL to consent page.
       */
      generateAuthUrl(opts = {}) {
        if (opts.code_challenge_method && !opts.code_challenge) {
          throw new Error("If a code_challenge_method is provided, code_challenge must be included.");
        }
        opts.response_type = opts.response_type || "code";
        opts.client_id = opts.client_id || this._clientId;
        opts.redirect_uri = opts.redirect_uri || this.redirectUri;
        if (Array.isArray(opts.scope)) {
          opts.scope = opts.scope.join(" ");
        }
        const rootUrl = this.endpoints.oauth2AuthBaseUrl.toString();
        return rootUrl + "?" + querystring.stringify(opts);
      }
      generateCodeVerifier() {
        throw new Error("generateCodeVerifier is removed, please use generateCodeVerifierAsync instead.");
      }
      /**
       * Convenience method to automatically generate a code_verifier, and its
       * resulting SHA256. If used, this must be paired with a S256
       * code_challenge_method.
       *
       * For a full example see:
       * https://github.com/googleapis/google-auth-library-nodejs/blob/main/samples/oauth2-codeVerifier.js
       */
      async generateCodeVerifierAsync() {
        const crypto2 = (0, crypto_1.createCrypto)();
        const randomString = crypto2.randomBytesBase64(96);
        const codeVerifier = randomString.replace(/\+/g, "~").replace(/=/g, "_").replace(/\//g, "-");
        const unencodedCodeChallenge = await crypto2.sha256DigestBase64(codeVerifier);
        const codeChallenge = unencodedCodeChallenge.split("=")[0].replace(/\+/g, "-").replace(/\//g, "_");
        return { codeVerifier, codeChallenge };
      }
      getToken(codeOrOptions, callback) {
        const options = typeof codeOrOptions === "string" ? { code: codeOrOptions } : codeOrOptions;
        if (callback) {
          this.getTokenAsync(options).then((r) => callback(null, r.tokens, r.res), (e) => callback(e, null, e.response));
        } else {
          return this.getTokenAsync(options);
        }
      }
      async getTokenAsync(options) {
        const url = this.endpoints.oauth2TokenUrl.toString();
        const headers = new Headers();
        const values = {
          client_id: options.client_id || this._clientId,
          code_verifier: options.codeVerifier,
          code: options.code,
          grant_type: "authorization_code",
          redirect_uri: options.redirect_uri || this.redirectUri
        };
        if (this.clientAuthentication === ClientAuthentication.ClientSecretBasic) {
          const basic = Buffer.from(`${this._clientId}:${this._clientSecret}`);
          headers.set("authorization", `Basic ${basic.toString("base64")}`);
        }
        if (this.clientAuthentication === ClientAuthentication.ClientSecretPost) {
          values.client_secret = this._clientSecret;
        }
        const opts = {
          ..._OAuth2Client.RETRY_CONFIG,
          method: "POST",
          url,
          data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(values)),
          headers
        };
        authclient_1.AuthClient.setMethodName(opts, "getTokenAsync");
        const res = await this.transporter.request(opts);
        const tokens = res.data;
        if (res.data && res.data.expires_in) {
          tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + res.data.expires_in * 1e3;
          delete tokens.expires_in;
        }
        this.emit("tokens", tokens);
        return { tokens, res };
      }
      /**
       * Refreshes the access token.
       * @param refresh_token Existing refresh token.
       * @private
       */
      async refreshToken(refreshToken) {
        if (!refreshToken) {
          return this.refreshTokenNoCache(refreshToken);
        }
        if (this.refreshTokenPromises.has(refreshToken)) {
          return this.refreshTokenPromises.get(refreshToken);
        }
        const p = this.refreshTokenNoCache(refreshToken).then((r) => {
          this.refreshTokenPromises.delete(refreshToken);
          return r;
        }, (e) => {
          this.refreshTokenPromises.delete(refreshToken);
          throw e;
        });
        this.refreshTokenPromises.set(refreshToken, p);
        return p;
      }
      async refreshTokenNoCache(refreshToken) {
        var _a;
        if (!refreshToken) {
          throw new Error("No refresh token is set.");
        }
        const url = this.endpoints.oauth2TokenUrl.toString();
        const data = {
          refresh_token: refreshToken,
          client_id: this._clientId,
          client_secret: this._clientSecret,
          grant_type: "refresh_token"
        };
        let res;
        try {
          const opts = {
            ..._OAuth2Client.RETRY_CONFIG,
            method: "POST",
            url,
            data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(data))
          };
          authclient_1.AuthClient.setMethodName(opts, "refreshTokenNoCache");
          res = await this.transporter.request(opts);
        } catch (e) {
          if (e instanceof gaxios_1.GaxiosError && e.message === "invalid_grant" && ((_a = e.response) == null ? void 0 : _a.data) && /ReAuth/i.test(e.response.data.error_description)) {
            e.message = JSON.stringify(e.response.data);
          }
          throw e;
        }
        const tokens = res.data;
        if (res.data && res.data.expires_in) {
          tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + res.data.expires_in * 1e3;
          delete tokens.expires_in;
        }
        this.emit("tokens", tokens);
        return { tokens, res };
      }
      refreshAccessToken(callback) {
        if (callback) {
          this.refreshAccessTokenAsync().then((r) => callback(null, r.credentials, r.res), callback);
        } else {
          return this.refreshAccessTokenAsync();
        }
      }
      async refreshAccessTokenAsync() {
        const r = await this.refreshToken(this.credentials.refresh_token);
        const tokens = r.tokens;
        tokens.refresh_token = this.credentials.refresh_token;
        this.credentials = tokens;
        return { credentials: this.credentials, res: r.res };
      }
      getAccessToken(callback) {
        if (callback) {
          this.getAccessTokenAsync().then((r) => callback(null, r.token, r.res), callback);
        } else {
          return this.getAccessTokenAsync();
        }
      }
      async getAccessTokenAsync() {
        const shouldRefresh = !this.credentials.access_token || this.isTokenExpiring();
        if (shouldRefresh) {
          if (!this.credentials.refresh_token) {
            if (this.refreshHandler) {
              const refreshedAccessToken = await this.processAndValidateRefreshHandler();
              if (refreshedAccessToken == null ? void 0 : refreshedAccessToken.access_token) {
                this.setCredentials(refreshedAccessToken);
                return { token: this.credentials.access_token };
              }
            } else {
              throw new Error("No refresh token or refresh handler callback is set.");
            }
          }
          const r = await this.refreshAccessTokenAsync();
          if (!r.credentials || r.credentials && !r.credentials.access_token) {
            throw new Error("Could not refresh access token.");
          }
          return { token: r.credentials.access_token, res: r.res };
        } else {
          return { token: this.credentials.access_token };
        }
      }
      /**
       * The main authentication interface.  It takes an optional url which when
       * present is the endpoint being accessed, and returns a Promise which
       * resolves with authorization header fields.
       *
       * In OAuth2Client, the result has the form:
       * { authorization: 'Bearer <access_token_value>' }
       */
      async getRequestHeaders(url) {
        const headers = (await this.getRequestMetadataAsync(url)).headers;
        return headers;
      }
      async getRequestMetadataAsync(url) {
        url;
        const thisCreds = this.credentials;
        if (!thisCreds.access_token && !thisCreds.refresh_token && !this.apiKey && !this.refreshHandler) {
          throw new Error("No access, refresh token, API key or refresh handler callback is set.");
        }
        if (thisCreds.access_token && !this.isTokenExpiring()) {
          thisCreds.token_type = thisCreds.token_type || "Bearer";
          const headers2 = new Headers({
            authorization: thisCreds.token_type + " " + thisCreds.access_token
          });
          return { headers: this.addSharedMetadataHeaders(headers2) };
        }
        if (this.refreshHandler) {
          const refreshedAccessToken = await this.processAndValidateRefreshHandler();
          if (refreshedAccessToken == null ? void 0 : refreshedAccessToken.access_token) {
            this.setCredentials(refreshedAccessToken);
            const headers2 = new Headers({
              authorization: "Bearer " + this.credentials.access_token
            });
            return { headers: this.addSharedMetadataHeaders(headers2) };
          }
        }
        if (this.apiKey) {
          return { headers: new Headers({ "X-Goog-Api-Key": this.apiKey }) };
        }
        let r = null;
        let tokens = null;
        try {
          r = await this.refreshToken(thisCreds.refresh_token);
          tokens = r.tokens;
        } catch (err) {
          const e = err;
          if (e.response && (e.response.status === 403 || e.response.status === 404)) {
            e.message = `Could not refresh access token: ${e.message}`;
          }
          throw e;
        }
        const credentials = this.credentials;
        credentials.token_type = credentials.token_type || "Bearer";
        tokens.refresh_token = credentials.refresh_token;
        this.credentials = tokens;
        const headers = new Headers({
          authorization: credentials.token_type + " " + tokens.access_token
        });
        return { headers: this.addSharedMetadataHeaders(headers), res: r.res };
      }
      /**
       * Generates an URL to revoke the given token.
       * @param token The existing token to be revoked.
       *
       * @deprecated use instance method {@link OAuth2Client.getRevokeTokenURL}
       */
      static getRevokeTokenUrl(token) {
        return new _OAuth2Client().getRevokeTokenURL(token).toString();
      }
      /**
       * Generates a URL to revoke the given token.
       *
       * @param token The existing token to be revoked.
       */
      getRevokeTokenURL(token) {
        const url = new URL(this.endpoints.oauth2RevokeUrl);
        url.searchParams.append("token", token);
        return url;
      }
      revokeToken(token, callback) {
        const opts = {
          ..._OAuth2Client.RETRY_CONFIG,
          url: this.getRevokeTokenURL(token).toString(),
          method: "POST"
        };
        authclient_1.AuthClient.setMethodName(opts, "revokeToken");
        if (callback) {
          this.transporter.request(opts).then((r) => callback(null, r), callback);
        } else {
          return this.transporter.request(opts);
        }
      }
      revokeCredentials(callback) {
        if (callback) {
          this.revokeCredentialsAsync().then((res) => callback(null, res), callback);
        } else {
          return this.revokeCredentialsAsync();
        }
      }
      async revokeCredentialsAsync() {
        const token = this.credentials.access_token;
        this.credentials = {};
        if (token) {
          return this.revokeToken(token);
        } else {
          throw new Error("No access token to revoke.");
        }
      }
      request(opts, callback) {
        if (callback) {
          this.requestAsync(opts).then((r) => callback(null, r), (e) => {
            return callback(e, e.response);
          });
        } else {
          return this.requestAsync(opts);
        }
      }
      async requestAsync(opts, reAuthRetried = false) {
        try {
          const r = await this.getRequestMetadataAsync();
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
          this.addUserProjectAndAuthHeaders(opts.headers, r.headers);
          if (this.apiKey) {
            opts.headers.set("X-Goog-Api-Key", this.apiKey);
          }
          return await this.transporter.request(opts);
        } catch (e) {
          const res = e.response;
          if (res) {
            const statusCode = res.status;
            const mayRequireRefresh = this.credentials && this.credentials.access_token && this.credentials.refresh_token && (!this.credentials.expiry_date || this.forceRefreshOnFailure);
            const mayRequireRefreshWithNoRefreshToken = this.credentials && this.credentials.access_token && !this.credentials.refresh_token && (!this.credentials.expiry_date || this.forceRefreshOnFailure) && this.refreshHandler;
            const isReadableStream = res.config.data instanceof stream.Readable;
            const isAuthErr = statusCode === 401 || statusCode === 403;
            if (!reAuthRetried && isAuthErr && !isReadableStream && mayRequireRefresh) {
              await this.refreshAccessTokenAsync();
              return this.requestAsync(opts, true);
            } else if (!reAuthRetried && isAuthErr && !isReadableStream && mayRequireRefreshWithNoRefreshToken) {
              const refreshedAccessToken = await this.processAndValidateRefreshHandler();
              if (refreshedAccessToken == null ? void 0 : refreshedAccessToken.access_token) {
                this.setCredentials(refreshedAccessToken);
              }
              return this.requestAsync(opts, true);
            }
          }
          throw e;
        }
      }
      verifyIdToken(options, callback) {
        if (callback && typeof callback !== "function") {
          throw new Error("This method accepts an options object as the first parameter, which includes the idToken, audience, and maxExpiry.");
        }
        if (callback) {
          this.verifyIdTokenAsync(options).then((r) => callback(null, r), callback);
        } else {
          return this.verifyIdTokenAsync(options);
        }
      }
      async verifyIdTokenAsync(options) {
        if (!options.idToken) {
          throw new Error("The verifyIdToken method requires an ID Token");
        }
        const response = await this.getFederatedSignonCertsAsync();
        const login = await this.verifySignedJwtWithCertsAsync(options.idToken, response.certs, options.audience, this.issuers, options.maxExpiry);
        return login;
      }
      /**
       * Obtains information about the provisioned access token.  Especially useful
       * if you want to check the scopes that were provisioned to a given token.
       *
       * @param accessToken Required.  The Access Token for which you want to get
       * user info.
       */
      async getTokenInfo(accessToken) {
        const { data } = await this.transporter.request({
          ..._OAuth2Client.RETRY_CONFIG,
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            authorization: `Bearer ${accessToken}`
          },
          url: this.endpoints.tokenInfoUrl.toString()
        });
        const info = Object.assign({
          expiry_date: (/* @__PURE__ */ new Date()).getTime() + data.expires_in * 1e3,
          scopes: data.scope.split(" ")
        }, data);
        delete info.expires_in;
        delete info.scope;
        return info;
      }
      getFederatedSignonCerts(callback) {
        if (callback) {
          this.getFederatedSignonCertsAsync().then((r) => callback(null, r.certs, r.res), callback);
        } else {
          return this.getFederatedSignonCertsAsync();
        }
      }
      async getFederatedSignonCertsAsync() {
        var _a, _b;
        const nowTime = (/* @__PURE__ */ new Date()).getTime();
        const format = (0, crypto_1.hasBrowserCrypto)() ? CertificateFormat.JWK : CertificateFormat.PEM;
        if (this.certificateExpiry && nowTime < this.certificateExpiry.getTime() && this.certificateCacheFormat === format) {
          return { certs: this.certificateCache, format };
        }
        let res;
        let url;
        switch (format) {
          case CertificateFormat.PEM:
            url = this.endpoints.oauth2FederatedSignonPemCertsUrl.toString();
            break;
          case CertificateFormat.JWK:
            url = this.endpoints.oauth2FederatedSignonJwkCertsUrl.toString();
            break;
          default:
            throw new Error(`Unsupported certificate format ${format}`);
        }
        try {
          const opts = {
            ..._OAuth2Client.RETRY_CONFIG,
            url
          };
          authclient_1.AuthClient.setMethodName(opts, "getFederatedSignonCertsAsync");
          res = await this.transporter.request(opts);
        } catch (e) {
          if (e instanceof Error) {
            e.message = `Failed to retrieve verification certificates: ${e.message}`;
          }
          throw e;
        }
        const cacheControl = res == null ? void 0 : res.headers.get("cache-control");
        let cacheAge = -1;
        if (cacheControl) {
          const maxAge = (_b = (_a = /max-age=(?<maxAge>[0-9]+)/.exec(cacheControl)) == null ? void 0 : _a.groups) == null ? void 0 : _b.maxAge;
          if (maxAge) {
            cacheAge = Number(maxAge) * 1e3;
          }
        }
        let certificates = {};
        switch (format) {
          case CertificateFormat.PEM:
            certificates = res.data;
            break;
          case CertificateFormat.JWK:
            for (const key of res.data.keys) {
              certificates[key.kid] = key;
            }
            break;
          default:
            throw new Error(`Unsupported certificate format ${format}`);
        }
        const now = /* @__PURE__ */ new Date();
        this.certificateExpiry = cacheAge === -1 ? null : new Date(now.getTime() + cacheAge);
        this.certificateCache = certificates;
        this.certificateCacheFormat = format;
        return { certs: certificates, format, res };
      }
      getIapPublicKeys(callback) {
        if (callback) {
          this.getIapPublicKeysAsync().then((r) => callback(null, r.pubkeys, r.res), callback);
        } else {
          return this.getIapPublicKeysAsync();
        }
      }
      async getIapPublicKeysAsync() {
        let res;
        const url = this.endpoints.oauth2IapPublicKeyUrl.toString();
        try {
          const opts = {
            ..._OAuth2Client.RETRY_CONFIG,
            url
          };
          authclient_1.AuthClient.setMethodName(opts, "getIapPublicKeysAsync");
          res = await this.transporter.request(opts);
        } catch (e) {
          if (e instanceof Error) {
            e.message = `Failed to retrieve verification certificates: ${e.message}`;
          }
          throw e;
        }
        return { pubkeys: res.data, res };
      }
      verifySignedJwtWithCerts() {
        throw new Error("verifySignedJwtWithCerts is removed, please use verifySignedJwtWithCertsAsync instead.");
      }
      /**
       * Verify the id token is signed with the correct certificate
       * and is from the correct audience.
       * @param jwt The jwt to verify (The ID Token in this case).
       * @param certs The array of certs to test the jwt against.
       * @param requiredAudience The audience to test the jwt against.
       * @param issuers The allowed issuers of the jwt (Optional).
       * @param maxExpiry The max expiry the certificate can be (Optional).
       * @return Returns a promise resolving to LoginTicket on verification.
       */
      async verifySignedJwtWithCertsAsync(jwt, certs, requiredAudience, issuers, maxExpiry) {
        const crypto2 = (0, crypto_1.createCrypto)();
        if (!maxExpiry) {
          maxExpiry = _OAuth2Client.DEFAULT_MAX_TOKEN_LIFETIME_SECS_;
        }
        const segments = jwt.split(".");
        if (segments.length !== 3) {
          throw new Error("Wrong number of segments in token: " + jwt);
        }
        const signed = segments[0] + "." + segments[1];
        let signature = segments[2];
        let envelope;
        let payload;
        try {
          envelope = JSON.parse(crypto2.decodeBase64StringUtf8(segments[0]));
        } catch (err) {
          if (err instanceof Error) {
            err.message = `Can't parse token envelope: ${segments[0]}': ${err.message}`;
          }
          throw err;
        }
        if (!envelope) {
          throw new Error("Can't parse token envelope: " + segments[0]);
        }
        try {
          payload = JSON.parse(crypto2.decodeBase64StringUtf8(segments[1]));
        } catch (err) {
          if (err instanceof Error) {
            err.message = `Can't parse token payload '${segments[0]}`;
          }
          throw err;
        }
        if (!payload) {
          throw new Error("Can't parse token payload: " + segments[1]);
        }
        if (!Object.prototype.hasOwnProperty.call(certs, envelope.kid)) {
          throw new Error("No pem found for envelope: " + JSON.stringify(envelope));
        }
        const cert = certs[envelope.kid];
        if (envelope.alg === "ES256") {
          signature = formatEcdsa.joseToDer(signature, "ES256").toString("base64");
        }
        const verified = await crypto2.verify(cert, signed, signature);
        if (!verified) {
          throw new Error("Invalid token signature: " + jwt);
        }
        if (!payload.iat) {
          throw new Error("No issue time in token: " + JSON.stringify(payload));
        }
        if (!payload.exp) {
          throw new Error("No expiration time in token: " + JSON.stringify(payload));
        }
        const iat = Number(payload.iat);
        if (isNaN(iat))
          throw new Error("iat field using invalid format");
        const exp = Number(payload.exp);
        if (isNaN(exp))
          throw new Error("exp field using invalid format");
        const now = (/* @__PURE__ */ new Date()).getTime() / 1e3;
        if (exp >= now + maxExpiry) {
          throw new Error("Expiration time too far in future: " + JSON.stringify(payload));
        }
        const earliest = iat - _OAuth2Client.CLOCK_SKEW_SECS_;
        const latest = exp + _OAuth2Client.CLOCK_SKEW_SECS_;
        if (now < earliest) {
          throw new Error("Token used too early, " + now + " < " + earliest + ": " + JSON.stringify(payload));
        }
        if (now > latest) {
          throw new Error("Token used too late, " + now + " > " + latest + ": " + JSON.stringify(payload));
        }
        if (issuers && issuers.indexOf(payload.iss) < 0) {
          throw new Error("Invalid issuer, expected one of [" + issuers + "], but got " + payload.iss);
        }
        if (typeof requiredAudience !== "undefined" && requiredAudience !== null) {
          const aud = payload.aud;
          let audVerified = false;
          if (requiredAudience.constructor === Array) {
            audVerified = requiredAudience.indexOf(aud) > -1;
          } else {
            audVerified = aud === requiredAudience;
          }
          if (!audVerified) {
            throw new Error("Wrong recipient, payload audience != requiredAudience");
          }
        }
        return new loginticket_1.LoginTicket(envelope, payload);
      }
      /**
       * Returns a promise that resolves with AccessTokenResponse type if
       * refreshHandler is defined.
       * If not, nothing is returned.
       */
      async processAndValidateRefreshHandler() {
        if (this.refreshHandler) {
          const accessTokenResponse = await this.refreshHandler();
          if (!accessTokenResponse.access_token) {
            throw new Error("No access token is returned by the refreshHandler callback.");
          }
          return accessTokenResponse;
        }
        return;
      }
      /**
       * Returns true if a token is expired or will expire within
       * eagerRefreshThresholdMillismilliseconds.
       * If there is no expiry time, assumes the token is not expired or expiring.
       */
      isTokenExpiring() {
        const expiryDate = this.credentials.expiry_date;
        return expiryDate ? expiryDate <= (/* @__PURE__ */ new Date()).getTime() + this.eagerRefreshThresholdMillis : false;
      }
    };
    /**
     * @deprecated use instance's {@link OAuth2Client.endpoints}
     */
    __publicField(_OAuth2Client, "GOOGLE_TOKEN_INFO_URL", "https://oauth2.googleapis.com/tokeninfo");
    /**
     * Clock skew - five minutes in seconds
     */
    __publicField(_OAuth2Client, "CLOCK_SKEW_SECS_", 300);
    /**
     * The default max Token Lifetime is one day in seconds
     */
    __publicField(_OAuth2Client, "DEFAULT_MAX_TOKEN_LIFETIME_SECS_", 86400);
    var OAuth2Client = _OAuth2Client;
    exports.OAuth2Client = OAuth2Client;
  }
});

// node_modules/google-auth-library/build/src/auth/computeclient.js
var require_computeclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/computeclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Compute = void 0;
    var gaxios_1 = require_src3();
    var gcpMetadata = require_src5();
    var oauth2client_1 = require_oauth2client();
    var Compute = class extends oauth2client_1.OAuth2Client {
      /**
       * Google Compute Engine service account credentials.
       *
       * Retrieve access token from the metadata server.
       * See: https://cloud.google.com/compute/docs/access/authenticate-workloads#applications
       */
      constructor(options = {}) {
        super(options);
        __publicField(this, "serviceAccountEmail");
        __publicField(this, "scopes");
        this.credentials = { expiry_date: 1, refresh_token: "compute-placeholder" };
        this.serviceAccountEmail = options.serviceAccountEmail || "default";
        this.scopes = Array.isArray(options.scopes) ? options.scopes : options.scopes ? [options.scopes] : [];
      }
      /**
       * Refreshes the access token.
       * @param refreshToken Unused parameter
       */
      async refreshTokenNoCache() {
        const tokenPath = `service-accounts/${this.serviceAccountEmail}/token`;
        let data;
        try {
          const instanceOptions = {
            property: tokenPath
          };
          if (this.scopes.length > 0) {
            instanceOptions.params = {
              scopes: this.scopes.join(",")
            };
          }
          data = await gcpMetadata.instance(instanceOptions);
        } catch (e) {
          if (e instanceof gaxios_1.GaxiosError) {
            e.message = `Could not refresh access token: ${e.message}`;
            this.wrapError(e);
          }
          throw e;
        }
        const tokens = data;
        if (data && data.expires_in) {
          tokens.expiry_date = (/* @__PURE__ */ new Date()).getTime() + data.expires_in * 1e3;
          delete tokens.expires_in;
        }
        this.emit("tokens", tokens);
        return { tokens, res: null };
      }
      /**
       * Fetches an ID token.
       * @param targetAudience the audience for the fetched ID token.
       */
      async fetchIdToken(targetAudience) {
        const idTokenPath = `service-accounts/${this.serviceAccountEmail}/identity?format=full&audience=${targetAudience}`;
        let idToken;
        try {
          const instanceOptions = {
            property: idTokenPath
          };
          idToken = await gcpMetadata.instance(instanceOptions);
        } catch (e) {
          if (e instanceof Error) {
            e.message = `Could not fetch ID token: ${e.message}`;
          }
          throw e;
        }
        return idToken;
      }
      wrapError(e) {
        const res = e.response;
        if (res && res.status) {
          e.status = res.status;
          if (res.status === 403) {
            e.message = "A Forbidden error was returned while attempting to retrieve an access token for the Compute Engine built-in service account. This may be because the Compute Engine instance does not have the correct permission scopes specified: " + e.message;
          } else if (res.status === 404) {
            e.message = "A Not Found error was returned while attempting to retrieve an accesstoken for the Compute Engine built-in service account. This may be because the Compute Engine instance does not have any permission scopes specified: " + e.message;
          }
        }
      }
    };
    exports.Compute = Compute;
  }
});

// node_modules/google-auth-library/build/src/auth/idtokenclient.js
var require_idtokenclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/idtokenclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IdTokenClient = void 0;
    var oauth2client_1 = require_oauth2client();
    var IdTokenClient = class extends oauth2client_1.OAuth2Client {
      /**
       * Google ID Token client
       *
       * Retrieve ID token from the metadata server.
       * See: https://cloud.google.com/docs/authentication/get-id-token#metadata-server
       */
      constructor(options) {
        super(options);
        __publicField(this, "targetAudience");
        __publicField(this, "idTokenProvider");
        this.targetAudience = options.targetAudience;
        this.idTokenProvider = options.idTokenProvider;
      }
      async getRequestMetadataAsync() {
        if (!this.credentials.id_token || !this.credentials.expiry_date || this.isTokenExpiring()) {
          const idToken = await this.idTokenProvider.fetchIdToken(this.targetAudience);
          this.credentials = {
            id_token: idToken,
            expiry_date: this.getIdTokenExpiryDate(idToken)
          };
        }
        const headers = new Headers({
          authorization: "Bearer " + this.credentials.id_token
        });
        return { headers };
      }
      getIdTokenExpiryDate(idToken) {
        const payloadB64 = idToken.split(".")[1];
        if (payloadB64) {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("ascii"));
          return payload.exp * 1e3;
        }
      }
    };
    exports.IdTokenClient = IdTokenClient;
  }
});

// node_modules/google-auth-library/build/src/auth/envDetect.js
var require_envDetect = __commonJS({
  "node_modules/google-auth-library/build/src/auth/envDetect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GCPEnv = void 0;
    exports.clear = clear;
    exports.getEnv = getEnv;
    var gcpMetadata = require_src5();
    var GCPEnv;
    (function(GCPEnv2) {
      GCPEnv2["APP_ENGINE"] = "APP_ENGINE";
      GCPEnv2["KUBERNETES_ENGINE"] = "KUBERNETES_ENGINE";
      GCPEnv2["CLOUD_FUNCTIONS"] = "CLOUD_FUNCTIONS";
      GCPEnv2["COMPUTE_ENGINE"] = "COMPUTE_ENGINE";
      GCPEnv2["CLOUD_RUN"] = "CLOUD_RUN";
      GCPEnv2["NONE"] = "NONE";
    })(GCPEnv || (exports.GCPEnv = GCPEnv = {}));
    var envPromise;
    function clear() {
      envPromise = void 0;
    }
    async function getEnv() {
      if (envPromise) {
        return envPromise;
      }
      envPromise = getEnvMemoized();
      return envPromise;
    }
    async function getEnvMemoized() {
      let env = GCPEnv.NONE;
      if (isAppEngine()) {
        env = GCPEnv.APP_ENGINE;
      } else if (isCloudFunction()) {
        env = GCPEnv.CLOUD_FUNCTIONS;
      } else if (await isComputeEngine()) {
        if (await isKubernetesEngine()) {
          env = GCPEnv.KUBERNETES_ENGINE;
        } else if (isCloudRun()) {
          env = GCPEnv.CLOUD_RUN;
        } else {
          env = GCPEnv.COMPUTE_ENGINE;
        }
      } else {
        env = GCPEnv.NONE;
      }
      return env;
    }
    function isAppEngine() {
      return !!(process.env.GAE_SERVICE || process.env.GAE_MODULE_NAME);
    }
    function isCloudFunction() {
      return !!(process.env.FUNCTION_NAME || process.env.FUNCTION_TARGET);
    }
    function isCloudRun() {
      return !!process.env.K_CONFIGURATION;
    }
    async function isKubernetesEngine() {
      try {
        await gcpMetadata.instance("attributes/cluster-name");
        return true;
      } catch (e) {
        return false;
      }
    }
    async function isComputeEngine() {
      return gcpMetadata.isAvailable();
    }
  }
});

// node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = require_stream();
    var util = require_util2();
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer2.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer2.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick((function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }).bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer2 = require_buffer().Buffer;
    var SlowBuffer = require_buffer().SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/jwa/index.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto2 = require_crypto();
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util = require_util2();
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto2.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util.format.bind(util, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto2.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual = "timingSafeEqual" in crypto2 ? function timingSafeEqual2(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto2.timingSafeEqual(a, b);
    } : function timingSafeEqual2(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase();
      var bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer2 = require_buffer().Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer2.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = require_stream();
    var toString = require_tostring();
    var util = require_util2();
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret || opts.privateKey || opts.key;
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", (function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }).bind(this));
      this.payload.once("close", (function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }).bind(this));
    }
    util.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = require_stream();
    var toString = require_tostring();
    var util = require_util2();
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret || opts.publicKey || opts.key;
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", (function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }).bind(this));
      this.signature.once("close", (function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }).bind(this));
    }
    util.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/gtoken/build/cjs/src/index.cjs
var require_src6 = __commonJS({
  "node_modules/gtoken/build/cjs/src/index.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GoogleToken = void 0;
    var fs = _interopRequireWildcard(require_fs());
    var _gaxios = require_src3();
    var jws = _interopRequireWildcard(require_jws());
    var path = _interopRequireWildcard(require_path());
    var _util = require_util2();
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (_interopRequireWildcard = function _interopRequireWildcard2(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = { __proto__: null, "default": e2 };
        if (null === e2 || "object" != _typeof(e2) && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (var _t3 in e2) "default" !== _t3 && {}.hasOwnProperty.call(e2, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e2[_t3]);
        return f;
      })(e, t);
    }
    function _typeof(o) {
      "@babel/helpers - typeof";
      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, _typeof(o);
    }
    function _classPrivateMethodInitSpec(e, a) {
      _checkPrivateRedeclaration(e, a), a.add(e);
    }
    function _classPrivateFieldInitSpec(e, t, a) {
      _checkPrivateRedeclaration(e, t), t.set(e, a);
    }
    function _checkPrivateRedeclaration(e, t) {
      if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
    function _classPrivateFieldSet(s, a, r) {
      return s.set(_assertClassBrand(s, a), r), r;
    }
    function _classPrivateFieldGet(s, a) {
      return s.get(_assertClassBrand(s, a));
    }
    function _assertClassBrand(e, t, n) {
      if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
      throw new TypeError("Private element is not present on this object");
    }
    function _defineProperties(e, r) {
      for (var t = 0; t < r.length; t++) {
        var o = r[t];
        o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
      }
    }
    function _createClass(e, r, t) {
      return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: false }), e;
    }
    function _classCallCheck(a, n) {
      if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
    }
    function _callSuper(t, o, e) {
      return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
    }
    function _possibleConstructorReturn(t, e) {
      if (e && ("object" == _typeof(e) || "function" == typeof e)) return e;
      if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
      return _assertThisInitialized(t);
    }
    function _assertThisInitialized(e) {
      if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e;
    }
    function _inherits(t, e) {
      if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
      t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: true, configurable: true } }), Object.defineProperty(t, "prototype", { writable: false }), e && _setPrototypeOf(t, e);
    }
    function _wrapNativeSuper(t) {
      var r = "function" == typeof Map ? /* @__PURE__ */ new Map() : void 0;
      return _wrapNativeSuper = function _wrapNativeSuper2(t2) {
        if (null === t2 || !_isNativeFunction(t2)) return t2;
        if ("function" != typeof t2) throw new TypeError("Super expression must either be null or a function");
        if (void 0 !== r) {
          if (r.has(t2)) return r.get(t2);
          r.set(t2, Wrapper);
        }
        function Wrapper() {
          return _construct(t2, arguments, _getPrototypeOf(this).constructor);
        }
        return Wrapper.prototype = Object.create(t2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }), _setPrototypeOf(Wrapper, t2);
      }, _wrapNativeSuper(t);
    }
    function _construct(t, e, r) {
      if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
      var o = [null];
      o.push.apply(o, e);
      var p = new (t.bind.apply(t, o))();
      return r && _setPrototypeOf(p, r.prototype), p;
    }
    function _isNativeReflectConstruct() {
      try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
        }));
      } catch (t2) {
      }
      return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
        return !!t;
      })();
    }
    function _isNativeFunction(t) {
      try {
        return -1 !== Function.toString.call(t).indexOf("[native code]");
      } catch (n) {
        return "function" == typeof t;
      }
    }
    function _setPrototypeOf(t, e) {
      return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t2, e2) {
        return t2.__proto__ = e2, t2;
      }, _setPrototypeOf(t, e);
    }
    function _getPrototypeOf(t) {
      return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t2) {
        return t2.__proto__ || Object.getPrototypeOf(t2);
      }, _getPrototypeOf(t);
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    function _toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _regenerator() {
      var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag";
      function i(r2, n2, o2, i2) {
        var c2 = n2 && n2.prototype instanceof Generator ? n2 : Generator, u2 = Object.create(c2.prototype);
        return _regeneratorDefine2(u2, "_invoke", function(r3, n3, o3) {
          var i3, c3, u3, f2 = 0, p = o3 || [], y = false, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d2(t2, r4) {
            return i3 = t2, c3 = 0, u3 = e, G.n = r4, a;
          } };
          function d(r4, n4) {
            for (c3 = r4, u3 = n4, t = 0; !y && f2 && !o4 && t < p.length; t++) {
              var o4, i4 = p[t], d2 = G.p, l = i4[2];
              r4 > 3 ? (o4 = l === n4) && (u3 = i4[(c3 = i4[4]) ? 5 : (c3 = 3, 3)], i4[4] = i4[5] = e) : i4[0] <= d2 && ((o4 = r4 < 2 && d2 < i4[1]) ? (c3 = 0, G.v = n4, G.n = i4[1]) : d2 < l && (o4 = r4 < 3 || i4[0] > n4 || n4 > l) && (i4[4] = r4, i4[5] = n4, G.n = l, c3 = 0));
            }
            if (o4 || r4 > 1) return a;
            throw y = true, n4;
          }
          return function(o4, p2, l) {
            if (f2 > 1) throw TypeError("Generator is already running");
            for (y && 1 === p2 && d(p2, l), c3 = p2, u3 = l; (t = c3 < 2 ? e : u3) || !y; ) {
              i3 || (c3 ? c3 < 3 ? (c3 > 1 && (G.n = -1), d(c3, u3)) : G.n = u3 : G.v = u3);
              try {
                if (f2 = 2, i3) {
                  if (c3 || (o4 = "next"), t = i3[o4]) {
                    if (!(t = t.call(i3, u3))) throw TypeError("iterator result is not an object");
                    if (!t.done) return t;
                    u3 = t.value, c3 < 2 && (c3 = 0);
                  } else 1 === c3 && (t = i3["return"]) && t.call(i3), c3 < 2 && (u3 = TypeError("The iterator does not provide a '" + o4 + "' method"), c3 = 1);
                  i3 = e;
                } else if ((t = (y = G.n < 0) ? u3 : r3.call(n3, G)) !== a) break;
              } catch (t2) {
                i3 = e, c3 = 1, u3 = t2;
              } finally {
                f2 = 1;
              }
            }
            return { value: t, done: y };
          };
        }(r2, o2, i2), true), u2;
      }
      var a = {};
      function Generator() {
      }
      function GeneratorFunction() {
      }
      function GeneratorFunctionPrototype() {
      }
      t = Object.getPrototypeOf;
      var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function() {
        return this;
      }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
      function f(e2) {
        return Object.setPrototypeOf ? Object.setPrototypeOf(e2, GeneratorFunctionPrototype) : (e2.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e2, o, "GeneratorFunction")), e2.prototype = Object.create(u), e2;
      }
      return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function() {
        return this;
      }), _regeneratorDefine2(u, "toString", function() {
        return "[object Generator]";
      }), (_regenerator = function _regenerator2() {
        return { w: i, m: f };
      })();
    }
    function _regeneratorDefine2(e, r, n, t) {
      var i = Object.defineProperty;
      try {
        i({}, "", {});
      } catch (e2) {
        i = 0;
      }
      _regeneratorDefine2 = function _regeneratorDefine(e2, r2, n2, t2) {
        if (r2) i ? i(e2, r2, { value: n2, enumerable: !t2, configurable: !t2, writable: !t2 }) : e2[r2] = n2;
        else {
          var o = function o2(r3, n3) {
            _regeneratorDefine2(e2, r3, function(e3) {
              return this._invoke(r3, n3, e3);
            });
          };
          o("next", 0), o("throw", 1), o("return", 2);
        }
      }, _regeneratorDefine2(e, r, n, t);
    }
    function asyncGeneratorStep(n, t, e, r, o, a, c) {
      try {
        var i = n[a](c), u = i.value;
      } catch (n2) {
        return void e(n2);
      }
      i.done ? t(u) : Promise.resolve(u).then(r, o);
    }
    function _asyncToGenerator(n) {
      return function() {
        var t = this, e = arguments;
        return new Promise(function(r, o) {
          var a = n.apply(t, e);
          function _next(n2) {
            asyncGeneratorStep(a, r, o, _next, _throw, "next", n2);
          }
          function _throw(n2) {
            asyncGeneratorStep(a, r, o, _next, _throw, "throw", n2);
          }
          _next(void 0);
        });
      };
    }
    var readFile = fs.readFile ? (0, _util.promisify)(fs.readFile) : _asyncToGenerator(_regenerator().m(function _callee() {
      return _regenerator().w(function(_context) {
        while (1) switch (_context.n) {
          case 0:
            throw new ErrorWithCode("use key rather than keyFile.", "MISSING_CREDENTIALS");
          case 1:
            return _context.a(2);
        }
      }, _callee);
    }));
    var GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    var GOOGLE_REVOKE_TOKEN_URL = "https://oauth2.googleapis.com/revoke?token=";
    var ErrorWithCode = function(_Error) {
      function ErrorWithCode2(message, code) {
        var _this;
        _classCallCheck(this, ErrorWithCode2);
        _this = _callSuper(this, ErrorWithCode2, [message]);
        _defineProperty(_this, "code", void 0);
        _this.code = code;
        return _this;
      }
      _inherits(ErrorWithCode2, _Error);
      return _createClass(ErrorWithCode2);
    }(_wrapNativeSuper(Error));
    var _inFlightRequest = /* @__PURE__ */ new WeakMap();
    var _GoogleToken_brand = /* @__PURE__ */ new WeakSet();
    var GoogleToken = exports.GoogleToken = function() {
      function GoogleToken2(_options) {
        _classCallCheck(this, GoogleToken2);
        _classPrivateMethodInitSpec(this, _GoogleToken_brand);
        _defineProperty(this, "expiresAt", void 0);
        _defineProperty(this, "key", void 0);
        _defineProperty(this, "keyFile", void 0);
        _defineProperty(this, "iss", void 0);
        _defineProperty(this, "sub", void 0);
        _defineProperty(this, "scope", void 0);
        _defineProperty(this, "rawToken", void 0);
        _defineProperty(this, "tokenExpires", void 0);
        _defineProperty(this, "email", void 0);
        _defineProperty(this, "additionalClaims", void 0);
        _defineProperty(this, "eagerRefreshThresholdMillis", void 0);
        _defineProperty(this, "transporter", {
          request: function request(opts) {
            return (0, _gaxios.request)(opts);
          }
        });
        _classPrivateFieldInitSpec(this, _inFlightRequest, void 0);
        _assertClassBrand(_GoogleToken_brand, this, _configure).call(this, _options);
      }
      return _createClass(GoogleToken2, [{
        key: "accessToken",
        get: function get() {
          return this.rawToken ? this.rawToken.access_token : void 0;
        }
      }, {
        key: "idToken",
        get: function get() {
          return this.rawToken ? this.rawToken.id_token : void 0;
        }
      }, {
        key: "tokenType",
        get: function get() {
          return this.rawToken ? this.rawToken.token_type : void 0;
        }
      }, {
        key: "refreshToken",
        get: function get() {
          return this.rawToken ? this.rawToken.refresh_token : void 0;
        }
      }, {
        key: "hasExpired",
        value: function hasExpired() {
          var now = (/* @__PURE__ */ new Date()).getTime();
          if (this.rawToken && this.expiresAt) {
            return now >= this.expiresAt;
          } else {
            return true;
          }
        }
        /**
         * Returns whether the token will expire within eagerRefreshThresholdMillis
         *
         * @return true if the token will be expired within eagerRefreshThresholdMillis, false otherwise.
         */
      }, {
        key: "isTokenExpiring",
        value: function isTokenExpiring() {
          var _this$eagerRefreshThr;
          var now = (/* @__PURE__ */ new Date()).getTime();
          var eagerRefreshThresholdMillis = (_this$eagerRefreshThr = this.eagerRefreshThresholdMillis) !== null && _this$eagerRefreshThr !== void 0 ? _this$eagerRefreshThr : 0;
          if (this.rawToken && this.expiresAt) {
            return this.expiresAt <= now + eagerRefreshThresholdMillis;
          } else {
            return true;
          }
        }
        /**
         * Returns a cached token or retrieves a new one from Google.
         *
         * @param callback The callback function.
         */
      }, {
        key: "getToken",
        value: function getToken(callback) {
          var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          if (_typeof(callback) === "object") {
            opts = callback;
            callback = void 0;
          }
          opts = Object.assign({
            forceRefresh: false
          }, opts);
          if (callback) {
            var cb = callback;
            _assertClassBrand(_GoogleToken_brand, this, _getTokenAsync).call(this, opts).then(function(t) {
              return cb(null, t);
            }, callback);
            return;
          }
          return _assertClassBrand(_GoogleToken_brand, this, _getTokenAsync).call(this, opts);
        }
        /**
         * Given a keyFile, extract the key and client email if available
         * @param keyFile Path to a json, pem, or p12 file that contains the key.
         * @returns an object with privateKey and clientEmail properties
         */
      }, {
        key: "getCredentials",
        value: function() {
          var _getCredentials = _asyncToGenerator(_regenerator().m(function _callee2(keyFile) {
            var ext, key, body, privateKey, clientEmail, _privateKey, _t;
            return _regenerator().w(function(_context2) {
              while (1) switch (_context2.n) {
                case 0:
                  ext = path.extname(keyFile);
                  _t = ext;
                  _context2.n = _t === ".json" ? 1 : _t === ".der" ? 4 : _t === ".crt" ? 4 : _t === ".pem" ? 4 : _t === ".p12" ? 6 : _t === ".pfx" ? 6 : 7;
                  break;
                case 1:
                  _context2.n = 2;
                  return readFile(keyFile, "utf8");
                case 2:
                  key = _context2.v;
                  body = JSON.parse(key);
                  privateKey = body.private_key;
                  clientEmail = body.client_email;
                  if (!(!privateKey || !clientEmail)) {
                    _context2.n = 3;
                    break;
                  }
                  throw new ErrorWithCode("private_key and client_email are required.", "MISSING_CREDENTIALS");
                case 3:
                  return _context2.a(2, {
                    privateKey,
                    clientEmail
                  });
                case 4:
                  _context2.n = 5;
                  return readFile(keyFile, "utf8");
                case 5:
                  _privateKey = _context2.v;
                  return _context2.a(2, {
                    privateKey: _privateKey
                  });
                case 6:
                  throw new ErrorWithCode("*.p12 certificates are not supported after v6.1.2. Consider utilizing *.json format or converting *.p12 to *.pem using the OpenSSL CLI.", "UNKNOWN_CERTIFICATE_TYPE");
                case 7:
                  throw new ErrorWithCode("Unknown certificate type. Type is determined based on file extension. Current supported extensions are *.json, and *.pem.", "UNKNOWN_CERTIFICATE_TYPE");
                case 8:
                  return _context2.a(2);
              }
            }, _callee2);
          }));
          function getCredentials(_x) {
            return _getCredentials.apply(this, arguments);
          }
          return getCredentials;
        }()
      }, {
        key: "revokeToken",
        value: function revokeToken(callback) {
          if (callback) {
            _assertClassBrand(_GoogleToken_brand, this, _revokeTokenAsync).call(this).then(function() {
              return callback();
            }, callback);
            return;
          }
          return _assertClassBrand(_GoogleToken_brand, this, _revokeTokenAsync).call(this);
        }
      }]);
    }();
    function _getTokenAsync(_x2) {
      return _getTokenAsync2.apply(this, arguments);
    }
    function _getTokenAsync2() {
      _getTokenAsync2 = _asyncToGenerator(_regenerator().m(function _callee3(opts) {
        return _regenerator().w(function(_context3) {
          while (1) switch (_context3.n) {
            case 0:
              if (!(_classPrivateFieldGet(_inFlightRequest, this) && !opts.forceRefresh)) {
                _context3.n = 1;
                break;
              }
              return _context3.a(2, _classPrivateFieldGet(_inFlightRequest, this));
            case 1:
              _context3.p = 1;
              _context3.n = 2;
              return _classPrivateFieldSet(_inFlightRequest, this, _assertClassBrand(_GoogleToken_brand, this, _getTokenAsyncInner).call(this, opts));
            case 2:
              return _context3.a(2, _context3.v);
            case 3:
              _context3.p = 3;
              _classPrivateFieldSet(_inFlightRequest, this, void 0);
              return _context3.f(3);
            case 4:
              return _context3.a(2);
          }
        }, _callee3, this, [[1, , 3, 4]]);
      }));
      return _getTokenAsync2.apply(this, arguments);
    }
    function _getTokenAsyncInner(_x3) {
      return _getTokenAsyncInner2.apply(this, arguments);
    }
    function _getTokenAsyncInner2() {
      _getTokenAsyncInner2 = _asyncToGenerator(_regenerator().m(function _callee4(opts) {
        var creds;
        return _regenerator().w(function(_context4) {
          while (1) switch (_context4.n) {
            case 0:
              if (!(this.isTokenExpiring() === false && opts.forceRefresh === false)) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2, Promise.resolve(this.rawToken));
            case 1:
              if (!(!this.key && !this.keyFile)) {
                _context4.n = 2;
                break;
              }
              throw new Error("No key or keyFile set.");
            case 2:
              if (!(!this.key && this.keyFile)) {
                _context4.n = 4;
                break;
              }
              _context4.n = 3;
              return this.getCredentials(this.keyFile);
            case 3:
              creds = _context4.v;
              this.key = creds.privateKey;
              this.iss = creds.clientEmail || this.iss;
              if (!creds.clientEmail) {
                _assertClassBrand(_GoogleToken_brand, this, _ensureEmail).call(this);
              }
            case 4:
              return _context4.a(2, _assertClassBrand(_GoogleToken_brand, this, _requestToken).call(this));
          }
        }, _callee4, this);
      }));
      return _getTokenAsyncInner2.apply(this, arguments);
    }
    function _ensureEmail() {
      if (!this.iss) {
        throw new ErrorWithCode("email is required.", "MISSING_CREDENTIALS");
      }
    }
    function _revokeTokenAsync() {
      return _revokeTokenAsync2.apply(this, arguments);
    }
    function _revokeTokenAsync2() {
      _revokeTokenAsync2 = _asyncToGenerator(_regenerator().m(function _callee5() {
        var url;
        return _regenerator().w(function(_context5) {
          while (1) switch (_context5.n) {
            case 0:
              if (this.accessToken) {
                _context5.n = 1;
                break;
              }
              throw new Error("No token to revoke.");
            case 1:
              url = GOOGLE_REVOKE_TOKEN_URL + this.accessToken;
              _context5.n = 2;
              return this.transporter.request({
                url,
                retry: true
              });
            case 2:
              _assertClassBrand(_GoogleToken_brand, this, _configure).call(this, {
                email: this.iss,
                sub: this.sub,
                key: this.key,
                keyFile: this.keyFile,
                scope: this.scope,
                additionalClaims: this.additionalClaims
              });
            case 3:
              return _context5.a(2);
          }
        }, _callee5, this);
      }));
      return _revokeTokenAsync2.apply(this, arguments);
    }
    function _configure() {
      var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      this.keyFile = options.keyFile;
      this.key = options.key;
      this.rawToken = void 0;
      this.iss = options.email || options.iss;
      this.sub = options.sub;
      this.additionalClaims = options.additionalClaims;
      if (_typeof(options.scope) === "object") {
        this.scope = options.scope.join(" ");
      } else {
        this.scope = options.scope;
      }
      this.eagerRefreshThresholdMillis = options.eagerRefreshThresholdMillis;
      if (options.transporter) {
        this.transporter = options.transporter;
      }
    }
    function _requestToken() {
      return _requestToken2.apply(this, arguments);
    }
    function _requestToken2() {
      _requestToken2 = _asyncToGenerator(_regenerator().m(function _callee6() {
        var iat, additionalClaims, payload, signedJWT, r, _response, _response2, body, desc, _t2;
        return _regenerator().w(function(_context6) {
          while (1) switch (_context6.n) {
            case 0:
              iat = Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3);
              additionalClaims = this.additionalClaims || {};
              payload = Object.assign({
                iss: this.iss,
                scope: this.scope,
                aud: GOOGLE_TOKEN_URL,
                exp: iat + 3600,
                iat,
                sub: this.sub
              }, additionalClaims);
              signedJWT = jws.sign({
                header: {
                  alg: "RS256"
                },
                payload,
                secret: this.key
              });
              _context6.p = 1;
              _context6.n = 2;
              return this.transporter.request({
                method: "POST",
                url: GOOGLE_TOKEN_URL,
                data: new URLSearchParams({
                  grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                  assertion: signedJWT
                }),
                responseType: "json",
                retryConfig: {
                  httpMethodsToRetry: ["POST"]
                }
              });
            case 2:
              r = _context6.v;
              this.rawToken = r.data;
              this.expiresAt = r.data.expires_in === null || r.data.expires_in === void 0 ? void 0 : (iat + r.data.expires_in) * 1e3;
              return _context6.a(2, this.rawToken);
            case 3:
              _context6.p = 3;
              _t2 = _context6.v;
              this.rawToken = void 0;
              this.tokenExpires = void 0;
              body = _t2.response && (_response = _t2.response) !== null && _response !== void 0 && _response.data ? (_response2 = _t2.response) === null || _response2 === void 0 ? void 0 : _response2.data : {};
              if (body.error) {
                desc = body.error_description ? ": ".concat(body.error_description) : "";
                _t2.message = "".concat(body.error).concat(desc);
              }
              throw _t2;
            case 4:
              return _context6.a(2);
          }
        }, _callee6, this, [[1, 3]]);
      }));
      return _requestToken2.apply(this, arguments);
    }
  }
});

// node_modules/google-auth-library/build/src/auth/jwtaccess.js
var require_jwtaccess = __commonJS({
  "node_modules/google-auth-library/build/src/auth/jwtaccess.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JWTAccess = void 0;
    var jws = require_jws();
    var util_1 = require_util3();
    var DEFAULT_HEADER = {
      alg: "RS256",
      typ: "JWT"
    };
    var JWTAccess = class _JWTAccess {
      /**
       * JWTAccess service account credentials.
       *
       * Create a new access token by using the credential to create a new JWT token
       * that's recognized as the access token.
       *
       * @param email the service account email address.
       * @param key the private key that will be used to sign the token.
       * @param keyId the ID of the private key used to sign the token.
       */
      constructor(email, key, keyId, eagerRefreshThresholdMillis) {
        __publicField(this, "email");
        __publicField(this, "key");
        __publicField(this, "keyId");
        __publicField(this, "projectId");
        __publicField(this, "eagerRefreshThresholdMillis");
        __publicField(this, "cache", new util_1.LRUCache({
          capacity: 500,
          maxAge: 60 * 60 * 1e3
        }));
        this.email = email;
        this.key = key;
        this.keyId = keyId;
        this.eagerRefreshThresholdMillis = eagerRefreshThresholdMillis ?? 5 * 60 * 1e3;
      }
      /**
       * Ensures that we're caching a key appropriately, giving precedence to scopes vs. url
       *
       * @param url The URI being authorized.
       * @param scopes The scope or scopes being authorized
       * @returns A string that returns the cached key.
       */
      getCachedKey(url, scopes) {
        let cacheKey = url;
        if (scopes && Array.isArray(scopes) && scopes.length) {
          cacheKey = url ? `${url}_${scopes.join("_")}` : `${scopes.join("_")}`;
        } else if (typeof scopes === "string") {
          cacheKey = url ? `${url}_${scopes}` : scopes;
        }
        if (!cacheKey) {
          throw Error("Scopes or url must be provided");
        }
        return cacheKey;
      }
      /**
       * Get a non-expired access token, after refreshing if necessary.
       *
       * @param url The URI being authorized.
       * @param additionalClaims An object with a set of additional claims to
       * include in the payload.
       * @returns An object that includes the authorization header.
       */
      getRequestHeaders(url, additionalClaims, scopes) {
        const key = this.getCachedKey(url, scopes);
        const cachedToken = this.cache.get(key);
        const now = Date.now();
        if (cachedToken && cachedToken.expiration - now > this.eagerRefreshThresholdMillis) {
          return new Headers(cachedToken.headers);
        }
        const iat = Math.floor(Date.now() / 1e3);
        const exp = _JWTAccess.getExpirationTime(iat);
        let defaultClaims;
        if (Array.isArray(scopes)) {
          scopes = scopes.join(" ");
        }
        if (scopes) {
          defaultClaims = {
            iss: this.email,
            sub: this.email,
            scope: scopes,
            exp,
            iat
          };
        } else {
          defaultClaims = {
            iss: this.email,
            sub: this.email,
            aud: url,
            exp,
            iat
          };
        }
        if (additionalClaims) {
          for (const claim in defaultClaims) {
            if (additionalClaims[claim]) {
              throw new Error(`The '${claim}' property is not allowed when passing additionalClaims. This claim is included in the JWT by default.`);
            }
          }
        }
        const header = this.keyId ? { ...DEFAULT_HEADER, kid: this.keyId } : DEFAULT_HEADER;
        const payload = Object.assign(defaultClaims, additionalClaims);
        const signedJWT = jws.sign({ header, payload, secret: this.key });
        const headers = new Headers({ authorization: `Bearer ${signedJWT}` });
        this.cache.set(key, {
          expiration: exp * 1e3,
          headers
        });
        return headers;
      }
      /**
       * Returns an expiration time for the JWT token.
       *
       * @param iat The issued at time for the JWT.
       * @returns An expiration time for the JWT.
       */
      static getExpirationTime(iat) {
        const exp = iat + 3600;
        return exp;
      }
      /**
       * Create a JWTAccess credentials instance using the given input options.
       * @param json The input object.
       */
      fromJSON(json) {
        if (!json) {
          throw new Error("Must pass in a JSON object containing the service account auth settings.");
        }
        if (!json.client_email) {
          throw new Error("The incoming JSON object does not contain a client_email field");
        }
        if (!json.private_key) {
          throw new Error("The incoming JSON object does not contain a private_key field");
        }
        this.email = json.client_email;
        this.key = json.private_key;
        this.keyId = json.private_key_id;
        this.projectId = json.project_id;
      }
      fromStream(inputStream, callback) {
        if (callback) {
          this.fromStreamAsync(inputStream).then(() => callback(), callback);
        } else {
          return this.fromStreamAsync(inputStream);
        }
      }
      fromStreamAsync(inputStream) {
        return new Promise((resolve, reject) => {
          if (!inputStream) {
            reject(new Error("Must pass in a stream containing the service account auth settings."));
          }
          let s = "";
          inputStream.setEncoding("utf8").on("data", (chunk) => s += chunk).on("error", reject).on("end", () => {
            try {
              const data = JSON.parse(s);
              this.fromJSON(data);
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    };
    exports.JWTAccess = JWTAccess;
  }
});

// node_modules/google-auth-library/build/src/auth/jwtclient.js
var require_jwtclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/jwtclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JWT = void 0;
    var gtoken_1 = require_src6();
    var jwtaccess_1 = require_jwtaccess();
    var oauth2client_1 = require_oauth2client();
    var authclient_1 = require_authclient();
    var JWT = class _JWT extends oauth2client_1.OAuth2Client {
      /**
       * JWT service account credentials.
       *
       * Retrieve access token using gtoken.
       *
       * @param options the
       */
      constructor(options = {}) {
        super(options);
        __publicField(this, "email");
        __publicField(this, "keyFile");
        __publicField(this, "key");
        __publicField(this, "keyId");
        __publicField(this, "defaultScopes");
        __publicField(this, "scopes");
        __publicField(this, "scope");
        __publicField(this, "subject");
        __publicField(this, "gtoken");
        __publicField(this, "additionalClaims");
        __publicField(this, "useJWTAccessWithScope");
        __publicField(this, "defaultServicePath");
        __publicField(this, "access");
        this.email = options.email;
        this.keyFile = options.keyFile;
        this.key = options.key;
        this.keyId = options.keyId;
        this.scopes = options.scopes;
        this.subject = options.subject;
        this.additionalClaims = options.additionalClaims;
        this.credentials = { refresh_token: "jwt-placeholder", expiry_date: 1 };
      }
      /**
       * Creates a copy of the credential with the specified scopes.
       * @param scopes List of requested scopes or a single scope.
       * @return The cloned instance.
       */
      createScoped(scopes) {
        const jwt = new _JWT(this);
        jwt.scopes = scopes;
        return jwt;
      }
      /**
       * Obtains the metadata to be sent with the request.
       *
       * @param url the URI being authorized.
       */
      async getRequestMetadataAsync(url) {
        url = this.defaultServicePath ? `https://${this.defaultServicePath}/` : url;
        const useSelfSignedJWT = !this.hasUserScopes() && url || this.useJWTAccessWithScope && this.hasAnyScopes() || this.universeDomain !== authclient_1.DEFAULT_UNIVERSE;
        if (this.subject && this.universeDomain !== authclient_1.DEFAULT_UNIVERSE) {
          throw new RangeError(`Service Account user is configured for the credential. Domain-wide delegation is not supported in universes other than ${authclient_1.DEFAULT_UNIVERSE}`);
        }
        if (!this.apiKey && useSelfSignedJWT) {
          if (this.additionalClaims && this.additionalClaims.target_audience) {
            const { tokens } = await this.refreshToken();
            return {
              headers: this.addSharedMetadataHeaders(new Headers({
                authorization: `Bearer ${tokens.id_token}`
              }))
            };
          } else {
            if (!this.access) {
              this.access = new jwtaccess_1.JWTAccess(this.email, this.key, this.keyId, this.eagerRefreshThresholdMillis);
            }
            let scopes;
            if (this.hasUserScopes()) {
              scopes = this.scopes;
            } else if (!url) {
              scopes = this.defaultScopes;
            }
            const useScopes = this.useJWTAccessWithScope || this.universeDomain !== authclient_1.DEFAULT_UNIVERSE;
            const headers = await this.access.getRequestHeaders(
              url ?? void 0,
              this.additionalClaims,
              // Scopes take precedent over audience for signing,
              // so we only provide them if `useJWTAccessWithScope` is on or
              // if we are in a non-default universe
              useScopes ? scopes : void 0
            );
            return { headers: this.addSharedMetadataHeaders(headers) };
          }
        } else if (this.hasAnyScopes() || this.apiKey) {
          return super.getRequestMetadataAsync(url);
        } else {
          return { headers: new Headers() };
        }
      }
      /**
       * Fetches an ID token.
       * @param targetAudience the audience for the fetched ID token.
       */
      async fetchIdToken(targetAudience) {
        const gtoken = new gtoken_1.GoogleToken({
          iss: this.email,
          sub: this.subject,
          scope: this.scopes || this.defaultScopes,
          keyFile: this.keyFile,
          key: this.key,
          additionalClaims: { target_audience: targetAudience },
          transporter: this.transporter
        });
        await gtoken.getToken({
          forceRefresh: true
        });
        if (!gtoken.idToken) {
          throw new Error("Unknown error: Failed to fetch ID token");
        }
        return gtoken.idToken;
      }
      /**
       * Determine if there are currently scopes available.
       */
      hasUserScopes() {
        if (!this.scopes) {
          return false;
        }
        return this.scopes.length > 0;
      }
      /**
       * Are there any default or user scopes defined.
       */
      hasAnyScopes() {
        if (this.scopes && this.scopes.length > 0)
          return true;
        if (this.defaultScopes && this.defaultScopes.length > 0)
          return true;
        return false;
      }
      authorize(callback) {
        if (callback) {
          this.authorizeAsync().then((r) => callback(null, r), callback);
        } else {
          return this.authorizeAsync();
        }
      }
      async authorizeAsync() {
        const result = await this.refreshToken();
        if (!result) {
          throw new Error("No result returned");
        }
        this.credentials = result.tokens;
        this.credentials.refresh_token = "jwt-placeholder";
        this.key = this.gtoken.key;
        this.email = this.gtoken.iss;
        return result.tokens;
      }
      /**
       * Refreshes the access token.
       * @param refreshToken ignored
       * @private
       */
      async refreshTokenNoCache() {
        const gtoken = this.createGToken();
        const token = await gtoken.getToken({
          forceRefresh: this.isTokenExpiring()
        });
        const tokens = {
          access_token: token.access_token,
          token_type: "Bearer",
          expiry_date: gtoken.expiresAt,
          id_token: gtoken.idToken
        };
        this.emit("tokens", tokens);
        return { res: null, tokens };
      }
      /**
       * Create a gToken if it doesn't already exist.
       */
      createGToken() {
        if (!this.gtoken) {
          this.gtoken = new gtoken_1.GoogleToken({
            iss: this.email,
            sub: this.subject,
            scope: this.scopes || this.defaultScopes,
            keyFile: this.keyFile,
            key: this.key,
            additionalClaims: this.additionalClaims,
            transporter: this.transporter
          });
        }
        return this.gtoken;
      }
      /**
       * Create a JWT credentials instance using the given input options.
       * @param json The input object.
       *
       * @remarks
       *
       * **Important**: If you accept a credential configuration (credential JSON/File/Stream) from an external source for authentication to Google Cloud, you must validate it before providing it to any Google API or library. Providing an unvalidated credential configuration to Google APIs can compromise the security of your systems and data. For more information, refer to {@link https://cloud.google.com/docs/authentication/external/externally-sourced-credentials Validate credential configurations from external sources}.
       */
      fromJSON(json) {
        if (!json) {
          throw new Error("Must pass in a JSON object containing the service account auth settings.");
        }
        if (!json.client_email) {
          throw new Error("The incoming JSON object does not contain a client_email field");
        }
        if (!json.private_key) {
          throw new Error("The incoming JSON object does not contain a private_key field");
        }
        this.email = json.client_email;
        this.key = json.private_key;
        this.keyId = json.private_key_id;
        this.projectId = json.project_id;
        this.quotaProjectId = json.quota_project_id;
        this.universeDomain = json.universe_domain || this.universeDomain;
      }
      fromStream(inputStream, callback) {
        if (callback) {
          this.fromStreamAsync(inputStream).then(() => callback(), callback);
        } else {
          return this.fromStreamAsync(inputStream);
        }
      }
      fromStreamAsync(inputStream) {
        return new Promise((resolve, reject) => {
          if (!inputStream) {
            throw new Error("Must pass in a stream containing the service account auth settings.");
          }
          let s = "";
          inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => s += chunk).on("end", () => {
            try {
              const data = JSON.parse(s);
              this.fromJSON(data);
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });
      }
      /**
       * Creates a JWT credentials instance using an API Key for authentication.
       * @param apiKey The API Key in string form.
       */
      fromAPIKey(apiKey) {
        if (typeof apiKey !== "string") {
          throw new Error("Must provide an API Key string.");
        }
        this.apiKey = apiKey;
      }
      /**
       * Using the key or keyFile on the JWT client, obtain an object that contains
       * the key and the client email.
       */
      async getCredentials() {
        if (this.key) {
          return { private_key: this.key, client_email: this.email };
        } else if (this.keyFile) {
          const gtoken = this.createGToken();
          const creds = await gtoken.getCredentials(this.keyFile);
          return { private_key: creds.privateKey, client_email: creds.clientEmail };
        }
        throw new Error("A key or a keyFile must be provided to getCredentials.");
      }
    };
    exports.JWT = JWT;
  }
});

// node_modules/google-auth-library/build/src/auth/refreshclient.js
var require_refreshclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/refreshclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserRefreshClient = exports.USER_REFRESH_ACCOUNT_TYPE = void 0;
    var oauth2client_1 = require_oauth2client();
    var authclient_1 = require_authclient();
    exports.USER_REFRESH_ACCOUNT_TYPE = "authorized_user";
    var UserRefreshClient = class _UserRefreshClient extends oauth2client_1.OAuth2Client {
      /**
       * The User Refresh Token client.
       *
       * @param optionsOrClientId The User Refresh Token client options. Passing an `clientId` directly is **@DEPRECATED**.
       * @param clientSecret **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
       * @param refreshToken **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
       * @param eagerRefreshThresholdMillis **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
       * @param forceRefreshOnFailure **@DEPRECATED**. Provide a {@link UserRefreshClientOptions `UserRefreshClientOptions`} object in the first parameter instead.
       */
      constructor(optionsOrClientId, clientSecret, refreshToken, eagerRefreshThresholdMillis, forceRefreshOnFailure) {
        const opts = optionsOrClientId && typeof optionsOrClientId === "object" ? optionsOrClientId : {
          clientId: optionsOrClientId,
          clientSecret,
          refreshToken,
          eagerRefreshThresholdMillis,
          forceRefreshOnFailure
        };
        super(opts);
        // TODO: refactor tests to make this private
        // In a future gts release, the _propertyName rule will be lifted.
        // This is also a hard one because `this.refreshToken` is a function.
        __publicField(this, "_refreshToken");
        this._refreshToken = opts.refreshToken;
        this.credentials.refresh_token = opts.refreshToken;
      }
      /**
       * Refreshes the access token.
       * @param refreshToken An ignored refreshToken..
       * @param callback Optional callback.
       */
      async refreshTokenNoCache() {
        return super.refreshTokenNoCache(this._refreshToken);
      }
      async fetchIdToken(targetAudience) {
        const opts = {
          ..._UserRefreshClient.RETRY_CONFIG,
          url: this.endpoints.oauth2TokenUrl,
          method: "POST",
          data: new URLSearchParams({
            client_id: this._clientId,
            client_secret: this._clientSecret,
            grant_type: "refresh_token",
            refresh_token: this._refreshToken,
            target_audience: targetAudience
          })
        };
        authclient_1.AuthClient.setMethodName(opts, "fetchIdToken");
        const res = await this.transporter.request(opts);
        return res.data.id_token;
      }
      /**
       * Create a UserRefreshClient credentials instance using the given input
       * options.
       * @param json The input object.
       */
      fromJSON(json) {
        if (!json) {
          throw new Error("Must pass in a JSON object containing the user refresh token");
        }
        if (json.type !== "authorized_user") {
          throw new Error('The incoming JSON object does not have the "authorized_user" type');
        }
        if (!json.client_id) {
          throw new Error("The incoming JSON object does not contain a client_id field");
        }
        if (!json.client_secret) {
          throw new Error("The incoming JSON object does not contain a client_secret field");
        }
        if (!json.refresh_token) {
          throw new Error("The incoming JSON object does not contain a refresh_token field");
        }
        this._clientId = json.client_id;
        this._clientSecret = json.client_secret;
        this._refreshToken = json.refresh_token;
        this.credentials.refresh_token = json.refresh_token;
        this.quotaProjectId = json.quota_project_id;
        this.universeDomain = json.universe_domain || this.universeDomain;
      }
      fromStream(inputStream, callback) {
        if (callback) {
          this.fromStreamAsync(inputStream).then(() => callback(), callback);
        } else {
          return this.fromStreamAsync(inputStream);
        }
      }
      async fromStreamAsync(inputStream) {
        return new Promise((resolve, reject) => {
          if (!inputStream) {
            return reject(new Error("Must pass in a stream containing the user refresh token."));
          }
          let s = "";
          inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => s += chunk).on("end", () => {
            try {
              const data = JSON.parse(s);
              this.fromJSON(data);
              return resolve();
            } catch (err) {
              return reject(err);
            }
          });
        });
      }
      /**
       * Create a UserRefreshClient credentials instance using the given input
       * options.
       * @param json The input object.
       */
      static fromJSON(json) {
        const client = new _UserRefreshClient();
        client.fromJSON(json);
        return client;
      }
    };
    exports.UserRefreshClient = UserRefreshClient;
  }
});

// node_modules/google-auth-library/build/src/auth/impersonated.js
var require_impersonated = __commonJS({
  "node_modules/google-auth-library/build/src/auth/impersonated.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Impersonated = exports.IMPERSONATED_ACCOUNT_TYPE = void 0;
    var oauth2client_1 = require_oauth2client();
    var gaxios_1 = require_src3();
    var util_1 = require_util3();
    exports.IMPERSONATED_ACCOUNT_TYPE = "impersonated_service_account";
    var Impersonated = class _Impersonated extends oauth2client_1.OAuth2Client {
      /**
       * Impersonated service account credentials.
       *
       * Create a new access token by impersonating another service account.
       *
       * Impersonated Credentials allowing credentials issued to a user or
       * service account to impersonate another. The source project using
       * Impersonated Credentials must enable the "IAMCredentials" API.
       * Also, the target service account must grant the orginating principal
       * the "Service Account Token Creator" IAM role.
       *
       * @param {object} options - The configuration object.
       * @param {object} [options.sourceClient] the source credential used as to
       * acquire the impersonated credentials.
       * @param {string} [options.targetPrincipal] the service account to
       * impersonate.
       * @param {string[]} [options.delegates] the chained list of delegates
       * required to grant the final access_token. If set, the sequence of
       * identities must have "Service Account Token Creator" capability granted to
       * the preceding identity. For example, if set to [serviceAccountB,
       * serviceAccountC], the sourceCredential must have the Token Creator role on
       * serviceAccountB. serviceAccountB must have the Token Creator on
       * serviceAccountC. Finally, C must have Token Creator on target_principal.
       * If left unset, sourceCredential must have that role on targetPrincipal.
       * @param {string[]} [options.targetScopes] scopes to request during the
       * authorization grant.
       * @param {number} [options.lifetime] number of seconds the delegated
       * credential should be valid for up to 3600 seconds by default, or 43,200
       * seconds by extending the token's lifetime, see:
       * https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials#sa-credentials-oauth
       * @param {string} [options.endpoint] api endpoint override.
       */
      constructor(options = {}) {
        super(options);
        __publicField(this, "sourceClient");
        __publicField(this, "targetPrincipal");
        __publicField(this, "targetScopes");
        __publicField(this, "delegates");
        __publicField(this, "lifetime");
        __publicField(this, "endpoint");
        this.credentials = {
          expiry_date: 1,
          refresh_token: "impersonated-placeholder"
        };
        this.sourceClient = options.sourceClient ?? new oauth2client_1.OAuth2Client();
        this.targetPrincipal = options.targetPrincipal ?? "";
        this.delegates = options.delegates ?? [];
        this.targetScopes = options.targetScopes ?? [];
        this.lifetime = options.lifetime ?? 3600;
        const usingExplicitUniverseDomain = !!(0, util_1.originalOrCamelOptions)(options).get("universe_domain");
        if (!usingExplicitUniverseDomain) {
          this.universeDomain = this.sourceClient.universeDomain;
        } else if (this.sourceClient.universeDomain !== this.universeDomain) {
          throw new RangeError(`Universe domain ${this.sourceClient.universeDomain} in source credentials does not match ${this.universeDomain} universe domain set for impersonated credentials.`);
        }
        this.endpoint = options.endpoint ?? `https://iamcredentials.${this.universeDomain}`;
      }
      /**
       * Signs some bytes.
       *
       * {@link https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/signBlob Reference Documentation}
       * @param blobToSign String to sign.
       *
       * @returns A {@link SignBlobResponse} denoting the keyID and signedBlob in base64 string
       */
      async sign(blobToSign) {
        await this.sourceClient.getAccessToken();
        const name = `projects/-/serviceAccounts/${this.targetPrincipal}`;
        const u = `${this.endpoint}/v1/${name}:signBlob`;
        const body = {
          delegates: this.delegates,
          payload: Buffer.from(blobToSign).toString("base64")
        };
        const res = await this.sourceClient.request({
          ..._Impersonated.RETRY_CONFIG,
          url: u,
          data: body,
          method: "POST"
        });
        return res.data;
      }
      /** The service account email to be impersonated. */
      getTargetPrincipal() {
        return this.targetPrincipal;
      }
      /**
       * Refreshes the access token.
       */
      async refreshToken() {
        var _a, _b, _c, _d, _e, _f;
        try {
          await this.sourceClient.getAccessToken();
          const name = "projects/-/serviceAccounts/" + this.targetPrincipal;
          const u = `${this.endpoint}/v1/${name}:generateAccessToken`;
          const body = {
            delegates: this.delegates,
            scope: this.targetScopes,
            lifetime: this.lifetime + "s"
          };
          const res = await this.sourceClient.request({
            ..._Impersonated.RETRY_CONFIG,
            url: u,
            data: body,
            method: "POST"
          });
          const tokenResponse = res.data;
          this.credentials.access_token = tokenResponse.accessToken;
          this.credentials.expiry_date = Date.parse(tokenResponse.expireTime);
          return {
            tokens: this.credentials,
            res
          };
        } catch (error) {
          if (!(error instanceof Error))
            throw error;
          let status = 0;
          let message = "";
          if (error instanceof gaxios_1.GaxiosError) {
            status = (_c = (_b = (_a = error == null ? void 0 : error.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) == null ? void 0 : _c.status;
            message = (_f = (_e = (_d = error == null ? void 0 : error.response) == null ? void 0 : _d.data) == null ? void 0 : _e.error) == null ? void 0 : _f.message;
          }
          if (status && message) {
            error.message = `${status}: unable to impersonate: ${message}`;
            throw error;
          } else {
            error.message = `unable to impersonate: ${error}`;
            throw error;
          }
        }
      }
      /**
       * Generates an OpenID Connect ID token for a service account.
       *
       * {@link https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken Reference Documentation}
       *
       * @param targetAudience the audience for the fetched ID token.
       * @param options the for the request
       * @return an OpenID Connect ID token
       */
      async fetchIdToken(targetAudience, options) {
        await this.sourceClient.getAccessToken();
        const name = `projects/-/serviceAccounts/${this.targetPrincipal}`;
        const u = `${this.endpoint}/v1/${name}:generateIdToken`;
        const body = {
          delegates: this.delegates,
          audience: targetAudience,
          includeEmail: (options == null ? void 0 : options.includeEmail) ?? true,
          useEmailAzp: (options == null ? void 0 : options.includeEmail) ?? true
        };
        const res = await this.sourceClient.request({
          ..._Impersonated.RETRY_CONFIG,
          url: u,
          data: body,
          method: "POST"
        });
        return res.data.token;
      }
    };
    exports.Impersonated = Impersonated;
  }
});

// node_modules/google-auth-library/build/src/auth/oauth2common.js
var require_oauth2common = __commonJS({
  "node_modules/google-auth-library/build/src/auth/oauth2common.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OAuthClientAuthHandler = void 0;
    exports.getErrorFromOAuthErrorResponse = getErrorFromOAuthErrorResponse;
    var gaxios_1 = require_src3();
    var crypto_1 = require_crypto4();
    var METHODS_SUPPORTING_REQUEST_BODY = ["PUT", "POST", "PATCH"];
    var _crypto, _clientAuthentication;
    var OAuthClientAuthHandler = class {
      /**
       * Instantiates an OAuth client authentication handler.
       * @param options The OAuth Client Auth Handler instance options. Passing an `ClientAuthentication` directly is **@DEPRECATED**.
       */
      constructor(options) {
        __privateAdd(this, _crypto, (0, crypto_1.createCrypto)());
        __privateAdd(this, _clientAuthentication);
        __publicField(this, "transporter");
        if (options && "clientId" in options) {
          __privateSet(this, _clientAuthentication, options);
          this.transporter = new gaxios_1.Gaxios();
        } else {
          __privateSet(this, _clientAuthentication, options == null ? void 0 : options.clientAuthentication);
          this.transporter = (options == null ? void 0 : options.transporter) || new gaxios_1.Gaxios();
        }
      }
      /**
       * Applies client authentication on the OAuth request's headers or POST
       * body but does not process the request.
       * @param opts The GaxiosOptions whose headers or data are to be modified
       *   depending on the client authentication mechanism to be used.
       * @param bearerToken The optional bearer token to use for authentication.
       *   When this is used, no client authentication credentials are needed.
       */
      applyClientAuthenticationOptions(opts, bearerToken) {
        opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
        this.injectAuthenticatedHeaders(opts, bearerToken);
        if (!bearerToken) {
          this.injectAuthenticatedRequestBody(opts);
        }
      }
      /**
       * Applies client authentication on the request's header if either
       * basic authentication or bearer token authentication is selected.
       *
       * @param opts The GaxiosOptions whose headers or data are to be modified
       *   depending on the client authentication mechanism to be used.
       * @param bearerToken The optional bearer token to use for authentication.
       *   When this is used, no client authentication credentials are needed.
       */
      injectAuthenticatedHeaders(opts, bearerToken) {
        var _a;
        if (bearerToken) {
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers, {
            authorization: `Bearer ${bearerToken}`
          });
        } else if (((_a = __privateGet(this, _clientAuthentication)) == null ? void 0 : _a.confidentialClientType) === "basic") {
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
          const clientId = __privateGet(this, _clientAuthentication).clientId;
          const clientSecret = __privateGet(this, _clientAuthentication).clientSecret || "";
          const base64EncodedCreds = __privateGet(this, _crypto).encodeBase64StringUtf8(`${clientId}:${clientSecret}`);
          gaxios_1.Gaxios.mergeHeaders(opts.headers, {
            authorization: `Basic ${base64EncodedCreds}`
          });
        }
      }
      /**
       * Applies client authentication on the request's body if request-body
       * client authentication is selected.
       *
       * @param opts The GaxiosOptions whose headers or data are to be modified
       *   depending on the client authentication mechanism to be used.
       */
      injectAuthenticatedRequestBody(opts) {
        var _a;
        if (((_a = __privateGet(this, _clientAuthentication)) == null ? void 0 : _a.confidentialClientType) === "request-body") {
          const method = (opts.method || "GET").toUpperCase();
          if (!METHODS_SUPPORTING_REQUEST_BODY.includes(method)) {
            throw new Error(`${method} HTTP method does not support ${__privateGet(this, _clientAuthentication).confidentialClientType} client authentication`);
          }
          const headers = new Headers(opts.headers);
          const contentType = headers.get("content-type");
          if ((contentType == null ? void 0 : contentType.startsWith("application/x-www-form-urlencoded")) || opts.data instanceof URLSearchParams) {
            const data = new URLSearchParams(opts.data ?? "");
            data.append("client_id", __privateGet(this, _clientAuthentication).clientId);
            data.append("client_secret", __privateGet(this, _clientAuthentication).clientSecret || "");
            opts.data = data;
          } else if (contentType == null ? void 0 : contentType.startsWith("application/json")) {
            opts.data = opts.data || {};
            Object.assign(opts.data, {
              client_id: __privateGet(this, _clientAuthentication).clientId,
              client_secret: __privateGet(this, _clientAuthentication).clientSecret || ""
            });
          } else {
            throw new Error(`${contentType} content-types are not supported with ${__privateGet(this, _clientAuthentication).confidentialClientType} client authentication`);
          }
        }
      }
      /**
       * Retry config for Auth-related requests.
       *
       * @remarks
       *
       * This is not a part of the default {@link AuthClient.transporter transporter/gaxios}
       * config as some downstream APIs would prefer if customers explicitly enable retries,
       * such as GCS.
       */
      static get RETRY_CONFIG() {
        return {
          retry: true,
          retryConfig: {
            httpMethodsToRetry: ["GET", "PUT", "POST", "HEAD", "OPTIONS", "DELETE"]
          }
        };
      }
    };
    _crypto = new WeakMap();
    _clientAuthentication = new WeakMap();
    exports.OAuthClientAuthHandler = OAuthClientAuthHandler;
    function getErrorFromOAuthErrorResponse(resp, err) {
      const errorCode = resp.error;
      const errorDescription = resp.error_description;
      const errorUri = resp.error_uri;
      let message = `Error code ${errorCode}`;
      if (typeof errorDescription !== "undefined") {
        message += `: ${errorDescription}`;
      }
      if (typeof errorUri !== "undefined") {
        message += ` - ${errorUri}`;
      }
      const newError = new Error(message);
      if (err) {
        const keys = Object.keys(err);
        if (err.stack) {
          keys.push("stack");
        }
        keys.forEach((key) => {
          if (key !== "message") {
            Object.defineProperty(newError, key, {
              value: err[key],
              writable: false,
              enumerable: true
            });
          }
        });
      }
      return newError;
    }
  }
});

// node_modules/google-auth-library/build/src/auth/stscredentials.js
var require_stscredentials = __commonJS({
  "node_modules/google-auth-library/build/src/auth/stscredentials.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StsCredentials = void 0;
    var gaxios_1 = require_src3();
    var authclient_1 = require_authclient();
    var oauth2common_1 = require_oauth2common();
    var util_1 = require_util3();
    var _tokenExchangeEndpoint;
    var _StsCredentials = class _StsCredentials extends oauth2common_1.OAuthClientAuthHandler {
      /**
       * Initializes an STS credentials instance.
       *
       * @param options The STS credentials instance options. Passing an `tokenExchangeEndpoint` directly is **@DEPRECATED**.
       * @param clientAuthentication **@DEPRECATED**. Provide a {@link StsCredentialsConstructionOptions `StsCredentialsConstructionOptions`} object in the first parameter instead.
       */
      constructor(options = {
        tokenExchangeEndpoint: ""
      }, clientAuthentication) {
        if (typeof options !== "object" || options instanceof URL) {
          options = {
            tokenExchangeEndpoint: options,
            clientAuthentication
          };
        }
        super(options);
        __privateAdd(this, _tokenExchangeEndpoint);
        __privateSet(this, _tokenExchangeEndpoint, options.tokenExchangeEndpoint);
      }
      /**
       * Exchanges the provided token for another type of token based on the
       * rfc8693 spec.
       * @param stsCredentialsOptions The token exchange options used to populate
       *   the token exchange request.
       * @param additionalHeaders Optional additional headers to pass along the
       *   request.
       * @param options Optional additional GCP-specific non-spec defined options
       *   to send with the request.
       *   Example: `&options=${encodeUriComponent(JSON.stringified(options))}`
       * @return A promise that resolves with the token exchange response containing
       *   the requested token and its expiration time.
       */
      async exchangeToken(stsCredentialsOptions, headers, options) {
        var _a, _b, _c;
        const values = {
          grant_type: stsCredentialsOptions.grantType,
          resource: stsCredentialsOptions.resource,
          audience: stsCredentialsOptions.audience,
          scope: (_a = stsCredentialsOptions.scope) == null ? void 0 : _a.join(" "),
          requested_token_type: stsCredentialsOptions.requestedTokenType,
          subject_token: stsCredentialsOptions.subjectToken,
          subject_token_type: stsCredentialsOptions.subjectTokenType,
          actor_token: (_b = stsCredentialsOptions.actingParty) == null ? void 0 : _b.actorToken,
          actor_token_type: (_c = stsCredentialsOptions.actingParty) == null ? void 0 : _c.actorTokenType,
          // Non-standard GCP-specific options.
          options: options && JSON.stringify(options)
        };
        const opts = {
          ..._StsCredentials.RETRY_CONFIG,
          url: __privateGet(this, _tokenExchangeEndpoint).toString(),
          method: "POST",
          headers,
          data: new URLSearchParams((0, util_1.removeUndefinedValuesInObject)(values))
        };
        authclient_1.AuthClient.setMethodName(opts, "exchangeToken");
        this.applyClientAuthenticationOptions(opts);
        try {
          const response = await this.transporter.request(opts);
          const stsSuccessfulResponse = response.data;
          stsSuccessfulResponse.res = response;
          return stsSuccessfulResponse;
        } catch (error) {
          if (error instanceof gaxios_1.GaxiosError && error.response) {
            throw (0, oauth2common_1.getErrorFromOAuthErrorResponse)(
              error.response.data,
              // Preserve other fields from the original error.
              error
            );
          }
          throw error;
        }
      }
    };
    _tokenExchangeEndpoint = new WeakMap();
    var StsCredentials = _StsCredentials;
    exports.StsCredentials = StsCredentials;
  }
});

// node_modules/google-auth-library/build/src/auth/baseexternalclient.js
var require_baseexternalclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/baseexternalclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseExternalAccountClient = exports.CLOUD_RESOURCE_MANAGER = exports.EXTERNAL_ACCOUNT_TYPE = exports.EXPIRATION_TIME_OFFSET = void 0;
    var gaxios_1 = require_src3();
    var stream = require_stream();
    var authclient_1 = require_authclient();
    var sts = require_stscredentials();
    var util_1 = require_util3();
    var shared_cjs_1 = require_shared2();
    var STS_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange";
    var STS_REQUEST_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
    var DEFAULT_OAUTH_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
    var DEFAULT_TOKEN_LIFESPAN = 3600;
    exports.EXPIRATION_TIME_OFFSET = 5 * 60 * 1e3;
    exports.EXTERNAL_ACCOUNT_TYPE = "external_account";
    exports.CLOUD_RESOURCE_MANAGER = "https://cloudresourcemanager.googleapis.com/v1/projects/";
    var WORKFORCE_AUDIENCE_PATTERN = "//iam\\.googleapis\\.com/locations/[^/]+/workforcePools/[^/]+/providers/.+";
    var DEFAULT_TOKEN_URL = "https://sts.{universeDomain}/v1/token";
    var _pendingAccessToken, _BaseExternalAccountClient_instances, internalRefreshAccessTokenAsync_fn;
    var _BaseExternalAccountClient = class _BaseExternalAccountClient extends authclient_1.AuthClient {
      /**
       * Instantiate a BaseExternalAccountClient instance using the provided JSON
       * object loaded from an external account credentials file.
       * @param options The external account options object typically loaded
       *   from the external account JSON credential file. The camelCased options
       *   are aliases for the snake_cased options.
       */
      constructor(options) {
        super(options);
        __privateAdd(this, _BaseExternalAccountClient_instances);
        /**
         * OAuth scopes for the GCP access token to use. When not provided,
         * the default https://www.googleapis.com/auth/cloud-platform is
         * used.
         */
        __publicField(this, "scopes");
        __publicField(this, "projectNumber");
        __publicField(this, "audience");
        __publicField(this, "subjectTokenType");
        __publicField(this, "stsCredential");
        __publicField(this, "clientAuth");
        __publicField(this, "credentialSourceType");
        __publicField(this, "cachedAccessToken");
        __publicField(this, "serviceAccountImpersonationUrl");
        __publicField(this, "serviceAccountImpersonationLifetime");
        __publicField(this, "workforcePoolUserProject");
        __publicField(this, "configLifetimeRequested");
        __publicField(this, "tokenUrl");
        /**
         * @example
         * ```ts
         * new URL('https://cloudresourcemanager.googleapis.com/v1/projects/');
         * ```
         */
        __publicField(this, "cloudResourceManagerURL");
        __publicField(this, "supplierContext");
        /**
         * A pending access token request. Used for concurrent calls.
         */
        __privateAdd(this, _pendingAccessToken, null);
        const opts = (0, util_1.originalOrCamelOptions)(options);
        const type = opts.get("type");
        if (type && type !== exports.EXTERNAL_ACCOUNT_TYPE) {
          throw new Error(`Expected "${exports.EXTERNAL_ACCOUNT_TYPE}" type but received "${options.type}"`);
        }
        const clientId = opts.get("client_id");
        const clientSecret = opts.get("client_secret");
        this.tokenUrl = opts.get("token_url") ?? DEFAULT_TOKEN_URL.replace("{universeDomain}", this.universeDomain);
        const subjectTokenType = opts.get("subject_token_type");
        const workforcePoolUserProject = opts.get("workforce_pool_user_project");
        const serviceAccountImpersonationUrl = opts.get("service_account_impersonation_url");
        const serviceAccountImpersonation = opts.get("service_account_impersonation");
        const serviceAccountImpersonationLifetime = (0, util_1.originalOrCamelOptions)(serviceAccountImpersonation).get("token_lifetime_seconds");
        this.cloudResourceManagerURL = new URL(opts.get("cloud_resource_manager_url") || `https://cloudresourcemanager.${this.universeDomain}/v1/projects/`);
        if (clientId) {
          this.clientAuth = {
            confidentialClientType: "basic",
            clientId,
            clientSecret
          };
        }
        this.stsCredential = new sts.StsCredentials({
          tokenExchangeEndpoint: this.tokenUrl,
          clientAuthentication: this.clientAuth
        });
        this.scopes = opts.get("scopes") || [DEFAULT_OAUTH_SCOPE];
        this.cachedAccessToken = null;
        this.audience = opts.get("audience");
        this.subjectTokenType = subjectTokenType;
        this.workforcePoolUserProject = workforcePoolUserProject;
        const workforceAudiencePattern = new RegExp(WORKFORCE_AUDIENCE_PATTERN);
        if (this.workforcePoolUserProject && !this.audience.match(workforceAudiencePattern)) {
          throw new Error("workforcePoolUserProject should not be set for non-workforce pool credentials.");
        }
        this.serviceAccountImpersonationUrl = serviceAccountImpersonationUrl;
        this.serviceAccountImpersonationLifetime = serviceAccountImpersonationLifetime;
        if (this.serviceAccountImpersonationLifetime) {
          this.configLifetimeRequested = true;
        } else {
          this.configLifetimeRequested = false;
          this.serviceAccountImpersonationLifetime = DEFAULT_TOKEN_LIFESPAN;
        }
        this.projectNumber = this.getProjectNumber(this.audience);
        this.supplierContext = {
          audience: this.audience,
          subjectTokenType: this.subjectTokenType,
          transporter: this.transporter
        };
      }
      /** The service account email to be impersonated, if available. */
      getServiceAccountEmail() {
        var _a;
        if (this.serviceAccountImpersonationUrl) {
          if (this.serviceAccountImpersonationUrl.length > 256) {
            throw new RangeError(`URL is too long: ${this.serviceAccountImpersonationUrl}`);
          }
          const re = /serviceAccounts\/(?<email>[^:]+):generateAccessToken$/;
          const result = re.exec(this.serviceAccountImpersonationUrl);
          return ((_a = result == null ? void 0 : result.groups) == null ? void 0 : _a.email) || null;
        }
        return null;
      }
      /**
       * Provides a mechanism to inject GCP access tokens directly.
       * When the provided credential expires, a new credential, using the
       * external account options, is retrieved.
       * @param credentials The Credentials object to set on the current client.
       */
      setCredentials(credentials) {
        super.setCredentials(credentials);
        this.cachedAccessToken = credentials;
      }
      /**
       * @return A promise that resolves with the current GCP access token
       *   response. If the current credential is expired, a new one is retrieved.
       */
      async getAccessToken() {
        if (!this.cachedAccessToken || this.isExpired(this.cachedAccessToken)) {
          await this.refreshAccessTokenAsync();
        }
        return {
          token: this.cachedAccessToken.access_token,
          res: this.cachedAccessToken.res
        };
      }
      /**
       * The main authentication interface. It takes an optional url which when
       * present is the endpoint being accessed, and returns a Promise which
       * resolves with authorization header fields.
       *
       * The result has the form:
       * { authorization: 'Bearer <access_token_value>' }
       */
      async getRequestHeaders() {
        const accessTokenResponse = await this.getAccessToken();
        const headers = new Headers({
          authorization: `Bearer ${accessTokenResponse.token}`
        });
        return this.addSharedMetadataHeaders(headers);
      }
      request(opts, callback) {
        if (callback) {
          this.requestAsync(opts).then((r) => callback(null, r), (e) => {
            return callback(e, e.response);
          });
        } else {
          return this.requestAsync(opts);
        }
      }
      /**
       * @return A promise that resolves with the project ID corresponding to the
       *   current workload identity pool or current workforce pool if
       *   determinable. For workforce pool credential, it returns the project ID
       *   corresponding to the workforcePoolUserProject.
       *   This is introduced to match the current pattern of using the Auth
       *   library:
       *   const projectId = await auth.getProjectId();
       *   const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
       *   const res = await client.request({ url });
       *   The resource may not have permission
       *   (resourcemanager.projects.get) to call this API or the required
       *   scopes may not be selected:
       *   https://cloud.google.com/resource-manager/reference/rest/v1/projects/get#authorization-scopes
       */
      async getProjectId() {
        const projectNumber = this.projectNumber || this.workforcePoolUserProject;
        if (this.projectId) {
          return this.projectId;
        } else if (projectNumber) {
          const headers = await this.getRequestHeaders();
          const opts = {
            ..._BaseExternalAccountClient.RETRY_CONFIG,
            headers,
            url: `${this.cloudResourceManagerURL.toString()}${projectNumber}`
          };
          authclient_1.AuthClient.setMethodName(opts, "getProjectId");
          const response = await this.transporter.request(opts);
          this.projectId = response.data.projectId;
          return this.projectId;
        }
        return null;
      }
      /**
       * Authenticates the provided HTTP request, processes it and resolves with the
       * returned response.
       * @param opts The HTTP request options.
       * @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure.
       * @return A promise that resolves with the successful response.
       */
      async requestAsync(opts, reAuthRetried = false) {
        let response;
        try {
          const requestHeaders = await this.getRequestHeaders();
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
          this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
          response = await this.transporter.request(opts);
        } catch (e) {
          const res = e.response;
          if (res) {
            const statusCode = res.status;
            const isReadableStream = res.config.data instanceof stream.Readable;
            const isAuthErr = statusCode === 401 || statusCode === 403;
            if (!reAuthRetried && isAuthErr && !isReadableStream && this.forceRefreshOnFailure) {
              await this.refreshAccessTokenAsync();
              return await this.requestAsync(opts, true);
            }
          }
          throw e;
        }
        return response;
      }
      /**
       * Forces token refresh, even if unexpired tokens are currently cached.
       * External credentials are exchanged for GCP access tokens via the token
       * exchange endpoint and other settings provided in the client options
       * object.
       * If the service_account_impersonation_url is provided, an additional
       * step to exchange the external account GCP access token for a service
       * account impersonated token is performed.
       * @return A promise that resolves with the fresh GCP access tokens.
       */
      async refreshAccessTokenAsync() {
        __privateSet(this, _pendingAccessToken, __privateGet(this, _pendingAccessToken) || __privateMethod(this, _BaseExternalAccountClient_instances, internalRefreshAccessTokenAsync_fn).call(this));
        try {
          return await __privateGet(this, _pendingAccessToken);
        } finally {
          __privateSet(this, _pendingAccessToken, null);
        }
      }
      /**
       * Returns the workload identity pool project number if it is determinable
       * from the audience resource name.
       * @param audience The STS audience used to determine the project number.
       * @return The project number associated with the workload identity pool, if
       *   this can be determined from the STS audience field. Otherwise, null is
       *   returned.
       */
      getProjectNumber(audience) {
        const match = audience.match(/\/projects\/([^/]+)/);
        if (!match) {
          return null;
        }
        return match[1];
      }
      /**
       * Exchanges an external account GCP access token for a service
       * account impersonated access token using iamcredentials
       * GenerateAccessToken API.
       * @param token The access token to exchange for a service account access
       *   token.
       * @return A promise that resolves with the service account impersonated
       *   credentials response.
       */
      async getImpersonatedAccessToken(token) {
        const opts = {
          ..._BaseExternalAccountClient.RETRY_CONFIG,
          url: this.serviceAccountImpersonationUrl,
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`
          },
          data: {
            scope: this.getScopesArray(),
            lifetime: this.serviceAccountImpersonationLifetime + "s"
          }
        };
        authclient_1.AuthClient.setMethodName(opts, "getImpersonatedAccessToken");
        const response = await this.transporter.request(opts);
        const successResponse = response.data;
        return {
          access_token: successResponse.accessToken,
          // Convert from ISO format to timestamp.
          expiry_date: new Date(successResponse.expireTime).getTime(),
          res: response
        };
      }
      /**
       * Returns whether the provided credentials are expired or not.
       * If there is no expiry time, assumes the token is not expired or expiring.
       * @param accessToken The credentials to check for expiration.
       * @return Whether the credentials are expired or not.
       */
      isExpired(accessToken) {
        const now = (/* @__PURE__ */ new Date()).getTime();
        return accessToken.expiry_date ? now >= accessToken.expiry_date - this.eagerRefreshThresholdMillis : false;
      }
      /**
       * @return The list of scopes for the requested GCP access token.
       */
      getScopesArray() {
        if (typeof this.scopes === "string") {
          return [this.scopes];
        }
        return this.scopes || [DEFAULT_OAUTH_SCOPE];
      }
      getMetricsHeaderValue() {
        const nodeVersion = process.version.replace(/^v/, "");
        const saImpersonation = this.serviceAccountImpersonationUrl !== void 0;
        const credentialSourceType = this.credentialSourceType ? this.credentialSourceType : "unknown";
        return `gl-node/${nodeVersion} auth/${shared_cjs_1.pkg.version} google-byoid-sdk source/${credentialSourceType} sa-impersonation/${saImpersonation} config-lifetime/${this.configLifetimeRequested}`;
      }
      getTokenUrl() {
        return this.tokenUrl;
      }
    };
    _pendingAccessToken = new WeakMap();
    _BaseExternalAccountClient_instances = new WeakSet();
    internalRefreshAccessTokenAsync_fn = async function() {
      const subjectToken = await this.retrieveSubjectToken();
      const stsCredentialsOptions = {
        grantType: STS_GRANT_TYPE,
        audience: this.audience,
        requestedTokenType: STS_REQUEST_TOKEN_TYPE,
        subjectToken,
        subjectTokenType: this.subjectTokenType,
        // generateAccessToken requires the provided access token to have
        // scopes:
        // https://www.googleapis.com/auth/iam or
        // https://www.googleapis.com/auth/cloud-platform
        // The new service account access token scopes will match the user
        // provided ones.
        scope: this.serviceAccountImpersonationUrl ? [DEFAULT_OAUTH_SCOPE] : this.getScopesArray()
      };
      const additionalOptions = !this.clientAuth && this.workforcePoolUserProject ? { userProject: this.workforcePoolUserProject } : void 0;
      const additionalHeaders = new Headers({
        "x-goog-api-client": this.getMetricsHeaderValue()
      });
      const stsResponse = await this.stsCredential.exchangeToken(stsCredentialsOptions, additionalHeaders, additionalOptions);
      if (this.serviceAccountImpersonationUrl) {
        this.cachedAccessToken = await this.getImpersonatedAccessToken(stsResponse.access_token);
      } else if (stsResponse.expires_in) {
        this.cachedAccessToken = {
          access_token: stsResponse.access_token,
          expiry_date: (/* @__PURE__ */ new Date()).getTime() + stsResponse.expires_in * 1e3,
          res: stsResponse.res
        };
      } else {
        this.cachedAccessToken = {
          access_token: stsResponse.access_token,
          res: stsResponse.res
        };
      }
      this.credentials = {};
      Object.assign(this.credentials, this.cachedAccessToken);
      delete this.credentials.res;
      this.emit("tokens", {
        refresh_token: null,
        expiry_date: this.cachedAccessToken.expiry_date,
        access_token: this.cachedAccessToken.access_token,
        token_type: "Bearer",
        id_token: null
      });
      return this.cachedAccessToken;
    };
    var BaseExternalAccountClient = _BaseExternalAccountClient;
    exports.BaseExternalAccountClient = BaseExternalAccountClient;
  }
});

// node_modules/google-auth-library/build/src/auth/filesubjecttokensupplier.js
var require_filesubjecttokensupplier = __commonJS({
  "node_modules/google-auth-library/build/src/auth/filesubjecttokensupplier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileSubjectTokenSupplier = void 0;
    var util_1 = require_util2();
    var fs = require_fs();
    var readFile = (0, util_1.promisify)(fs.readFile ?? (() => {
    }));
    var realpath = (0, util_1.promisify)(fs.realpath ?? (() => {
    }));
    var lstat = (0, util_1.promisify)(fs.lstat ?? (() => {
    }));
    var FileSubjectTokenSupplier = class {
      /**
       * Instantiates a new file based subject token supplier.
       * @param opts The file subject token supplier options to build the supplier
       *   with.
       */
      constructor(opts) {
        __publicField(this, "filePath");
        __publicField(this, "formatType");
        __publicField(this, "subjectTokenFieldName");
        this.filePath = opts.filePath;
        this.formatType = opts.formatType;
        this.subjectTokenFieldName = opts.subjectTokenFieldName;
      }
      /**
       * Returns the subject token stored at the file specified in the constructor.
       * @param context {@link ExternalAccountSupplierContext} from the calling
       *   {@link IdentityPoolClient}, contains the requested audience and subject
       *   token type for the external account identity. Not used.
       */
      async getSubjectToken() {
        let parsedFilePath = this.filePath;
        try {
          parsedFilePath = await realpath(parsedFilePath);
          if (!(await lstat(parsedFilePath)).isFile()) {
            throw new Error();
          }
        } catch (err) {
          if (err instanceof Error) {
            err.message = `The file at ${parsedFilePath} does not exist, or it is not a file. ${err.message}`;
          }
          throw err;
        }
        let subjectToken;
        const rawText = await readFile(parsedFilePath, { encoding: "utf8" });
        if (this.formatType === "text") {
          subjectToken = rawText;
        } else if (this.formatType === "json" && this.subjectTokenFieldName) {
          const json = JSON.parse(rawText);
          subjectToken = json[this.subjectTokenFieldName];
        }
        if (!subjectToken) {
          throw new Error("Unable to parse the subject_token from the credential_source file");
        }
        return subjectToken;
      }
    };
    exports.FileSubjectTokenSupplier = FileSubjectTokenSupplier;
  }
});

// node_modules/google-auth-library/build/src/auth/urlsubjecttokensupplier.js
var require_urlsubjecttokensupplier = __commonJS({
  "node_modules/google-auth-library/build/src/auth/urlsubjecttokensupplier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UrlSubjectTokenSupplier = void 0;
    var authclient_1 = require_authclient();
    var UrlSubjectTokenSupplier = class {
      /**
       * Instantiates a URL subject token supplier.
       * @param opts The URL subject token supplier options to build the supplier with.
       */
      constructor(opts) {
        __publicField(this, "url");
        __publicField(this, "headers");
        __publicField(this, "formatType");
        __publicField(this, "subjectTokenFieldName");
        __publicField(this, "additionalGaxiosOptions");
        this.url = opts.url;
        this.formatType = opts.formatType;
        this.subjectTokenFieldName = opts.subjectTokenFieldName;
        this.headers = opts.headers;
        this.additionalGaxiosOptions = opts.additionalGaxiosOptions;
      }
      /**
       * Sends a GET request to the URL provided in the constructor and resolves
       * with the returned external subject token.
       * @param context {@link ExternalAccountSupplierContext} from the calling
       *   {@link IdentityPoolClient}, contains the requested audience and subject
       *   token type for the external account identity. Not used.
       */
      async getSubjectToken(context) {
        const opts = {
          ...this.additionalGaxiosOptions,
          url: this.url,
          method: "GET",
          headers: this.headers
        };
        authclient_1.AuthClient.setMethodName(opts, "getSubjectToken");
        let subjectToken;
        if (this.formatType === "text") {
          const response = await context.transporter.request(opts);
          subjectToken = response.data;
        } else if (this.formatType === "json" && this.subjectTokenFieldName) {
          const response = await context.transporter.request(opts);
          subjectToken = response.data[this.subjectTokenFieldName];
        }
        if (!subjectToken) {
          throw new Error("Unable to parse the subject_token from the credential_source URL");
        }
        return subjectToken;
      }
    };
    exports.UrlSubjectTokenSupplier = UrlSubjectTokenSupplier;
  }
});

// node_modules/google-auth-library/build/src/auth/certificatesubjecttokensupplier.js
var require_certificatesubjecttokensupplier = __commonJS({
  "node_modules/google-auth-library/build/src/auth/certificatesubjecttokensupplier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CertificateSubjectTokenSupplier = exports.InvalidConfigurationError = exports.CertificateSourceUnavailableError = exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE = void 0;
    var util_1 = require_util3();
    var fs = require_fs();
    var crypto_1 = require_crypto();
    var https = require_https();
    exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE = "GOOGLE_API_CERTIFICATE_CONFIG";
    var CertificateSourceUnavailableError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "CertificateSourceUnavailableError";
      }
    };
    exports.CertificateSourceUnavailableError = CertificateSourceUnavailableError;
    var InvalidConfigurationError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "InvalidConfigurationError";
      }
    };
    exports.InvalidConfigurationError = InvalidConfigurationError;
    var _CertificateSubjectTokenSupplier_instances, resolveCertificateConfigFilePath_fn, getCertAndKeyPaths_fn, getKeyAndCert_fn, processChainFromPaths_fn;
    var CertificateSubjectTokenSupplier = class {
      /**
       * Initializes a new instance of the CertificateSubjectTokenSupplier.
       * @param opts The configuration options for the supplier.
       */
      constructor(opts) {
        __privateAdd(this, _CertificateSubjectTokenSupplier_instances);
        __publicField(this, "certificateConfigPath");
        __publicField(this, "trustChainPath");
        __publicField(this, "cert");
        __publicField(this, "key");
        if (!opts.useDefaultCertificateConfig && !opts.certificateConfigLocation) {
          throw new InvalidConfigurationError("Either `useDefaultCertificateConfig` must be true or a `certificateConfigLocation` must be provided.");
        }
        if (opts.useDefaultCertificateConfig && opts.certificateConfigLocation) {
          throw new InvalidConfigurationError("Both `useDefaultCertificateConfig` and `certificateConfigLocation` cannot be provided.");
        }
        this.trustChainPath = opts.trustChainPath;
        this.certificateConfigPath = opts.certificateConfigLocation ?? "";
      }
      /**
       * Creates an HTTPS agent configured with the client certificate and private key for mTLS.
       * @returns An mTLS-configured https.Agent.
       */
      async createMtlsHttpsAgent() {
        if (!this.key || !this.cert) {
          throw new InvalidConfigurationError("Cannot create mTLS Agent with missing certificate or key");
        }
        return new https.Agent({ key: this.key, cert: this.cert });
      }
      /**
       * Constructs the subject token, which is the base64-encoded certificate chain.
       * @returns A promise that resolves with the subject token.
       */
      async getSubjectToken() {
        this.certificateConfigPath = await __privateMethod(this, _CertificateSubjectTokenSupplier_instances, resolveCertificateConfigFilePath_fn).call(this);
        const { certPath, keyPath } = await __privateMethod(this, _CertificateSubjectTokenSupplier_instances, getCertAndKeyPaths_fn).call(this);
        ({ cert: this.cert, key: this.key } = await __privateMethod(this, _CertificateSubjectTokenSupplier_instances, getKeyAndCert_fn).call(this, certPath, keyPath));
        return await __privateMethod(this, _CertificateSubjectTokenSupplier_instances, processChainFromPaths_fn).call(this, this.cert);
      }
    };
    _CertificateSubjectTokenSupplier_instances = new WeakSet();
    resolveCertificateConfigFilePath_fn = async function() {
      const overridePath = this.certificateConfigPath;
      if (overridePath) {
        if (await (0, util_1.isValidFile)(overridePath)) {
          return overridePath;
        }
        throw new CertificateSourceUnavailableError(`Provided certificate config path is invalid: ${overridePath}`);
      }
      const envPath = process.env[exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE];
      if (envPath) {
        if (await (0, util_1.isValidFile)(envPath)) {
          return envPath;
        }
        throw new CertificateSourceUnavailableError(`Path from environment variable "${exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE}" is invalid: ${envPath}`);
      }
      const wellKnownPath = (0, util_1.getWellKnownCertificateConfigFileLocation)();
      if (await (0, util_1.isValidFile)(wellKnownPath)) {
        return wellKnownPath;
      }
      throw new CertificateSourceUnavailableError(`Could not find certificate configuration file. Searched override path, the "${exports.CERTIFICATE_CONFIGURATION_ENV_VARIABLE}" env var, and the gcloud path (${wellKnownPath}).`);
    };
    getCertAndKeyPaths_fn = async function() {
      var _a, _b, _c, _d;
      const configPath = this.certificateConfigPath;
      let fileContents;
      try {
        fileContents = await fs.promises.readFile(configPath, "utf8");
      } catch (err) {
        throw new CertificateSourceUnavailableError(`Failed to read certificate config file at: ${configPath}`);
      }
      try {
        const config = JSON.parse(fileContents);
        const certPath = (_b = (_a = config == null ? void 0 : config.cert_configs) == null ? void 0 : _a.workload) == null ? void 0 : _b.cert_path;
        const keyPath = (_d = (_c = config == null ? void 0 : config.cert_configs) == null ? void 0 : _c.workload) == null ? void 0 : _d.key_path;
        if (!certPath || !keyPath) {
          throw new InvalidConfigurationError(`Certificate config file (${configPath}) is missing required "cert_path" or "key_path" in the workload config.`);
        }
        return { certPath, keyPath };
      } catch (e) {
        if (e instanceof InvalidConfigurationError)
          throw e;
        throw new InvalidConfigurationError(`Failed to parse certificate config from ${configPath}: ${e.message}`);
      }
    };
    getKeyAndCert_fn = async function(certPath, keyPath) {
      let cert, key;
      try {
        cert = await fs.promises.readFile(certPath);
        new crypto_1.X509Certificate(cert);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new CertificateSourceUnavailableError(`Failed to read certificate file at ${certPath}: ${message}`);
      }
      try {
        key = await fs.promises.readFile(keyPath);
        (0, crypto_1.createPrivateKey)(key);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new CertificateSourceUnavailableError(`Failed to read private key file at ${keyPath}: ${message}`);
      }
      return { cert, key };
    };
    processChainFromPaths_fn = async function(leafCertBuffer) {
      const leafCert = new crypto_1.X509Certificate(leafCertBuffer);
      if (!this.trustChainPath) {
        return JSON.stringify([leafCert.raw.toString("base64")]);
      }
      try {
        const chainPems = await fs.promises.readFile(this.trustChainPath, "utf8");
        const pemBlocks = chainPems.match(/-----BEGIN CERTIFICATE-----[^-]+-----END CERTIFICATE-----/g) ?? [];
        const chainCerts = pemBlocks.map((pem, index) => {
          try {
            return new crypto_1.X509Certificate(pem);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new InvalidConfigurationError(`Failed to parse certificate at index ${index} in trust chain file ${this.trustChainPath}: ${message}`);
          }
        });
        const leafIndex = chainCerts.findIndex((chainCert) => leafCert.raw.equals(chainCert.raw));
        let finalChain;
        if (leafIndex === -1) {
          finalChain = [leafCert, ...chainCerts];
        } else if (leafIndex === 0) {
          finalChain = chainCerts;
        } else {
          throw new InvalidConfigurationError(`Leaf certificate exists in the trust chain but is not the first entry (found at index ${leafIndex}).`);
        }
        return JSON.stringify(finalChain.map((cert) => cert.raw.toString("base64")));
      } catch (err) {
        if (err instanceof InvalidConfigurationError)
          throw err;
        const message = err instanceof Error ? err.message : String(err);
        throw new CertificateSourceUnavailableError(`Failed to process certificate chain from ${this.trustChainPath}: ${message}`);
      }
    };
    exports.CertificateSubjectTokenSupplier = CertificateSubjectTokenSupplier;
  }
});

// node_modules/google-auth-library/build/src/auth/identitypoolclient.js
var require_identitypoolclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/identitypoolclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IdentityPoolClient = void 0;
    var baseexternalclient_1 = require_baseexternalclient();
    var util_1 = require_util3();
    var filesubjecttokensupplier_1 = require_filesubjecttokensupplier();
    var urlsubjecttokensupplier_1 = require_urlsubjecttokensupplier();
    var certificatesubjecttokensupplier_1 = require_certificatesubjecttokensupplier();
    var stscredentials_1 = require_stscredentials();
    var gaxios_1 = require_src3();
    var IdentityPoolClient = class _IdentityPoolClient extends baseexternalclient_1.BaseExternalAccountClient {
      /**
       * Instantiate an IdentityPoolClient instance using the provided JSON
       * object loaded from an external account credentials file.
       * An error is thrown if the credential is not a valid file-sourced or
       * url-sourced credential or a workforce pool user project is provided
       * with a non workforce audience.
       * @param options The external account options object typically loaded
       *   from the external account JSON credential file. The camelCased options
       *   are aliases for the snake_cased options.
       */
      constructor(options) {
        super(options);
        __publicField(this, "subjectTokenSupplier");
        const opts = (0, util_1.originalOrCamelOptions)(options);
        const credentialSource = opts.get("credential_source");
        const subjectTokenSupplier = opts.get("subject_token_supplier");
        if (!credentialSource && !subjectTokenSupplier) {
          throw new Error("A credential source or subject token supplier must be specified.");
        }
        if (credentialSource && subjectTokenSupplier) {
          throw new Error("Only one of credential source or subject token supplier can be specified.");
        }
        if (subjectTokenSupplier) {
          this.subjectTokenSupplier = subjectTokenSupplier;
          this.credentialSourceType = "programmatic";
        } else {
          const credentialSourceOpts = (0, util_1.originalOrCamelOptions)(credentialSource);
          const formatOpts = (0, util_1.originalOrCamelOptions)(credentialSourceOpts.get("format"));
          const formatType = formatOpts.get("type") || "text";
          const formatSubjectTokenFieldName = formatOpts.get("subject_token_field_name");
          if (formatType !== "json" && formatType !== "text") {
            throw new Error(`Invalid credential_source format "${formatType}"`);
          }
          if (formatType === "json" && !formatSubjectTokenFieldName) {
            throw new Error("Missing subject_token_field_name for JSON credential_source format");
          }
          const file = credentialSourceOpts.get("file");
          const url = credentialSourceOpts.get("url");
          const certificate = credentialSourceOpts.get("certificate");
          const headers = credentialSourceOpts.get("headers");
          if (file && url || url && certificate || file && certificate) {
            throw new Error('No valid Identity Pool "credential_source" provided, must be either file, url, or certificate.');
          } else if (file) {
            this.credentialSourceType = "file";
            this.subjectTokenSupplier = new filesubjecttokensupplier_1.FileSubjectTokenSupplier({
              filePath: file,
              formatType,
              subjectTokenFieldName: formatSubjectTokenFieldName
            });
          } else if (url) {
            this.credentialSourceType = "url";
            this.subjectTokenSupplier = new urlsubjecttokensupplier_1.UrlSubjectTokenSupplier({
              url,
              formatType,
              subjectTokenFieldName: formatSubjectTokenFieldName,
              headers,
              additionalGaxiosOptions: _IdentityPoolClient.RETRY_CONFIG
            });
          } else if (certificate) {
            this.credentialSourceType = "certificate";
            const certificateSubjecttokensupplier = new certificatesubjecttokensupplier_1.CertificateSubjectTokenSupplier({
              useDefaultCertificateConfig: certificate.use_default_certificate_config,
              certificateConfigLocation: certificate.certificate_config_location,
              trustChainPath: certificate.trust_chain_path
            });
            this.subjectTokenSupplier = certificateSubjecttokensupplier;
          } else {
            throw new Error('No valid Identity Pool "credential_source" provided, must be either file, url, or certificate.');
          }
        }
      }
      /**
       * Triggered when a external subject token is needed to be exchanged for a GCP
       * access token via GCP STS endpoint. Gets a subject token by calling
       * the configured {@link SubjectTokenSupplier}
       * @return A promise that resolves with the external subject token.
       */
      async retrieveSubjectToken() {
        const subjectToken = await this.subjectTokenSupplier.getSubjectToken(this.supplierContext);
        if (this.subjectTokenSupplier instanceof certificatesubjecttokensupplier_1.CertificateSubjectTokenSupplier) {
          const mtlsAgent = await this.subjectTokenSupplier.createMtlsHttpsAgent();
          this.stsCredential = new stscredentials_1.StsCredentials({
            tokenExchangeEndpoint: this.getTokenUrl(),
            clientAuthentication: this.clientAuth,
            transporter: new gaxios_1.Gaxios({ agent: mtlsAgent })
          });
          this.transporter = new gaxios_1.Gaxios({
            ...this.transporter.defaults || {},
            agent: mtlsAgent
          });
        }
        return subjectToken;
      }
    };
    exports.IdentityPoolClient = IdentityPoolClient;
  }
});

// node_modules/google-auth-library/build/src/auth/awsrequestsigner.js
var require_awsrequestsigner = __commonJS({
  "node_modules/google-auth-library/build/src/auth/awsrequestsigner.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AwsRequestSigner = void 0;
    var gaxios_1 = require_src3();
    var crypto_1 = require_crypto4();
    var AWS_ALGORITHM = "AWS4-HMAC-SHA256";
    var AWS_REQUEST_TYPE = "aws4_request";
    var AwsRequestSigner = class {
      /**
       * Instantiates an AWS API request signer used to send authenticated signed
       * requests to AWS APIs based on the AWS Signature Version 4 signing process.
       * This also provides a mechanism to generate the signed request without
       * sending it.
       * @param getCredentials A mechanism to retrieve AWS security credentials
       *   when needed.
       * @param region The AWS region to use.
       */
      constructor(getCredentials, region) {
        __publicField(this, "getCredentials");
        __publicField(this, "region");
        __publicField(this, "crypto");
        this.getCredentials = getCredentials;
        this.region = region;
        this.crypto = (0, crypto_1.createCrypto)();
      }
      /**
       * Generates the signed request for the provided HTTP request for calling
       * an AWS API. This follows the steps described at:
       * https://docs.aws.amazon.com/general/latest/gr/sigv4_signing.html
       * @param amzOptions The AWS request options that need to be signed.
       * @return A promise that resolves with the GaxiosOptions containing the
       *   signed HTTP request parameters.
       */
      async getRequestOptions(amzOptions) {
        if (!amzOptions.url) {
          throw new RangeError('"url" is required in "amzOptions"');
        }
        const requestPayloadData = typeof amzOptions.data === "object" ? JSON.stringify(amzOptions.data) : amzOptions.data;
        const url = amzOptions.url;
        const method = amzOptions.method || "GET";
        const requestPayload = amzOptions.body || requestPayloadData;
        const additionalAmzHeaders = amzOptions.headers;
        const awsSecurityCredentials = await this.getCredentials();
        const uri = new URL(url);
        if (typeof requestPayload !== "string" && requestPayload !== void 0) {
          throw new TypeError(`'requestPayload' is expected to be a string if provided. Got: ${requestPayload}`);
        }
        const headerMap = await generateAuthenticationHeaderMap({
          crypto: this.crypto,
          host: uri.host,
          canonicalUri: uri.pathname,
          canonicalQuerystring: uri.search.slice(1),
          method,
          region: this.region,
          securityCredentials: awsSecurityCredentials,
          requestPayload,
          additionalAmzHeaders
        });
        const headers = gaxios_1.Gaxios.mergeHeaders(
          // Add x-amz-date if available.
          headerMap.amzDate ? { "x-amz-date": headerMap.amzDate } : {},
          {
            authorization: headerMap.authorizationHeader,
            host: uri.host
          },
          additionalAmzHeaders || {}
        );
        if (awsSecurityCredentials.token) {
          gaxios_1.Gaxios.mergeHeaders(headers, {
            "x-amz-security-token": awsSecurityCredentials.token
          });
        }
        const awsSignedReq = {
          url,
          method,
          headers
        };
        if (requestPayload !== void 0) {
          awsSignedReq.body = requestPayload;
        }
        return awsSignedReq;
      }
    };
    exports.AwsRequestSigner = AwsRequestSigner;
    async function sign(crypto2, key, msg) {
      return await crypto2.signWithHmacSha256(key, msg);
    }
    async function getSigningKey(crypto2, key, dateStamp, region, serviceName) {
      const kDate = await sign(crypto2, `AWS4${key}`, dateStamp);
      const kRegion = await sign(crypto2, kDate, region);
      const kService = await sign(crypto2, kRegion, serviceName);
      const kSigning = await sign(crypto2, kService, "aws4_request");
      return kSigning;
    }
    async function generateAuthenticationHeaderMap(options) {
      const additionalAmzHeaders = gaxios_1.Gaxios.mergeHeaders(options.additionalAmzHeaders);
      const requestPayload = options.requestPayload || "";
      const serviceName = options.host.split(".")[0];
      const now = /* @__PURE__ */ new Date();
      const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.[0-9]+/, "");
      const dateStamp = now.toISOString().replace(/[-]/g, "").replace(/T.*/, "");
      if (options.securityCredentials.token) {
        additionalAmzHeaders.set("x-amz-security-token", options.securityCredentials.token);
      }
      const amzHeaders = gaxios_1.Gaxios.mergeHeaders(
        {
          host: options.host
        },
        // Previously the date was not fixed with x-amz- and could be provided manually.
        // https://github.com/boto/botocore/blob/879f8440a4e9ace5d3cf145ce8b3d5e5ffb892ef/tests/unit/auth/aws4_testsuite/get-header-value-trim.req
        additionalAmzHeaders.has("date") ? {} : { "x-amz-date": amzDate },
        additionalAmzHeaders
      );
      let canonicalHeaders = "";
      const signedHeadersList = [
        ...amzHeaders.keys()
      ].sort();
      signedHeadersList.forEach((key) => {
        canonicalHeaders += `${key}:${amzHeaders.get(key)}
`;
      });
      const signedHeaders = signedHeadersList.join(";");
      const payloadHash = await options.crypto.sha256DigestHex(requestPayload);
      const canonicalRequest = `${options.method.toUpperCase()}
${options.canonicalUri}
${options.canonicalQuerystring}
${canonicalHeaders}
${signedHeaders}
${payloadHash}`;
      const credentialScope = `${dateStamp}/${options.region}/${serviceName}/${AWS_REQUEST_TYPE}`;
      const stringToSign = `${AWS_ALGORITHM}
${amzDate}
${credentialScope}
` + await options.crypto.sha256DigestHex(canonicalRequest);
      const signingKey = await getSigningKey(options.crypto, options.securityCredentials.secretAccessKey, dateStamp, options.region, serviceName);
      const signature = await sign(options.crypto, signingKey, stringToSign);
      const authorizationHeader = `${AWS_ALGORITHM} Credential=${options.securityCredentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${(0, crypto_1.fromArrayBufferToHex)(signature)}`;
      return {
        // Do not return x-amz-date if date is available.
        amzDate: additionalAmzHeaders.has("date") ? void 0 : amzDate,
        authorizationHeader,
        canonicalQuerystring: options.canonicalQuerystring
      };
    }
  }
});

// node_modules/google-auth-library/build/src/auth/defaultawssecuritycredentialssupplier.js
var require_defaultawssecuritycredentialssupplier = __commonJS({
  "node_modules/google-auth-library/build/src/auth/defaultawssecuritycredentialssupplier.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultAwsSecurityCredentialsSupplier = void 0;
    var authclient_1 = require_authclient();
    var _DefaultAwsSecurityCredentialsSupplier_instances, getImdsV2SessionToken_fn, getAwsRoleName_fn, retrieveAwsSecurityCredentials_fn, regionFromEnv_get, securityCredentialsFromEnv_get;
    var DefaultAwsSecurityCredentialsSupplier = class {
      /**
       * Instantiates a new DefaultAwsSecurityCredentialsSupplier using information
       * from the credential_source stored in the ADC file.
       * @param opts The default aws security credentials supplier options object to
       *   build the supplier with.
       */
      constructor(opts) {
        __privateAdd(this, _DefaultAwsSecurityCredentialsSupplier_instances);
        __publicField(this, "regionUrl");
        __publicField(this, "securityCredentialsUrl");
        __publicField(this, "imdsV2SessionTokenUrl");
        __publicField(this, "additionalGaxiosOptions");
        this.regionUrl = opts.regionUrl;
        this.securityCredentialsUrl = opts.securityCredentialsUrl;
        this.imdsV2SessionTokenUrl = opts.imdsV2SessionTokenUrl;
        this.additionalGaxiosOptions = opts.additionalGaxiosOptions;
      }
      /**
       * Returns the active AWS region. This first checks to see if the region
       * is available as an environment variable. If it is not, then the supplier
       * will call the region URL.
       * @param context {@link ExternalAccountSupplierContext} from the calling
       *   {@link AwsClient}, contains the requested audience and subject token type
       *   for the external account identity.
       * @return A promise that resolves with the AWS region string.
       */
      async getAwsRegion(context) {
        if (__privateGet(this, _DefaultAwsSecurityCredentialsSupplier_instances, regionFromEnv_get)) {
          return __privateGet(this, _DefaultAwsSecurityCredentialsSupplier_instances, regionFromEnv_get);
        }
        const metadataHeaders = new Headers();
        if (!__privateGet(this, _DefaultAwsSecurityCredentialsSupplier_instances, regionFromEnv_get) && this.imdsV2SessionTokenUrl) {
          metadataHeaders.set("x-aws-ec2-metadata-token", await __privateMethod(this, _DefaultAwsSecurityCredentialsSupplier_instances, getImdsV2SessionToken_fn).call(this, context.transporter));
        }
        if (!this.regionUrl) {
          throw new RangeError('Unable to determine AWS region due to missing "options.credential_source.region_url"');
        }
        const opts = {
          ...this.additionalGaxiosOptions,
          url: this.regionUrl,
          method: "GET",
          headers: metadataHeaders
        };
        authclient_1.AuthClient.setMethodName(opts, "getAwsRegion");
        const response = await context.transporter.request(opts);
        return response.data.substr(0, response.data.length - 1);
      }
      /**
       * Returns AWS security credentials. This first checks to see if the credentials
       * is available as environment variables. If it is not, then the supplier
       * will call the security credentials URL.
       * @param context {@link ExternalAccountSupplierContext} from the calling
       *   {@link AwsClient}, contains the requested audience and subject token type
       *   for the external account identity.
       * @return A promise that resolves with the AWS security credentials.
       */
      async getAwsSecurityCredentials(context) {
        if (__privateGet(this, _DefaultAwsSecurityCredentialsSupplier_instances, securityCredentialsFromEnv_get)) {
          return __privateGet(this, _DefaultAwsSecurityCredentialsSupplier_instances, securityCredentialsFromEnv_get);
        }
        const metadataHeaders = new Headers();
        if (this.imdsV2SessionTokenUrl) {
          metadataHeaders.set("x-aws-ec2-metadata-token", await __privateMethod(this, _DefaultAwsSecurityCredentialsSupplier_instances, getImdsV2SessionToken_fn).call(this, context.transporter));
        }
        const roleName = await __privateMethod(this, _DefaultAwsSecurityCredentialsSupplier_instances, getAwsRoleName_fn).call(this, metadataHeaders, context.transporter);
        const awsCreds = await __privateMethod(this, _DefaultAwsSecurityCredentialsSupplier_instances, retrieveAwsSecurityCredentials_fn).call(this, roleName, metadataHeaders, context.transporter);
        return {
          accessKeyId: awsCreds.AccessKeyId,
          secretAccessKey: awsCreds.SecretAccessKey,
          token: awsCreds.Token
        };
      }
    };
    _DefaultAwsSecurityCredentialsSupplier_instances = new WeakSet();
    getImdsV2SessionToken_fn = async function(transporter) {
      const opts = {
        ...this.additionalGaxiosOptions,
        url: this.imdsV2SessionTokenUrl,
        method: "PUT",
        headers: { "x-aws-ec2-metadata-token-ttl-seconds": "300" }
      };
      authclient_1.AuthClient.setMethodName(opts, "#getImdsV2SessionToken");
      const response = await transporter.request(opts);
      return response.data;
    };
    getAwsRoleName_fn = async function(headers, transporter) {
      if (!this.securityCredentialsUrl) {
        throw new Error('Unable to determine AWS role name due to missing "options.credential_source.url"');
      }
      const opts = {
        ...this.additionalGaxiosOptions,
        url: this.securityCredentialsUrl,
        method: "GET",
        headers
      };
      authclient_1.AuthClient.setMethodName(opts, "#getAwsRoleName");
      const response = await transporter.request(opts);
      return response.data;
    };
    retrieveAwsSecurityCredentials_fn = async function(roleName, headers, transporter) {
      const opts = {
        ...this.additionalGaxiosOptions,
        url: `${this.securityCredentialsUrl}/${roleName}`,
        headers
      };
      authclient_1.AuthClient.setMethodName(opts, "#retrieveAwsSecurityCredentials");
      const response = await transporter.request(opts);
      return response.data;
    };
    regionFromEnv_get = function() {
      return process.env["AWS_REGION"] || process.env["AWS_DEFAULT_REGION"] || null;
    };
    securityCredentialsFromEnv_get = function() {
      if (process.env["AWS_ACCESS_KEY_ID"] && process.env["AWS_SECRET_ACCESS_KEY"]) {
        return {
          accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
          secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
          token: process.env["AWS_SESSION_TOKEN"]
        };
      }
      return null;
    };
    exports.DefaultAwsSecurityCredentialsSupplier = DefaultAwsSecurityCredentialsSupplier;
  }
});

// node_modules/google-auth-library/build/src/auth/awsclient.js
var require_awsclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/awsclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AwsClient = void 0;
    var awsrequestsigner_1 = require_awsrequestsigner();
    var baseexternalclient_1 = require_baseexternalclient();
    var defaultawssecuritycredentialssupplier_1 = require_defaultawssecuritycredentialssupplier();
    var util_1 = require_util3();
    var gaxios_1 = require_src3();
    var _DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL;
    var _AwsClient = class _AwsClient extends baseexternalclient_1.BaseExternalAccountClient {
      /**
       * Instantiates an AwsClient instance using the provided JSON
       * object loaded from an external account credentials file.
       * An error is thrown if the credential is not a valid AWS credential.
       * @param options The external account options object typically loaded
       *   from the external account JSON credential file.
       */
      constructor(options) {
        super(options);
        __publicField(this, "environmentId");
        __publicField(this, "awsSecurityCredentialsSupplier");
        __publicField(this, "regionalCredVerificationUrl");
        __publicField(this, "awsRequestSigner");
        __publicField(this, "region");
        const opts = (0, util_1.originalOrCamelOptions)(options);
        const credentialSource = opts.get("credential_source");
        const awsSecurityCredentialsSupplier = opts.get("aws_security_credentials_supplier");
        if (!credentialSource && !awsSecurityCredentialsSupplier) {
          throw new Error("A credential source or AWS security credentials supplier must be specified.");
        }
        if (credentialSource && awsSecurityCredentialsSupplier) {
          throw new Error("Only one of credential source or AWS security credentials supplier can be specified.");
        }
        if (awsSecurityCredentialsSupplier) {
          this.awsSecurityCredentialsSupplier = awsSecurityCredentialsSupplier;
          this.regionalCredVerificationUrl = __privateGet(_AwsClient, _DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL);
          this.credentialSourceType = "programmatic";
        } else {
          const credentialSourceOpts = (0, util_1.originalOrCamelOptions)(credentialSource);
          this.environmentId = credentialSourceOpts.get("environment_id");
          const regionUrl = credentialSourceOpts.get("region_url");
          const securityCredentialsUrl = credentialSourceOpts.get("url");
          const imdsV2SessionTokenUrl = credentialSourceOpts.get("imdsv2_session_token_url");
          this.awsSecurityCredentialsSupplier = new defaultawssecuritycredentialssupplier_1.DefaultAwsSecurityCredentialsSupplier({
            regionUrl,
            securityCredentialsUrl,
            imdsV2SessionTokenUrl
          });
          this.regionalCredVerificationUrl = credentialSourceOpts.get("regional_cred_verification_url");
          this.credentialSourceType = "aws";
          this.validateEnvironmentId();
        }
        this.awsRequestSigner = null;
        this.region = "";
      }
      validateEnvironmentId() {
        var _a;
        const match = (_a = this.environmentId) == null ? void 0 : _a.match(/^(aws)(\d+)$/);
        if (!match || !this.regionalCredVerificationUrl) {
          throw new Error('No valid AWS "credential_source" provided');
        } else if (parseInt(match[2], 10) !== 1) {
          throw new Error(`aws version "${match[2]}" is not supported in the current build.`);
        }
      }
      /**
       * Triggered when an external subject token is needed to be exchanged for a
       * GCP access token via GCP STS endpoint. This will call the
       * {@link AwsSecurityCredentialsSupplier} to retrieve an AWS region and AWS
       * Security Credentials, then use them to create a signed AWS STS request that
       * can be exchanged for a GCP access token.
       * @return A promise that resolves with the external subject token.
       */
      async retrieveSubjectToken() {
        if (!this.awsRequestSigner) {
          this.region = await this.awsSecurityCredentialsSupplier.getAwsRegion(this.supplierContext);
          this.awsRequestSigner = new awsrequestsigner_1.AwsRequestSigner(async () => {
            return this.awsSecurityCredentialsSupplier.getAwsSecurityCredentials(this.supplierContext);
          }, this.region);
        }
        const options = await this.awsRequestSigner.getRequestOptions({
          ..._AwsClient.RETRY_CONFIG,
          url: this.regionalCredVerificationUrl.replace("{region}", this.region),
          method: "POST"
        });
        const reformattedHeader = [];
        const extendedHeaders = gaxios_1.Gaxios.mergeHeaders({
          // The full, canonical resource name of the workload identity pool
          // provider, with or without the HTTPS prefix.
          // Including this header as part of the signature is recommended to
          // ensure data integrity.
          "x-goog-cloud-target-resource": this.audience
        }, options.headers);
        extendedHeaders.forEach((value, key) => reformattedHeader.push({ key, value }));
        return encodeURIComponent(JSON.stringify({
          url: options.url,
          method: options.method,
          headers: reformattedHeader
        }));
      }
    };
    _DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL = new WeakMap();
    __privateAdd(_AwsClient, _DEFAULT_AWS_REGIONAL_CREDENTIAL_VERIFICATION_URL, "https://sts.{region}.amazonaws.com?Action=GetCallerIdentity&Version=2011-06-15");
    /**
     * @deprecated AWS client no validates the EC2 metadata address.
     **/
    __publicField(_AwsClient, "AWS_EC2_METADATA_IPV4_ADDRESS", "169.254.169.254");
    /**
     * @deprecated AWS client no validates the EC2 metadata address.
     **/
    __publicField(_AwsClient, "AWS_EC2_METADATA_IPV6_ADDRESS", "fd00:ec2::254");
    var AwsClient = _AwsClient;
    exports.AwsClient = AwsClient;
  }
});

// node_modules/google-auth-library/build/src/auth/executable-response.js
var require_executable_response = __commonJS({
  "node_modules/google-auth-library/build/src/auth/executable-response.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidSubjectTokenError = exports.InvalidMessageFieldError = exports.InvalidCodeFieldError = exports.InvalidTokenTypeFieldError = exports.InvalidExpirationTimeFieldError = exports.InvalidSuccessFieldError = exports.InvalidVersionFieldError = exports.ExecutableResponseError = exports.ExecutableResponse = void 0;
    var SAML_SUBJECT_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:saml2";
    var OIDC_SUBJECT_TOKEN_TYPE1 = "urn:ietf:params:oauth:token-type:id_token";
    var OIDC_SUBJECT_TOKEN_TYPE2 = "urn:ietf:params:oauth:token-type:jwt";
    var ExecutableResponse = class {
      /**
       * Instantiates an ExecutableResponse instance using the provided JSON object
       * from the output of the executable.
       * @param responseJson Response from a 3rd party executable, loaded from a
       * run of the executable or a cached output file.
       */
      constructor(responseJson) {
        /**
         * The version of the Executable response. Only version 1 is currently supported.
         */
        __publicField(this, "version");
        /**
         * Whether the executable ran successfully.
         */
        __publicField(this, "success");
        /**
         * The epoch time for expiration of the token in seconds.
         */
        __publicField(this, "expirationTime");
        /**
         * The type of subject token in the response, currently supported values are:
         * urn:ietf:params:oauth:token-type:saml2
         * urn:ietf:params:oauth:token-type:id_token
         * urn:ietf:params:oauth:token-type:jwt
         */
        __publicField(this, "tokenType");
        /**
         * The error code from the executable.
         */
        __publicField(this, "errorCode");
        /**
         * The error message from the executable.
         */
        __publicField(this, "errorMessage");
        /**
         * The subject token from the executable, format depends on tokenType.
         */
        __publicField(this, "subjectToken");
        if (!responseJson.version) {
          throw new InvalidVersionFieldError("Executable response must contain a 'version' field.");
        }
        if (responseJson.success === void 0) {
          throw new InvalidSuccessFieldError("Executable response must contain a 'success' field.");
        }
        this.version = responseJson.version;
        this.success = responseJson.success;
        if (this.success) {
          this.expirationTime = responseJson.expiration_time;
          this.tokenType = responseJson.token_type;
          if (this.tokenType !== SAML_SUBJECT_TOKEN_TYPE && this.tokenType !== OIDC_SUBJECT_TOKEN_TYPE1 && this.tokenType !== OIDC_SUBJECT_TOKEN_TYPE2) {
            throw new InvalidTokenTypeFieldError(`Executable response must contain a 'token_type' field when successful and it must be one of ${OIDC_SUBJECT_TOKEN_TYPE1}, ${OIDC_SUBJECT_TOKEN_TYPE2}, or ${SAML_SUBJECT_TOKEN_TYPE}.`);
          }
          if (this.tokenType === SAML_SUBJECT_TOKEN_TYPE) {
            if (!responseJson.saml_response) {
              throw new InvalidSubjectTokenError(`Executable response must contain a 'saml_response' field when token_type=${SAML_SUBJECT_TOKEN_TYPE}.`);
            }
            this.subjectToken = responseJson.saml_response;
          } else {
            if (!responseJson.id_token) {
              throw new InvalidSubjectTokenError(`Executable response must contain a 'id_token' field when token_type=${OIDC_SUBJECT_TOKEN_TYPE1} or ${OIDC_SUBJECT_TOKEN_TYPE2}.`);
            }
            this.subjectToken = responseJson.id_token;
          }
        } else {
          if (!responseJson.code) {
            throw new InvalidCodeFieldError("Executable response must contain a 'code' field when unsuccessful.");
          }
          if (!responseJson.message) {
            throw new InvalidMessageFieldError("Executable response must contain a 'message' field when unsuccessful.");
          }
          this.errorCode = responseJson.code;
          this.errorMessage = responseJson.message;
        }
      }
      /**
       * @return A boolean representing if the response has a valid token. Returns
       * true when the response was successful and the token is not expired.
       */
      isValid() {
        return !this.isExpired() && this.success;
      }
      /**
       * @return A boolean representing if the response is expired. Returns true if the
       * provided timeout has passed.
       */
      isExpired() {
        return this.expirationTime !== void 0 && this.expirationTime < Math.round(Date.now() / 1e3);
      }
    };
    exports.ExecutableResponse = ExecutableResponse;
    var ExecutableResponseError = class extends Error {
      constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
      }
    };
    exports.ExecutableResponseError = ExecutableResponseError;
    var InvalidVersionFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidVersionFieldError = InvalidVersionFieldError;
    var InvalidSuccessFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidSuccessFieldError = InvalidSuccessFieldError;
    var InvalidExpirationTimeFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidExpirationTimeFieldError = InvalidExpirationTimeFieldError;
    var InvalidTokenTypeFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidTokenTypeFieldError = InvalidTokenTypeFieldError;
    var InvalidCodeFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidCodeFieldError = InvalidCodeFieldError;
    var InvalidMessageFieldError = class extends ExecutableResponseError {
    };
    exports.InvalidMessageFieldError = InvalidMessageFieldError;
    var InvalidSubjectTokenError = class extends ExecutableResponseError {
    };
    exports.InvalidSubjectTokenError = InvalidSubjectTokenError;
  }
});

// node_modules/google-auth-library/build/src/auth/pluggable-auth-handler.js
var require_pluggable_auth_handler = __commonJS({
  "node_modules/google-auth-library/build/src/auth/pluggable-auth-handler.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PluggableAuthHandler = exports.ExecutableError = void 0;
    var executable_response_1 = require_executable_response();
    var childProcess = require_child_process();
    var fs = require_fs();
    var ExecutableError = class extends Error {
      constructor(message, code) {
        super(`The executable failed with exit code: ${code} and error message: ${message}.`);
        /**
         * The exit code returned by the executable.
         */
        __publicField(this, "code");
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
      }
    };
    exports.ExecutableError = ExecutableError;
    var PluggableAuthHandler = class _PluggableAuthHandler {
      /**
       * Instantiates a PluggableAuthHandler instance using the provided
       * PluggableAuthHandlerOptions object.
       */
      constructor(options) {
        __publicField(this, "commandComponents");
        __publicField(this, "timeoutMillis");
        __publicField(this, "outputFile");
        if (!options.command) {
          throw new Error("No command provided.");
        }
        this.commandComponents = _PluggableAuthHandler.parseCommand(options.command);
        this.timeoutMillis = options.timeoutMillis;
        if (!this.timeoutMillis) {
          throw new Error("No timeoutMillis provided.");
        }
        this.outputFile = options.outputFile;
      }
      /**
       * Calls user provided executable to get a 3rd party subject token and
       * returns the response.
       * @param envMap a Map of additional Environment Variables required for
       *   the executable.
       * @return A promise that resolves with the executable response.
       */
      retrieveResponseFromExecutable(envMap) {
        return new Promise((resolve, reject) => {
          const child = childProcess.spawn(this.commandComponents[0], this.commandComponents.slice(1), {
            env: { ...process.env, ...Object.fromEntries(envMap) }
          });
          let output = "";
          child.stdout.on("data", (data) => {
            output += data;
          });
          child.stderr.on("data", (err) => {
            output += err;
          });
          const timeout = setTimeout(() => {
            child.removeAllListeners();
            child.kill();
            return reject(new Error("The executable failed to finish within the timeout specified."));
          }, this.timeoutMillis);
          child.on("close", (code) => {
            clearTimeout(timeout);
            if (code === 0) {
              try {
                const responseJson = JSON.parse(output);
                const response = new executable_response_1.ExecutableResponse(responseJson);
                return resolve(response);
              } catch (error) {
                if (error instanceof executable_response_1.ExecutableResponseError) {
                  return reject(error);
                }
                return reject(new executable_response_1.ExecutableResponseError(`The executable returned an invalid response: ${output}`));
              }
            } else {
              return reject(new ExecutableError(output, code.toString()));
            }
          });
        });
      }
      /**
       * Checks user provided output file for response from previous run of
       * executable and return the response if it exists, is formatted correctly, and is not expired.
       */
      async retrieveCachedResponse() {
        if (!this.outputFile || this.outputFile.length === 0) {
          return void 0;
        }
        let filePath;
        try {
          filePath = await fs.promises.realpath(this.outputFile);
        } catch {
          return void 0;
        }
        if (!(await fs.promises.lstat(filePath)).isFile()) {
          return void 0;
        }
        const responseString = await fs.promises.readFile(filePath, {
          encoding: "utf8"
        });
        if (responseString === "") {
          return void 0;
        }
        try {
          const responseJson = JSON.parse(responseString);
          const response = new executable_response_1.ExecutableResponse(responseJson);
          if (response.isValid()) {
            return new executable_response_1.ExecutableResponse(responseJson);
          }
          return void 0;
        } catch (error) {
          if (error instanceof executable_response_1.ExecutableResponseError) {
            throw error;
          }
          throw new executable_response_1.ExecutableResponseError(`The output file contained an invalid response: ${responseString}`);
        }
      }
      /**
       * Parses given command string into component array, splitting on spaces unless
       * spaces are between quotation marks.
       */
      static parseCommand(command) {
        const components = command.match(/(?:[^\s"]+|"[^"]*")+/g);
        if (!components) {
          throw new Error(`Provided command: "${command}" could not be parsed.`);
        }
        for (let i = 0; i < components.length; i++) {
          if (components[i][0] === '"' && components[i].slice(-1) === '"') {
            components[i] = components[i].slice(1, -1);
          }
        }
        return components;
      }
    };
    exports.PluggableAuthHandler = PluggableAuthHandler;
  }
});

// node_modules/google-auth-library/build/src/auth/pluggable-auth-client.js
var require_pluggable_auth_client = __commonJS({
  "node_modules/google-auth-library/build/src/auth/pluggable-auth-client.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PluggableAuthClient = exports.ExecutableError = void 0;
    var baseexternalclient_1 = require_baseexternalclient();
    var executable_response_1 = require_executable_response();
    var pluggable_auth_handler_1 = require_pluggable_auth_handler();
    var pluggable_auth_handler_2 = require_pluggable_auth_handler();
    Object.defineProperty(exports, "ExecutableError", { enumerable: true, get: function() {
      return pluggable_auth_handler_2.ExecutableError;
    } });
    var DEFAULT_EXECUTABLE_TIMEOUT_MILLIS = 30 * 1e3;
    var MINIMUM_EXECUTABLE_TIMEOUT_MILLIS = 5 * 1e3;
    var MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS = 120 * 1e3;
    var GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES = "GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES";
    var MAXIMUM_EXECUTABLE_VERSION = 1;
    var PluggableAuthClient = class extends baseexternalclient_1.BaseExternalAccountClient {
      /**
       * Instantiates a PluggableAuthClient instance using the provided JSON
       * object loaded from an external account credentials file.
       * An error is thrown if the credential is not a valid pluggable auth credential.
       * @param options The external account options object typically loaded from
       *   the external account JSON credential file.
       */
      constructor(options) {
        super(options);
        /**
         * The command used to retrieve the third party token.
         */
        __publicField(this, "command");
        /**
         * The timeout in milliseconds for running executable,
         * set to default if none provided.
         */
        __publicField(this, "timeoutMillis");
        /**
         * The path to file to check for cached executable response.
         */
        __publicField(this, "outputFile");
        /**
         * Executable and output file handler.
         */
        __publicField(this, "handler");
        if (!options.credential_source.executable) {
          throw new Error('No valid Pluggable Auth "credential_source" provided.');
        }
        this.command = options.credential_source.executable.command;
        if (!this.command) {
          throw new Error('No valid Pluggable Auth "credential_source" provided.');
        }
        if (options.credential_source.executable.timeout_millis === void 0) {
          this.timeoutMillis = DEFAULT_EXECUTABLE_TIMEOUT_MILLIS;
        } else {
          this.timeoutMillis = options.credential_source.executable.timeout_millis;
          if (this.timeoutMillis < MINIMUM_EXECUTABLE_TIMEOUT_MILLIS || this.timeoutMillis > MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS) {
            throw new Error(`Timeout must be between ${MINIMUM_EXECUTABLE_TIMEOUT_MILLIS} and ${MAXIMUM_EXECUTABLE_TIMEOUT_MILLIS} milliseconds.`);
          }
        }
        this.outputFile = options.credential_source.executable.output_file;
        this.handler = new pluggable_auth_handler_1.PluggableAuthHandler({
          command: this.command,
          timeoutMillis: this.timeoutMillis,
          outputFile: this.outputFile
        });
        this.credentialSourceType = "executable";
      }
      /**
       * Triggered when an external subject token is needed to be exchanged for a
       * GCP access token via GCP STS endpoint.
       * This uses the `options.credential_source` object to figure out how
       * to retrieve the token using the current environment. In this case,
       * this calls a user provided executable which returns the subject token.
       * The logic is summarized as:
       * 1. Validated that the executable is allowed to run. The
       *    GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES environment must be set to
       *    1 for security reasons.
       * 2. If an output file is specified by the user, check the file location
       *    for a response. If the file exists and contains a valid response,
       *    return the subject token from the file.
       * 3. Call the provided executable and return response.
       * @return A promise that resolves with the external subject token.
       */
      async retrieveSubjectToken() {
        if (process.env[GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES] !== "1") {
          throw new Error("Pluggable Auth executables need to be explicitly allowed to run by setting the GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES environment Variable to 1.");
        }
        let executableResponse = void 0;
        if (this.outputFile) {
          executableResponse = await this.handler.retrieveCachedResponse();
        }
        if (!executableResponse) {
          const envMap = /* @__PURE__ */ new Map();
          envMap.set("GOOGLE_EXTERNAL_ACCOUNT_AUDIENCE", this.audience);
          envMap.set("GOOGLE_EXTERNAL_ACCOUNT_TOKEN_TYPE", this.subjectTokenType);
          envMap.set("GOOGLE_EXTERNAL_ACCOUNT_INTERACTIVE", "0");
          if (this.outputFile) {
            envMap.set("GOOGLE_EXTERNAL_ACCOUNT_OUTPUT_FILE", this.outputFile);
          }
          const serviceAccountEmail = this.getServiceAccountEmail();
          if (serviceAccountEmail) {
            envMap.set("GOOGLE_EXTERNAL_ACCOUNT_IMPERSONATED_EMAIL", serviceAccountEmail);
          }
          executableResponse = await this.handler.retrieveResponseFromExecutable(envMap);
        }
        if (executableResponse.version > MAXIMUM_EXECUTABLE_VERSION) {
          throw new Error(`Version of executable is not currently supported, maximum supported version is ${MAXIMUM_EXECUTABLE_VERSION}.`);
        }
        if (!executableResponse.success) {
          throw new pluggable_auth_handler_1.ExecutableError(executableResponse.errorMessage, executableResponse.errorCode);
        }
        if (this.outputFile) {
          if (!executableResponse.expirationTime) {
            throw new executable_response_1.InvalidExpirationTimeFieldError("The executable response must contain the `expiration_time` field for successful responses when an output_file has been specified in the configuration.");
          }
        }
        if (executableResponse.isExpired()) {
          throw new Error("Executable response is expired.");
        }
        return executableResponse.subjectToken;
      }
    };
    exports.PluggableAuthClient = PluggableAuthClient;
  }
});

// node_modules/google-auth-library/build/src/auth/externalclient.js
var require_externalclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/externalclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalAccountClient = void 0;
    var baseexternalclient_1 = require_baseexternalclient();
    var identitypoolclient_1 = require_identitypoolclient();
    var awsclient_1 = require_awsclient();
    var pluggable_auth_client_1 = require_pluggable_auth_client();
    var ExternalAccountClient = class {
      constructor() {
        throw new Error("ExternalAccountClients should be initialized via: ExternalAccountClient.fromJSON(), directly via explicit constructors, eg. new AwsClient(options), new IdentityPoolClient(options), newPluggableAuthClientOptions, or via new GoogleAuth(options).getClient()");
      }
      /**
       * This static method will instantiate the
       * corresponding type of external account credential depending on the
       * underlying credential source.
       * @param options The external account options object typically loaded
       *   from the external account JSON credential file.
       * @return A BaseExternalAccountClient instance or null if the options
       *   provided do not correspond to an external account credential.
       */
      static fromJSON(options) {
        var _a, _b;
        if (options && options.type === baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) {
          if ((_a = options.credential_source) == null ? void 0 : _a.environment_id) {
            return new awsclient_1.AwsClient(options);
          } else if ((_b = options.credential_source) == null ? void 0 : _b.executable) {
            return new pluggable_auth_client_1.PluggableAuthClient(options);
          } else {
            return new identitypoolclient_1.IdentityPoolClient(options);
          }
        } else {
          return null;
        }
      }
    };
    exports.ExternalAccountClient = ExternalAccountClient;
  }
});

// node_modules/google-auth-library/build/src/auth/externalAccountAuthorizedUserClient.js
var require_externalAccountAuthorizedUserClient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/externalAccountAuthorizedUserClient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalAccountAuthorizedUserClient = exports.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE = void 0;
    var authclient_1 = require_authclient();
    var oauth2common_1 = require_oauth2common();
    var gaxios_1 = require_src3();
    var stream = require_stream();
    var baseexternalclient_1 = require_baseexternalclient();
    exports.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE = "external_account_authorized_user";
    var DEFAULT_TOKEN_URL = "https://sts.{universeDomain}/v1/oauthtoken";
    var _tokenRefreshEndpoint;
    var _ExternalAccountAuthorizedUserHandler = class _ExternalAccountAuthorizedUserHandler extends oauth2common_1.OAuthClientAuthHandler {
      /**
       * Initializes an ExternalAccountAuthorizedUserHandler instance.
       * @param url The URL of the token refresh endpoint.
       * @param transporter The transporter to use for the refresh request.
       * @param clientAuthentication The client authentication credentials to use
       *   for the refresh request.
       */
      constructor(options) {
        super(options);
        __privateAdd(this, _tokenRefreshEndpoint);
        __privateSet(this, _tokenRefreshEndpoint, options.tokenRefreshEndpoint);
      }
      /**
       * Requests a new access token from the token_url endpoint using the provided
       *   refresh token.
       * @param refreshToken The refresh token to use to generate a new access token.
       * @param additionalHeaders Optional additional headers to pass along the
       *   request.
       * @return A promise that resolves with the token refresh response containing
       *   the requested access token and its expiration time.
       */
      async refreshToken(refreshToken, headers) {
        const opts = {
          ..._ExternalAccountAuthorizedUserHandler.RETRY_CONFIG,
          url: __privateGet(this, _tokenRefreshEndpoint),
          method: "POST",
          headers,
          data: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
          })
        };
        authclient_1.AuthClient.setMethodName(opts, "refreshToken");
        this.applyClientAuthenticationOptions(opts);
        try {
          const response = await this.transporter.request(opts);
          const tokenRefreshResponse = response.data;
          tokenRefreshResponse.res = response;
          return tokenRefreshResponse;
        } catch (error) {
          if (error instanceof gaxios_1.GaxiosError && error.response) {
            throw (0, oauth2common_1.getErrorFromOAuthErrorResponse)(
              error.response.data,
              // Preserve other fields from the original error.
              error
            );
          }
          throw error;
        }
      }
    };
    _tokenRefreshEndpoint = new WeakMap();
    var ExternalAccountAuthorizedUserHandler = _ExternalAccountAuthorizedUserHandler;
    var ExternalAccountAuthorizedUserClient = class extends authclient_1.AuthClient {
      /**
       * Instantiates an ExternalAccountAuthorizedUserClient instances using the
       * provided JSON object loaded from a credentials files.
       * An error is throws if the credential is not valid.
       * @param options The external account authorized user option object typically
       *   from the external accoutn authorized user JSON credential file.
       */
      constructor(options) {
        super(options);
        __publicField(this, "cachedAccessToken");
        __publicField(this, "externalAccountAuthorizedUserHandler");
        __publicField(this, "refreshToken");
        if (options.universe_domain) {
          this.universeDomain = options.universe_domain;
        }
        this.refreshToken = options.refresh_token;
        const clientAuthentication = {
          confidentialClientType: "basic",
          clientId: options.client_id,
          clientSecret: options.client_secret
        };
        this.externalAccountAuthorizedUserHandler = new ExternalAccountAuthorizedUserHandler({
          tokenRefreshEndpoint: options.token_url ?? DEFAULT_TOKEN_URL.replace("{universeDomain}", this.universeDomain),
          transporter: this.transporter,
          clientAuthentication
        });
        this.cachedAccessToken = null;
        this.quotaProjectId = options.quota_project_id;
        if (typeof (options == null ? void 0 : options.eagerRefreshThresholdMillis) !== "number") {
          this.eagerRefreshThresholdMillis = baseexternalclient_1.EXPIRATION_TIME_OFFSET;
        } else {
          this.eagerRefreshThresholdMillis = options.eagerRefreshThresholdMillis;
        }
        this.forceRefreshOnFailure = !!(options == null ? void 0 : options.forceRefreshOnFailure);
      }
      async getAccessToken() {
        if (!this.cachedAccessToken || this.isExpired(this.cachedAccessToken)) {
          await this.refreshAccessTokenAsync();
        }
        return {
          token: this.cachedAccessToken.access_token,
          res: this.cachedAccessToken.res
        };
      }
      async getRequestHeaders() {
        const accessTokenResponse = await this.getAccessToken();
        const headers = new Headers({
          authorization: `Bearer ${accessTokenResponse.token}`
        });
        return this.addSharedMetadataHeaders(headers);
      }
      request(opts, callback) {
        if (callback) {
          this.requestAsync(opts).then((r) => callback(null, r), (e) => {
            return callback(e, e.response);
          });
        } else {
          return this.requestAsync(opts);
        }
      }
      /**
       * Authenticates the provided HTTP request, processes it and resolves with the
       * returned response.
       * @param opts The HTTP request options.
       * @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure.
       * @return A promise that resolves with the successful response.
       */
      async requestAsync(opts, reAuthRetried = false) {
        let response;
        try {
          const requestHeaders = await this.getRequestHeaders();
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
          this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
          response = await this.transporter.request(opts);
        } catch (e) {
          const res = e.response;
          if (res) {
            const statusCode = res.status;
            const isReadableStream = res.config.data instanceof stream.Readable;
            const isAuthErr = statusCode === 401 || statusCode === 403;
            if (!reAuthRetried && isAuthErr && !isReadableStream && this.forceRefreshOnFailure) {
              await this.refreshAccessTokenAsync();
              return await this.requestAsync(opts, true);
            }
          }
          throw e;
        }
        return response;
      }
      /**
       * Forces token refresh, even if unexpired tokens are currently cached.
       * @return A promise that resolves with the refreshed credential.
       */
      async refreshAccessTokenAsync() {
        const refreshResponse = await this.externalAccountAuthorizedUserHandler.refreshToken(this.refreshToken);
        this.cachedAccessToken = {
          access_token: refreshResponse.access_token,
          expiry_date: (/* @__PURE__ */ new Date()).getTime() + refreshResponse.expires_in * 1e3,
          res: refreshResponse.res
        };
        if (refreshResponse.refresh_token !== void 0) {
          this.refreshToken = refreshResponse.refresh_token;
        }
        return this.cachedAccessToken;
      }
      /**
       * Returns whether the provided credentials are expired or not.
       * If there is no expiry time, assumes the token is not expired or expiring.
       * @param credentials The credentials to check for expiration.
       * @return Whether the credentials are expired or not.
       */
      isExpired(credentials) {
        const now = (/* @__PURE__ */ new Date()).getTime();
        return credentials.expiry_date ? now >= credentials.expiry_date - this.eagerRefreshThresholdMillis : false;
      }
    };
    exports.ExternalAccountAuthorizedUserClient = ExternalAccountAuthorizedUserClient;
  }
});

// node_modules/google-auth-library/build/src/auth/googleauth.js
var require_googleauth = __commonJS({
  "node_modules/google-auth-library/build/src/auth/googleauth.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GoogleAuth = exports.GoogleAuthExceptionMessages = void 0;
    var child_process_1 = require_child_process();
    var fs = require_fs();
    var gaxios_1 = require_src3();
    var gcpMetadata = require_src5();
    var os = require_os();
    var path = require_path();
    var crypto_1 = require_crypto4();
    var computeclient_1 = require_computeclient();
    var idtokenclient_1 = require_idtokenclient();
    var envDetect_1 = require_envDetect();
    var jwtclient_1 = require_jwtclient();
    var refreshclient_1 = require_refreshclient();
    var impersonated_1 = require_impersonated();
    var externalclient_1 = require_externalclient();
    var baseexternalclient_1 = require_baseexternalclient();
    var authclient_1 = require_authclient();
    var externalAccountAuthorizedUserClient_1 = require_externalAccountAuthorizedUserClient();
    var util_1 = require_util3();
    exports.GoogleAuthExceptionMessages = {
      API_KEY_WITH_CREDENTIALS: "API Keys and Credentials are mutually exclusive authentication methods and cannot be used together.",
      NO_PROJECT_ID_FOUND: "Unable to detect a Project Id in the current environment. \nTo learn more about authentication and Google APIs, visit: \nhttps://cloud.google.com/docs/authentication/getting-started",
      NO_CREDENTIALS_FOUND: "Unable to find credentials in current environment. \nTo learn more about authentication and Google APIs, visit: \nhttps://cloud.google.com/docs/authentication/getting-started",
      NO_ADC_FOUND: "Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.",
      NO_UNIVERSE_DOMAIN_FOUND: "Unable to detect a Universe Domain in the current environment.\nTo learn more about Universe Domain retrieval, visit: \nhttps://cloud.google.com/compute/docs/metadata/predefined-metadata-keys"
    };
    var _pendingAuthClient, _GoogleAuth_instances, prepareAndCacheClient_fn, determineClient_fn;
    var GoogleAuth = class {
      /**
       * Configuration is resolved in the following order of precedence:
       * - {@link GoogleAuthOptions.credentials `credentials`}
       * - {@link GoogleAuthOptions.keyFilename `keyFilename`}
       * - {@link GoogleAuthOptions.keyFile `keyFile`}
       *
       * {@link GoogleAuthOptions.clientOptions `clientOptions`} are passed to the
       * {@link AuthClient `AuthClient`s}.
       *
       * @param opts
       */
      constructor(opts = {}) {
        __privateAdd(this, _GoogleAuth_instances);
        /**
         * Caches a value indicating whether the auth layer is running on Google
         * Compute Engine.
         * @private
         */
        __publicField(this, "checkIsGCE");
        __publicField(this, "useJWTAccessWithScope");
        __publicField(this, "defaultServicePath");
        __publicField(this, "_findProjectIdPromise");
        __publicField(this, "_cachedProjectId");
        // To save the contents of the JSON credential file
        __publicField(this, "jsonContent", null);
        __publicField(this, "apiKey");
        __publicField(this, "cachedCredential", null);
        /**
         * A pending {@link AuthClient}. Used for concurrent {@link GoogleAuth.getClient} calls.
         */
        __privateAdd(this, _pendingAuthClient, null);
        /**
         * Scopes populated by the client library by default. We differentiate between
         * these and user defined scopes when deciding whether to use a self-signed JWT.
         */
        __publicField(this, "defaultScopes");
        __publicField(this, "keyFilename");
        __publicField(this, "scopes");
        __publicField(this, "clientOptions", {});
        this._cachedProjectId = opts.projectId || null;
        this.cachedCredential = opts.authClient || null;
        this.keyFilename = opts.keyFilename || opts.keyFile;
        this.scopes = opts.scopes;
        this.clientOptions = opts.clientOptions || {};
        this.jsonContent = opts.credentials || null;
        this.apiKey = opts.apiKey || this.clientOptions.apiKey || null;
        if (this.apiKey && (this.jsonContent || this.clientOptions.credentials)) {
          throw new RangeError(exports.GoogleAuthExceptionMessages.API_KEY_WITH_CREDENTIALS);
        }
        if (opts.universeDomain) {
          this.clientOptions.universeDomain = opts.universeDomain;
        }
      }
      // Note:  this properly is only public to satisfy unit tests.
      // https://github.com/Microsoft/TypeScript/issues/5228
      get isGCE() {
        return this.checkIsGCE;
      }
      // GAPIC client libraries should always use self-signed JWTs. The following
      // variables are set on the JWT client in order to indicate the type of library,
      // and sign the JWT with the correct audience and scopes (if not supplied).
      setGapicJWTValues(client) {
        client.defaultServicePath = this.defaultServicePath;
        client.useJWTAccessWithScope = this.useJWTAccessWithScope;
        client.defaultScopes = this.defaultScopes;
      }
      getProjectId(callback) {
        if (callback) {
          this.getProjectIdAsync().then((r) => callback(null, r), callback);
        } else {
          return this.getProjectIdAsync();
        }
      }
      /**
       * A temporary method for internal `getProjectId` usages where `null` is
       * acceptable. In a future major release, `getProjectId` should return `null`
       * (as the `Promise<string | null>` base signature describes) and this private
       * method should be removed.
       *
       * @returns Promise that resolves with project id (or `null`)
       */
      async getProjectIdOptional() {
        try {
          return await this.getProjectId();
        } catch (e) {
          if (e instanceof Error && e.message === exports.GoogleAuthExceptionMessages.NO_PROJECT_ID_FOUND) {
            return null;
          } else {
            throw e;
          }
        }
      }
      /**
       * A private method for finding and caching a projectId.
       *
       * Supports environments in order of precedence:
       * - GCLOUD_PROJECT or GOOGLE_CLOUD_PROJECT environment variable
       * - GOOGLE_APPLICATION_CREDENTIALS JSON file
       * - Cloud SDK: `gcloud config config-helper --format json`
       * - GCE project ID from metadata server
       *
       * @returns projectId
       */
      async findAndCacheProjectId() {
        let projectId = null;
        projectId || (projectId = await this.getProductionProjectId());
        projectId || (projectId = await this.getFileProjectId());
        projectId || (projectId = await this.getDefaultServiceProjectId());
        projectId || (projectId = await this.getGCEProjectId());
        projectId || (projectId = await this.getExternalAccountClientProjectId());
        if (projectId) {
          this._cachedProjectId = projectId;
          return projectId;
        } else {
          throw new Error(exports.GoogleAuthExceptionMessages.NO_PROJECT_ID_FOUND);
        }
      }
      async getProjectIdAsync() {
        if (this._cachedProjectId) {
          return this._cachedProjectId;
        }
        if (!this._findProjectIdPromise) {
          this._findProjectIdPromise = this.findAndCacheProjectId();
        }
        return this._findProjectIdPromise;
      }
      /**
       * Retrieves a universe domain from the metadata server via
       * {@link gcpMetadata.universe}.
       *
       * @returns a universe domain
       */
      async getUniverseDomainFromMetadataServer() {
        var _a;
        let universeDomain;
        try {
          universeDomain = await gcpMetadata.universe("universe-domain");
          universeDomain || (universeDomain = authclient_1.DEFAULT_UNIVERSE);
        } catch (e) {
          if (e && ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.status) === 404) {
            universeDomain = authclient_1.DEFAULT_UNIVERSE;
          } else {
            throw e;
          }
        }
        return universeDomain;
      }
      /**
       * Retrieves, caches, and returns the universe domain in the following order
       * of precedence:
       * - The universe domain in {@link GoogleAuth.clientOptions}
       * - An existing or ADC {@link AuthClient}'s universe domain
       * - {@link gcpMetadata.universe}, if {@link Compute} client
       *
       * @returns The universe domain
       */
      async getUniverseDomain() {
        let universeDomain = (0, util_1.originalOrCamelOptions)(this.clientOptions).get("universe_domain");
        try {
          universeDomain ?? (universeDomain = (await this.getClient()).universeDomain);
        } catch {
          universeDomain ?? (universeDomain = authclient_1.DEFAULT_UNIVERSE);
        }
        return universeDomain;
      }
      /**
       * @returns Any scopes (user-specified or default scopes specified by the
       *   client library) that need to be set on the current Auth client.
       */
      getAnyScopes() {
        return this.scopes || this.defaultScopes;
      }
      getApplicationDefault(optionsOrCallback = {}, callback) {
        let options;
        if (typeof optionsOrCallback === "function") {
          callback = optionsOrCallback;
        } else {
          options = optionsOrCallback;
        }
        if (callback) {
          this.getApplicationDefaultAsync(options).then((r) => callback(null, r.credential, r.projectId), callback);
        } else {
          return this.getApplicationDefaultAsync(options);
        }
      }
      async getApplicationDefaultAsync(options = {}) {
        if (this.cachedCredential) {
          return await __privateMethod(this, _GoogleAuth_instances, prepareAndCacheClient_fn).call(this, this.cachedCredential, null);
        }
        let credential;
        credential = await this._tryGetApplicationCredentialsFromEnvironmentVariable(options);
        if (credential) {
          if (credential instanceof jwtclient_1.JWT) {
            credential.scopes = this.scopes;
          } else if (credential instanceof baseexternalclient_1.BaseExternalAccountClient) {
            credential.scopes = this.getAnyScopes();
          }
          return await __privateMethod(this, _GoogleAuth_instances, prepareAndCacheClient_fn).call(this, credential);
        }
        credential = await this._tryGetApplicationCredentialsFromWellKnownFile(options);
        if (credential) {
          if (credential instanceof jwtclient_1.JWT) {
            credential.scopes = this.scopes;
          } else if (credential instanceof baseexternalclient_1.BaseExternalAccountClient) {
            credential.scopes = this.getAnyScopes();
          }
          return await __privateMethod(this, _GoogleAuth_instances, prepareAndCacheClient_fn).call(this, credential);
        }
        if (await this._checkIsGCE()) {
          options.scopes = this.getAnyScopes();
          return await __privateMethod(this, _GoogleAuth_instances, prepareAndCacheClient_fn).call(this, new computeclient_1.Compute(options));
        }
        throw new Error(exports.GoogleAuthExceptionMessages.NO_ADC_FOUND);
      }
      /**
       * Determines whether the auth layer is running on Google Compute Engine.
       * Checks for GCP Residency, then fallback to checking if metadata server
       * is available.
       *
       * @returns A promise that resolves with the boolean.
       * @api private
       */
      async _checkIsGCE() {
        if (this.checkIsGCE === void 0) {
          this.checkIsGCE = gcpMetadata.getGCPResidency() || await gcpMetadata.isAvailable();
        }
        return this.checkIsGCE;
      }
      /**
       * Attempts to load default credentials from the environment variable path..
       * @returns Promise that resolves with the OAuth2Client or null.
       * @api private
       */
      async _tryGetApplicationCredentialsFromEnvironmentVariable(options) {
        const credentialsPath = process.env["GOOGLE_APPLICATION_CREDENTIALS"] || process.env["google_application_credentials"];
        if (!credentialsPath || credentialsPath.length === 0) {
          return null;
        }
        try {
          return this._getApplicationCredentialsFromFilePath(credentialsPath, options);
        } catch (e) {
          if (e instanceof Error) {
            e.message = `Unable to read the credential file specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable: ${e.message}`;
          }
          throw e;
        }
      }
      /**
       * Attempts to load default credentials from a well-known file location
       * @return Promise that resolves with the OAuth2Client or null.
       * @api private
       */
      async _tryGetApplicationCredentialsFromWellKnownFile(options) {
        let location = null;
        if (this._isWindows()) {
          location = process.env["APPDATA"];
        } else {
          const home = process.env["HOME"];
          if (home) {
            location = path.join(home, ".config");
          }
        }
        if (location) {
          location = path.join(location, "gcloud", "application_default_credentials.json");
          if (!fs.existsSync(location)) {
            location = null;
          }
        }
        if (!location) {
          return null;
        }
        const client = await this._getApplicationCredentialsFromFilePath(location, options);
        return client;
      }
      /**
       * Attempts to load default credentials from a file at the given path..
       * @param filePath The path to the file to read.
       * @returns Promise that resolves with the OAuth2Client
       * @api private
       */
      async _getApplicationCredentialsFromFilePath(filePath, options = {}) {
        if (!filePath || filePath.length === 0) {
          throw new Error("The file path is invalid.");
        }
        try {
          filePath = fs.realpathSync(filePath);
          if (!fs.lstatSync(filePath).isFile()) {
            throw new Error();
          }
        } catch (err) {
          if (err instanceof Error) {
            err.message = `The file at ${filePath} does not exist, or it is not a file. ${err.message}`;
          }
          throw err;
        }
        const readStream = fs.createReadStream(filePath);
        return this.fromStream(readStream, options);
      }
      /**
       * Create a credentials instance using a given impersonated input options.
       * @param json The impersonated input object.
       * @returns JWT or UserRefresh Client with data
       */
      fromImpersonatedJSON(json) {
        var _a, _b, _c;
        if (!json) {
          throw new Error("Must pass in a JSON object containing an  impersonated refresh token");
        }
        if (json.type !== impersonated_1.IMPERSONATED_ACCOUNT_TYPE) {
          throw new Error(`The incoming JSON object does not have the "${impersonated_1.IMPERSONATED_ACCOUNT_TYPE}" type`);
        }
        if (!json.source_credentials) {
          throw new Error("The incoming JSON object does not contain a source_credentials field");
        }
        if (!json.service_account_impersonation_url) {
          throw new Error("The incoming JSON object does not contain a service_account_impersonation_url field");
        }
        const sourceClient = this.fromJSON(json.source_credentials);
        if (((_a = json.service_account_impersonation_url) == null ? void 0 : _a.length) > 256) {
          throw new RangeError(`Target principal is too long: ${json.service_account_impersonation_url}`);
        }
        const targetPrincipal = (_c = (_b = /(?<target>[^/]+):(generateAccessToken|generateIdToken)$/.exec(json.service_account_impersonation_url)) == null ? void 0 : _b.groups) == null ? void 0 : _c.target;
        if (!targetPrincipal) {
          throw new RangeError(`Cannot extract target principal from ${json.service_account_impersonation_url}`);
        }
        const targetScopes = this.getAnyScopes() ?? [];
        return new impersonated_1.Impersonated({
          ...json,
          sourceClient,
          targetPrincipal,
          targetScopes: Array.isArray(targetScopes) ? targetScopes : [targetScopes]
        });
      }
      /**
       * Create a credentials instance using the given input options.
       * This client is not cached.
       *
       * **Important**: If you accept a credential configuration (credential JSON/File/Stream) from an external source for authentication to Google Cloud, you must validate it before providing it to any Google API or library. Providing an unvalidated credential configuration to Google APIs can compromise the security of your systems and data. For more information, refer to {@link https://cloud.google.com/docs/authentication/external/externally-sourced-credentials Validate credential configurations from external sources}.
       *
       * @param json The input object.
       * @param options The JWT or UserRefresh options for the client
       * @returns JWT or UserRefresh Client with data
       */
      fromJSON(json, options = {}) {
        let client;
        const preferredUniverseDomain = (0, util_1.originalOrCamelOptions)(options).get("universe_domain");
        if (json.type === refreshclient_1.USER_REFRESH_ACCOUNT_TYPE) {
          client = new refreshclient_1.UserRefreshClient(options);
          client.fromJSON(json);
        } else if (json.type === impersonated_1.IMPERSONATED_ACCOUNT_TYPE) {
          client = this.fromImpersonatedJSON(json);
        } else if (json.type === baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) {
          client = externalclient_1.ExternalAccountClient.fromJSON({
            ...json,
            ...options
          });
          client.scopes = this.getAnyScopes();
        } else if (json.type === externalAccountAuthorizedUserClient_1.EXTERNAL_ACCOUNT_AUTHORIZED_USER_TYPE) {
          client = new externalAccountAuthorizedUserClient_1.ExternalAccountAuthorizedUserClient({
            ...json,
            ...options
          });
        } else {
          options.scopes = this.scopes;
          client = new jwtclient_1.JWT(options);
          this.setGapicJWTValues(client);
          client.fromJSON(json);
        }
        if (preferredUniverseDomain) {
          client.universeDomain = preferredUniverseDomain;
        }
        return client;
      }
      /**
       * Return a JWT or UserRefreshClient from JavaScript object, caching both the
       * object used to instantiate and the client.
       * @param json The input object.
       * @param options The JWT or UserRefresh options for the client
       * @returns JWT or UserRefresh Client with data
       */
      _cacheClientFromJSON(json, options) {
        const client = this.fromJSON(json, options);
        this.jsonContent = json;
        this.cachedCredential = client;
        return client;
      }
      fromStream(inputStream, optionsOrCallback = {}, callback) {
        let options = {};
        if (typeof optionsOrCallback === "function") {
          callback = optionsOrCallback;
        } else {
          options = optionsOrCallback;
        }
        if (callback) {
          this.fromStreamAsync(inputStream, options).then((r) => callback(null, r), callback);
        } else {
          return this.fromStreamAsync(inputStream, options);
        }
      }
      fromStreamAsync(inputStream, options) {
        return new Promise((resolve, reject) => {
          if (!inputStream) {
            throw new Error("Must pass in a stream containing the Google auth settings.");
          }
          const chunks = [];
          inputStream.setEncoding("utf8").on("error", reject).on("data", (chunk) => chunks.push(chunk)).on("end", () => {
            try {
              try {
                const data = JSON.parse(chunks.join(""));
                const r = this._cacheClientFromJSON(data, options);
                return resolve(r);
              } catch (err) {
                if (!this.keyFilename)
                  throw err;
                const client = new jwtclient_1.JWT({
                  ...this.clientOptions,
                  keyFile: this.keyFilename
                });
                this.cachedCredential = client;
                this.setGapicJWTValues(client);
                return resolve(client);
              }
            } catch (err) {
              return reject(err);
            }
          });
        });
      }
      /**
       * Create a credentials instance using the given API key string.
       * The created client is not cached. In order to create and cache it use the {@link GoogleAuth.getClient `getClient`} method after first providing an {@link GoogleAuth.apiKey `apiKey`}.
       *
       * @param apiKey The API key string
       * @param options An optional options object.
       * @returns A JWT loaded from the key
       */
      fromAPIKey(apiKey, options = {}) {
        return new jwtclient_1.JWT({ ...options, apiKey });
      }
      /**
       * Determines whether the current operating system is Windows.
       * @api private
       */
      _isWindows() {
        const sys = os.platform();
        if (sys && sys.length >= 3) {
          if (sys.substring(0, 3).toLowerCase() === "win") {
            return true;
          }
        }
        return false;
      }
      /**
       * Run the Google Cloud SDK command that prints the default project ID
       */
      async getDefaultServiceProjectId() {
        return new Promise((resolve) => {
          (0, child_process_1.exec)("gcloud config config-helper --format json", (err, stdout) => {
            if (!err && stdout) {
              try {
                const projectId = JSON.parse(stdout).configuration.properties.core.project;
                resolve(projectId);
                return;
              } catch (e) {
              }
            }
            resolve(null);
          });
        });
      }
      /**
       * Loads the project id from environment variables.
       * @api private
       */
      getProductionProjectId() {
        return process.env["GCLOUD_PROJECT"] || process.env["GOOGLE_CLOUD_PROJECT"] || process.env["gcloud_project"] || process.env["google_cloud_project"];
      }
      /**
       * Loads the project id from the GOOGLE_APPLICATION_CREDENTIALS json file.
       * @api private
       */
      async getFileProjectId() {
        if (this.cachedCredential) {
          return this.cachedCredential.projectId;
        }
        if (this.keyFilename) {
          const creds = await this.getClient();
          if (creds && creds.projectId) {
            return creds.projectId;
          }
        }
        const r = await this._tryGetApplicationCredentialsFromEnvironmentVariable();
        if (r) {
          return r.projectId;
        } else {
          return null;
        }
      }
      /**
       * Gets the project ID from external account client if available.
       */
      async getExternalAccountClientProjectId() {
        if (!this.jsonContent || this.jsonContent.type !== baseexternalclient_1.EXTERNAL_ACCOUNT_TYPE) {
          return null;
        }
        const creds = await this.getClient();
        return await creds.getProjectId();
      }
      /**
       * Gets the Compute Engine project ID if it can be inferred.
       */
      async getGCEProjectId() {
        try {
          const r = await gcpMetadata.project("project-id");
          return r;
        } catch (e) {
          return null;
        }
      }
      getCredentials(callback) {
        if (callback) {
          this.getCredentialsAsync().then((r) => callback(null, r), callback);
        } else {
          return this.getCredentialsAsync();
        }
      }
      async getCredentialsAsync() {
        const client = await this.getClient();
        if (client instanceof impersonated_1.Impersonated) {
          return { client_email: client.getTargetPrincipal() };
        }
        if (client instanceof baseexternalclient_1.BaseExternalAccountClient) {
          const serviceAccountEmail = client.getServiceAccountEmail();
          if (serviceAccountEmail) {
            return {
              client_email: serviceAccountEmail,
              universe_domain: client.universeDomain
            };
          }
        }
        if (this.jsonContent) {
          return {
            client_email: this.jsonContent.client_email,
            private_key: this.jsonContent.private_key,
            universe_domain: this.jsonContent.universe_domain
          };
        }
        if (await this._checkIsGCE()) {
          const [client_email, universe_domain] = await Promise.all([
            gcpMetadata.instance("service-accounts/default/email"),
            this.getUniverseDomain()
          ]);
          return { client_email, universe_domain };
        }
        throw new Error(exports.GoogleAuthExceptionMessages.NO_CREDENTIALS_FOUND);
      }
      /**
       * Automatically obtain an {@link AuthClient `AuthClient`} based on the
       * provided configuration. If no options were passed, use Application
       * Default Credentials.
       */
      async getClient() {
        if (this.cachedCredential) {
          return this.cachedCredential;
        }
        __privateSet(this, _pendingAuthClient, __privateGet(this, _pendingAuthClient) || __privateMethod(this, _GoogleAuth_instances, determineClient_fn).call(this));
        try {
          return await __privateGet(this, _pendingAuthClient);
        } finally {
          __privateSet(this, _pendingAuthClient, null);
        }
      }
      /**
       * Creates a client which will fetch an ID token for authorization.
       * @param targetAudience the audience for the fetched ID token.
       * @returns IdTokenClient for making HTTP calls authenticated with ID tokens.
       */
      async getIdTokenClient(targetAudience) {
        const client = await this.getClient();
        if (!("fetchIdToken" in client)) {
          throw new Error("Cannot fetch ID token in this environment, use GCE or set the GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account credentials JSON file.");
        }
        return new idtokenclient_1.IdTokenClient({ targetAudience, idTokenProvider: client });
      }
      /**
       * Automatically obtain application default credentials, and return
       * an access token for making requests.
       */
      async getAccessToken() {
        const client = await this.getClient();
        return (await client.getAccessToken()).token;
      }
      /**
       * Obtain the HTTP headers that will provide authorization for a given
       * request.
       */
      async getRequestHeaders(url) {
        const client = await this.getClient();
        return client.getRequestHeaders(url);
      }
      /**
       * Obtain credentials for a request, then attach the appropriate headers to
       * the request options.
       * @param opts Axios or Request options on which to attach the headers
       */
      async authorizeRequest(opts = {}) {
        const url = opts.url;
        const client = await this.getClient();
        const headers = await client.getRequestHeaders(url);
        opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers, headers);
        return opts;
      }
      /**
       * A {@link fetch `fetch`} compliant API for {@link GoogleAuth}.
       *
       * @see {@link GoogleAuth.request} for the classic method.
       *
       * @remarks
       *
       * This is useful as a drop-in replacement for `fetch` API usage.
       *
       * @example
       *
       * ```ts
       * const auth = new GoogleAuth();
       * const fetchWithAuth: typeof fetch = (...args) => auth.fetch(...args);
       * await fetchWithAuth('https://example.com');
       * ```
       *
       * @param args `fetch` API or {@link Gaxios.fetch `Gaxios#fetch`} parameters
       * @returns the {@link GaxiosResponse} with Gaxios-added properties
       */
      async fetch(...args) {
        const client = await this.getClient();
        return client.fetch(...args);
      }
      /**
       * Automatically obtain application default credentials, and make an
       * HTTP request using the given options.
       *
       * @see {@link GoogleAuth.fetch} for the modern method.
       *
       * @param opts Axios request options for the HTTP request.
       */
      async request(opts) {
        const client = await this.getClient();
        return client.request(opts);
      }
      /**
       * Determine the compute environment in which the code is running.
       */
      getEnv() {
        return (0, envDetect_1.getEnv)();
      }
      /**
       * Sign the given data with the current private key, or go out
       * to the IAM API to sign it.
       * @param data The data to be signed.
       * @param endpoint A custom endpoint to use.
       *
       * @example
       * ```
       * sign('data', 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/');
       * ```
       */
      async sign(data, endpoint) {
        const client = await this.getClient();
        const universe = await this.getUniverseDomain();
        endpoint = endpoint || `https://iamcredentials.${universe}/v1/projects/-/serviceAccounts/`;
        if (client instanceof impersonated_1.Impersonated) {
          const signed = await client.sign(data);
          return signed.signedBlob;
        }
        const crypto2 = (0, crypto_1.createCrypto)();
        if (client instanceof jwtclient_1.JWT && client.key) {
          const sign = await crypto2.sign(client.key, data);
          return sign;
        }
        const creds = await this.getCredentials();
        if (!creds.client_email) {
          throw new Error("Cannot sign data without `client_email`.");
        }
        return this.signBlob(crypto2, creds.client_email, data, endpoint);
      }
      async signBlob(crypto2, emailOrUniqueId, data, endpoint) {
        const url = new URL(endpoint + `${emailOrUniqueId}:signBlob`);
        const res = await this.request({
          method: "POST",
          url: url.href,
          data: {
            payload: crypto2.encodeBase64StringUtf8(data)
          },
          retry: true,
          retryConfig: {
            httpMethodsToRetry: ["POST"]
          }
        });
        return res.data.signedBlob;
      }
    };
    _pendingAuthClient = new WeakMap();
    _GoogleAuth_instances = new WeakSet();
    prepareAndCacheClient_fn = async function(credential, quotaProjectIdOverride = process.env["GOOGLE_CLOUD_QUOTA_PROJECT"] || null) {
      const projectId = await this.getProjectIdOptional();
      if (quotaProjectIdOverride) {
        credential.quotaProjectId = quotaProjectIdOverride;
      }
      this.cachedCredential = credential;
      return { credential, projectId };
    };
    determineClient_fn = async function() {
      if (this.jsonContent) {
        return this._cacheClientFromJSON(this.jsonContent, this.clientOptions);
      } else if (this.keyFilename) {
        const filePath = path.resolve(this.keyFilename);
        const stream = fs.createReadStream(filePath);
        return await this.fromStreamAsync(stream, this.clientOptions);
      } else if (this.apiKey) {
        const client = await this.fromAPIKey(this.apiKey, this.clientOptions);
        client.scopes = this.scopes;
        const { credential } = await __privateMethod(this, _GoogleAuth_instances, prepareAndCacheClient_fn).call(this, client);
        return credential;
      } else {
        const { credential } = await this.getApplicationDefaultAsync(this.clientOptions);
        return credential;
      }
    };
    exports.GoogleAuth = GoogleAuth;
  }
});

// node_modules/google-auth-library/build/src/auth/iam.js
var require_iam = __commonJS({
  "node_modules/google-auth-library/build/src/auth/iam.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IAMAuth = void 0;
    var IAMAuth = class {
      /**
       * IAM credentials.
       *
       * @param selector the iam authority selector
       * @param token the token
       * @constructor
       */
      constructor(selector, token) {
        __publicField(this, "selector");
        __publicField(this, "token");
        this.selector = selector;
        this.token = token;
        this.selector = selector;
        this.token = token;
      }
      /**
       * Acquire the HTTP headers required to make an authenticated request.
       */
      getRequestHeaders() {
        return {
          "x-goog-iam-authority-selector": this.selector,
          "x-goog-iam-authorization-token": this.token
        };
      }
    };
    exports.IAMAuth = IAMAuth;
  }
});

// node_modules/google-auth-library/build/src/auth/downscopedclient.js
var require_downscopedclient = __commonJS({
  "node_modules/google-auth-library/build/src/auth/downscopedclient.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DownscopedClient = exports.EXPIRATION_TIME_OFFSET = exports.MAX_ACCESS_BOUNDARY_RULES_COUNT = void 0;
    var gaxios_1 = require_src3();
    var stream = require_stream();
    var authclient_1 = require_authclient();
    var sts = require_stscredentials();
    var STS_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange";
    var STS_REQUEST_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
    var STS_SUBJECT_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:access_token";
    exports.MAX_ACCESS_BOUNDARY_RULES_COUNT = 10;
    exports.EXPIRATION_TIME_OFFSET = 5 * 60 * 1e3;
    var DownscopedClient = class extends authclient_1.AuthClient {
      /**
       * Instantiates a downscoped client object using the provided source
       * AuthClient and credential access boundary rules.
       * To downscope permissions of a source AuthClient, a Credential Access
       * Boundary that specifies which resources the new credential can access, as
       * well as an upper bound on the permissions that are available on each
       * resource, has to be defined. A downscoped client can then be instantiated
       * using the source AuthClient and the Credential Access Boundary.
       * @param options the {@link DownscopedClientOptions `DownscopedClientOptions`} to use. Passing an `AuthClient` directly is **@DEPRECATED**.
       * @param credentialAccessBoundary **@DEPRECATED**. Provide a {@link DownscopedClientOptions `DownscopedClientOptions`} object in the first parameter instead.
       */
      constructor(options, credentialAccessBoundary = {
        accessBoundary: {
          accessBoundaryRules: []
        }
      }) {
        super(options instanceof authclient_1.AuthClient ? {} : options);
        __publicField(this, "authClient");
        __publicField(this, "credentialAccessBoundary");
        __publicField(this, "cachedDownscopedAccessToken");
        __publicField(this, "stsCredential");
        if (options instanceof authclient_1.AuthClient) {
          this.authClient = options;
          this.credentialAccessBoundary = credentialAccessBoundary;
        } else {
          this.authClient = options.authClient;
          this.credentialAccessBoundary = options.credentialAccessBoundary;
        }
        if (this.credentialAccessBoundary.accessBoundary.accessBoundaryRules.length === 0) {
          throw new Error("At least one access boundary rule needs to be defined.");
        } else if (this.credentialAccessBoundary.accessBoundary.accessBoundaryRules.length > exports.MAX_ACCESS_BOUNDARY_RULES_COUNT) {
          throw new Error(`The provided access boundary has more than ${exports.MAX_ACCESS_BOUNDARY_RULES_COUNT} access boundary rules.`);
        }
        for (const rule of this.credentialAccessBoundary.accessBoundary.accessBoundaryRules) {
          if (rule.availablePermissions.length === 0) {
            throw new Error("At least one permission should be defined in access boundary rules.");
          }
        }
        this.stsCredential = new sts.StsCredentials({
          tokenExchangeEndpoint: `https://sts.${this.universeDomain}/v1/token`
        });
        this.cachedDownscopedAccessToken = null;
      }
      /**
       * Provides a mechanism to inject Downscoped access tokens directly.
       * The expiry_date field is required to facilitate determination of the token
       * expiration which would make it easier for the token consumer to handle.
       * @param credentials The Credentials object to set on the current client.
       */
      setCredentials(credentials) {
        if (!credentials.expiry_date) {
          throw new Error("The access token expiry_date field is missing in the provided credentials.");
        }
        super.setCredentials(credentials);
        this.cachedDownscopedAccessToken = credentials;
      }
      async getAccessToken() {
        if (!this.cachedDownscopedAccessToken || this.isExpired(this.cachedDownscopedAccessToken)) {
          await this.refreshAccessTokenAsync();
        }
        return {
          token: this.cachedDownscopedAccessToken.access_token,
          expirationTime: this.cachedDownscopedAccessToken.expiry_date,
          res: this.cachedDownscopedAccessToken.res
        };
      }
      /**
       * The main authentication interface. It takes an optional url which when
       * present is the endpoint being accessed, and returns a Promise which
       * resolves with authorization header fields.
       *
       * The result has the form:
       * { authorization: 'Bearer <access_token_value>' }
       */
      async getRequestHeaders() {
        const accessTokenResponse = await this.getAccessToken();
        const headers = new Headers({
          authorization: `Bearer ${accessTokenResponse.token}`
        });
        return this.addSharedMetadataHeaders(headers);
      }
      request(opts, callback) {
        if (callback) {
          this.requestAsync(opts).then((r) => callback(null, r), (e) => {
            return callback(e, e.response);
          });
        } else {
          return this.requestAsync(opts);
        }
      }
      /**
       * Authenticates the provided HTTP request, processes it and resolves with the
       * returned response.
       * @param opts The HTTP request options.
       * @param reAuthRetried Whether the current attempt is a retry after a failed attempt due to an auth failure
       * @return A promise that resolves with the successful response.
       */
      async requestAsync(opts, reAuthRetried = false) {
        let response;
        try {
          const requestHeaders = await this.getRequestHeaders();
          opts.headers = gaxios_1.Gaxios.mergeHeaders(opts.headers);
          this.addUserProjectAndAuthHeaders(opts.headers, requestHeaders);
          response = await this.transporter.request(opts);
        } catch (e) {
          const res = e.response;
          if (res) {
            const statusCode = res.status;
            const isReadableStream = res.config.data instanceof stream.Readable;
            const isAuthErr = statusCode === 401 || statusCode === 403;
            if (!reAuthRetried && isAuthErr && !isReadableStream && this.forceRefreshOnFailure) {
              await this.refreshAccessTokenAsync();
              return await this.requestAsync(opts, true);
            }
          }
          throw e;
        }
        return response;
      }
      /**
       * Forces token refresh, even if unexpired tokens are currently cached.
       * GCP access tokens are retrieved from authclient object/source credential.
       * Then GCP access tokens are exchanged for downscoped access tokens via the
       * token exchange endpoint.
       * @return A promise that resolves with the fresh downscoped access token.
       */
      async refreshAccessTokenAsync() {
        var _a;
        const subjectToken = (await this.authClient.getAccessToken()).token;
        const stsCredentialsOptions = {
          grantType: STS_GRANT_TYPE,
          requestedTokenType: STS_REQUEST_TOKEN_TYPE,
          subjectToken,
          subjectTokenType: STS_SUBJECT_TOKEN_TYPE
        };
        const stsResponse = await this.stsCredential.exchangeToken(stsCredentialsOptions, void 0, this.credentialAccessBoundary);
        const sourceCredExpireDate = ((_a = this.authClient.credentials) == null ? void 0 : _a.expiry_date) || null;
        const expiryDate = stsResponse.expires_in ? (/* @__PURE__ */ new Date()).getTime() + stsResponse.expires_in * 1e3 : sourceCredExpireDate;
        this.cachedDownscopedAccessToken = {
          access_token: stsResponse.access_token,
          expiry_date: expiryDate,
          res: stsResponse.res
        };
        this.credentials = {};
        Object.assign(this.credentials, this.cachedDownscopedAccessToken);
        delete this.credentials.res;
        this.emit("tokens", {
          refresh_token: null,
          expiry_date: this.cachedDownscopedAccessToken.expiry_date,
          access_token: this.cachedDownscopedAccessToken.access_token,
          token_type: "Bearer",
          id_token: null
        });
        return this.cachedDownscopedAccessToken;
      }
      /**
       * Returns whether the provided credentials are expired or not.
       * If there is no expiry time, assumes the token is not expired or expiring.
       * @param downscopedAccessToken The credentials to check for expiration.
       * @return Whether the credentials are expired or not.
       */
      isExpired(downscopedAccessToken) {
        const now = (/* @__PURE__ */ new Date()).getTime();
        return downscopedAccessToken.expiry_date ? now >= downscopedAccessToken.expiry_date - this.eagerRefreshThresholdMillis : false;
      }
    };
    exports.DownscopedClient = DownscopedClient;
  }
});

// node_modules/google-auth-library/build/src/auth/passthrough.js
var require_passthrough = __commonJS({
  "node_modules/google-auth-library/build/src/auth/passthrough.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PassThroughClient = void 0;
    var authclient_1 = require_authclient();
    var PassThroughClient = class extends authclient_1.AuthClient {
      /**
       * Creates a request without any authentication headers or checks.
       *
       * @remarks
       *
       * In testing environments it may be useful to change the provided
       * {@link AuthClient.transporter} for any desired request overrides/handling.
       *
       * @param opts
       * @returns The response of the request.
       */
      async request(opts) {
        return this.transporter.request(opts);
      }
      /**
       * A required method of the base class.
       * Always will return an empty object.
       *
       * @returns {}
       */
      async getAccessToken() {
        return {};
      }
      /**
       * A required method of the base class.
       * Always will return an empty object.
       *
       * @returns {}
       */
      async getRequestHeaders() {
        return new Headers();
      }
    };
    exports.PassThroughClient = PassThroughClient;
  }
});

// node_modules/google-auth-library/build/src/index.js
var require_src7 = __commonJS({
  "node_modules/google-auth-library/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GoogleAuth = exports.auth = exports.PassThroughClient = exports.ExecutableError = exports.PluggableAuthClient = exports.DownscopedClient = exports.BaseExternalAccountClient = exports.ExternalAccountClient = exports.IdentityPoolClient = exports.AwsRequestSigner = exports.AwsClient = exports.UserRefreshClient = exports.LoginTicket = exports.ClientAuthentication = exports.OAuth2Client = exports.CodeChallengeMethod = exports.Impersonated = exports.JWT = exports.JWTAccess = exports.IdTokenClient = exports.IAMAuth = exports.GCPEnv = exports.Compute = exports.DEFAULT_UNIVERSE = exports.AuthClient = exports.gaxios = exports.gcpMetadata = void 0;
    var googleauth_1 = require_googleauth();
    Object.defineProperty(exports, "GoogleAuth", { enumerable: true, get: function() {
      return googleauth_1.GoogleAuth;
    } });
    exports.gcpMetadata = require_src5();
    exports.gaxios = require_src3();
    var authclient_1 = require_authclient();
    Object.defineProperty(exports, "AuthClient", { enumerable: true, get: function() {
      return authclient_1.AuthClient;
    } });
    Object.defineProperty(exports, "DEFAULT_UNIVERSE", { enumerable: true, get: function() {
      return authclient_1.DEFAULT_UNIVERSE;
    } });
    var computeclient_1 = require_computeclient();
    Object.defineProperty(exports, "Compute", { enumerable: true, get: function() {
      return computeclient_1.Compute;
    } });
    var envDetect_1 = require_envDetect();
    Object.defineProperty(exports, "GCPEnv", { enumerable: true, get: function() {
      return envDetect_1.GCPEnv;
    } });
    var iam_1 = require_iam();
    Object.defineProperty(exports, "IAMAuth", { enumerable: true, get: function() {
      return iam_1.IAMAuth;
    } });
    var idtokenclient_1 = require_idtokenclient();
    Object.defineProperty(exports, "IdTokenClient", { enumerable: true, get: function() {
      return idtokenclient_1.IdTokenClient;
    } });
    var jwtaccess_1 = require_jwtaccess();
    Object.defineProperty(exports, "JWTAccess", { enumerable: true, get: function() {
      return jwtaccess_1.JWTAccess;
    } });
    var jwtclient_1 = require_jwtclient();
    Object.defineProperty(exports, "JWT", { enumerable: true, get: function() {
      return jwtclient_1.JWT;
    } });
    var impersonated_1 = require_impersonated();
    Object.defineProperty(exports, "Impersonated", { enumerable: true, get: function() {
      return impersonated_1.Impersonated;
    } });
    var oauth2client_1 = require_oauth2client();
    Object.defineProperty(exports, "CodeChallengeMethod", { enumerable: true, get: function() {
      return oauth2client_1.CodeChallengeMethod;
    } });
    Object.defineProperty(exports, "OAuth2Client", { enumerable: true, get: function() {
      return oauth2client_1.OAuth2Client;
    } });
    Object.defineProperty(exports, "ClientAuthentication", { enumerable: true, get: function() {
      return oauth2client_1.ClientAuthentication;
    } });
    var loginticket_1 = require_loginticket();
    Object.defineProperty(exports, "LoginTicket", { enumerable: true, get: function() {
      return loginticket_1.LoginTicket;
    } });
    var refreshclient_1 = require_refreshclient();
    Object.defineProperty(exports, "UserRefreshClient", { enumerable: true, get: function() {
      return refreshclient_1.UserRefreshClient;
    } });
    var awsclient_1 = require_awsclient();
    Object.defineProperty(exports, "AwsClient", { enumerable: true, get: function() {
      return awsclient_1.AwsClient;
    } });
    var awsrequestsigner_1 = require_awsrequestsigner();
    Object.defineProperty(exports, "AwsRequestSigner", { enumerable: true, get: function() {
      return awsrequestsigner_1.AwsRequestSigner;
    } });
    var identitypoolclient_1 = require_identitypoolclient();
    Object.defineProperty(exports, "IdentityPoolClient", { enumerable: true, get: function() {
      return identitypoolclient_1.IdentityPoolClient;
    } });
    var externalclient_1 = require_externalclient();
    Object.defineProperty(exports, "ExternalAccountClient", { enumerable: true, get: function() {
      return externalclient_1.ExternalAccountClient;
    } });
    var baseexternalclient_1 = require_baseexternalclient();
    Object.defineProperty(exports, "BaseExternalAccountClient", { enumerable: true, get: function() {
      return baseexternalclient_1.BaseExternalAccountClient;
    } });
    var downscopedclient_1 = require_downscopedclient();
    Object.defineProperty(exports, "DownscopedClient", { enumerable: true, get: function() {
      return downscopedclient_1.DownscopedClient;
    } });
    var pluggable_auth_client_1 = require_pluggable_auth_client();
    Object.defineProperty(exports, "PluggableAuthClient", { enumerable: true, get: function() {
      return pluggable_auth_client_1.PluggableAuthClient;
    } });
    Object.defineProperty(exports, "ExecutableError", { enumerable: true, get: function() {
      return pluggable_auth_client_1.ExecutableError;
    } });
    var passthrough_1 = require_passthrough();
    Object.defineProperty(exports, "PassThroughClient", { enumerable: true, get: function() {
      return passthrough_1.PassThroughClient;
    } });
    var auth = new googleauth_1.GoogleAuth();
    exports.auth = auth;
  }
});

// node_modules/retry-request/index.js
var require_retry_request = __commonJS({
  "node_modules/retry-request/index.js"(exports, module) {
    "use strict";
    var { PassThrough } = require_stream();
    var extend = require_extend();
    var debug = () => {
    };
    if (typeof process !== "undefined" && "env" in process && typeof process.env === "object" && process.env.DEBUG === "retry-request") {
      debug = (message) => {
        console.log("retry-request:", message);
      };
    }
    var DEFAULTS = {
      objectMode: false,
      retries: 2,
      /*
        The maximum time to delay in seconds. If retryDelayMultiplier results in a
        delay greater than maxRetryDelay, retries should delay by maxRetryDelay
        seconds instead.
      */
      maxRetryDelay: 64,
      /*
        The multiplier by which to increase the delay time between the completion of
        failed requests, and the initiation of the subsequent retrying request.
      */
      retryDelayMultiplier: 2,
      /*
        The length of time to keep retrying in seconds. The last sleep period will
        be shortened as necessary, so that the last retry runs at deadline (and not
        considerably beyond it).  The total time starting from when the initial
        request is sent, after which an error will be returned, regardless of the
        retrying attempts made meanwhile.
       */
      totalTimeout: 600,
      noResponseRetries: 2,
      currentRetryAttempt: 0,
      shouldRetryFn: function(response) {
        const retryRanges = [
          // https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
          // 1xx - Retry (Informational, request still processing)
          // 2xx - Do not retry (Success)
          // 3xx - Do not retry (Redirect)
          // 4xx - Do not retry (Client errors)
          // 429 - Retry ("Too Many Requests")
          // 5xx - Retry (Server errors)
          [100, 199],
          [429, 429],
          [500, 599]
        ];
        const statusCode = response.statusCode;
        debug(`Response status: ${statusCode}`);
        let range;
        while (range = retryRanges.shift()) {
          if (statusCode >= range[0] && statusCode <= range[1]) {
            return true;
          }
        }
      }
    };
    function retryRequest(requestOpts, opts, callback) {
      if (typeof requestOpts === "string") {
        requestOpts = { url: requestOpts };
      }
      const streamMode = typeof arguments[arguments.length - 1] !== "function";
      if (typeof opts === "function") {
        callback = opts;
      }
      const manualCurrentRetryAttemptWasSet = opts && typeof opts.currentRetryAttempt === "number";
      opts = extend({}, DEFAULTS, opts);
      if (typeof opts.request === "undefined") {
        throw new Error("A request library must be provided to retry-request.");
      }
      let currentRetryAttempt = opts.currentRetryAttempt;
      let numNoResponseAttempts = 0;
      let streamResponseHandled = false;
      let retryStream;
      let requestStream;
      let delayStream;
      let activeRequest;
      const retryRequest2 = {
        abort: function() {
          if (activeRequest && activeRequest.abort) {
            activeRequest.abort();
          }
        }
      };
      if (streamMode) {
        retryStream = new PassThrough({ objectMode: opts.objectMode });
        retryStream.abort = resetStreams;
      }
      const timeOfFirstRequest = Date.now();
      if (currentRetryAttempt > 0) {
        retryAfterDelay(currentRetryAttempt);
      } else {
        makeRequest();
      }
      if (streamMode) {
        return retryStream;
      } else {
        return retryRequest2;
      }
      function resetStreams() {
        delayStream = null;
        if (requestStream) {
          requestStream.abort && requestStream.abort();
          requestStream.cancel && requestStream.cancel();
          if (requestStream.destroy) {
            requestStream.destroy();
          } else if (requestStream.end) {
            requestStream.end();
          }
        }
      }
      function makeRequest() {
        let finishHandled = false;
        currentRetryAttempt++;
        debug(`Current retry attempt: ${currentRetryAttempt}`);
        function handleFinish(args = []) {
          if (!finishHandled) {
            finishHandled = true;
            retryStream.emit("complete", ...args);
          }
        }
        if (streamMode) {
          streamResponseHandled = false;
          delayStream = new PassThrough({ objectMode: opts.objectMode });
          requestStream = opts.request(requestOpts);
          setImmediate(() => {
            retryStream.emit("request");
          });
          requestStream.on("error", (err) => {
            if (streamResponseHandled) {
              return;
            }
            streamResponseHandled = true;
            onResponse(err);
          }).on("response", (resp, body) => {
            if (streamResponseHandled) {
              return;
            }
            streamResponseHandled = true;
            onResponse(null, resp, body);
          }).on("complete", (...params) => handleFinish(params)).on("finish", (...params) => handleFinish(params));
          requestStream.pipe(delayStream);
        } else {
          activeRequest = opts.request(requestOpts, onResponse);
        }
      }
      function retryAfterDelay(currentRetryAttempt2) {
        if (streamMode) {
          resetStreams();
        }
        const nextRetryDelay = getNextRetryDelay({
          maxRetryDelay: opts.maxRetryDelay,
          retryDelayMultiplier: opts.retryDelayMultiplier,
          retryNumber: currentRetryAttempt2,
          timeOfFirstRequest,
          totalTimeout: opts.totalTimeout
        });
        debug(`Next retry delay: ${nextRetryDelay}`);
        if (nextRetryDelay <= 0) {
          numNoResponseAttempts = opts.noResponseRetries + 1;
          return;
        }
        setTimeout(makeRequest, nextRetryDelay);
      }
      function onResponse(err, response, body) {
        if (err) {
          numNoResponseAttempts++;
          if (numNoResponseAttempts <= opts.noResponseRetries) {
            retryAfterDelay(numNoResponseAttempts);
          } else {
            if (streamMode) {
              retryStream.emit("error", err);
              retryStream.end();
            } else {
              callback(err, response, body);
            }
          }
          return;
        }
        const adjustedCurrentRetryAttempt = manualCurrentRetryAttemptWasSet ? currentRetryAttempt : currentRetryAttempt - 1;
        if (adjustedCurrentRetryAttempt < opts.retries && opts.shouldRetryFn(response)) {
          retryAfterDelay(currentRetryAttempt);
          return;
        }
        if (streamMode) {
          retryStream.emit("response", response);
          delayStream.pipe(retryStream);
          requestStream.on("error", (err2) => {
            retryStream.destroy(err2);
          });
        } else {
          callback(err, response, body);
        }
      }
    }
    module.exports = retryRequest;
    function getNextRetryDelay(config) {
      const {
        maxRetryDelay,
        retryDelayMultiplier,
        retryNumber,
        timeOfFirstRequest,
        totalTimeout
      } = config;
      const maxRetryDelayMs = maxRetryDelay * 1e3;
      const totalTimeoutMs = totalTimeout * 1e3;
      const jitter = Math.floor(Math.random() * 1e3);
      const calculatedNextRetryDelay = Math.pow(retryDelayMultiplier, retryNumber) * 1e3 + jitter;
      const maxAllowableDelayMs = totalTimeoutMs - (Date.now() - timeOfFirstRequest);
      return Math.min(
        calculatedNextRetryDelay,
        maxAllowableDelayMs,
        maxRetryDelayMs
      );
    }
    module.exports.defaults = DEFAULTS;
    module.exports.getNextRetryDelay = getNextRetryDelay;
  }
});

// node_modules/@tootallnate/once/dist/index.js
var require_dist = __commonJS({
  "node_modules/@tootallnate/once/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function once(emitter, name, { signal } = {}) {
      return new Promise((resolve, reject) => {
        function cleanup() {
          signal === null || signal === void 0 ? void 0 : signal.removeEventListener("abort", cleanup);
          emitter.removeListener(name, onEvent);
          emitter.removeListener("error", onError);
        }
        function onEvent(...args) {
          cleanup();
          resolve(args);
        }
        function onError(err) {
          cleanup();
          reject(err);
        }
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", cleanup);
        emitter.on(name, onEvent);
        emitter.on("error", onError);
      });
    }
    exports.default = once;
  }
});

// node_modules/agent-base/dist/src/promisify.js
var require_promisify = __commonJS({
  "node_modules/agent-base/dist/src/promisify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function promisify(fn) {
      return function(req, opts) {
        return new Promise((resolve, reject) => {
          fn.call(this, req, opts, (err, rtn) => {
            if (err) {
              reject(err);
            } else {
              resolve(rtn);
            }
          });
        });
      };
    }
    exports.default = promisify;
  }
});

// node_modules/agent-base/dist/src/index.js
var require_src8 = __commonJS({
  "node_modules/agent-base/dist/src/index.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var events_1 = require_events();
    var debug_1 = __importDefault(require_browser());
    var promisify_1 = __importDefault(require_promisify());
    var debug = debug_1.default("agent-base");
    function isAgent(v) {
      return Boolean(v) && typeof v.addRequest === "function";
    }
    function isSecureEndpoint() {
      const { stack } = new Error();
      if (typeof stack !== "string")
        return false;
      return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
    }
    function createAgent(callback, opts) {
      return new createAgent.Agent(callback, opts);
    }
    (function(createAgent2) {
      class Agent extends events_1.EventEmitter {
        constructor(callback, _opts) {
          super();
          let opts = _opts;
          if (typeof callback === "function") {
            this.callback = callback;
          } else if (callback) {
            opts = callback;
          }
          this.timeout = null;
          if (opts && typeof opts.timeout === "number") {
            this.timeout = opts.timeout;
          }
          this.maxFreeSockets = 1;
          this.maxSockets = 1;
          this.maxTotalSockets = Infinity;
          this.sockets = {};
          this.freeSockets = {};
          this.requests = {};
          this.options = {};
        }
        get defaultPort() {
          if (typeof this.explicitDefaultPort === "number") {
            return this.explicitDefaultPort;
          }
          return isSecureEndpoint() ? 443 : 80;
        }
        set defaultPort(v) {
          this.explicitDefaultPort = v;
        }
        get protocol() {
          if (typeof this.explicitProtocol === "string") {
            return this.explicitProtocol;
          }
          return isSecureEndpoint() ? "https:" : "http:";
        }
        set protocol(v) {
          this.explicitProtocol = v;
        }
        callback(req, opts, fn) {
          throw new Error('"agent-base" has no default implementation, you must subclass and override `callback()`');
        }
        /**
         * Called by node-core's "_http_client.js" module when creating
         * a new HTTP request with this Agent instance.
         *
         * @api public
         */
        addRequest(req, _opts) {
          const opts = Object.assign({}, _opts);
          if (typeof opts.secureEndpoint !== "boolean") {
            opts.secureEndpoint = isSecureEndpoint();
          }
          if (opts.host == null) {
            opts.host = "localhost";
          }
          if (opts.port == null) {
            opts.port = opts.secureEndpoint ? 443 : 80;
          }
          if (opts.protocol == null) {
            opts.protocol = opts.secureEndpoint ? "https:" : "http:";
          }
          if (opts.host && opts.path) {
            delete opts.path;
          }
          delete opts.agent;
          delete opts.hostname;
          delete opts._defaultAgent;
          delete opts.defaultPort;
          delete opts.createConnection;
          req._last = true;
          req.shouldKeepAlive = false;
          let timedOut = false;
          let timeoutId = null;
          const timeoutMs = opts.timeout || this.timeout;
          const onerror = (err) => {
            if (req._hadError)
              return;
            req.emit("error", err);
            req._hadError = true;
          };
          const ontimeout = () => {
            timeoutId = null;
            timedOut = true;
            const err = new Error(`A "socket" was not created for HTTP request before ${timeoutMs}ms`);
            err.code = "ETIMEOUT";
            onerror(err);
          };
          const callbackError = (err) => {
            if (timedOut)
              return;
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            onerror(err);
          };
          const onsocket = (socket) => {
            if (timedOut)
              return;
            if (timeoutId != null) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            if (isAgent(socket)) {
              debug("Callback returned another Agent instance %o", socket.constructor.name);
              socket.addRequest(req, opts);
              return;
            }
            if (socket) {
              socket.once("free", () => {
                this.freeSocket(socket, opts);
              });
              req.onSocket(socket);
              return;
            }
            const err = new Error(`no Duplex stream was returned to agent-base for \`${req.method} ${req.path}\``);
            onerror(err);
          };
          if (typeof this.callback !== "function") {
            onerror(new Error("`callback` is not defined"));
            return;
          }
          if (!this.promisifiedCallback) {
            if (this.callback.length >= 3) {
              debug("Converting legacy callback function to promise");
              this.promisifiedCallback = promisify_1.default(this.callback);
            } else {
              this.promisifiedCallback = this.callback;
            }
          }
          if (typeof timeoutMs === "number" && timeoutMs > 0) {
            timeoutId = setTimeout(ontimeout, timeoutMs);
          }
          if ("port" in opts && typeof opts.port !== "number") {
            opts.port = Number(opts.port);
          }
          try {
            debug("Resolving socket for %o request: %o", opts.protocol, `${req.method} ${req.path}`);
            Promise.resolve(this.promisifiedCallback(req, opts)).then(onsocket, callbackError);
          } catch (err) {
            Promise.reject(err).catch(callbackError);
          }
        }
        freeSocket(socket, opts) {
          debug("Freeing socket %o %o", socket.constructor.name, opts);
          socket.destroy();
        }
        destroy() {
          debug("Destroying agent %o", this.constructor.name);
        }
      }
      createAgent2.Agent = Agent;
      createAgent2.prototype = createAgent2.Agent.prototype;
    })(createAgent || (createAgent = {}));
    module.exports = createAgent;
  }
});

// node_modules/http-proxy-agent/dist/agent.js
var require_agent = __commonJS({
  "node_modules/http-proxy-agent/dist/agent.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var net_1 = __importDefault(require_net());
    var tls_1 = __importDefault(require_tls());
    var url_1 = __importDefault(require_url());
    var debug_1 = __importDefault(require_browser());
    var once_1 = __importDefault(require_dist());
    var agent_base_1 = require_src8();
    var debug = (0, debug_1.default)("http-proxy-agent");
    function isHTTPS(protocol) {
      return typeof protocol === "string" ? /^https:?$/i.test(protocol) : false;
    }
    var HttpProxyAgent = class extends agent_base_1.Agent {
      constructor(_opts) {
        let opts;
        if (typeof _opts === "string") {
          opts = url_1.default.parse(_opts);
        } else {
          opts = _opts;
        }
        if (!opts) {
          throw new Error("an HTTP(S) proxy server `host` and `port` must be specified!");
        }
        debug("Creating new HttpProxyAgent instance: %o", opts);
        super(opts);
        const proxy = Object.assign({}, opts);
        this.secureProxy = opts.secureProxy || isHTTPS(proxy.protocol);
        proxy.host = proxy.hostname || proxy.host;
        if (typeof proxy.port === "string") {
          proxy.port = parseInt(proxy.port, 10);
        }
        if (!proxy.port && proxy.host) {
          proxy.port = this.secureProxy ? 443 : 80;
        }
        if (proxy.host && proxy.path) {
          delete proxy.path;
          delete proxy.pathname;
        }
        this.proxy = proxy;
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       *
       * @api protected
       */
      callback(req, opts) {
        return __awaiter(this, void 0, void 0, function* () {
          const { proxy, secureProxy } = this;
          const parsed = url_1.default.parse(req.path);
          if (!parsed.protocol) {
            parsed.protocol = "http:";
          }
          if (!parsed.hostname) {
            parsed.hostname = opts.hostname || opts.host || null;
          }
          if (parsed.port == null && typeof opts.port) {
            parsed.port = String(opts.port);
          }
          if (parsed.port === "80") {
            parsed.port = "";
          }
          req.path = url_1.default.format(parsed);
          if (proxy.auth) {
            req.setHeader("Proxy-Authorization", `Basic ${Buffer.from(proxy.auth).toString("base64")}`);
          }
          let socket;
          if (secureProxy) {
            debug("Creating `tls.Socket`: %o", proxy);
            socket = tls_1.default.connect(proxy);
          } else {
            debug("Creating `net.Socket`: %o", proxy);
            socket = net_1.default.connect(proxy);
          }
          if (req._header) {
            let first;
            let endOfHeaders;
            debug("Regenerating stored HTTP header string for request");
            req._header = null;
            req._implicitHeader();
            if (req.output && req.output.length > 0) {
              debug("Patching connection write() output buffer with updated header");
              first = req.output[0];
              endOfHeaders = first.indexOf("\r\n\r\n") + 4;
              req.output[0] = req._header + first.substring(endOfHeaders);
              debug("Output buffer: %o", req.output);
            } else if (req.outputData && req.outputData.length > 0) {
              debug("Patching connection write() output buffer with updated header");
              first = req.outputData[0].data;
              endOfHeaders = first.indexOf("\r\n\r\n") + 4;
              req.outputData[0].data = req._header + first.substring(endOfHeaders);
              debug("Output buffer: %o", req.outputData[0].data);
            }
          }
          yield (0, once_1.default)(socket, "connect");
          return socket;
        });
      }
    };
    exports.default = HttpProxyAgent;
  }
});

// node_modules/http-proxy-agent/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/http-proxy-agent/dist/index.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var agent_1 = __importDefault(require_agent());
    function createHttpProxyAgent(opts) {
      return new agent_1.default(opts);
    }
    (function(createHttpProxyAgent2) {
      createHttpProxyAgent2.HttpProxyAgent = agent_1.default;
      createHttpProxyAgent2.prototype = agent_1.default.prototype;
    })(createHttpProxyAgent || (createHttpProxyAgent = {}));
    module.exports = createHttpProxyAgent;
  }
});

// node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var debug_1 = __importDefault(require_browser());
    var debug = debug_1.default("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0;
        const buffers = [];
        function read() {
          const b = socket.read();
          if (b)
            ondata(b);
          else
            socket.once("readable", read);
        }
        function cleanup() {
          socket.removeListener("end", onend);
          socket.removeListener("error", onerror);
          socket.removeListener("close", onclose);
          socket.removeListener("readable", read);
        }
        function onclose(err) {
          debug("onclose had error %o", err);
        }
        function onend() {
          debug("onend");
        }
        function onerror(err) {
          cleanup();
          debug("onerror %o", err);
          reject(err);
        }
        function ondata(b) {
          buffers.push(b);
          buffersLength += b.length;
          const buffered = Buffer.concat(buffers, buffersLength);
          const endOfHeaders = buffered.indexOf("\r\n\r\n");
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet...");
            read();
            return;
          }
          const firstLine = buffered.toString("ascii", 0, buffered.indexOf("\r\n"));
          const statusCode = +firstLine.split(" ")[1];
          debug("got proxy server response: %o", firstLine);
          resolve({
            statusCode,
            buffered
          });
        }
        socket.on("error", onerror);
        socket.on("close", onclose);
        socket.on("end", onend);
        read();
      });
    }
    exports.default = parseProxyResponse;
  }
});

// node_modules/https-proxy-agent/dist/agent.js
var require_agent2 = __commonJS({
  "node_modules/https-proxy-agent/dist/agent.js"(exports) {
    "use strict";
    var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var net_1 = __importDefault(require_net());
    var tls_1 = __importDefault(require_tls());
    var url_1 = __importDefault(require_url());
    var assert_1 = __importDefault(require_assert());
    var debug_1 = __importDefault(require_browser());
    var agent_base_1 = require_src8();
    var parse_proxy_response_1 = __importDefault(require_parse_proxy_response());
    var debug = debug_1.default("https-proxy-agent:agent");
    var HttpsProxyAgent = class extends agent_base_1.Agent {
      constructor(_opts) {
        let opts;
        if (typeof _opts === "string") {
          opts = url_1.default.parse(_opts);
        } else {
          opts = _opts;
        }
        if (!opts) {
          throw new Error("an HTTP(S) proxy server `host` and `port` must be specified!");
        }
        debug("creating new HttpsProxyAgent instance: %o", opts);
        super(opts);
        const proxy = Object.assign({}, opts);
        this.secureProxy = opts.secureProxy || isHTTPS(proxy.protocol);
        proxy.host = proxy.hostname || proxy.host;
        if (typeof proxy.port === "string") {
          proxy.port = parseInt(proxy.port, 10);
        }
        if (!proxy.port && proxy.host) {
          proxy.port = this.secureProxy ? 443 : 80;
        }
        if (this.secureProxy && !("ALPNProtocols" in proxy)) {
          proxy.ALPNProtocols = ["http 1.1"];
        }
        if (proxy.host && proxy.path) {
          delete proxy.path;
          delete proxy.pathname;
        }
        this.proxy = proxy;
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       *
       * @api protected
       */
      callback(req, opts) {
        return __awaiter(this, void 0, void 0, function* () {
          const { proxy, secureProxy } = this;
          let socket;
          if (secureProxy) {
            debug("Creating `tls.Socket`: %o", proxy);
            socket = tls_1.default.connect(proxy);
          } else {
            debug("Creating `net.Socket`: %o", proxy);
            socket = net_1.default.connect(proxy);
          }
          const headers = Object.assign({}, proxy.headers);
          const hostname = `${opts.host}:${opts.port}`;
          let payload = `CONNECT ${hostname} HTTP/1.1\r
`;
          if (proxy.auth) {
            headers["Proxy-Authorization"] = `Basic ${Buffer.from(proxy.auth).toString("base64")}`;
          }
          let { host, port, secureEndpoint } = opts;
          if (!isDefaultPort(port, secureEndpoint)) {
            host += `:${port}`;
          }
          headers.Host = host;
          headers.Connection = "close";
          for (const name of Object.keys(headers)) {
            payload += `${name}: ${headers[name]}\r
`;
          }
          const proxyResponsePromise = parse_proxy_response_1.default(socket);
          socket.write(`${payload}\r
`);
          const { statusCode, buffered } = yield proxyResponsePromise;
          if (statusCode === 200) {
            req.once("socket", resume);
            if (opts.secureEndpoint) {
              debug("Upgrading socket connection to TLS");
              const servername = opts.servername || opts.host;
              return tls_1.default.connect(Object.assign(Object.assign({}, omit(opts, "host", "hostname", "path", "port")), {
                socket,
                servername
              }));
            }
            return socket;
          }
          socket.destroy();
          const fakeSocket = new net_1.default.Socket({ writable: false });
          fakeSocket.readable = true;
          req.once("socket", (s) => {
            debug("replaying proxy buffer for failed request");
            assert_1.default(s.listenerCount("data") > 0);
            s.push(buffered);
            s.push(null);
          });
          return fakeSocket;
        });
      }
    };
    exports.default = HttpsProxyAgent;
    function resume(socket) {
      socket.resume();
    }
    function isDefaultPort(port, secure) {
      return Boolean(!secure && port === 80 || secure && port === 443);
    }
    function isHTTPS(protocol) {
      return typeof protocol === "string" ? /^https:?$/i.test(protocol) : false;
    }
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// node_modules/https-proxy-agent/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/https-proxy-agent/dist/index.js"(exports, module) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    var agent_1 = __importDefault(require_agent2());
    function createHttpsProxyAgent(opts) {
      return new agent_1.default(opts);
    }
    (function(createHttpsProxyAgent2) {
      createHttpsProxyAgent2.HttpsProxyAgent = agent_1.default;
      createHttpsProxyAgent2.prototype = agent_1.default.prototype;
    })(createHttpsProxyAgent || (createHttpsProxyAgent = {}));
    module.exports = createHttpsProxyAgent;
  }
});

// node_modules/teeny-request/build/src/agents.js
var require_agents = __commonJS({
  "node_modules/teeny-request/build/src/agents.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pool = void 0;
    exports.getAgent = getAgent;
    var http_1 = require_http();
    var https_1 = require_https();
    var url_1 = require_url();
    exports.pool = /* @__PURE__ */ new Map();
    function shouldUseProxyForURI(uri) {
      const noProxyEnv = process.env.NO_PROXY || process.env.no_proxy;
      if (!noProxyEnv) {
        return true;
      }
      const givenURI = new URL(uri);
      for (const noProxyRaw of noProxyEnv.split(",")) {
        const noProxy = noProxyRaw.trim();
        if (noProxy === givenURI.origin || noProxy === givenURI.hostname) {
          return false;
        } else if (noProxy.startsWith("*.") || noProxy.startsWith(".")) {
          const noProxyWildcard = noProxy.replace(/^\*\./, ".");
          if (givenURI.hostname.endsWith(noProxyWildcard)) {
            return false;
          }
        }
      }
      return true;
    }
    function getAgent(uri, reqOpts) {
      const isHttp = uri.startsWith("http://");
      const proxy = reqOpts.proxy || process.env.HTTP_PROXY || process.env.http_proxy || process.env.HTTPS_PROXY || process.env.https_proxy;
      const poolOptions = Object.assign({}, reqOpts.pool);
      const manuallyProvidedProxy = !!reqOpts.proxy;
      const shouldUseProxy = manuallyProvidedProxy || shouldUseProxyForURI(uri);
      if (proxy && shouldUseProxy) {
        const Agent = isHttp ? require_dist2() : require_dist3();
        const proxyOpts = { ...(0, url_1.parse)(proxy), ...poolOptions };
        return new Agent(proxyOpts);
      }
      let key = isHttp ? "http" : "https";
      if (reqOpts.forever) {
        key += ":forever";
        if (!exports.pool.has(key)) {
          const Agent = isHttp ? http_1.Agent : https_1.Agent;
          exports.pool.set(key, new Agent({ ...poolOptions, keepAlive: true }));
        }
      }
      return exports.pool.get(key);
    }
  }
});

// node_modules/teeny-request/build/src/TeenyStatistics.js
var require_TeenyStatistics = __commonJS({
  "node_modules/teeny-request/build/src/TeenyStatistics.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TeenyStatistics = exports.TeenyStatisticsWarning = void 0;
    var TeenyStatisticsWarning = class extends Error {
      /**
       * @param {string} message
       */
      constructor(message) {
        super(message);
        __publicField(this, "threshold", 0);
        __publicField(this, "type", "");
        __publicField(this, "value", 0);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
      }
    };
    __publicField(TeenyStatisticsWarning, "CONCURRENT_REQUESTS", "ConcurrentRequestsExceededWarning");
    exports.TeenyStatisticsWarning = TeenyStatisticsWarning;
    var _TeenyStatistics = class _TeenyStatistics {
      /**
       * @param {TeenyStatisticsOptions} [opts]
       */
      constructor(opts) {
        /**
         * @type {TeenyStatisticsConfig}
         * @private
         */
        __publicField(this, "_options");
        /**
         * @type {number}
         * @private
         * @default 0
         */
        __publicField(this, "_concurrentRequests", 0);
        /**
         * @type {boolean}
         * @private
         * @default false
         */
        __publicField(this, "_didConcurrentRequestWarn", false);
        this._options = _TeenyStatistics._prepareOptions(opts);
      }
      /**
       * Returns a copy of the current options.
       * @return {TeenyStatisticsOptions}
       */
      getOptions() {
        return Object.assign({}, this._options);
      }
      /**
       * Change configured statistics options. This will not preserve unspecified
       *   options that were previously specified, i.e. this is a reset of options.
       * @param {TeenyStatisticsOptions} [opts]
       * @returns {TeenyStatisticsConfig} The previous options.
       * @see _prepareOptions
       */
      setOptions(opts) {
        const oldOpts = this._options;
        this._options = _TeenyStatistics._prepareOptions(opts);
        return oldOpts;
      }
      /**
       * @readonly
       * @return {TeenyStatisticsCounters}
       */
      get counters() {
        return {
          concurrentRequests: this._concurrentRequests
        };
      }
      /**
       * @description Should call this right before making a request.
       */
      requestStarting() {
        this._concurrentRequests++;
        if (this._options.concurrentRequests > 0 && this._concurrentRequests >= this._options.concurrentRequests && !this._didConcurrentRequestWarn) {
          this._didConcurrentRequestWarn = true;
          const warning = new TeenyStatisticsWarning("Possible excessive concurrent requests detected. " + this._concurrentRequests + " requests in-flight, which exceeds the configured threshold of " + this._options.concurrentRequests + ". Use the TEENY_REQUEST_WARN_CONCURRENT_REQUESTS environment variable or the concurrentRequests option of teeny-request to increase or disable (0) this warning.");
          warning.type = TeenyStatisticsWarning.CONCURRENT_REQUESTS;
          warning.value = this._concurrentRequests;
          warning.threshold = this._options.concurrentRequests;
          process.emitWarning(warning);
        }
      }
      /**
       * @description When using `requestStarting`, call this after the request
       *   has finished.
       */
      requestFinished() {
        this._concurrentRequests--;
      }
      /**
       * Configuration Precedence:
       *   1. Dependency inversion via defined option.
       *   2. Global numeric environment variable.
       *   3. Built-in default.
       * This will not preserve unspecified options previously specified.
       * @param {TeenyStatisticsOptions} [opts]
       * @returns {TeenyStatisticsOptions}
       * @private
       */
      static _prepareOptions({ concurrentRequests: diConcurrentRequests } = {}) {
        let concurrentRequests = this.DEFAULT_WARN_CONCURRENT_REQUESTS;
        const envConcurrentRequests = Number(process.env.TEENY_REQUEST_WARN_CONCURRENT_REQUESTS);
        if (diConcurrentRequests !== void 0) {
          concurrentRequests = diConcurrentRequests;
        } else if (!Number.isNaN(envConcurrentRequests)) {
          concurrentRequests = envConcurrentRequests;
        }
        return { concurrentRequests };
      }
    };
    /**
     * @description A default threshold representing when to warn about excessive
     *   in-flight/concurrent requests.
     * @type {number}
     * @static
     * @readonly
     * @default 5000
     */
    __publicField(_TeenyStatistics, "DEFAULT_WARN_CONCURRENT_REQUESTS", 5e3);
    var TeenyStatistics = _TeenyStatistics;
    exports.TeenyStatistics = TeenyStatistics;
  }
});

// node_modules/stubs/index.js
var require_stubs = __commonJS({
  "node_modules/stubs/index.js"(exports, module) {
    "use strict";
    module.exports = function stubs(obj, method, cfg, stub) {
      if (!obj || !method || !obj[method])
        throw new Error("You must provide an object and a key for an existing method");
      if (!stub) {
        stub = cfg;
        cfg = {};
      }
      stub = stub || function() {
      };
      cfg.callthrough = cfg.callthrough || false;
      cfg.calls = cfg.calls || 0;
      var norevert = cfg.calls === 0;
      var cached = obj[method].bind(obj);
      obj[method] = function() {
        var args = [].slice.call(arguments);
        var returnVal;
        if (cfg.callthrough)
          returnVal = cached.apply(obj, args);
        returnVal = stub.apply(obj, args) || returnVal;
        if (!norevert && --cfg.calls === 0)
          obj[method] = cached;
        return returnVal;
      };
    };
  }
});

// node_modules/stream-events/index.js
var require_stream_events = __commonJS({
  "node_modules/stream-events/index.js"(exports, module) {
    "use strict";
    var stubs = require_stubs();
    function StreamEvents(stream) {
      stream = stream || this;
      var cfg = {
        callthrough: true,
        calls: 1
      };
      stubs(stream, "_read", cfg, stream.emit.bind(stream, "reading"));
      stubs(stream, "_write", cfg, stream.emit.bind(stream, "writing"));
      return stream;
    }
    module.exports = StreamEvents;
  }
});

// node_modules/teeny-request/build/src/index.js
var require_src9 = __commonJS({
  "node_modules/teeny-request/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestError = void 0;
    exports.teenyRequest = teenyRequest;
    var stream_1 = require_stream();
    var agents_1 = require_agents();
    var TeenyStatistics_1 = require_TeenyStatistics();
    var crypto_1 = require_crypto();
    var streamEvents = require_stream_events();
    var fetch = (...args) => import("./src-2TBUGPLO.js").then(({ default: fetch2 }) => fetch2(...args));
    var RequestError = class extends Error {
      constructor() {
        super(...arguments);
        __publicField(this, "code");
      }
    };
    exports.RequestError = RequestError;
    function requestToFetchOptions(reqOpts) {
      const options = {
        method: reqOpts.method || "GET",
        ...reqOpts.timeout && { timeout: reqOpts.timeout },
        ...typeof reqOpts.gzip === "boolean" && { compress: reqOpts.gzip }
      };
      if (typeof reqOpts.json === "object") {
        reqOpts.headers = reqOpts.headers || {};
        if (reqOpts.headers instanceof globalThis.Headers) {
          reqOpts.headers.set("Content-Type", "application/json");
        } else {
          reqOpts.headers["Content-Type"] = "application/json";
        }
        options.body = JSON.stringify(reqOpts.json);
      } else {
        if (Buffer.isBuffer(reqOpts.body)) {
          options.body = reqOpts.body;
        } else if (typeof reqOpts.body !== "string") {
          options.body = JSON.stringify(reqOpts.body);
        } else {
          options.body = reqOpts.body;
        }
      }
      if (reqOpts.headers instanceof globalThis.Headers) {
        options.headers = {};
        for (const pair of reqOpts.headers.entries()) {
          options.headers[pair[0]] = pair[1];
        }
      } else {
        options.headers = reqOpts.headers;
      }
      let uri = reqOpts.uri || reqOpts.url;
      if (!uri) {
        throw new Error("Missing uri or url in reqOpts.");
      }
      if (reqOpts.useQuerystring === true || typeof reqOpts.qs === "object") {
        const qs = require_querystring();
        const params = qs.stringify(reqOpts.qs);
        uri = uri + "?" + params;
      }
      options.agent = (0, agents_1.getAgent)(uri, reqOpts);
      return { uri, options };
    }
    function fetchToRequestResponse(opts, res) {
      const request = {};
      request.agent = opts.agent || false;
      request.headers = opts.headers || {};
      request.href = res.url;
      const resHeaders = {};
      res.headers.forEach((value, key) => resHeaders[key] = value);
      const response = Object.assign(res.body, {
        statusCode: res.status,
        statusMessage: res.statusText,
        request,
        body: res.body,
        headers: resHeaders,
        toJSON: () => ({ headers: resHeaders })
      });
      return response;
    }
    function createMultipartStream(boundary, multipart) {
      const finale = `--${boundary}--`;
      const stream = new stream_1.PassThrough();
      for (const part of multipart) {
        const preamble = `--${boundary}\r
Content-Type: ${part["Content-Type"]}\r
\r
`;
        stream.write(preamble);
        if (typeof part.body === "string") {
          stream.write(part.body);
          stream.write("\r\n");
        } else {
          part.body.pipe(stream, { end: false });
          part.body.on("end", () => {
            stream.write("\r\n");
            stream.write(finale);
            stream.end();
          });
        }
      }
      return stream;
    }
    function teenyRequest(reqOpts, callback) {
      const { uri, options } = requestToFetchOptions(reqOpts);
      const multipart = reqOpts.multipart;
      if (reqOpts.multipart && multipart.length === 2) {
        if (!callback) {
          throw new Error("Multipart without callback is not implemented.");
        }
        const boundary = (0, crypto_1.randomUUID)();
        options.headers["Content-Type"] = `multipart/related; boundary=${boundary}`;
        options.body = createMultipartStream(boundary, multipart);
        teenyRequest.stats.requestStarting();
        fetch(uri, options).then((res) => {
          teenyRequest.stats.requestFinished();
          const header = res.headers.get("content-type");
          const response = fetchToRequestResponse(options, res);
          const body = response.body;
          if (header === "application/json" || header === "application/json; charset=utf-8") {
            res.json().then((json) => {
              response.body = json;
              callback(null, response, json);
            }, (err) => {
              callback(err, response, body);
            });
            return;
          }
          res.text().then((text) => {
            response.body = text;
            callback(null, response, text);
          }, (err) => {
            callback(err, response, body);
          });
        }, (err) => {
          teenyRequest.stats.requestFinished();
          callback(err, null, null);
        });
        return;
      }
      if (callback === void 0) {
        const requestStream = streamEvents(new stream_1.PassThrough());
        let responseStream;
        requestStream.once("reading", () => {
          if (responseStream) {
            (0, stream_1.pipeline)(responseStream, requestStream, () => {
            });
          } else {
            requestStream.once("response", () => {
              (0, stream_1.pipeline)(responseStream, requestStream, () => {
              });
            });
          }
        });
        options.compress = false;
        teenyRequest.stats.requestStarting();
        fetch(uri, options).then((res) => {
          teenyRequest.stats.requestFinished();
          responseStream = res.body;
          responseStream.on("error", (err) => {
            requestStream.emit("error", err);
          });
          const response = fetchToRequestResponse(options, res);
          requestStream.emit("response", response);
        }, (err) => {
          teenyRequest.stats.requestFinished();
          requestStream.emit("error", err);
        });
        return requestStream;
      }
      teenyRequest.stats.requestStarting();
      fetch(uri, options).then((res) => {
        teenyRequest.stats.requestFinished();
        const header = res.headers.get("content-type");
        const response = fetchToRequestResponse(options, res);
        const body = response.body;
        if (header === "application/json" || header === "application/json; charset=utf-8") {
          if (response.statusCode === 204) {
            callback(null, response, body);
            return;
          }
          res.json().then((json) => {
            response.body = json;
            callback(null, response, json);
          }, (err) => {
            callback(err, response, body);
          });
          return;
        }
        res.text().then((text) => {
          const response2 = fetchToRequestResponse(options, res);
          response2.body = text;
          callback(null, response2, text);
        }, (err) => {
          callback(err, response, body);
        });
      }, (err) => {
        teenyRequest.stats.requestFinished();
        callback(err, null, null);
      });
      return;
    }
    teenyRequest.defaults = (defaults) => {
      return (reqOpts, callback) => {
        const opts = { ...defaults, ...reqOpts };
        if (callback === void 0) {
          return teenyRequest(opts);
        }
        teenyRequest(opts, callback);
      };
    };
    teenyRequest.stats = new TeenyStatistics_1.TeenyStatistics();
    teenyRequest.resetStats = () => {
      teenyRequest.stats = new TeenyStatistics_1.TeenyStatistics(teenyRequest.stats.getOptions());
    };
  }
});

// node_modules/@google-cloud/common/build/src/service.js
var require_service = __commonJS({
  "node_modules/@google-cloud/common/build/src/service.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Service = exports.DEFAULT_PROJECT_ID_TOKEN = void 0;
    var arrify = require_arrify();
    var extend = require_extend();
    var util_1 = require_util4();
    exports.DEFAULT_PROJECT_ID_TOKEN = "{{projectId}}";
    var Service = class _Service {
      /**
       * Service is a base class, meant to be inherited from by a "service," like
       * BigQuery or Storage.
       *
       * This handles making authenticated requests by exposing a `makeReq_`
       * function.
       *
       * @constructor
       * @alias module:common/service
       *
       * @param {object} config - Configuration object.
       * @param {string} config.baseUrl - The base URL to make API requests to.
       * @param {string[]} config.scopes - The scopes required for the request.
       * @param {object=} options - [Configuration object](#/docs).
       */
      constructor(config, options = {}) {
        __publicField(this, "baseUrl");
        __publicField(this, "globalInterceptors");
        __publicField(this, "interceptors");
        __publicField(this, "packageJson");
        __publicField(this, "projectId");
        __publicField(this, "projectIdRequired");
        __publicField(this, "providedUserAgent");
        __publicField(this, "makeAuthenticatedRequest");
        __publicField(this, "authClient");
        __publicField(this, "getCredentials");
        __publicField(this, "apiEndpoint");
        __publicField(this, "timeout");
        this.baseUrl = config.baseUrl;
        this.apiEndpoint = config.apiEndpoint;
        this.timeout = options.timeout;
        this.globalInterceptors = arrify(options.interceptors_);
        this.interceptors = [];
        this.packageJson = config.packageJson;
        this.projectId = options.projectId || exports.DEFAULT_PROJECT_ID_TOKEN;
        this.projectIdRequired = config.projectIdRequired !== false;
        this.providedUserAgent = options.userAgent;
        const reqCfg = extend({}, config, {
          projectIdRequired: this.projectIdRequired,
          projectId: this.projectId,
          authClient: options.authClient,
          credentials: options.credentials,
          keyFile: options.keyFilename,
          email: options.email,
          token: options.token
        });
        this.makeAuthenticatedRequest = util_1.util.makeAuthenticatedRequestFactory(reqCfg);
        this.authClient = this.makeAuthenticatedRequest.authClient;
        this.getCredentials = this.makeAuthenticatedRequest.getCredentials;
        const isCloudFunctionEnv = !!process.env.FUNCTION_NAME;
        if (isCloudFunctionEnv) {
          this.interceptors.push({
            request(reqOpts) {
              reqOpts.forever = false;
              return reqOpts;
            }
          });
        }
      }
      /**
       * Return the user's custom request interceptors.
       */
      getRequestInterceptors() {
        return [].slice.call(this.globalInterceptors).concat(this.interceptors).filter((interceptor) => typeof interceptor.request === "function").map((interceptor) => interceptor.request);
      }
      getProjectId(callback) {
        if (!callback) {
          return this.getProjectIdAsync();
        }
        this.getProjectIdAsync().then((p) => callback(null, p), callback);
      }
      async getProjectIdAsync() {
        const projectId = await this.authClient.getProjectId();
        if (this.projectId === exports.DEFAULT_PROJECT_ID_TOKEN && projectId) {
          this.projectId = projectId;
        }
        return this.projectId;
      }
      request_(reqOpts, callback) {
        reqOpts = extend(true, {}, reqOpts, { timeout: this.timeout });
        const isAbsoluteUrl = reqOpts.uri.indexOf("http") === 0;
        const uriComponents = [this.baseUrl];
        if (this.projectIdRequired) {
          if (reqOpts.projectId) {
            uriComponents.push("projects");
            uriComponents.push(reqOpts.projectId);
          } else {
            uriComponents.push("projects");
            uriComponents.push(this.projectId);
          }
        }
        uriComponents.push(reqOpts.uri);
        if (isAbsoluteUrl) {
          uriComponents.splice(0, uriComponents.indexOf(reqOpts.uri));
        }
        reqOpts.uri = uriComponents.map((uriComponent) => {
          const trimSlashesRegex = /^\/*|\/*$/g;
          return uriComponent.replace(trimSlashesRegex, "");
        }).join("/").replace(/\/:/g, ":");
        const requestInterceptors = this.getRequestInterceptors();
        arrify(reqOpts.interceptors_).forEach((interceptor) => {
          if (typeof interceptor.request === "function") {
            requestInterceptors.push(interceptor.request);
          }
        });
        requestInterceptors.forEach((requestInterceptor) => {
          reqOpts = requestInterceptor(reqOpts);
        });
        delete reqOpts.interceptors_;
        const pkg = this.packageJson;
        let userAgent = util_1.util.getUserAgentFromPackageJson(pkg);
        if (this.providedUserAgent) {
          userAgent = `${this.providedUserAgent} ${userAgent}`;
        }
        reqOpts.headers = extend({}, reqOpts.headers, {
          "User-Agent": userAgent,
          "x-goog-api-client": `gl-node/${process.versions.node} gccl/${pkg.version}`
        });
        if (reqOpts.shouldReturnStream) {
          return this.makeAuthenticatedRequest(reqOpts);
        } else {
          this.makeAuthenticatedRequest(reqOpts, callback);
        }
      }
      /**
       * Make an authenticated API request.
       *
       * @param {object} reqOpts - Request options that are passed to `request`.
       * @param {string} reqOpts.uri - A URI relative to the baseUrl.
       * @param {function} callback - The callback function passed to `request`.
       */
      request(reqOpts, callback) {
        _Service.prototype.request_.call(this, reqOpts, callback);
      }
      /**
       * Make an authenticated API request.
       *
       * @param {object} reqOpts - Request options that are passed to `request`.
       * @param {string} reqOpts.uri - A URI relative to the baseUrl.
       */
      requestStream(reqOpts) {
        const opts = extend(true, reqOpts, { shouldReturnStream: true });
        return _Service.prototype.request_.call(this, opts);
      }
    };
    exports.Service = Service;
  }
});

// node_modules/readable-stream/lib/internal/streams/stream-browser.js
var require_stream_browser = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/stream-browser.js"(exports, module) {
    module.exports = require_events().EventEmitter;
  }
});

// node_modules/readable-stream/lib/internal/streams/buffer_list.js
var require_buffer_list = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/buffer_list.js"(exports, module) {
    "use strict";
    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);
      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        enumerableOnly && (symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        })), keys.push.apply(keys, symbols);
      }
      return keys;
    }
    function _objectSpread(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = null != arguments[i] ? arguments[i] : {};
        i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
      return target;
    }
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", { writable: false });
      return Constructor;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    var _require = require_buffer();
    var Buffer2 = _require.Buffer;
    var _require2 = require_util2();
    var inspect = _require2.inspect;
    var custom = inspect && inspect.custom || "inspect";
    function copyBuffer(src, target, offset) {
      Buffer2.prototype.copy.call(src, target, offset);
    }
    module.exports = function() {
      function BufferList() {
        _classCallCheck(this, BufferList);
        this.head = null;
        this.tail = null;
        this.length = 0;
      }
      _createClass(BufferList, [{
        key: "push",
        value: function push(v) {
          var entry = {
            data: v,
            next: null
          };
          if (this.length > 0) this.tail.next = entry;
          else this.head = entry;
          this.tail = entry;
          ++this.length;
        }
      }, {
        key: "unshift",
        value: function unshift(v) {
          var entry = {
            data: v,
            next: this.head
          };
          if (this.length === 0) this.tail = entry;
          this.head = entry;
          ++this.length;
        }
      }, {
        key: "shift",
        value: function shift() {
          if (this.length === 0) return;
          var ret = this.head.data;
          if (this.length === 1) this.head = this.tail = null;
          else this.head = this.head.next;
          --this.length;
          return ret;
        }
      }, {
        key: "clear",
        value: function clear() {
          this.head = this.tail = null;
          this.length = 0;
        }
      }, {
        key: "join",
        value: function join(s) {
          if (this.length === 0) return "";
          var p = this.head;
          var ret = "" + p.data;
          while (p = p.next) ret += s + p.data;
          return ret;
        }
      }, {
        key: "concat",
        value: function concat(n) {
          if (this.length === 0) return Buffer2.alloc(0);
          var ret = Buffer2.allocUnsafe(n >>> 0);
          var p = this.head;
          var i = 0;
          while (p) {
            copyBuffer(p.data, ret, i);
            i += p.data.length;
            p = p.next;
          }
          return ret;
        }
        // Consumes a specified amount of bytes or characters from the buffered data.
      }, {
        key: "consume",
        value: function consume(n, hasStrings) {
          var ret;
          if (n < this.head.data.length) {
            ret = this.head.data.slice(0, n);
            this.head.data = this.head.data.slice(n);
          } else if (n === this.head.data.length) {
            ret = this.shift();
          } else {
            ret = hasStrings ? this._getString(n) : this._getBuffer(n);
          }
          return ret;
        }
      }, {
        key: "first",
        value: function first() {
          return this.head.data;
        }
        // Consumes a specified amount of characters from the buffered data.
      }, {
        key: "_getString",
        value: function _getString(n) {
          var p = this.head;
          var c = 1;
          var ret = p.data;
          n -= ret.length;
          while (p = p.next) {
            var str = p.data;
            var nb = n > str.length ? str.length : n;
            if (nb === str.length) ret += str;
            else ret += str.slice(0, n);
            n -= nb;
            if (n === 0) {
              if (nb === str.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = str.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }
        // Consumes a specified amount of bytes from the buffered data.
      }, {
        key: "_getBuffer",
        value: function _getBuffer(n) {
          var ret = Buffer2.allocUnsafe(n);
          var p = this.head;
          var c = 1;
          p.data.copy(ret);
          n -= p.data.length;
          while (p = p.next) {
            var buf = p.data;
            var nb = n > buf.length ? buf.length : n;
            buf.copy(ret, ret.length - n, 0, nb);
            n -= nb;
            if (n === 0) {
              if (nb === buf.length) {
                ++c;
                if (p.next) this.head = p.next;
                else this.head = this.tail = null;
              } else {
                this.head = p;
                p.data = buf.slice(nb);
              }
              break;
            }
            ++c;
          }
          this.length -= c;
          return ret;
        }
        // Make sure the linked list only shows the minimal necessary information.
      }, {
        key: custom,
        value: function value(_, options) {
          return inspect(this, _objectSpread(_objectSpread({}, options), {}, {
            // Only inspect one level.
            depth: 0,
            // It should not recurse.
            customInspect: false
          }));
        }
      }]);
      return BufferList;
    }();
  }
});

// node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/destroy.js"(exports, module) {
    "use strict";
    function destroy(err, cb) {
      var _this = this;
      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;
      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err) {
          if (!this._writableState) {
            process.nextTick(emitErrorNT, this, err);
          } else if (!this._writableState.errorEmitted) {
            this._writableState.errorEmitted = true;
            process.nextTick(emitErrorNT, this, err);
          }
        }
        return this;
      }
      if (this._readableState) {
        this._readableState.destroyed = true;
      }
      if (this._writableState) {
        this._writableState.destroyed = true;
      }
      this._destroy(err || null, function(err2) {
        if (!cb && err2) {
          if (!_this._writableState) {
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else if (!_this._writableState.errorEmitted) {
            _this._writableState.errorEmitted = true;
            process.nextTick(emitErrorAndCloseNT, _this, err2);
          } else {
            process.nextTick(emitCloseNT, _this);
          }
        } else if (cb) {
          process.nextTick(emitCloseNT, _this);
          cb(err2);
        } else {
          process.nextTick(emitCloseNT, _this);
        }
      });
      return this;
    }
    function emitErrorAndCloseNT(self2, err) {
      emitErrorNT(self2, err);
      emitCloseNT(self2);
    }
    function emitCloseNT(self2) {
      if (self2._writableState && !self2._writableState.emitClose) return;
      if (self2._readableState && !self2._readableState.emitClose) return;
      self2.emit("close");
    }
    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }
      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finalCalled = false;
        this._writableState.prefinished = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }
    function emitErrorNT(self2, err) {
      self2.emit("error", err);
    }
    function errorOrDestroy(stream, err) {
      var rState = stream._readableState;
      var wState = stream._writableState;
      if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);
      else stream.emit("error", err);
    }
    module.exports = {
      destroy,
      undestroy,
      errorOrDestroy
    };
  }
});

// node_modules/readable-stream/errors-browser.js
var require_errors_browser = __commonJS({
  "node_modules/readable-stream/errors-browser.js"(exports, module) {
    "use strict";
    function _inheritsLoose(subClass, superClass) {
      subClass.prototype = Object.create(superClass.prototype);
      subClass.prototype.constructor = subClass;
      subClass.__proto__ = superClass;
    }
    var codes = {};
    function createErrorType(code, message, Base) {
      if (!Base) {
        Base = Error;
      }
      function getMessage(arg1, arg2, arg3) {
        if (typeof message === "string") {
          return message;
        } else {
          return message(arg1, arg2, arg3);
        }
      }
      var NodeError = function(_Base) {
        _inheritsLoose(NodeError2, _Base);
        function NodeError2(arg1, arg2, arg3) {
          return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
        }
        return NodeError2;
      }(Base);
      NodeError.prototype.name = Base.name;
      NodeError.prototype.code = code;
      codes[code] = NodeError;
    }
    function oneOf(expected, thing) {
      if (Array.isArray(expected)) {
        var len = expected.length;
        expected = expected.map(function(i) {
          return String(i);
        });
        if (len > 2) {
          return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(", "), ", or ") + expected[len - 1];
        } else if (len === 2) {
          return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
        } else {
          return "of ".concat(thing, " ").concat(expected[0]);
        }
      } else {
        return "of ".concat(thing, " ").concat(String(expected));
      }
    }
    function startsWith(str, search, pos) {
      return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    }
    function endsWith(str, search, this_len) {
      if (this_len === void 0 || this_len > str.length) {
        this_len = str.length;
      }
      return str.substring(this_len - search.length, this_len) === search;
    }
    function includes(str, search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > str.length) {
        return false;
      } else {
        return str.indexOf(search, start) !== -1;
      }
    }
    createErrorType("ERR_INVALID_OPT_VALUE", function(name, value) {
      return 'The value "' + value + '" is invalid for option "' + name + '"';
    }, TypeError);
    createErrorType("ERR_INVALID_ARG_TYPE", function(name, expected, actual) {
      var determiner;
      if (typeof expected === "string" && startsWith(expected, "not ")) {
        determiner = "must not be";
        expected = expected.replace(/^not /, "");
      } else {
        determiner = "must be";
      }
      var msg;
      if (endsWith(name, " argument")) {
        msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
      } else {
        var type = includes(name, ".") ? "property" : "argument";
        msg = 'The "'.concat(name, '" ').concat(type, " ").concat(determiner, " ").concat(oneOf(expected, "type"));
      }
      msg += ". Received type ".concat(typeof actual);
      return msg;
    }, TypeError);
    createErrorType("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF");
    createErrorType("ERR_METHOD_NOT_IMPLEMENTED", function(name) {
      return "The " + name + " method is not implemented";
    });
    createErrorType("ERR_STREAM_PREMATURE_CLOSE", "Premature close");
    createErrorType("ERR_STREAM_DESTROYED", function(name) {
      return "Cannot call " + name + " after a stream was destroyed";
    });
    createErrorType("ERR_MULTIPLE_CALLBACK", "Callback called multiple times");
    createErrorType("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable");
    createErrorType("ERR_STREAM_WRITE_AFTER_END", "write after end");
    createErrorType("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError);
    createErrorType("ERR_UNKNOWN_ENCODING", function(arg) {
      return "Unknown encoding: " + arg;
    }, TypeError);
    createErrorType("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event");
    module.exports.codes = codes;
  }
});

// node_modules/readable-stream/lib/internal/streams/state.js
var require_state = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/state.js"(exports, module) {
    "use strict";
    var ERR_INVALID_OPT_VALUE = require_errors_browser().codes.ERR_INVALID_OPT_VALUE;
    function highWaterMarkFrom(options, isDuplex, duplexKey) {
      return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
    }
    function getHighWaterMark(state, options, duplexKey, isDuplex) {
      var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);
      if (hwm != null) {
        if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
          var name = isDuplex ? duplexKey : "highWaterMark";
          throw new ERR_INVALID_OPT_VALUE(name, hwm);
        }
        return Math.floor(hwm);
      }
      return state.objectMode ? 16 : 16 * 1024;
    }
    module.exports = {
      getHighWaterMark
    };
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports, module) {
    if (typeof Object.create === "function") {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
              value: ctor,
              enumerable: false,
              writable: true,
              configurable: true
            }
          });
        }
      };
    } else {
      module.exports = function inherits(ctor, superCtor) {
        if (superCtor) {
          ctor.super_ = superCtor;
          var TempCtor = function() {
          };
          TempCtor.prototype = superCtor.prototype;
          ctor.prototype = new TempCtor();
          ctor.prototype.constructor = ctor;
        }
      };
    }
  }
});

// node_modules/util-deprecate/browser.js
var require_browser2 = __commonJS({
  "node_modules/util-deprecate/browser.js"(exports, module) {
    module.exports = deprecate;
    function deprecate(fn, msg) {
      if (config("noDeprecation")) {
        return fn;
      }
      var warned = false;
      function deprecated() {
        if (!warned) {
          if (config("throwDeprecation")) {
            throw new Error(msg);
          } else if (config("traceDeprecation")) {
            console.trace(msg);
          } else {
            console.warn(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }
      return deprecated;
    }
    function config(name) {
      try {
        if (!global.localStorage) return false;
      } catch (_) {
        return false;
      }
      var val = global.localStorage[name];
      if (null == val) return false;
      return String(val).toLowerCase() === "true";
    }
  }
});

// node_modules/readable-stream/lib/_stream_writable.js
var require_stream_writable = __commonJS({
  "node_modules/readable-stream/lib/_stream_writable.js"(exports, module) {
    "use strict";
    module.exports = Writable;
    function CorkedRequest(state) {
      var _this = this;
      this.next = null;
      this.entry = null;
      this.finish = function() {
        onCorkedFinish(_this, state);
      };
    }
    var Duplex;
    Writable.WritableState = WritableState;
    var internalUtil = {
      deprecate: require_browser2()
    };
    var Stream = require_stream_browser();
    var Buffer2 = require_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors_browser().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    var ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES;
    var ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END;
    var ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    require_inherits_browser()(Writable, Stream);
    function nop() {
    }
    function WritableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "writableHighWaterMark", isDuplex);
      this.finalCalled = false;
      this.needDrain = false;
      this.ending = false;
      this.ended = false;
      this.finished = false;
      this.destroyed = false;
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.length = 0;
      this.writing = false;
      this.corked = 0;
      this.sync = true;
      this.bufferProcessing = false;
      this.onwrite = function(er) {
        onwrite(stream, er);
      };
      this.writecb = null;
      this.writelen = 0;
      this.bufferedRequest = null;
      this.lastBufferedRequest = null;
      this.pendingcb = 0;
      this.prefinished = false;
      this.errorEmitted = false;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.bufferedRequestCount = 0;
      this.corkedRequestsFree = new CorkedRequest(this);
    }
    WritableState.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    (function() {
      try {
        Object.defineProperty(WritableState.prototype, "buffer", {
          get: internalUtil.deprecate(function writableStateBufferGetter() {
            return this.getBuffer();
          }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
        });
      } catch (_) {
      }
    })();
    var realHasInstance;
    if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable, Symbol.hasInstance, {
        value: function value(object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable) return false;
          return object && object._writableState instanceof WritableState;
        }
      });
    } else {
      realHasInstance = function realHasInstance2(object) {
        return object instanceof this;
      };
    }
    function Writable(options) {
      Duplex = Duplex || require_stream_duplex();
      var isDuplex = this instanceof Duplex;
      if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
      this._writableState = new WritableState(options, this, isDuplex);
      this.writable = true;
      if (options) {
        if (typeof options.write === "function") this._write = options.write;
        if (typeof options.writev === "function") this._writev = options.writev;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
        if (typeof options.final === "function") this._final = options.final;
      }
      Stream.call(this);
    }
    Writable.prototype.pipe = function() {
      errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
    };
    function writeAfterEnd(stream, cb) {
      var er = new ERR_STREAM_WRITE_AFTER_END();
      errorOrDestroy(stream, er);
      process.nextTick(cb, er);
    }
    function validChunk(stream, state, chunk, cb) {
      var er;
      if (chunk === null) {
        er = new ERR_STREAM_NULL_VALUES();
      } else if (typeof chunk !== "string" && !state.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer"], chunk);
      }
      if (er) {
        errorOrDestroy(stream, er);
        process.nextTick(cb, er);
        return false;
      }
      return true;
    }
    Writable.prototype.write = function(chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);
      if (isBuf && !Buffer2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }
      if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (isBuf) encoding = "buffer";
      else if (!encoding) encoding = state.defaultEncoding;
      if (typeof cb !== "function") cb = nop;
      if (state.ending) writeAfterEnd(this, cb);
      else if (isBuf || validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
      }
      return ret;
    };
    Writable.prototype.cork = function() {
      this._writableState.corked++;
    };
    Writable.prototype.uncork = function() {
      var state = this._writableState;
      if (state.corked) {
        state.corked--;
        if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
      }
    };
    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      if (typeof encoding === "string") encoding = encoding.toLowerCase();
      if (!(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((encoding + "").toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState && this._writableState.getBuffer();
      }
    });
    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
        chunk = Buffer2.from(chunk, encoding);
      }
      return chunk;
    }
    Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState.highWaterMark;
      }
    });
    function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = "buffer";
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;
      state.length += len;
      var ret = state.length < state.highWaterMark;
      if (!ret) state.needDrain = true;
      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk,
          encoding,
          isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }
      return ret;
    }
    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED("write"));
      else if (writev) stream._writev(chunk, state.onwrite);
      else stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }
    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) {
        process.nextTick(cb, er);
        process.nextTick(finishMaybe, stream, state);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
      } else {
        cb(er);
        stream._writableState.errorEmitted = true;
        errorOrDestroy(stream, er);
        finishMaybe(stream, state);
      }
    }
    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }
    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;
      if (typeof cb !== "function") throw new ERR_MULTIPLE_CALLBACK();
      onwriteStateUpdate(state);
      if (er) onwriteError(stream, state, sync, er, cb);
      else {
        var finished = needFinish(state) || stream.destroyed;
        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }
        if (sync) {
          process.nextTick(afterWrite, stream, state, finished, cb);
        } else {
          afterWrite(stream, state, finished, cb);
        }
      }
    }
    function afterWrite(stream, state, finished, cb) {
      if (!finished) onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit("drain");
      }
    }
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;
      if (stream._writev && entry && entry.next) {
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;
        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;
        doWrite(stream, state, true, state.length, buffer, "", holder.finish);
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;
          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          if (state.writing) {
            break;
          }
        }
        if (entry === null) state.lastBufferedRequest = null;
      }
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }
    Writable.prototype._write = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_write()"));
    };
    Writable.prototype._writev = null;
    Writable.prototype.end = function(chunk, encoding, cb) {
      var state = this._writableState;
      if (typeof chunk === "function") {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === "function") {
        cb = encoding;
        encoding = null;
      }
      if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }
      if (!state.ending) endWritable(this, state, cb);
      return this;
    };
    Object.defineProperty(Writable.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState.length;
      }
    });
    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream, state) {
      stream._final(function(err) {
        state.pendingcb--;
        if (err) {
          errorOrDestroy(stream, err);
        }
        state.prefinished = true;
        stream.emit("prefinish");
        finishMaybe(stream, state);
      });
    }
    function prefinish(stream, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream._final === "function" && !state.destroyed) {
          state.pendingcb++;
          state.finalCalled = true;
          process.nextTick(callFinal, stream, state);
        } else {
          state.prefinished = true;
          stream.emit("prefinish");
        }
      }
    }
    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        prefinish(stream, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream.emit("finish");
          if (state.autoDestroy) {
            var rState = stream._readableState;
            if (!rState || rState.autoDestroy && rState.endEmitted) {
              stream.destroy();
            }
          }
        }
      }
      return need;
    }
    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished) process.nextTick(cb);
        else stream.once("finish", cb);
      }
      state.ended = true;
      stream.writable = false;
    }
    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      state.corkedRequestsFree.next = corkReq;
    }
    Object.defineProperty(Writable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        if (this._writableState === void 0) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function set(value) {
        if (!this._writableState) {
          return;
        }
        this._writableState.destroyed = value;
      }
    });
    Writable.prototype.destroy = destroyImpl.destroy;
    Writable.prototype._undestroy = destroyImpl.undestroy;
    Writable.prototype._destroy = function(err, cb) {
      cb(err);
    };
  }
});

// node_modules/readable-stream/lib/_stream_duplex.js
var require_stream_duplex = __commonJS({
  "node_modules/readable-stream/lib/_stream_duplex.js"(exports, module) {
    "use strict";
    var objectKeys = Object.keys || function(obj) {
      var keys2 = [];
      for (var key in obj) keys2.push(key);
      return keys2;
    };
    module.exports = Duplex;
    var Readable = require_stream_readable();
    var Writable = require_stream_writable();
    require_inherits_browser()(Duplex, Readable);
    {
      keys = objectKeys(Writable.prototype);
      for (v = 0; v < keys.length; v++) {
        method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
      }
    }
    var keys;
    var method;
    var v;
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);
      Readable.call(this, options);
      Writable.call(this, options);
      this.allowHalfOpen = true;
      if (options) {
        if (options.readable === false) this.readable = false;
        if (options.writable === false) this.writable = false;
        if (options.allowHalfOpen === false) {
          this.allowHalfOpen = false;
          this.once("end", onend);
        }
      }
    }
    Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState.highWaterMark;
      }
    });
    Object.defineProperty(Duplex.prototype, "writableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState && this._writableState.getBuffer();
      }
    });
    Object.defineProperty(Duplex.prototype, "writableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._writableState.length;
      }
    });
    function onend() {
      if (this._writableState.ended) return;
      process.nextTick(onEndNT, this);
    }
    function onEndNT(self2) {
      self2.end();
    }
    Object.defineProperty(Duplex.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function set(value) {
        if (this._readableState === void 0 || this._writableState === void 0) {
          return;
        }
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });
  }
});

// node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = __commonJS({
  "node_modules/string_decoder/lib/string_decoder.js"(exports) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var isEncoding = Buffer2.isEncoding || function(encoding) {
      encoding = "" + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
        case "raw":
          return true;
        default:
          return false;
      }
    };
    function _normalizeEncoding(enc) {
      if (!enc) return "utf8";
      var retried;
      while (true) {
        switch (enc) {
          case "utf8":
          case "utf-8":
            return "utf8";
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return "utf16le";
          case "latin1":
          case "binary":
            return "latin1";
          case "base64":
          case "ascii":
          case "hex":
            return enc;
          default:
            if (retried) return;
            enc = ("" + enc).toLowerCase();
            retried = true;
        }
      }
    }
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== "string" && (Buffer2.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
      return nenc || enc;
    }
    exports.StringDecoder = StringDecoder;
    function StringDecoder(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case "utf16le":
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case "utf8":
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case "base64":
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer2.allocUnsafe(nb);
    }
    StringDecoder.prototype.write = function(buf) {
      if (buf.length === 0) return "";
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === void 0) return "";
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || "";
    };
    StringDecoder.prototype.end = utf8End;
    StringDecoder.prototype.text = utf8Text;
    StringDecoder.prototype.fillLast = function(buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };
    function utf8CheckByte(byte) {
      if (byte <= 127) return 0;
      else if (byte >> 5 === 6) return 2;
      else if (byte >> 4 === 14) return 3;
      else if (byte >> 3 === 30) return 4;
      return byte >> 6 === 2 ? -1 : -2;
    }
    function utf8CheckIncomplete(self2, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self2.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;
          else self2.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }
    function utf8CheckExtraBytes(self2, buf, p) {
      if ((buf[0] & 192) !== 128) {
        self2.lastNeed = 0;
        return "�";
      }
      if (self2.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 192) !== 128) {
          self2.lastNeed = 1;
          return "�";
        }
        if (self2.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 192) !== 128) {
            self2.lastNeed = 2;
            return "�";
          }
        }
      }
    }
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== void 0) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString("utf8", i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString("utf8", i, end);
    }
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + "�";
      return r;
    }
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString("utf16le", i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 55296 && c <= 56319) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString("utf16le", i, buf.length - 1);
    }
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString("utf16le", 0, end);
      }
      return r;
    }
    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString("base64", i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString("base64", i, buf.length - n);
    }
    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : "";
      if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
      return r;
    }
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }
    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : "";
    }
  }
});

// node_modules/readable-stream/lib/internal/streams/end-of-stream.js
var require_end_of_stream = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/end-of-stream.js"(exports, module) {
    "use strict";
    var ERR_STREAM_PREMATURE_CLOSE = require_errors_browser().codes.ERR_STREAM_PREMATURE_CLOSE;
    function once(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        callback.apply(this, args);
      };
    }
    function noop() {
    }
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    function eos(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once(callback || noop);
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var onlegacyfinish = function onlegacyfinish2() {
        if (!stream.writable) onfinish();
      };
      var writableEnded = stream._writableState && stream._writableState.finished;
      var onfinish = function onfinish2() {
        writable = false;
        writableEnded = true;
        if (!readable) callback.call(stream);
      };
      var readableEnded = stream._readableState && stream._readableState.endEmitted;
      var onend = function onend2() {
        readable = false;
        readableEnded = true;
        if (!writable) callback.call(stream);
      };
      var onerror = function onerror2(err) {
        callback.call(stream, err);
      };
      var onclose = function onclose2() {
        var err;
        if (readable && !readableEnded) {
          if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
        if (writable && !writableEnded) {
          if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
          return callback.call(stream, err);
        }
      };
      var onrequest = function onrequest2() {
        stream.req.on("finish", onfinish);
      };
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !stream._writableState) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    }
    module.exports = eos;
  }
});

// node_modules/readable-stream/lib/internal/streams/async_iterator.js
var require_async_iterator = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/async_iterator.js"(exports, module) {
    "use strict";
    var _Object$setPrototypeO;
    function _defineProperty(obj, key, value) {
      key = _toPropertyKey(key);
      if (key in obj) {
        Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
      } else {
        obj[key] = value;
      }
      return obj;
    }
    function _toPropertyKey(arg) {
      var key = _toPrimitive(arg, "string");
      return typeof key === "symbol" ? key : String(key);
    }
    function _toPrimitive(input, hint) {
      if (typeof input !== "object" || input === null) return input;
      var prim = input[Symbol.toPrimitive];
      if (prim !== void 0) {
        var res = prim.call(input, hint || "default");
        if (typeof res !== "object") return res;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return (hint === "string" ? String : Number)(input);
    }
    var finished = require_end_of_stream();
    var kLastResolve = Symbol("lastResolve");
    var kLastReject = Symbol("lastReject");
    var kError = Symbol("error");
    var kEnded = Symbol("ended");
    var kLastPromise = Symbol("lastPromise");
    var kHandlePromise = Symbol("handlePromise");
    var kStream = Symbol("stream");
    function createIterResult(value, done) {
      return {
        value,
        done
      };
    }
    function readAndResolve(iter) {
      var resolve = iter[kLastResolve];
      if (resolve !== null) {
        var data = iter[kStream].read();
        if (data !== null) {
          iter[kLastPromise] = null;
          iter[kLastResolve] = null;
          iter[kLastReject] = null;
          resolve(createIterResult(data, false));
        }
      }
    }
    function onReadable(iter) {
      process.nextTick(readAndResolve, iter);
    }
    function wrapForNext(lastPromise, iter) {
      return function(resolve, reject) {
        lastPromise.then(function() {
          if (iter[kEnded]) {
            resolve(createIterResult(void 0, true));
            return;
          }
          iter[kHandlePromise](resolve, reject);
        }, reject);
      };
    }
    var AsyncIteratorPrototype = Object.getPrototypeOf(function() {
    });
    var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
      get stream() {
        return this[kStream];
      },
      next: function next() {
        var _this = this;
        var error = this[kError];
        if (error !== null) {
          return Promise.reject(error);
        }
        if (this[kEnded]) {
          return Promise.resolve(createIterResult(void 0, true));
        }
        if (this[kStream].destroyed) {
          return new Promise(function(resolve, reject) {
            process.nextTick(function() {
              if (_this[kError]) {
                reject(_this[kError]);
              } else {
                resolve(createIterResult(void 0, true));
              }
            });
          });
        }
        var lastPromise = this[kLastPromise];
        var promise;
        if (lastPromise) {
          promise = new Promise(wrapForNext(lastPromise, this));
        } else {
          var data = this[kStream].read();
          if (data !== null) {
            return Promise.resolve(createIterResult(data, false));
          }
          promise = new Promise(this[kHandlePromise]);
        }
        this[kLastPromise] = promise;
        return promise;
      }
    }, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function() {
      return this;
    }), _defineProperty(_Object$setPrototypeO, "return", function _return() {
      var _this2 = this;
      return new Promise(function(resolve, reject) {
        _this2[kStream].destroy(null, function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(createIterResult(void 0, true));
        });
      });
    }), _Object$setPrototypeO), AsyncIteratorPrototype);
    var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator2(stream) {
      var _Object$create;
      var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
        value: stream,
        writable: true
      }), _defineProperty(_Object$create, kLastResolve, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kLastReject, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kError, {
        value: null,
        writable: true
      }), _defineProperty(_Object$create, kEnded, {
        value: stream._readableState.endEmitted,
        writable: true
      }), _defineProperty(_Object$create, kHandlePromise, {
        value: function value(resolve, reject) {
          var data = iterator[kStream].read();
          if (data) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            resolve(createIterResult(data, false));
          } else {
            iterator[kLastResolve] = resolve;
            iterator[kLastReject] = reject;
          }
        },
        writable: true
      }), _Object$create));
      iterator[kLastPromise] = null;
      finished(stream, function(err) {
        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
          var reject = iterator[kLastReject];
          if (reject !== null) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            reject(err);
          }
          iterator[kError] = err;
          return;
        }
        var resolve = iterator[kLastResolve];
        if (resolve !== null) {
          iterator[kLastPromise] = null;
          iterator[kLastResolve] = null;
          iterator[kLastReject] = null;
          resolve(createIterResult(void 0, true));
        }
        iterator[kEnded] = true;
      });
      stream.on("readable", onReadable.bind(null, iterator));
      return iterator;
    };
    module.exports = createReadableStreamAsyncIterator;
  }
});

// node_modules/readable-stream/lib/internal/streams/from-browser.js
var require_from_browser = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/from-browser.js"(exports, module) {
    module.exports = function() {
      throw new Error("Readable.from is not available in the browser");
    };
  }
});

// node_modules/readable-stream/lib/_stream_readable.js
var require_stream_readable = __commonJS({
  "node_modules/readable-stream/lib/_stream_readable.js"(exports, module) {
    "use strict";
    module.exports = Readable;
    var Duplex;
    Readable.ReadableState = ReadableState;
    var EE = require_events().EventEmitter;
    var EElistenerCount = function EElistenerCount2(emitter, type) {
      return emitter.listeners(type).length;
    };
    var Stream = require_stream_browser();
    var Buffer2 = require_buffer().Buffer;
    var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {
    };
    function _uint8ArrayToBuffer(chunk) {
      return Buffer2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer2.isBuffer(obj) || obj instanceof OurUint8Array;
    }
    var debugUtil = require_util2();
    var debug;
    if (debugUtil && debugUtil.debuglog) {
      debug = debugUtil.debuglog("stream");
    } else {
      debug = function debug2() {
      };
    }
    var BufferList = require_buffer_list();
    var destroyImpl = require_destroy();
    var _require = require_state();
    var getHighWaterMark = _require.getHighWaterMark;
    var _require$codes = require_errors_browser().codes;
    var ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE;
    var ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
    var StringDecoder;
    var createReadableStreamAsyncIterator;
    var from;
    require_inherits_browser()(Readable, Stream);
    var errorOrDestroy = destroyImpl.errorOrDestroy;
    var kProxyEvents = ["error", "close", "destroy", "pause", "resume"];
    function prependListener(emitter, event, fn) {
      if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
      else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);
      else emitter._events[event] = [fn, emitter._events[event]];
    }
    function ReadableState(options, stream, isDuplex) {
      Duplex = Duplex || require_stream_duplex();
      options = options || {};
      if (typeof isDuplex !== "boolean") isDuplex = stream instanceof Duplex;
      this.objectMode = !!options.objectMode;
      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
      this.highWaterMark = getHighWaterMark(this, options, "readableHighWaterMark", isDuplex);
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;
      this.sync = true;
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;
      this.paused = true;
      this.emitClose = options.emitClose !== false;
      this.autoDestroy = !!options.autoDestroy;
      this.destroyed = false;
      this.defaultEncoding = options.defaultEncoding || "utf8";
      this.awaitDrain = 0;
      this.readingMore = false;
      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {
      Duplex = Duplex || require_stream_duplex();
      if (!(this instanceof Readable)) return new Readable(options);
      var isDuplex = this instanceof Duplex;
      this._readableState = new ReadableState(options, this, isDuplex);
      this.readable = true;
      if (options) {
        if (typeof options.read === "function") this._read = options.read;
        if (typeof options.destroy === "function") this._destroy = options.destroy;
      }
      Stream.call(this);
    }
    Object.defineProperty(Readable.prototype, "destroyed", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        if (this._readableState === void 0) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function set(value) {
        if (!this._readableState) {
          return;
        }
        this._readableState.destroyed = value;
      }
    });
    Readable.prototype.destroy = destroyImpl.destroy;
    Readable.prototype._undestroy = destroyImpl.undestroy;
    Readable.prototype._destroy = function(err, cb) {
      cb(err);
    };
    Readable.prototype.push = function(chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;
      if (!state.objectMode) {
        if (typeof chunk === "string") {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer2.from(chunk, encoding);
            encoding = "";
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }
      return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
    };
    Readable.prototype.unshift = function(chunk) {
      return readableAddChunk(this, chunk, null, true, false);
    };
    function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
      debug("readableAddChunk", chunk);
      var state = stream._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid(state, chunk);
        if (er) {
          errorOrDestroy(stream, er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer2.prototype) {
            chunk = _uint8ArrayToBuffer(chunk);
          }
          if (addToFront) {
            if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());
            else addChunk(stream, state, chunk, true);
          } else if (state.ended) {
            errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
          } else if (state.destroyed) {
            return false;
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
              else maybeReadMore(stream, state);
            } else {
              addChunk(stream, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
          maybeReadMore(stream, state);
        }
      }
      return !state.ended && (state.length < state.highWaterMark || state.length === 0);
    }
    function addChunk(stream, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        state.awaitDrain = 0;
        stream.emit("data", chunk);
      } else {
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) state.buffer.unshift(chunk);
        else state.buffer.push(chunk);
        if (state.needReadable) emitReadable(stream);
      }
      maybeReadMore(stream, state);
    }
    function chunkInvalid(state, chunk) {
      var er;
      if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) {
        er = new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
      }
      return er;
    }
    Readable.prototype.isPaused = function() {
      return this._readableState.flowing === false;
    };
    Readable.prototype.setEncoding = function(enc) {
      if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
      var decoder = new StringDecoder(enc);
      this._readableState.decoder = decoder;
      this._readableState.encoding = this._readableState.decoder.encoding;
      var p = this._readableState.buffer.head;
      var content = "";
      while (p !== null) {
        content += decoder.write(p.data);
        p = p.next;
      }
      this._readableState.buffer.clear();
      if (content !== "") this._readableState.buffer.push(content);
      this._readableState.length = content.length;
      return this;
    };
    var MAX_HWM = 1073741824;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n !== n) {
        if (state.flowing && state.length) return state.buffer.head.data.length;
        else return state.length;
      }
      if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length) return n;
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }
    Readable.prototype.read = function(n) {
      debug("read", n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;
      if (n !== 0) state.emittedReadable = false;
      if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
        debug("read: emitReadable", state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable(this);
        else emitReadable(this);
        return null;
      }
      n = howMuchToRead(n, state);
      if (n === 0 && state.ended) {
        if (state.length === 0) endReadable(this);
        return null;
      }
      var doRead = state.needReadable;
      debug("need readable", doRead);
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug("length less than watermark", doRead);
      }
      if (state.ended || state.reading) {
        doRead = false;
        debug("reading or ended", doRead);
      } else if (doRead) {
        debug("do read");
        state.reading = true;
        state.sync = true;
        if (state.length === 0) state.needReadable = true;
        this._read(state.highWaterMark);
        state.sync = false;
        if (!state.reading) n = howMuchToRead(nOrig, state);
      }
      var ret;
      if (n > 0) ret = fromList(n, state);
      else ret = null;
      if (ret === null) {
        state.needReadable = state.length <= state.highWaterMark;
        n = 0;
      } else {
        state.length -= n;
        state.awaitDrain = 0;
      }
      if (state.length === 0) {
        if (!state.ended) state.needReadable = true;
        if (nOrig !== n && state.ended) endReadable(this);
      }
      if (ret !== null) this.emit("data", ret);
      return ret;
    };
    function onEofChunk(stream, state) {
      debug("onEofChunk");
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;
      if (state.sync) {
        emitReadable(stream);
      } else {
        state.needReadable = false;
        if (!state.emittedReadable) {
          state.emittedReadable = true;
          emitReadable_(stream);
        }
      }
    }
    function emitReadable(stream) {
      var state = stream._readableState;
      debug("emitReadable", state.needReadable, state.emittedReadable);
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug("emitReadable", state.flowing);
        state.emittedReadable = true;
        process.nextTick(emitReadable_, stream);
      }
    }
    function emitReadable_(stream) {
      var state = stream._readableState;
      debug("emitReadable_", state.destroyed, state.length, state.ended);
      if (!state.destroyed && (state.length || state.ended)) {
        stream.emit("readable");
        state.emittedReadable = false;
      }
      state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
      flow(stream);
    }
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        process.nextTick(maybeReadMore_, stream, state);
      }
    }
    function maybeReadMore_(stream, state) {
      while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
        var len = state.length;
        debug("maybeReadMore read 0");
        stream.read(0);
        if (len === state.length)
          break;
      }
      state.readingMore = false;
    }
    Readable.prototype._read = function(n) {
      errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED("_read()"));
    };
    Readable.prototype.pipe = function(dest, pipeOpts) {
      var src = this;
      var state = this._readableState;
      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) process.nextTick(endFn);
      else src.once("end", endFn);
      dest.on("unpipe", onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug("onunpipe");
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }
      function onend() {
        debug("onend");
        dest.end();
      }
      var ondrain = pipeOnDrain(src);
      dest.on("drain", ondrain);
      var cleanedUp = false;
      function cleanup() {
        debug("cleanup");
        dest.removeListener("close", onclose);
        dest.removeListener("finish", onfinish);
        dest.removeListener("drain", ondrain);
        dest.removeListener("error", onerror);
        dest.removeListener("unpipe", onunpipe);
        src.removeListener("end", onend);
        src.removeListener("end", unpipe);
        src.removeListener("data", ondata);
        cleanedUp = true;
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }
      src.on("data", ondata);
      function ondata(chunk) {
        debug("ondata");
        var ret = dest.write(chunk);
        debug("dest.write", ret);
        if (ret === false) {
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug("false write response, pause", state.awaitDrain);
            state.awaitDrain++;
          }
          src.pause();
        }
      }
      function onerror(er) {
        debug("onerror", er);
        unpipe();
        dest.removeListener("error", onerror);
        if (EElistenerCount(dest, "error") === 0) errorOrDestroy(dest, er);
      }
      prependListener(dest, "error", onerror);
      function onclose() {
        dest.removeListener("finish", onfinish);
        unpipe();
      }
      dest.once("close", onclose);
      function onfinish() {
        debug("onfinish");
        dest.removeListener("close", onclose);
        unpipe();
      }
      dest.once("finish", onfinish);
      function unpipe() {
        debug("unpipe");
        src.unpipe(dest);
      }
      dest.emit("pipe", src);
      if (!state.flowing) {
        debug("pipe resume");
        src.resume();
      }
      return dest;
    };
    function pipeOnDrain(src) {
      return function pipeOnDrainFunctionResult() {
        var state = src._readableState;
        debug("pipeOnDrain", state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
          state.flowing = true;
          flow(src);
        }
      };
    }
    Readable.prototype.unpipe = function(dest) {
      var state = this._readableState;
      var unpipeInfo = {
        hasUnpiped: false
      };
      if (state.pipesCount === 0) return this;
      if (state.pipesCount === 1) {
        if (dest && dest !== state.pipes) return this;
        if (!dest) dest = state.pipes;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit("unpipe", this, unpipeInfo);
        return this;
      }
      if (!dest) {
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, {
          hasUnpiped: false
        });
        return this;
      }
      var index = indexOf(state.pipes, dest);
      if (index === -1) return this;
      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];
      dest.emit("unpipe", this, unpipeInfo);
      return this;
    };
    Readable.prototype.on = function(ev, fn) {
      var res = Stream.prototype.on.call(this, ev, fn);
      var state = this._readableState;
      if (ev === "data") {
        state.readableListening = this.listenerCount("readable") > 0;
        if (state.flowing !== false) this.resume();
      } else if (ev === "readable") {
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.flowing = false;
          state.emittedReadable = false;
          debug("on readable", state.length, state.reading);
          if (state.length) {
            emitReadable(this);
          } else if (!state.reading) {
            process.nextTick(nReadingNextTick, this);
          }
        }
      }
      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;
    Readable.prototype.removeListener = function(ev, fn) {
      var res = Stream.prototype.removeListener.call(this, ev, fn);
      if (ev === "readable") {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    Readable.prototype.removeAllListeners = function(ev) {
      var res = Stream.prototype.removeAllListeners.apply(this, arguments);
      if (ev === "readable" || ev === void 0) {
        process.nextTick(updateReadableListening, this);
      }
      return res;
    };
    function updateReadableListening(self2) {
      var state = self2._readableState;
      state.readableListening = self2.listenerCount("readable") > 0;
      if (state.resumeScheduled && !state.paused) {
        state.flowing = true;
      } else if (self2.listenerCount("data") > 0) {
        self2.resume();
      }
    }
    function nReadingNextTick(self2) {
      debug("readable nexttick read 0");
      self2.read(0);
    }
    Readable.prototype.resume = function() {
      var state = this._readableState;
      if (!state.flowing) {
        debug("resume");
        state.flowing = !state.readableListening;
        resume(this, state);
      }
      state.paused = false;
      return this;
    };
    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        process.nextTick(resume_, stream, state);
      }
    }
    function resume_(stream, state) {
      debug("resume", state.reading);
      if (!state.reading) {
        stream.read(0);
      }
      state.resumeScheduled = false;
      stream.emit("resume");
      flow(stream);
      if (state.flowing && !state.reading) stream.read(0);
    }
    Readable.prototype.pause = function() {
      debug("call pause flowing=%j", this._readableState.flowing);
      if (this._readableState.flowing !== false) {
        debug("pause");
        this._readableState.flowing = false;
        this.emit("pause");
      }
      this._readableState.paused = true;
      return this;
    };
    function flow(stream) {
      var state = stream._readableState;
      debug("flow", state.flowing);
      while (state.flowing && stream.read() !== null) ;
    }
    Readable.prototype.wrap = function(stream) {
      var _this = this;
      var state = this._readableState;
      var paused = false;
      stream.on("end", function() {
        debug("wrapped end");
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }
        _this.push(null);
      });
      stream.on("data", function(chunk) {
        debug("wrapped data");
        if (state.decoder) chunk = state.decoder.write(chunk);
        if (state.objectMode && (chunk === null || chunk === void 0)) return;
        else if (!state.objectMode && (!chunk || !chunk.length)) return;
        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });
      for (var i in stream) {
        if (this[i] === void 0 && typeof stream[i] === "function") {
          this[i] = /* @__PURE__ */ function methodWrap(method) {
            return function methodWrapReturnFunction() {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }
      this._read = function(n2) {
        debug("wrapped _read", n2);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };
      return this;
    };
    if (typeof Symbol === "function") {
      Readable.prototype[Symbol.asyncIterator] = function() {
        if (createReadableStreamAsyncIterator === void 0) {
          createReadableStreamAsyncIterator = require_async_iterator();
        }
        return createReadableStreamAsyncIterator(this);
      };
    }
    Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._readableState.highWaterMark;
      }
    });
    Object.defineProperty(Readable.prototype, "readableBuffer", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._readableState && this._readableState.buffer;
      }
    });
    Object.defineProperty(Readable.prototype, "readableFlowing", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._readableState.flowing;
      },
      set: function set(state) {
        if (this._readableState) {
          this._readableState.flowing = state;
        }
      }
    });
    Readable._fromList = fromList;
    Object.defineProperty(Readable.prototype, "readableLength", {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function get() {
        return this._readableState.length;
      }
    });
    function fromList(n, state) {
      if (state.length === 0) return null;
      var ret;
      if (state.objectMode) ret = state.buffer.shift();
      else if (!n || n >= state.length) {
        if (state.decoder) ret = state.buffer.join("");
        else if (state.buffer.length === 1) ret = state.buffer.first();
        else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        ret = state.buffer.consume(n, state.decoder);
      }
      return ret;
    }
    function endReadable(stream) {
      var state = stream._readableState;
      debug("endReadable", state.endEmitted);
      if (!state.endEmitted) {
        state.ended = true;
        process.nextTick(endReadableNT, state, stream);
      }
    }
    function endReadableNT(state, stream) {
      debug("endReadableNT", state.endEmitted, state.length);
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit("end");
        if (state.autoDestroy) {
          var wState = stream._writableState;
          if (!wState || wState.autoDestroy && wState.finished) {
            stream.destroy();
          }
        }
      }
    }
    if (typeof Symbol === "function") {
      Readable.from = function(iterable, opts) {
        if (from === void 0) {
          from = require_from_browser();
        }
        return from(Readable, iterable, opts);
      };
    }
    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }
  }
});

// node_modules/readable-stream/lib/_stream_transform.js
var require_stream_transform = __commonJS({
  "node_modules/readable-stream/lib/_stream_transform.js"(exports, module) {
    "use strict";
    module.exports = Transform;
    var _require$codes = require_errors_browser().codes;
    var ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED;
    var ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK;
    var ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING;
    var ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;
    var Duplex = require_stream_duplex();
    require_inherits_browser()(Transform, Duplex);
    function afterTransform(er, data) {
      var ts = this._transformState;
      ts.transforming = false;
      var cb = ts.writecb;
      if (cb === null) {
        return this.emit("error", new ERR_MULTIPLE_CALLBACK());
      }
      ts.writechunk = null;
      ts.writecb = null;
      if (data != null)
        this.push(data);
      cb(er);
      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);
      Duplex.call(this, options);
      this._transformState = {
        afterTransform: afterTransform.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };
      this._readableState.needReadable = true;
      this._readableState.sync = false;
      if (options) {
        if (typeof options.transform === "function") this._transform = options.transform;
        if (typeof options.flush === "function") this._flush = options.flush;
      }
      this.on("prefinish", prefinish);
    }
    function prefinish() {
      var _this = this;
      if (typeof this._flush === "function" && !this._readableState.destroyed) {
        this._flush(function(er, data) {
          done(_this, er, data);
        });
      } else {
        done(this, null, null);
      }
    }
    Transform.prototype.push = function(chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
      cb(new ERR_METHOD_NOT_IMPLEMENTED("_transform()"));
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };
    Transform.prototype._read = function(n) {
      var ts = this._transformState;
      if (ts.writechunk !== null && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        ts.needTransform = true;
      }
    };
    Transform.prototype._destroy = function(err, cb) {
      Duplex.prototype._destroy.call(this, err, function(err2) {
        cb(err2);
      });
    };
    function done(stream, er, data) {
      if (er) return stream.emit("error", er);
      if (data != null)
        stream.push(data);
      if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
      if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
      return stream.push(null);
    }
  }
});

// node_modules/readable-stream/lib/_stream_passthrough.js
var require_stream_passthrough = __commonJS({
  "node_modules/readable-stream/lib/_stream_passthrough.js"(exports, module) {
    "use strict";
    module.exports = PassThrough;
    var Transform = require_stream_transform();
    require_inherits_browser()(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);
      Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
      cb(null, chunk);
    };
  }
});

// node_modules/readable-stream/lib/internal/streams/pipeline.js
var require_pipeline = __commonJS({
  "node_modules/readable-stream/lib/internal/streams/pipeline.js"(exports, module) {
    "use strict";
    var eos;
    function once(callback) {
      var called = false;
      return function() {
        if (called) return;
        called = true;
        callback.apply(void 0, arguments);
      };
    }
    var _require$codes = require_errors_browser().codes;
    var ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS;
    var ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;
    function noop(err) {
      if (err) throw err;
    }
    function isRequest(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    }
    function destroyer(stream, reading, writing, callback) {
      callback = once(callback);
      var closed = false;
      stream.on("close", function() {
        closed = true;
      });
      if (eos === void 0) eos = require_end_of_stream();
      eos(stream, {
        readable: reading,
        writable: writing
      }, function(err) {
        if (err) return callback(err);
        closed = true;
        callback();
      });
      var destroyed = false;
      return function(err) {
        if (closed) return;
        if (destroyed) return;
        destroyed = true;
        if (isRequest(stream)) return stream.abort();
        if (typeof stream.destroy === "function") return stream.destroy();
        callback(err || new ERR_STREAM_DESTROYED("pipe"));
      };
    }
    function call(fn) {
      fn();
    }
    function pipe(from, to) {
      return from.pipe(to);
    }
    function popCallback(streams) {
      if (!streams.length) return noop;
      if (typeof streams[streams.length - 1] !== "function") return noop;
      return streams.pop();
    }
    function pipeline() {
      for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
        streams[_key] = arguments[_key];
      }
      var callback = popCallback(streams);
      if (Array.isArray(streams[0])) streams = streams[0];
      if (streams.length < 2) {
        throw new ERR_MISSING_ARGS("streams");
      }
      var error;
      var destroys = streams.map(function(stream, i) {
        var reading = i < streams.length - 1;
        var writing = i > 0;
        return destroyer(stream, reading, writing, function(err) {
          if (!error) error = err;
          if (err) destroys.forEach(call);
          if (reading) return;
          destroys.forEach(call);
          callback(error);
        });
      });
      return streams.reduce(pipe);
    }
    module.exports = pipeline;
  }
});

// node_modules/readable-stream/readable-browser.js
var require_readable_browser = __commonJS({
  "node_modules/readable-stream/readable-browser.js"(exports, module) {
    exports = module.exports = require_stream_readable();
    exports.Stream = exports;
    exports.Readable = exports;
    exports.Writable = require_stream_writable();
    exports.Duplex = require_stream_duplex();
    exports.Transform = require_stream_transform();
    exports.PassThrough = require_stream_passthrough();
    exports.finished = require_end_of_stream();
    exports.pipeline = require_pipeline();
  }
});

// node_modules/wrappy/wrappy.js
var require_wrappy = __commonJS({
  "node_modules/wrappy/wrappy.js"(exports, module) {
    module.exports = wrappy;
    function wrappy(fn, cb) {
      if (fn && cb) return wrappy(fn)(cb);
      if (typeof fn !== "function")
        throw new TypeError("need wrapper function");
      Object.keys(fn).forEach(function(k) {
        wrapper[k] = fn[k];
      });
      return wrapper;
      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret = fn.apply(this, args);
        var cb2 = args[args.length - 1];
        if (typeof ret === "function" && ret !== cb2) {
          Object.keys(cb2).forEach(function(k) {
            ret[k] = cb2[k];
          });
        }
        return ret;
      }
    }
  }
});

// node_modules/once/once.js
var require_once = __commonJS({
  "node_modules/once/once.js"(exports, module) {
    var wrappy = require_wrappy();
    module.exports = wrappy(once);
    module.exports.strict = wrappy(onceStrict);
    once.proto = once(function() {
      Object.defineProperty(Function.prototype, "once", {
        value: function() {
          return once(this);
        },
        configurable: true
      });
      Object.defineProperty(Function.prototype, "onceStrict", {
        value: function() {
          return onceStrict(this);
        },
        configurable: true
      });
    });
    function once(fn) {
      var f = function() {
        if (f.called) return f.value;
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      f.called = false;
      return f;
    }
    function onceStrict(fn) {
      var f = function() {
        if (f.called)
          throw new Error(f.onceError);
        f.called = true;
        return f.value = fn.apply(this, arguments);
      };
      var name = fn.name || "Function wrapped with `once`";
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f;
    }
  }
});

// node_modules/end-of-stream/index.js
var require_end_of_stream2 = __commonJS({
  "node_modules/end-of-stream/index.js"(exports, module) {
    var once = require_once();
    var noop = function() {
    };
    var qnt = global.Bare ? queueMicrotask : process.nextTick.bind(process);
    var isRequest = function(stream) {
      return stream.setHeader && typeof stream.abort === "function";
    };
    var isChildProcess = function(stream) {
      return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3;
    };
    var eos = function(stream, opts, callback) {
      if (typeof opts === "function") return eos(stream, null, opts);
      if (!opts) opts = {};
      callback = once(callback || noop);
      var ws = stream._writableState;
      var rs = stream._readableState;
      var readable = opts.readable || opts.readable !== false && stream.readable;
      var writable = opts.writable || opts.writable !== false && stream.writable;
      var cancelled = false;
      var onlegacyfinish = function() {
        if (!stream.writable) onfinish();
      };
      var onfinish = function() {
        writable = false;
        if (!readable) callback.call(stream);
      };
      var onend = function() {
        readable = false;
        if (!writable) callback.call(stream);
      };
      var onexit = function(exitCode) {
        callback.call(stream, exitCode ? new Error("exited with error code: " + exitCode) : null);
      };
      var onerror = function(err) {
        callback.call(stream, err);
      };
      var onclose = function() {
        qnt(onclosenexttick);
      };
      var onclosenexttick = function() {
        if (cancelled) return;
        if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream, new Error("premature close"));
        if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream, new Error("premature close"));
      };
      var onrequest = function() {
        stream.req.on("finish", onfinish);
      };
      if (isRequest(stream)) {
        stream.on("complete", onfinish);
        stream.on("abort", onclose);
        if (stream.req) onrequest();
        else stream.on("request", onrequest);
      } else if (writable && !ws) {
        stream.on("end", onlegacyfinish);
        stream.on("close", onlegacyfinish);
      }
      if (isChildProcess(stream)) stream.on("exit", onexit);
      stream.on("end", onend);
      stream.on("finish", onfinish);
      if (opts.error !== false) stream.on("error", onerror);
      stream.on("close", onclose);
      return function() {
        cancelled = true;
        stream.removeListener("complete", onfinish);
        stream.removeListener("abort", onclose);
        stream.removeListener("request", onrequest);
        if (stream.req) stream.req.removeListener("finish", onfinish);
        stream.removeListener("end", onlegacyfinish);
        stream.removeListener("close", onlegacyfinish);
        stream.removeListener("finish", onfinish);
        stream.removeListener("exit", onexit);
        stream.removeListener("end", onend);
        stream.removeListener("error", onerror);
        stream.removeListener("close", onclose);
      };
    };
    module.exports = eos;
  }
});

// node_modules/stream-shift/index.js
var require_stream_shift = __commonJS({
  "node_modules/stream-shift/index.js"(exports, module) {
    module.exports = shift;
    function shift(stream) {
      var rs = stream._readableState;
      if (!rs) return null;
      return rs.objectMode || typeof stream._duplexState === "number" ? stream.read() : stream.read(getStateLength(rs));
    }
    function getStateLength(state) {
      if (state.buffer.length) {
        var idx = state.bufferIndex || 0;
        if (state.buffer.head) {
          return state.buffer.head.data.length;
        } else if (state.buffer.length - idx > 0 && state.buffer[idx]) {
          return state.buffer[idx].length;
        }
      }
      return state.length;
    }
  }
});

// node_modules/duplexify/index.js
var require_duplexify = __commonJS({
  "node_modules/duplexify/index.js"(exports, module) {
    var stream = require_readable_browser();
    var eos = require_end_of_stream2();
    var inherits = require_inherits_browser();
    var shift = require_stream_shift();
    var SIGNAL_FLUSH = Buffer.from && Buffer.from !== Uint8Array.from ? Buffer.from([0]) : new Buffer([0]);
    var onuncork = function(self2, fn) {
      if (self2._corked) self2.once("uncork", fn);
      else fn();
    };
    var autoDestroy = function(self2, err) {
      if (self2._autoDestroy) self2.destroy(err);
    };
    var destroyer = function(self2, end2) {
      return function(err) {
        if (err) autoDestroy(self2, err.message === "premature close" ? null : err);
        else if (end2 && !self2._ended) self2.end();
      };
    };
    var end = function(ws, fn) {
      if (!ws) return fn();
      if (ws._writableState && ws._writableState.finished) return fn();
      if (ws._writableState) return ws.end(fn);
      ws.end();
      fn();
    };
    var noop = function() {
    };
    var toStreams2 = function(rs) {
      return new stream.Readable({ objectMode: true, highWaterMark: 16 }).wrap(rs);
    };
    var Duplexify = function(writable, readable, opts) {
      if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts);
      stream.Duplex.call(this, opts);
      this._writable = null;
      this._readable = null;
      this._readable2 = null;
      this._autoDestroy = !opts || opts.autoDestroy !== false;
      this._forwardDestroy = !opts || opts.destroy !== false;
      this._forwardEnd = !opts || opts.end !== false;
      this._corked = 1;
      this._ondrain = null;
      this._drained = false;
      this._forwarding = false;
      this._unwrite = null;
      this._unread = null;
      this._ended = false;
      this.destroyed = false;
      if (writable) this.setWritable(writable);
      if (readable) this.setReadable(readable);
    };
    inherits(Duplexify, stream.Duplex);
    Duplexify.obj = function(writable, readable, opts) {
      if (!opts) opts = {};
      opts.objectMode = true;
      opts.highWaterMark = 16;
      return new Duplexify(writable, readable, opts);
    };
    Duplexify.prototype.cork = function() {
      if (++this._corked === 1) this.emit("cork");
    };
    Duplexify.prototype.uncork = function() {
      if (this._corked && --this._corked === 0) this.emit("uncork");
    };
    Duplexify.prototype.setWritable = function(writable) {
      if (this._unwrite) this._unwrite();
      if (this.destroyed) {
        if (writable && writable.destroy) writable.destroy();
        return;
      }
      if (writable === null || writable === false) {
        this.end();
        return;
      }
      var self2 = this;
      var unend = eos(writable, { writable: true, readable: false }, destroyer(this, this._forwardEnd));
      var ondrain = function() {
        var ondrain2 = self2._ondrain;
        self2._ondrain = null;
        if (ondrain2) ondrain2();
      };
      var clear = function() {
        self2._writable.removeListener("drain", ondrain);
        unend();
      };
      if (this._unwrite) process.nextTick(ondrain);
      this._writable = writable;
      this._writable.on("drain", ondrain);
      this._unwrite = clear;
      this.uncork();
    };
    Duplexify.prototype.setReadable = function(readable) {
      if (this._unread) this._unread();
      if (this.destroyed) {
        if (readable && readable.destroy) readable.destroy();
        return;
      }
      if (readable === null || readable === false) {
        this.push(null);
        this.resume();
        return;
      }
      var self2 = this;
      var unend = eos(readable, { writable: false, readable: true }, destroyer(this));
      var onreadable = function() {
        self2._forward();
      };
      var onend = function() {
        self2.push(null);
      };
      var clear = function() {
        self2._readable2.removeListener("readable", onreadable);
        self2._readable2.removeListener("end", onend);
        unend();
      };
      this._drained = true;
      this._readable = readable;
      this._readable2 = readable._readableState ? readable : toStreams2(readable);
      this._readable2.on("readable", onreadable);
      this._readable2.on("end", onend);
      this._unread = clear;
      this._forward();
    };
    Duplexify.prototype._read = function() {
      this._drained = true;
      this._forward();
    };
    Duplexify.prototype._forward = function() {
      if (this._forwarding || !this._readable2 || !this._drained) return;
      this._forwarding = true;
      var data;
      while (this._drained && (data = shift(this._readable2)) !== null) {
        if (this.destroyed) continue;
        this._drained = this.push(data);
      }
      this._forwarding = false;
    };
    Duplexify.prototype.destroy = function(err, cb) {
      if (!cb) cb = noop;
      if (this.destroyed) return cb(null);
      this.destroyed = true;
      var self2 = this;
      process.nextTick(function() {
        self2._destroy(err);
        cb(null);
      });
    };
    Duplexify.prototype._destroy = function(err) {
      if (err) {
        var ondrain = this._ondrain;
        this._ondrain = null;
        if (ondrain) ondrain(err);
        else this.emit("error", err);
      }
      if (this._forwardDestroy) {
        if (this._readable && this._readable.destroy) this._readable.destroy();
        if (this._writable && this._writable.destroy) this._writable.destroy();
      }
      this.emit("close");
    };
    Duplexify.prototype._write = function(data, enc, cb) {
      if (this.destroyed) return;
      if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb));
      if (data === SIGNAL_FLUSH) return this._finish(cb);
      if (!this._writable) return cb();
      if (this._writable.write(data) === false) this._ondrain = cb;
      else if (!this.destroyed) cb();
    };
    Duplexify.prototype._finish = function(cb) {
      var self2 = this;
      this.emit("preend");
      onuncork(this, function() {
        end(self2._forwardEnd && self2._writable, function() {
          if (self2._writableState.prefinished === false) self2._writableState.prefinished = true;
          self2.emit("prefinish");
          onuncork(self2, cb);
        });
      });
    };
    Duplexify.prototype.end = function(data, enc, cb) {
      if (typeof data === "function") return this.end(null, null, data);
      if (typeof enc === "function") return this.end(data, null, enc);
      this._ended = true;
      if (data) this.write(data);
      if (!this._writableState.ending && !this._writableState.destroyed) this.write(SIGNAL_FLUSH);
      return stream.Writable.prototype.end.call(this, cb);
    };
    module.exports = Duplexify;
  }
});

// node_modules/@google-cloud/common/build/src/util.js
var require_util4 = __commonJS({
  "node_modules/@google-cloud/common/build/src/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.util = exports.Util = exports.PartialFailureError = exports.ApiError = void 0;
    var projectify_1 = require_src2();
    var htmlEntities = require_commonjs();
    var extend = require_extend();
    var google_auth_library_1 = require_src7();
    var retryRequest = require_retry_request();
    var stream_1 = require_stream();
    var teeny_request_1 = require_src9();
    var service_1 = require_service();
    var duplexify = require_duplexify();
    var requestDefaults = {
      timeout: 6e4,
      gzip: true,
      forever: true,
      pool: {
        maxSockets: Infinity
      }
    };
    var AUTO_RETRY_DEFAULT = true;
    var MAX_RETRY_DEFAULT = 3;
    var ApiError = class _ApiError extends Error {
      constructor(errorBodyOrMessage) {
        super();
        __publicField(this, "code");
        __publicField(this, "errors");
        __publicField(this, "response");
        if (typeof errorBodyOrMessage !== "object") {
          this.message = errorBodyOrMessage || "";
          return;
        }
        const errorBody = errorBodyOrMessage;
        this.code = errorBody.code;
        this.errors = errorBody.errors;
        this.response = errorBody.response;
        try {
          this.errors = JSON.parse(this.response.body).error.errors;
        } catch (e) {
          this.errors = errorBody.errors;
        }
        this.message = _ApiError.createMultiErrorMessage(errorBody, this.errors);
        Error.captureStackTrace(this);
      }
      /**
       * Pieces together an error message by combining all unique error messages
       * returned from a single GoogleError
       *
       * @private
       *
       * @param {GoogleErrorBody} err The original error.
       * @param {GoogleInnerError[]} [errors] Inner errors, if any.
       * @returns {string}
       */
      static createMultiErrorMessage(err, errors) {
        const messages = /* @__PURE__ */ new Set();
        if (err.message) {
          messages.add(err.message);
        }
        if (errors && errors.length) {
          errors.forEach(({ message }) => messages.add(message));
        } else if (err.response && err.response.body) {
          messages.add(htmlEntities.decode(err.response.body.toString()));
        } else if (!err.message) {
          messages.add("A failure occurred during this request.");
        }
        let messageArr = Array.from(messages);
        if (messageArr.length > 1) {
          messageArr = messageArr.map((message, i) => `    ${i + 1}. ${message}`);
          messageArr.unshift("Multiple errors occurred during the request. Please see the `errors` array for complete details.\n");
          messageArr.push("\n");
        }
        return messageArr.join("\n");
      }
    };
    exports.ApiError = ApiError;
    var PartialFailureError = class extends Error {
      constructor(b) {
        super();
        __publicField(this, "errors");
        __publicField(this, "response");
        const errorObject = b;
        this.errors = errorObject.errors;
        this.name = "PartialFailureError";
        this.response = errorObject.response;
        this.message = ApiError.createMultiErrorMessage(errorObject, this.errors);
      }
    };
    exports.PartialFailureError = PartialFailureError;
    var Util = class {
      constructor() {
        __publicField(this, "ApiError", ApiError);
        __publicField(this, "PartialFailureError", PartialFailureError);
      }
      /**
       * No op.
       *
       * @example
       * function doSomething(callback) {
       *   callback = callback || noop;
       * }
       */
      noop() {
      }
      /**
       * Uniformly process an API response.
       *
       * @param {*} err - Error value.
       * @param {*} resp - Response value.
       * @param {*} body - Body value.
       * @param {function} callback - The callback function.
       */
      handleResp(err, resp, body, callback) {
        callback = callback || util.noop;
        const parsedResp = extend(true, { err: err || null }, resp && util.parseHttpRespMessage(resp), body && util.parseHttpRespBody(body));
        if (!parsedResp.err && resp && typeof parsedResp.body === "object") {
          parsedResp.resp.body = parsedResp.body;
        }
        if (parsedResp.err && resp) {
          parsedResp.err.response = resp;
        }
        callback(parsedResp.err, parsedResp.body, parsedResp.resp);
      }
      /**
       * Sniff an incoming HTTP response message for errors.
       *
       * @param {object} httpRespMessage - An incoming HTTP response message from `request`.
       * @return {object} parsedHttpRespMessage - The parsed response.
       * @param {?error} parsedHttpRespMessage.err - An error detected.
       * @param {object} parsedHttpRespMessage.resp - The original response object.
       */
      parseHttpRespMessage(httpRespMessage) {
        const parsedHttpRespMessage = {
          resp: httpRespMessage
        };
        if (httpRespMessage.statusCode < 200 || httpRespMessage.statusCode > 299) {
          parsedHttpRespMessage.err = new ApiError({
            errors: new Array(),
            code: httpRespMessage.statusCode,
            message: httpRespMessage.statusMessage,
            response: httpRespMessage
          });
        }
        return parsedHttpRespMessage;
      }
      /**
       * Parse the response body from an HTTP request.
       *
       * @param {object} body - The response body.
       * @return {object} parsedHttpRespMessage - The parsed response.
       * @param {?error} parsedHttpRespMessage.err - An error detected.
       * @param {object} parsedHttpRespMessage.body - The original body value provided
       *     will try to be JSON.parse'd. If it's successful, the parsed value will
       * be returned here, otherwise the original value and an error will be returned.
       */
      parseHttpRespBody(body) {
        const parsedHttpRespBody = {
          body
        };
        if (typeof body === "string") {
          try {
            parsedHttpRespBody.body = JSON.parse(body);
          } catch (err) {
            parsedHttpRespBody.body = body;
          }
        }
        if (parsedHttpRespBody.body && parsedHttpRespBody.body.error) {
          parsedHttpRespBody.err = new ApiError(parsedHttpRespBody.body.error);
        }
        return parsedHttpRespBody;
      }
      /**
       * Take a Duplexify stream, fetch an authenticated connection header, and
       * create an outgoing writable stream.
       *
       * @param {Duplexify} dup - Duplexify stream.
       * @param {object} options - Configuration object.
       * @param {module:common/connection} options.connection - A connection instance used to get a token with and send the request through.
       * @param {object} options.metadata - Metadata to send at the head of the request.
       * @param {object} options.request - Request object, in the format of a standard Node.js http.request() object.
       * @param {string=} options.request.method - Default: "POST".
       * @param {string=} options.request.qs.uploadType - Default: "multipart".
       * @param {string=} options.streamContentType - Default: "application/octet-stream".
       * @param {function} onComplete - Callback, executed after the writable Request stream has completed.
       */
      makeWritableStream(dup, options, onComplete) {
        onComplete = onComplete || util.noop;
        const writeStream = new ProgressStream();
        writeStream.on("progress", (evt) => dup.emit("progress", evt));
        dup.setWritable(writeStream);
        const defaultReqOpts = {
          method: "POST",
          qs: {
            uploadType: "multipart"
          },
          timeout: 0,
          maxRetries: 0
        };
        const metadata = options.metadata || {};
        const reqOpts = extend(true, defaultReqOpts, options.request, {
          multipart: [
            {
              "Content-Type": "application/json",
              body: JSON.stringify(metadata)
            },
            {
              "Content-Type": metadata.contentType || "application/octet-stream",
              body: writeStream
            }
          ]
        });
        options.makeAuthenticatedRequest(reqOpts, {
          onAuthenticated(err, authenticatedReqOpts) {
            if (err) {
              dup.destroy(err);
              return;
            }
            const request = teeny_request_1.teenyRequest.defaults(requestDefaults);
            request(authenticatedReqOpts, (err2, resp, body) => {
              util.handleResp(err2, resp, body, (err3, data) => {
                if (err3) {
                  dup.destroy(err3);
                  return;
                }
                dup.emit("response", resp);
                onComplete(data);
              });
            });
          }
        });
      }
      /**
       * Returns true if the API request should be retried, given the error that was
       * given the first time the request was attempted. This is used for rate limit
       * related errors as well as intermittent server errors.
       *
       * @param {error} err - The API error to check if it is appropriate to retry.
       * @return {boolean} True if the API request should be retried, false otherwise.
       */
      shouldRetryRequest(err) {
        if (err) {
          if ([408, 429, 500, 502, 503, 504].indexOf(err.code) !== -1) {
            return true;
          }
          if (err.errors) {
            for (const e of err.errors) {
              const reason = e.reason;
              if (reason === "rateLimitExceeded") {
                return true;
              }
              if (reason === "userRateLimitExceeded") {
                return true;
              }
              if (reason && reason.includes("EAI_AGAIN")) {
                return true;
              }
            }
          }
        }
        return false;
      }
      /**
       * Get a function for making authenticated requests.
       *
       * @param {object} config - Configuration object.
       * @param {boolean=} config.autoRetry - Automatically retry requests if the
       *     response is related to rate limits or certain intermittent server
       * errors. We will exponentially backoff subsequent requests by default.
       * (default: true)
       * @param {object=} config.credentials - Credentials object.
       * @param {boolean=} config.customEndpoint - If true, just return the provided request options. Default: false.
       * @param {boolean=} config.useAuthWithCustomEndpoint - If true, will authenticate when using a custom endpoint. Default: false.
       * @param {string=} config.email - Account email address, required for PEM/P12 usage.
       * @param {number=} config.maxRetries - Maximum number of automatic retries attempted before returning the error. (default: 3)
       * @param {string=} config.keyFile - Path to a .json, .pem, or .p12 keyfile.
       * @param {array} config.scopes - Array of scopes required for the API.
       */
      makeAuthenticatedRequestFactory(config) {
        const googleAutoAuthConfig = extend({}, config);
        if (googleAutoAuthConfig.projectId === service_1.DEFAULT_PROJECT_ID_TOKEN) {
          delete googleAutoAuthConfig.projectId;
        }
        let authClient;
        if (googleAutoAuthConfig.authClient instanceof google_auth_library_1.GoogleAuth) {
          authClient = googleAutoAuthConfig.authClient;
        } else {
          const config2 = {
            ...googleAutoAuthConfig,
            authClient: googleAutoAuthConfig.authClient
          };
          authClient = new google_auth_library_1.GoogleAuth(config2);
        }
        function makeAuthenticatedRequest(reqOpts, optionsOrCallback) {
          let stream;
          let projectId;
          const reqConfig = extend({}, config);
          let activeRequest_;
          if (!optionsOrCallback) {
            stream = duplexify();
            reqConfig.stream = stream;
          }
          const options = typeof optionsOrCallback === "object" ? optionsOrCallback : void 0;
          const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : void 0;
          async function setProjectId() {
            projectId = await authClient.getProjectId();
          }
          const onAuthenticated = async (err, authenticatedReqOpts) => {
            const authLibraryError = err;
            const autoAuthFailed = err && err.message.indexOf("Could not load the default credentials") > -1;
            if (autoAuthFailed) {
              authenticatedReqOpts = reqOpts;
            }
            if (!err || autoAuthFailed) {
              try {
                authenticatedReqOpts = util.decorateRequest(authenticatedReqOpts, projectId);
                err = null;
              } catch (e) {
                if (e instanceof projectify_1.MissingProjectIdError) {
                  try {
                    await setProjectId();
                    authenticatedReqOpts = util.decorateRequest(authenticatedReqOpts, projectId);
                    err = null;
                  } catch (e2) {
                    err = err || e2;
                  }
                } else {
                  err = err || e;
                }
              }
            }
            if (err) {
              if (stream) {
                stream.destroy(err);
              } else {
                const fn = options && options.onAuthenticated ? options.onAuthenticated : callback;
                fn(err);
              }
              return;
            }
            if (options && options.onAuthenticated) {
              options.onAuthenticated(null, authenticatedReqOpts);
            } else {
              activeRequest_ = util.makeRequest(authenticatedReqOpts, reqConfig, (apiResponseError, ...params) => {
                if (apiResponseError && apiResponseError.code === 401 && authLibraryError) {
                  apiResponseError = authLibraryError;
                }
                callback(apiResponseError, ...params);
              });
            }
          };
          const prepareRequest = async () => {
            try {
              const getProjectId = async () => {
                if (config.projectId && config.projectId !== service_1.DEFAULT_PROJECT_ID_TOKEN) {
                  return config.projectId;
                }
                if (config.projectIdRequired === false) {
                  return service_1.DEFAULT_PROJECT_ID_TOKEN;
                }
                return setProjectId();
              };
              const authorizeRequest = async () => {
                if (reqConfig.customEndpoint && !reqConfig.useAuthWithCustomEndpoint) {
                  return reqOpts;
                } else {
                  return authClient.authorizeRequest(reqOpts);
                }
              };
              const [_projectId, authorizedReqOpts] = await Promise.all([
                getProjectId(),
                authorizeRequest()
              ]);
              if (_projectId) {
                projectId = _projectId;
              }
              return onAuthenticated(null, authorizedReqOpts);
            } catch (e) {
              return onAuthenticated(e);
            }
          };
          void prepareRequest();
          if (stream) {
            return stream;
          }
          return {
            abort() {
              setImmediate(() => {
                if (activeRequest_) {
                  activeRequest_.abort();
                  activeRequest_ = null;
                }
              });
            }
          };
        }
        const mar = makeAuthenticatedRequest;
        mar.getCredentials = authClient.getCredentials.bind(authClient);
        mar.authClient = authClient;
        return mar;
      }
      /**
       * Make a request through the `retryRequest` module with built-in error
       * handling and exponential back off.
       *
       * @param {object} reqOpts - Request options in the format `request` expects.
       * @param {object=} config - Configuration object.
       * @param {boolean=} config.autoRetry - Automatically retry requests if the
       *     response is related to rate limits or certain intermittent server
       * errors. We will exponentially backoff subsequent requests by default.
       * (default: true)
       * @param {number=} config.maxRetries - Maximum number of automatic retries
       *     attempted before returning the error. (default: 3)
       * @param {object=} config.request - HTTP module for request calls.
       * @param {function} callback - The callback function.
       */
      makeRequest(reqOpts, config, callback) {
        var _a, _b, _c, _d, _e, _f, _g;
        let autoRetryValue = AUTO_RETRY_DEFAULT;
        if (config.autoRetry !== void 0 && ((_a = config.retryOptions) == null ? void 0 : _a.autoRetry) !== void 0) {
          throw new ApiError("autoRetry is deprecated. Use retryOptions.autoRetry instead.");
        } else if (config.autoRetry !== void 0) {
          autoRetryValue = config.autoRetry;
        } else if (((_b = config.retryOptions) == null ? void 0 : _b.autoRetry) !== void 0) {
          autoRetryValue = config.retryOptions.autoRetry;
        }
        let maxRetryValue = MAX_RETRY_DEFAULT;
        if (config.maxRetries && ((_c = config.retryOptions) == null ? void 0 : _c.maxRetries)) {
          throw new ApiError("maxRetries is deprecated. Use retryOptions.maxRetries instead.");
        } else if (config.maxRetries) {
          maxRetryValue = config.maxRetries;
        } else if ((_d = config.retryOptions) == null ? void 0 : _d.maxRetries) {
          maxRetryValue = config.retryOptions.maxRetries;
        }
        const options = {
          request: teeny_request_1.teenyRequest.defaults(requestDefaults),
          retries: autoRetryValue !== false ? maxRetryValue : 0,
          noResponseRetries: autoRetryValue !== false ? maxRetryValue : 0,
          shouldRetryFn(httpRespMessage) {
            var _a2, _b2;
            const err = util.parseHttpRespMessage(httpRespMessage).err;
            if ((_a2 = config.retryOptions) == null ? void 0 : _a2.retryableErrorFn) {
              return err && ((_b2 = config.retryOptions) == null ? void 0 : _b2.retryableErrorFn(err));
            }
            return err && util.shouldRetryRequest(err);
          },
          maxRetryDelay: (_e = config.retryOptions) == null ? void 0 : _e.maxRetryDelay,
          retryDelayMultiplier: (_f = config.retryOptions) == null ? void 0 : _f.retryDelayMultiplier,
          totalTimeout: (_g = config.retryOptions) == null ? void 0 : _g.totalTimeout
        };
        if (typeof reqOpts.maxRetries === "number") {
          options.retries = reqOpts.maxRetries;
        }
        if (!config.stream) {
          return retryRequest(reqOpts, options, (err, response, body) => {
            util.handleResp(err, response, body, callback);
          });
        }
        const dup = config.stream;
        let requestStream;
        const isGetRequest = (reqOpts.method || "GET").toUpperCase() === "GET";
        if (isGetRequest) {
          requestStream = retryRequest(reqOpts, options);
          dup.setReadable(requestStream);
        } else {
          requestStream = options.request(reqOpts);
          dup.setWritable(requestStream);
        }
        requestStream.on("error", dup.destroy.bind(dup)).on("response", dup.emit.bind(dup, "response")).on("complete", dup.emit.bind(dup, "complete"));
        dup.abort = requestStream.abort;
        return dup;
      }
      /**
       * Decorate the options about to be made in a request.
       *
       * @param {object} reqOpts - The options to be passed to `request`.
       * @param {string} projectId - The project ID.
       * @return {object} reqOpts - The decorated reqOpts.
       */
      decorateRequest(reqOpts, projectId) {
        delete reqOpts.autoPaginate;
        delete reqOpts.autoPaginateVal;
        delete reqOpts.objectMode;
        if (reqOpts.qs !== null && typeof reqOpts.qs === "object") {
          delete reqOpts.qs.autoPaginate;
          delete reqOpts.qs.autoPaginateVal;
          reqOpts.qs = (0, projectify_1.replaceProjectIdToken)(reqOpts.qs, projectId);
        }
        if (Array.isArray(reqOpts.multipart)) {
          reqOpts.multipart = reqOpts.multipart.map((part) => {
            return (0, projectify_1.replaceProjectIdToken)(part, projectId);
          });
        }
        if (reqOpts.json !== null && typeof reqOpts.json === "object") {
          delete reqOpts.json.autoPaginate;
          delete reqOpts.json.autoPaginateVal;
          reqOpts.json = (0, projectify_1.replaceProjectIdToken)(reqOpts.json, projectId);
        }
        reqOpts.uri = (0, projectify_1.replaceProjectIdToken)(reqOpts.uri, projectId);
        return reqOpts;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isCustomType(unknown, module2) {
        function getConstructorName(obj) {
          return obj.constructor && obj.constructor.name.toLowerCase();
        }
        const moduleNameParts = module2.split("/");
        const parentModuleName = moduleNameParts[0] && moduleNameParts[0].toLowerCase();
        const subModuleName = moduleNameParts[1] && moduleNameParts[1].toLowerCase();
        if (subModuleName && getConstructorName(unknown) !== subModuleName) {
          return false;
        }
        let walkingModule = unknown;
        while (true) {
          if (getConstructorName(walkingModule) === parentModuleName) {
            return true;
          }
          walkingModule = walkingModule.parent;
          if (!walkingModule) {
            return false;
          }
        }
      }
      /**
       * Create a properly-formatted User-Agent string from a package.json file.
       *
       * @param {object} packageJson - A module's package.json file.
       * @return {string} userAgent - The formatted User-Agent string.
       */
      getUserAgentFromPackageJson(packageJson) {
        const hyphenatedPackageName = packageJson.name.replace("@google-cloud", "gcloud-node").replace("/", "-");
        return hyphenatedPackageName + "/" + packageJson.version;
      }
      /**
       * Given two parameters, figure out if this is either:
       *  - Just a callback function
       *  - An options object, and then a callback function
       * @param optionsOrCallback An options object or callback.
       * @param cb A potentially undefined callback.
       */
      maybeOptionsOrCallback(optionsOrCallback, cb) {
        return typeof optionsOrCallback === "function" ? [{}, optionsOrCallback] : [optionsOrCallback, cb];
      }
    };
    exports.Util = Util;
    var ProgressStream = class extends stream_1.Transform {
      constructor() {
        super(...arguments);
        __publicField(this, "bytesRead", 0);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _transform(chunk, encoding, callback) {
        this.bytesRead += chunk.length;
        this.emit("progress", { bytesWritten: this.bytesRead, contentLength: "*" });
        this.push(chunk);
        callback();
      }
    };
    var util = new Util();
    exports.util = util;
  }
});

// node_modules/@google-cloud/common/build/src/service-object.js
var require_service_object = __commonJS({
  "node_modules/@google-cloud/common/build/src/service-object.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServiceObject = void 0;
    var promisify_1 = require_src();
    var arrify = require_arrify();
    var events_1 = require_events();
    var extend = require_extend();
    var util_1 = require_util4();
    var ServiceObject = class _ServiceObject extends events_1.EventEmitter {
      /*
       * @constructor
       * @alias module:common/service-object
       *
       * @private
       *
       * @param {object} config - Configuration object.
       * @param {string} config.baseUrl - The base URL to make API requests to.
       * @param {string} config.createMethod - The method which creates this object.
       * @param {string=} config.id - The identifier of the object. For example, the
       *     name of a Storage bucket or Pub/Sub topic.
       * @param {object=} config.methods - A map of each method name that should be inherited.
       * @param {object} config.methods[].reqOpts - Default request options for this
       *     particular method. A common use case is when `setMetadata` requires a
       *     `PUT` method to override the default `PATCH`.
       * @param {object} config.parent - The parent service instance. For example, an
       *     instance of Storage if the object is Bucket.
       */
      constructor(config) {
        super();
        __publicField(this, "metadata");
        __publicField(this, "baseUrl");
        __publicField(this, "parent");
        __publicField(this, "id");
        __publicField(this, "pollIntervalMs");
        __publicField(this, "createMethod");
        __publicField(this, "methods");
        __publicField(this, "interceptors");
        __publicField(this, "projectId");
        this.metadata = {};
        this.baseUrl = config.baseUrl;
        this.parent = config.parent;
        this.id = config.id;
        this.createMethod = config.createMethod;
        this.methods = config.methods || {};
        this.interceptors = [];
        this.pollIntervalMs = config.pollIntervalMs;
        this.projectId = config.projectId;
        if (config.methods) {
          Object.getOwnPropertyNames(_ServiceObject.prototype).filter((methodName) => {
            return (
              // All ServiceObjects need `request` and `getRequestInterceptors`.
              // clang-format off
              !/^request/.test(methodName) && !/^getRequestInterceptors/.test(methodName) && // clang-format on
              // The ServiceObject didn't redefine the method.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this[methodName] === // eslint-disable-next-line @typescript-eslint/no-explicit-any
              _ServiceObject.prototype[methodName] && // This method isn't wanted.
              !config.methods[methodName]
            );
          }).forEach((methodName) => {
            this[methodName] = void 0;
          });
        }
      }
      create(optionsOrCallback, callback) {
        const self2 = this;
        const args = [this.id];
        if (typeof optionsOrCallback === "function") {
          callback = optionsOrCallback;
        }
        if (typeof optionsOrCallback === "object") {
          args.push(optionsOrCallback);
        }
        function onCreate(...args2) {
          const [err, instance] = args2;
          if (!err) {
            self2.metadata = instance.metadata;
            args2[1] = self2;
          }
          callback(...args2);
        }
        args.push(onCreate);
        this.createMethod.apply(null, args);
      }
      delete(optionsOrCallback, cb) {
        const [options, callback] = util_1.util.maybeOptionsOrCallback(optionsOrCallback, cb);
        const ignoreNotFound = options.ignoreNotFound;
        delete options.ignoreNotFound;
        const methodConfig = typeof this.methods.delete === "object" && this.methods.delete || {};
        const reqOpts = extend(true, {
          method: "DELETE",
          uri: ""
        }, methodConfig.reqOpts, {
          qs: options
        });
        _ServiceObject.prototype.request.call(this, reqOpts, (err, ...args) => {
          if (err) {
            if (err.code === 404 && ignoreNotFound) {
              err = null;
            }
          }
          callback(err, ...args);
        });
      }
      exists(optionsOrCallback, cb) {
        const [options, callback] = util_1.util.maybeOptionsOrCallback(optionsOrCallback, cb);
        this.get(options, (err) => {
          if (err) {
            if (err.code === 404) {
              callback(null, false);
            } else {
              callback(err);
            }
            return;
          }
          callback(null, true);
        });
      }
      get(optionsOrCallback, cb) {
        const self2 = this;
        const [opts, callback] = util_1.util.maybeOptionsOrCallback(optionsOrCallback, cb);
        const options = Object.assign({}, opts);
        const autoCreate = options.autoCreate && typeof this.create === "function";
        delete options.autoCreate;
        function onCreate(err, instance, apiResponse) {
          if (err) {
            if (err.code === 409) {
              self2.get(options, callback);
              return;
            }
            callback(err, null, apiResponse);
            return;
          }
          callback(null, instance, apiResponse);
        }
        this.getMetadata(options, (err, metadata) => {
          if (err) {
            if (err.code === 404 && autoCreate) {
              const args = [];
              if (Object.keys(options).length > 0) {
                args.push(options);
              }
              args.push(onCreate);
              void self2.create(...args);
              return;
            }
            callback(err, null, metadata);
            return;
          }
          callback(null, self2, metadata);
        });
      }
      getMetadata(optionsOrCallback, cb) {
        const [options, callback] = util_1.util.maybeOptionsOrCallback(optionsOrCallback, cb);
        const methodConfig = typeof this.methods.getMetadata === "object" && this.methods.getMetadata || {};
        const reqOpts = extend(true, {
          uri: ""
        }, methodConfig.reqOpts, {
          qs: options
        });
        _ServiceObject.prototype.request.call(this, reqOpts, (err, body, res) => {
          this.metadata = body;
          callback(err, this.metadata, res);
        });
      }
      /**
       * Return the user's custom request interceptors.
       */
      getRequestInterceptors() {
        const localInterceptors = this.interceptors.filter((interceptor) => typeof interceptor.request === "function").map((interceptor) => interceptor.request);
        return this.parent.getRequestInterceptors().concat(localInterceptors);
      }
      setMetadata(metadata, optionsOrCallback, cb) {
        const [options, callback] = util_1.util.maybeOptionsOrCallback(optionsOrCallback, cb);
        const methodConfig = typeof this.methods.setMetadata === "object" && this.methods.setMetadata || {};
        const reqOpts = extend(true, {}, {
          method: "PATCH",
          uri: ""
        }, methodConfig.reqOpts, {
          json: metadata,
          qs: options
        });
        _ServiceObject.prototype.request.call(this, reqOpts, (err, body, res) => {
          this.metadata = body;
          callback(err, this.metadata, res);
        });
      }
      request_(reqOpts, callback) {
        reqOpts = extend(true, {}, reqOpts);
        if (this.projectId) {
          reqOpts.projectId = this.projectId;
        }
        const isAbsoluteUrl = reqOpts.uri.indexOf("http") === 0;
        const uriComponents = [this.baseUrl, this.id || "", reqOpts.uri];
        if (isAbsoluteUrl) {
          uriComponents.splice(0, uriComponents.indexOf(reqOpts.uri));
        }
        reqOpts.uri = uriComponents.filter((x) => x.trim()).map((uriComponent) => {
          const trimSlashesRegex = /^\/*|\/*$/g;
          return uriComponent.replace(trimSlashesRegex, "");
        }).join("/");
        const childInterceptors = arrify(reqOpts.interceptors_);
        const localInterceptors = [].slice.call(this.interceptors);
        reqOpts.interceptors_ = childInterceptors.concat(localInterceptors);
        if (reqOpts.shouldReturnStream) {
          return this.parent.requestStream(reqOpts);
        }
        this.parent.request(reqOpts, callback);
      }
      request(reqOpts, callback) {
        this.request_(reqOpts, callback);
      }
      /**
       * Make an authenticated API request.
       *
       * @param {object} reqOpts - Request options that are passed to `request`.
       * @param {string} reqOpts.uri - A URI relative to the baseUrl.
       */
      requestStream(reqOpts) {
        const opts = extend(true, reqOpts, { shouldReturnStream: true });
        return this.request_(opts);
      }
    };
    exports.ServiceObject = ServiceObject;
    (0, promisify_1.promisifyAll)(ServiceObject, { exclude: ["getRequestInterceptors"] });
  }
});

// node_modules/@google-cloud/common/build/src/operation.js
var require_operation = __commonJS({
  "node_modules/@google-cloud/common/build/src/operation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Operation = void 0;
    var service_object_1 = require_service_object();
    var util_1 = require_util2();
    var Operation = class extends service_object_1.ServiceObject {
      /**
       * An Operation object allows you to interact with APIs that take longer to
       * process things.
       *
       * @constructor
       * @alias module:common/operation
       *
       * @param {object} config - Configuration object.
       * @param {module:common/service|module:common/serviceObject|module:common/grpcService|module:common/grpcServiceObject} config.parent - The parent object.
       */
      constructor(config) {
        const methods = {
          /**
           * Checks to see if an operation exists.
           */
          exists: true,
          /**
           * Retrieves the operation.
           */
          get: true,
          /**
           * Retrieves metadata for the operation.
           */
          getMetadata: {
            reqOpts: {
              name: config.id
            }
          }
        };
        config = Object.assign({
          baseUrl: ""
        }, config);
        config.methods = config.methods || methods;
        super(config);
        __publicField(this, "completeListeners");
        __publicField(this, "hasActiveListeners");
        this.completeListeners = 0;
        this.hasActiveListeners = false;
        this.listenForEvents_();
      }
      /**
       * Wraps the `complete` and `error` events in a Promise.
       *
       * @return {Promise}
       */
      promise() {
        return new Promise((resolve, reject) => {
          this.on("error", reject).on("complete", (metadata) => {
            resolve([metadata]);
          });
        });
      }
      /**
       * Begin listening for events on the operation. This method keeps track of how
       * many "complete" listeners are registered and removed, making sure polling
       * is handled automatically.
       *
       * As long as there is one active "complete" listener, the connection is open.
       * When there are no more listeners, the polling stops.
       *
       * @private
       */
      listenForEvents_() {
        this.on("newListener", (event) => {
          if (event === "complete") {
            this.completeListeners++;
            if (!this.hasActiveListeners) {
              this.hasActiveListeners = true;
              void this.startPolling_();
            }
          }
        });
        this.on("removeListener", (event) => {
          if (event === "complete" && --this.completeListeners === 0) {
            this.hasActiveListeners = false;
          }
        });
      }
      /**
       * Poll for a status update. Returns null for an incomplete
       * status, and metadata for a complete status.
       *
       * @private
       */
      poll_(callback) {
        void this.getMetadata((err, body) => {
          if (err || body.error) {
            callback(err || body.error);
            return;
          }
          if (!body.done) {
            callback(null);
            return;
          }
          callback(null, body);
        });
      }
      /**
       * Poll `getMetadata` to check the operation's status. This runs a loop to
       * ping the API on an interval.
       *
       * Note: This method is automatically called once a "complete" event handler
       * is registered on the operation.
       *
       * @private
       */
      async startPolling_() {
        if (!this.hasActiveListeners) {
          return;
        }
        try {
          const metadata = await (0, util_1.promisify)(this.poll_.bind(this))();
          if (!metadata) {
            setTimeout(this.startPolling_.bind(this), this.pollIntervalMs || 500);
            return;
          }
          this.emit("complete", metadata);
        } catch (err) {
          this.emit("error", err);
        }
      }
    };
    exports.Operation = Operation;
  }
});

// node_modules/@google-cloud/common/build/src/index.js
var require_src10 = __commonJS({
  "node_modules/@google-cloud/common/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.util = exports.ApiError = exports.ServiceObject = exports.Service = exports.Operation = void 0;
    var operation_1 = require_operation();
    Object.defineProperty(exports, "Operation", { enumerable: true, get: function() {
      return operation_1.Operation;
    } });
    var service_1 = require_service();
    Object.defineProperty(exports, "Service", { enumerable: true, get: function() {
      return service_1.Service;
    } });
    var service_object_1 = require_service_object();
    Object.defineProperty(exports, "ServiceObject", { enumerable: true, get: function() {
      return service_object_1.ServiceObject;
    } });
    var util_1 = require_util4();
    Object.defineProperty(exports, "ApiError", { enumerable: true, get: function() {
      return util_1.ApiError;
    } });
    Object.defineProperty(exports, "util", { enumerable: true, get: function() {
      return util_1.util;
    } });
  }
});

// node_modules/@google-cloud/paginator/build/src/resource-stream.js
var require_resource_stream = __commonJS({
  "node_modules/@google-cloud/paginator/build/src/resource-stream.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceStream = void 0;
    var stream_1 = require_stream();
    var ResourceStream = class extends stream_1.Transform {
      constructor(args, requestFn) {
        const options = Object.assign({ objectMode: true }, args.streamOptions);
        super(options);
        __publicField(this, "_ended");
        __publicField(this, "_maxApiCalls");
        __publicField(this, "_nextQuery");
        __publicField(this, "_otherArgs");
        __publicField(this, "_reading");
        __publicField(this, "_requestFn");
        __publicField(this, "_requestsMade");
        __publicField(this, "_resultsToSend");
        this._ended = false;
        this._maxApiCalls = args.maxApiCalls === -1 ? Infinity : args.maxApiCalls;
        this._nextQuery = args.query;
        this._reading = false;
        this._requestFn = requestFn;
        this._requestsMade = 0;
        this._resultsToSend = args.maxResults === -1 ? Infinity : args.maxResults;
        this._otherArgs = [];
      }
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      end(...args) {
        this._ended = true;
        return super.end(...args);
      }
      _read() {
        if (this._reading) {
          return;
        }
        this._reading = true;
        try {
          this._requestFn(this._nextQuery, (err, results, nextQuery, ...otherArgs) => {
            if (err) {
              this.destroy(err);
              return;
            }
            this._otherArgs = otherArgs;
            this._nextQuery = nextQuery;
            if (this._resultsToSend !== Infinity) {
              results = results.splice(0, this._resultsToSend);
              this._resultsToSend -= results.length;
            }
            let more = true;
            for (const result of results) {
              if (this._ended) {
                break;
              }
              more = this.push(result);
            }
            const isFinished = !this._nextQuery || this._resultsToSend < 1;
            const madeMaxCalls = ++this._requestsMade >= this._maxApiCalls;
            if (isFinished || madeMaxCalls) {
              this.end();
            }
            if (more && !this._ended) {
              setImmediate(() => this._read());
            }
            this._reading = false;
          });
        } catch (e) {
          this.destroy(e);
        }
      }
    };
    exports.ResourceStream = ResourceStream;
  }
});

// node_modules/@google-cloud/paginator/build/src/index.js
var require_src11 = __commonJS({
  "node_modules/@google-cloud/paginator/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceStream = exports.paginator = exports.Paginator = void 0;
    var extend = require_extend();
    var resource_stream_1 = require_resource_stream();
    Object.defineProperty(exports, "ResourceStream", { enumerable: true, get: function() {
      return resource_stream_1.ResourceStream;
    } });
    var Paginator = class {
      /**
       * Cache the original method, then overwrite it on the Class's prototype.
       *
       * @param {function} Class - The parent class of the methods to extend.
       * @param {string|string[]} methodNames - Name(s) of the methods to extend.
       */
      // tslint:disable-next-line:variable-name
      extend(Class, methodNames) {
        if (typeof methodNames === "string") {
          methodNames = [methodNames];
        }
        methodNames.forEach((methodName) => {
          const originalMethod = Class.prototype[methodName];
          Class.prototype[methodName + "_"] = originalMethod;
          Class.prototype[methodName] = function(...args) {
            const parsedArguments = paginator.parseArguments_(args);
            return paginator.run_(parsedArguments, originalMethod.bind(this));
          };
        });
      }
      /**
       * Wraps paginated API calls in a readable object stream.
       *
       * This method simply calls the nextQuery recursively, emitting results to a
       * stream. The stream ends when `nextQuery` is null.
       *
       * `maxResults` will act as a cap for how many results are fetched and emitted
       * to the stream.
       *
       * @param {string} methodName - Name of the method to streamify.
       * @return {function} - Wrapped function.
       */
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      streamify(methodName) {
        return function(...args) {
          const parsedArguments = paginator.parseArguments_(args);
          const originalMethod = this[methodName + "_"] || this[methodName];
          return paginator.runAsStream_(parsedArguments, originalMethod.bind(this));
        };
      }
      /**
       * Parse a pseudo-array `arguments` for a query and callback.
       *
       * @param {array} args - The original `arguments` pseduo-array that the original
       *     method received.
       */
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      parseArguments_(args) {
        let query;
        let autoPaginate = true;
        let maxApiCalls = -1;
        let maxResults = -1;
        let callback;
        const firstArgument = args[0];
        const lastArgument = args[args.length - 1];
        if (typeof firstArgument === "function") {
          callback = firstArgument;
        } else {
          query = firstArgument;
        }
        if (typeof lastArgument === "function") {
          callback = lastArgument;
        }
        if (typeof query === "object") {
          query = extend(true, {}, query);
          if (query.maxResults && typeof query.maxResults === "number") {
            maxResults = query.maxResults;
          } else if (typeof query.pageSize === "number") {
            maxResults = query.pageSize;
          }
          if (query.maxApiCalls && typeof query.maxApiCalls === "number") {
            maxApiCalls = query.maxApiCalls;
            delete query.maxApiCalls;
          }
          if (maxResults !== -1 || query.autoPaginate === false) {
            autoPaginate = false;
          }
        }
        const parsedArguments = {
          query: query || {},
          autoPaginate,
          maxApiCalls,
          maxResults,
          callback
        };
        parsedArguments.streamOptions = extend(true, {}, parsedArguments.query);
        delete parsedArguments.streamOptions.autoPaginate;
        delete parsedArguments.streamOptions.maxResults;
        delete parsedArguments.streamOptions.pageSize;
        return parsedArguments;
      }
      /**
       * This simply checks to see if `autoPaginate` is set or not, if it's true
       * then we buffer all results, otherwise simply call the original method.
       *
       * @param {array} parsedArguments - Parsed arguments from the original method
       *     call.
       * @param {object=|string=} parsedArguments.query - Query object. This is most
       *     commonly an object, but to make the API more simple, it can also be a
       *     string in some places.
       * @param {function=} parsedArguments.callback - Callback function.
       * @param {boolean} parsedArguments.autoPaginate - Auto-pagination enabled.
       * @param {boolean} parsedArguments.maxApiCalls - Maximum API calls to make.
       * @param {number} parsedArguments.maxResults - Maximum results to return.
       * @param {function} originalMethod - The cached method that accepts a callback
       *     and returns `nextQuery` to receive more results.
       */
      run_(parsedArguments, originalMethod) {
        const query = parsedArguments.query;
        const callback = parsedArguments.callback;
        if (!parsedArguments.autoPaginate) {
          return originalMethod(query, callback);
        }
        const results = new Array();
        let otherArgs = [];
        const promise = new Promise((resolve, reject) => {
          const stream = paginator.runAsStream_(parsedArguments, originalMethod);
          stream.on("error", reject).on("data", (data) => results.push(data)).on("end", () => {
            otherArgs = stream._otherArgs || [];
            resolve(results);
          });
        });
        if (!callback) {
          return promise.then((results2) => [results2, query, ...otherArgs]);
        }
        promise.then((results2) => callback(null, results2, query, ...otherArgs), (err) => callback(err));
      }
      /**
       * This method simply calls the nextQuery recursively, emitting results to a
       * stream. The stream ends when `nextQuery` is null.
       *
       * `maxResults` will act as a cap for how many results are fetched and emitted
       * to the stream.
       *
       * @param {object=|string=} parsedArguments.query - Query object. This is most
       *     commonly an object, but to make the API more simple, it can also be a
       *     string in some places.
       * @param {function=} parsedArguments.callback - Callback function.
       * @param {boolean} parsedArguments.autoPaginate - Auto-pagination enabled.
       * @param {boolean} parsedArguments.maxApiCalls - Maximum API calls to make.
       * @param {number} parsedArguments.maxResults - Maximum results to return.
       * @param {function} originalMethod - The cached method that accepts a callback
       *     and returns `nextQuery` to receive more results.
       * @return {stream} - Readable object stream.
       */
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      runAsStream_(parsedArguments, originalMethod) {
        return new resource_stream_1.ResourceStream(parsedArguments, originalMethod);
      }
    };
    exports.Paginator = Paginator;
    var paginator = new Paginator();
    exports.paginator = paginator;
  }
});

// node_modules/@google-cloud/promisify/build/src/index.js
var require_src12 = __commonJS({
  "node_modules/@google-cloud/promisify/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.promisify = promisify;
    exports.promisifyAll = promisifyAll;
    exports.callbackify = callbackify;
    exports.callbackifyAll = callbackifyAll;
    function promisify(originalMethod, options) {
      if (originalMethod.promisified_) {
        return originalMethod;
      }
      options = options || {};
      const slice = Array.prototype.slice;
      const wrapper = function() {
        let last;
        for (last = arguments.length - 1; last >= 0; last--) {
          const arg = arguments[last];
          if (typeof arg === "undefined") {
            continue;
          }
          if (typeof arg !== "function") {
            break;
          }
          return originalMethod.apply(this, arguments);
        }
        const args = slice.call(arguments, 0, last + 1);
        let PromiseCtor = Promise;
        if (this && this.Promise) {
          PromiseCtor = this.Promise;
        }
        return new PromiseCtor((resolve, reject) => {
          args.push((...args2) => {
            const callbackArgs = slice.call(args2);
            const err = callbackArgs.shift();
            if (err) {
              return reject(err);
            }
            if (options.singular && callbackArgs.length === 1) {
              resolve(callbackArgs[0]);
            } else {
              resolve(callbackArgs);
            }
          });
          originalMethod.apply(this, args);
        });
      };
      wrapper.promisified_ = true;
      return wrapper;
    }
    function promisifyAll(Class, options) {
      const exclude = options && options.exclude || [];
      const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
      const methods = ownPropertyNames.filter((methodName) => {
        return !exclude.includes(methodName) && typeof Class.prototype[methodName] === "function" && // is it a function?
        !/(^_|(Stream|_)|promise$)|^constructor$/.test(methodName);
      });
      methods.forEach((methodName) => {
        const originalMethod = Class.prototype[methodName];
        if (!originalMethod.promisified_) {
          Class.prototype[methodName] = exports.promisify(originalMethod, options);
        }
      });
    }
    function callbackify(originalMethod) {
      if (originalMethod.callbackified_) {
        return originalMethod;
      }
      const wrapper = function() {
        if (typeof arguments[arguments.length - 1] !== "function") {
          return originalMethod.apply(this, arguments);
        }
        const cb = Array.prototype.pop.call(arguments);
        originalMethod.apply(this, arguments).then(
          // tslint:disable-next-line:no-any
          (res) => {
            res = Array.isArray(res) ? res : [res];
            cb(null, ...res);
          },
          (err) => cb(err)
        );
      };
      wrapper.callbackified_ = true;
      return wrapper;
    }
    function callbackifyAll(Class, options) {
      const exclude = options && options.exclude || [];
      const ownPropertyNames = Object.getOwnPropertyNames(Class.prototype);
      const methods = ownPropertyNames.filter((methodName) => {
        return !exclude.includes(methodName) && typeof Class.prototype[methodName] === "function" && // is it a function?
        !/^_|(Stream|_)|^constructor$/.test(methodName);
      });
      methods.forEach((methodName) => {
        const originalMethod = Class.prototype[methodName];
        if (!originalMethod.callbackified_) {
          Class.prototype[methodName] = exports.callbackify(originalMethod);
        }
      });
    }
  }
});

// node_modules/@google-cloud/precise-date/build/src/index.js
var require_src13 = __commonJS({
  "node_modules/@google-cloud/precise-date/build/src/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreciseDate = void 0;
    var FULL_ISO_REG = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{4,9}Z/;
    var NO_BIG_INT = "BigInt only available in Node >= v10.7. Consider using getFullTimeString instead.";
    var Sign;
    (function(Sign2) {
      Sign2[Sign2["NEGATIVE"] = -1] = "NEGATIVE";
      Sign2[Sign2["POSITIVE"] = 1] = "POSITIVE";
      Sign2[Sign2["ZERO"] = 0] = "ZERO";
    })(Sign || (Sign = {}));
    var PreciseDate = class _PreciseDate extends Date {
      constructor(time) {
        super();
        __publicField(this, "_micros", 0);
        __publicField(this, "_nanos", 0);
        if (time && typeof time !== "number" && !(time instanceof Date)) {
          this.setFullTime(_PreciseDate.parseFull(time));
          return;
        }
        const args = Array.from(arguments);
        const dateFields = args.slice(0, 7);
        const date = new Date(...dateFields);
        const nanos = args.length === 9 ? args.pop() : 0;
        const micros = args.length === 8 ? args.pop() : 0;
        this.setTime(date.getTime());
        this.setMicroseconds(micros);
        this.setNanoseconds(nanos);
      }
      /**
       * Returns the specified date represented in nanoseconds according to
       * universal time.
       *
       * **NOTE:** Because this method returns a `BigInt` it requires Node >= v10.7.
       * Use {@link PreciseDate#getFullTimeString} to get the time as a string.
       *
       * @see {@link https://github.com/tc39/proposal-bigint|BigInt}
       *
       * @throws {error} If `BigInt` is unavailable.
       * @returns {bigint}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145231Z');
       *
       * console.log(date.getFullTime());
       * // expected output: 1549622069481145231n
       */
      getFullTime() {
        if (typeof BigInt !== "function") {
          throw new Error(NO_BIG_INT);
        }
        return BigInt(this.getFullTimeString());
      }
      /**
       * Returns a string of the specified date represented in nanoseconds according
       * to universal time.
       *
       * @returns {string}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145231Z');
       *
       * console.log(date.getFullTimeString());
       * // expected output: "1549622069481145231"
       */
      getFullTimeString() {
        const seconds = this._getSeconds();
        let nanos = this._getNanos();
        if (nanos && Math.sign(seconds) === Sign.NEGATIVE) {
          nanos = 1e9 - nanos;
        }
        return `${seconds}${padLeft(nanos, 9)}`;
      }
      /**
       * Returns the microseconds in the specified date according to universal time.
       *
       * @returns {number}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145Z');
       *
       * console.log(date.getMicroseconds());
       * // expected output: 145
       */
      getMicroseconds() {
        return this._micros;
      }
      /**
       * Returns the nanoseconds in the specified date according to universal time.
       *
       * @returns {number}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145231Z');
       *
       * console.log(date.getNanoseconds());
       * // expected output: 231
       */
      getNanoseconds() {
        return this._nanos;
      }
      /**
       * Sets the microseconds for a specified date according to universal time.
       *
       * @param {number} microseconds A number representing the microseconds.
       * @returns {string} Returns a string representing the nanoseconds in the
       *     specified date according to universal time.
       *
       * @example
       * const date = new PreciseDate();
       *
       * date.setMicroseconds(149);
       *
       * console.log(date.getMicroseconds());
       * // expected output: 149
       */
      setMicroseconds(micros) {
        const abs = Math.abs(micros);
        let millis = this.getUTCMilliseconds();
        if (abs >= 1e3) {
          millis += Math.floor(abs / 1e3) * Math.sign(micros);
          micros %= 1e3;
        }
        if (Math.sign(micros) === Sign.NEGATIVE) {
          millis -= 1;
          micros += 1e3;
        }
        this._micros = micros;
        this.setUTCMilliseconds(millis);
        return this.getFullTimeString();
      }
      /**
       * Sets the nanoseconds for a specified date according to universal time.
       *
       * @param {number} nanoseconds A number representing the nanoseconds.
       * @returns {string} Returns a string representing the nanoseconds in the
       *     specified date according to universal time.
       *
       * @example
       * const date = new PreciseDate();
       *
       * date.setNanoseconds(231);
       *
       * console.log(date.getNanoseconds());
       * // expected output: 231
       */
      setNanoseconds(nanos) {
        const abs = Math.abs(nanos);
        let micros = this._micros;
        if (abs >= 1e3) {
          micros += Math.floor(abs / 1e3) * Math.sign(nanos);
          nanos %= 1e3;
        }
        if (Math.sign(nanos) === Sign.NEGATIVE) {
          micros -= 1;
          nanos += 1e3;
        }
        this._nanos = nanos;
        return this.setMicroseconds(micros);
      }
      /**
       * Sets the PreciseDate object to the time represented by a number of
       * nanoseconds since January 1, 1970, 00:00:00 UTC.
       *
       * @param {bigint|number|string} time Value representing the number of
       *     nanoseconds since January 1, 1970, 00:00:00 UTC.
       * @returns {string} Returns a string representing the nanoseconds in the
       *     specified date according to universal time (effectively, the value of
       *     the argument).
       *
       * @see {@link https://github.com/tc39/proposal-bigint|BigInt}
       *
       * @example <caption>With a nanosecond string.</caption>
       * const date = new PreciseDate();
       * date.setFullTime('1549622069481145231');
       *
       * @example <caption>With a BigInt</caption>
       * date.setFullTime(1549622069481145231n);
       */
      setFullTime(time) {
        if (typeof time !== "string") {
          time = time.toString();
        }
        const sign = Math.sign(Number(time));
        time = time.replace(/^-/, "");
        const seconds = Number(time.substr(0, time.length - 9)) * sign;
        const nanos = Number(time.substr(-9)) * sign;
        this.setTime(seconds * 1e3);
        return this.setNanoseconds(nanos);
      }
      /**
       * Sets the PreciseDate object to the time represented by a number of
       * milliseconds since January 1, 1970, 00:00:00 UTC. Calling this method will
       * reset both the microseconds and nanoseconds to 0.
       *
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setTime|Date#setTime}
       *
       * @param {number} time Value representing the number of milliseconds since
       *     January 1, 1970, 00:00:00 UTC.
       * @returns {string} The number of milliseconds between January 1, 1970,
       *     00:00:00 UTC and the updated date (effectively, the value of the
       *     argument).
       */
      setTime(time) {
        this._micros = 0;
        this._nanos = 0;
        return super.setTime(time);
      }
      /**
       * Returns a string in RFC 3339 format. Unlike the native `Date#toISOString`,
       * this will return 9 digits to represent sub-second precision.
       *
       * @see {@link https://tools.ietf.org/html/rfc3339|RFC 3339}
       *
       * @returns {string}
       *
       * @example
       * const date = new PreciseDate(1549622069481145231n);
       *
       * console.log(date.toISOString());
       * // expected output: "2019-02-08T10:34:29.481145231Z"
       */
      toISOString() {
        const micros = padLeft(this._micros, 3);
        const nanos = padLeft(this._nanos, 3);
        return super.toISOString().replace(/z$/i, `${micros}${nanos}Z`);
      }
      /**
       * Returns an object representing the specified date according to universal
       * time.
       *
       * @see {@link https://developers.google.com/protocol-buffers/docs/reference/google.protobuf#timestamp|google.protobuf.Timestamp}
       *
       * @returns {DateStruct}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145231Z');
       *
       * console.log(date.toStruct());
       * // expected output: {seconds: 1549622069, nanos: 481145231}
       */
      toStruct() {
        let seconds = this._getSeconds();
        const nanos = this._getNanos();
        const sign = Math.sign(seconds);
        if (sign === Sign.NEGATIVE && nanos) {
          seconds -= 1;
        }
        return { seconds, nanos };
      }
      /**
       * Returns a tuple representing the specified date according to universal
       * time.
       *
       * @returns {DateTuple}
       *
       * @example
       * const date = new PreciseDate('2019-02-08T10:34:29.481145231Z');
       *
       * console.log(date.toTuple());
       * // expected output: [1549622069, 481145231]
       */
      toTuple() {
        const { seconds, nanos } = this.toStruct();
        return [seconds, nanos];
      }
      /**
       * Returns the total number of seconds in the specified date since Unix epoch.
       * Numbers representing < epoch will be negative.
       *
       * @private
       *
       * @returns {number}
       */
      _getSeconds() {
        const time = this.getTime();
        const sign = Math.sign(time);
        return Math.floor(Math.abs(time) / 1e3) * sign;
      }
      /**
       * Returns the sub-second precision of the specified date. This will always be
       * a positive number.
       *
       * @private
       *
       * @returns {number}
       */
      _getNanos() {
        const msInNanos = this.getUTCMilliseconds() * 1e6;
        const microsInNanos = this._micros * 1e3;
        return this._nanos + msInNanos + microsInNanos;
      }
      /**
       * Parses a precise time.
       *
       * @static
       *
       * @param {string|bigint|DateTuple|DateStruct} time The precise time value.
       * @returns {string} Returns a string representing the nanoseconds in the
       *     specified date according to universal time.
       *
       * @example <caption>From a RFC 3339 formatted string.</caption>
       * const time = PreciseDate.parseFull('2019-02-08T10:34:29.481145231Z');
       * console.log(time); // expected output: "1549622069481145231"
       *
       * @example <caption>From a nanosecond timestamp string.</caption>
       * const time = PreciseDate.parseFull('1549622069481145231');
       * console.log(time); // expected output: "1549622069481145231"
       *
       * @example <caption>From a BigInt (requires Node >= v10.7)</caption>
       * const time = PreciseDate.parseFull(1549622069481145231n);
       * console.log(time); // expected output: "1549622069481145231"
       *
       * @example <caption>From a tuple.</caption>
       * const time = PreciseDate.parseFull([1549622069, 481145231]);
       * console.log(time); // expected output: "1549622069481145231"
       *
       * @example <caption>From an object.</caption>
       * const struct = {seconds: 1549622069, nanos: 481145231};
       * const time = PreciseDate.parseFull(struct);
       * console.log(time); // expected output: "1549622069481145231"
       */
      static parseFull(time) {
        const date = new _PreciseDate();
        if (Array.isArray(time)) {
          const [seconds, nanos] = time;
          time = { seconds, nanos };
        }
        if (isFullTime(time)) {
          date.setFullTime(time);
        } else if (isStruct(time)) {
          const { seconds, nanos } = parseProto(time);
          date.setTime(seconds * 1e3);
          date.setNanoseconds(nanos);
        } else if (isFullISOString(time)) {
          date.setFullTime(parseFullISO(time));
        } else {
          date.setTime(new Date(time).getTime());
        }
        return date.getFullTimeString();
      }
      /**
       * Accepts the same number parameters as the PreciseDate constructor, but
       * treats them as UTC. It returns a string that represents the number of
       * nanoseconds since January 1, 1970, 00:00:00 UTC.
       *
       * **NOTE:** Because this method returns a `BigInt` it requires Node >= v10.7.
       *
       * @see {@link https://github.com/tc39/proposal-bigint|BigInt}
       *
       * @static
       *
       * @throws {error} If `BigInt` is unavailable.
       *
       * @param {...number} [dateFields] The date fields.
       * @returns {bigint}
       *
       * @example
       * const time = PreciseDate.fullUTC(2019, 1, 8, 10, 34, 29, 481, 145, 231);
       * console.log(time); // expected output: 1549622069481145231n
       */
      static fullUTC(...args) {
        if (typeof BigInt !== "function") {
          throw new Error(NO_BIG_INT);
        }
        return BigInt(_PreciseDate.fullUTCString(...args));
      }
      /**
       * Accepts the same number parameters as the PreciseDate constructor, but
       * treats them as UTC. It returns a string that represents the number of
       * nanoseconds since January 1, 1970, 00:00:00 UTC.
       *
       * @static
       *
       * @param {...number} [dateFields] The date fields.
       * @returns {string}
       *
       * @example
       * const time = PreciseDate.fullUTCString(2019, 1, 8, 10, 34, 29, 481, 145,
       * 231); console.log(time); // expected output: '1549622069481145231'
       */
      static fullUTCString(...args) {
        const milliseconds = Date.UTC(...args.slice(0, 7));
        const date = new _PreciseDate(milliseconds);
        if (args.length === 9) {
          date.setNanoseconds(args.pop());
        }
        if (args.length === 8) {
          date.setMicroseconds(args.pop());
        }
        return date.getFullTimeString();
      }
    };
    exports.PreciseDate = PreciseDate;
    function parseFullISO(time) {
      let digits = "0";
      time = time.replace(/\.(\d+)/, ($0, $1) => {
        digits = $1;
        return ".000";
      });
      const nanos = Number(padRight(digits, 9));
      const date = new PreciseDate(time);
      return date.setNanoseconds(nanos);
    }
    function parseProto({ seconds = 0, nanos = 0 }) {
      if (typeof seconds.toNumber === "function") {
        seconds = seconds.toNumber();
      }
      seconds = Number(seconds);
      nanos = Number(nanos);
      return { seconds, nanos };
    }
    function isFullTime(time) {
      return typeof time === "bigint" || typeof time === "string" && /^\d+$/.test(time);
    }
    function isStruct(time) {
      return typeof time === "object" && typeof time.seconds !== "undefined" || typeof time.nanos === "number";
    }
    function isFullISOString(time) {
      return typeof time === "string" && FULL_ISO_REG.test(time);
    }
    function padLeft(n, min) {
      const padding = getPadding(n, min);
      return `${padding}${n}`;
    }
    function padRight(n, min) {
      const padding = getPadding(n, min);
      return `${n}${padding}`;
    }
    function getPadding(n, min) {
      const size = Math.max(min - n.toString().length, 0);
      return "0".repeat(size);
    }
  }
});

// node_modules/@google-cloud/bigquery/build/src/util.js
var require_util5 = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toArray = toArray;
    exports.isObject = isObject;
    exports.isString = isString;
    exports.isArray = isArray;
    exports.isDate = isDate;
    exports.isBoolean = isBoolean;
    exports.isNumber = isNumber;
    function toArray(value) {
      if (value === null || value === void 0) {
        return [];
      }
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === "string") {
        return [value];
      }
      if (typeof value[Symbol.iterator] === "function") {
        return [...value];
      }
      return [value];
    }
    function isObject(value) {
      return value && [void 0, Object].includes(value.constructor);
    }
    function isString(value) {
      return Object.prototype.toString.call(value) === "[object String]";
    }
    function isArray(value) {
      return Array.isArray(value);
    }
    function isDate(value) {
      return value instanceof Date;
    }
    function isBoolean(value) {
      return Object.prototype.toString.call(value) === "[object Boolean]";
    }
    function isNumber(value) {
      return Object.prototype.toString.call(value) === "[object Number]";
    }
  }
});

// node_modules/big.js/big.js
var require_big = __commonJS({
  "node_modules/big.js/big.js"(exports, module) {
    (function(GLOBAL) {
      "use strict";
      var Big, DP = 20, RM = 1, MAX_DP = 1e6, MAX_POWER = 1e6, NE = -7, PE = 21, STRICT = false, NAME = "[big.js] ", INVALID = NAME + "Invalid ", INVALID_DP = INVALID + "decimal places", INVALID_RM = INVALID + "rounding mode", DIV_BY_ZERO = NAME + "Division by zero", P = {}, UNDEFINED = void 0, NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
      function _Big_() {
        function Big2(n) {
          var x = this;
          if (!(x instanceof Big2)) return n === UNDEFINED ? _Big_() : new Big2(n);
          if (n instanceof Big2) {
            x.s = n.s;
            x.e = n.e;
            x.c = n.c.slice();
          } else {
            if (typeof n !== "string") {
              if (Big2.strict === true && typeof n !== "bigint") {
                throw TypeError(INVALID + "value");
              }
              n = n === 0 && 1 / n < 0 ? "-0" : String(n);
            }
            parse(x, n);
          }
          x.constructor = Big2;
        }
        Big2.prototype = P;
        Big2.DP = DP;
        Big2.RM = RM;
        Big2.NE = NE;
        Big2.PE = PE;
        Big2.strict = STRICT;
        Big2.roundDown = 0;
        Big2.roundHalfUp = 1;
        Big2.roundHalfEven = 2;
        Big2.roundUp = 3;
        return Big2;
      }
      function parse(x, n) {
        var e, i, nl;
        if (!NUMERIC.test(n)) {
          throw Error(INVALID + "number");
        }
        x.s = n.charAt(0) == "-" ? (n = n.slice(1), -1) : 1;
        if ((e = n.indexOf(".")) > -1) n = n.replace(".", "");
        if ((i = n.search(/e/i)) > 0) {
          if (e < 0) e = i;
          e += +n.slice(i + 1);
          n = n.substring(0, i);
        } else if (e < 0) {
          e = n.length;
        }
        nl = n.length;
        for (i = 0; i < nl && n.charAt(i) == "0"; ) ++i;
        if (i == nl) {
          x.c = [x.e = 0];
        } else {
          for (; nl > 0 && n.charAt(--nl) == "0"; ) ;
          x.e = e - i - 1;
          x.c = [];
          for (e = 0; i <= nl; ) x.c[e++] = +n.charAt(i++);
        }
        return x;
      }
      function round(x, sd, rm, more) {
        var xc = x.c;
        if (rm === UNDEFINED) rm = x.constructor.RM;
        if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
          throw Error(INVALID_RM);
        }
        if (sd < 1) {
          more = rm === 3 && (more || !!xc[0]) || sd === 0 && (rm === 1 && xc[0] >= 5 || rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED)));
          xc.length = 1;
          if (more) {
            x.e = x.e - sd + 1;
            xc[0] = 1;
          } else {
            xc[0] = x.e = 0;
          }
        } else if (sd < xc.length) {
          more = rm === 1 && xc[sd] >= 5 || rm === 2 && (xc[sd] > 5 || xc[sd] === 5 && (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) || rm === 3 && (more || !!xc[0]);
          xc.length = sd;
          if (more) {
            for (; ++xc[--sd] > 9; ) {
              xc[sd] = 0;
              if (sd === 0) {
                ++x.e;
                xc.unshift(1);
                break;
              }
            }
          }
          for (sd = xc.length; !xc[--sd]; ) xc.pop();
        }
        return x;
      }
      function stringify(x, doExponential, isNonzero) {
        var e = x.e, s = x.c.join(""), n = s.length;
        if (doExponential) {
          s = s.charAt(0) + (n > 1 ? "." + s.slice(1) : "") + (e < 0 ? "e" : "e+") + e;
        } else if (e < 0) {
          for (; ++e; ) s = "0" + s;
          s = "0." + s;
        } else if (e > 0) {
          if (++e > n) {
            for (e -= n; e--; ) s += "0";
          } else if (e < n) {
            s = s.slice(0, e) + "." + s.slice(e);
          }
        } else if (n > 1) {
          s = s.charAt(0) + "." + s.slice(1);
        }
        return x.s < 0 && isNonzero ? "-" + s : s;
      }
      P.abs = function() {
        var x = new this.constructor(this);
        x.s = 1;
        return x;
      };
      P.cmp = function(y) {
        var isneg, x = this, xc = x.c, yc = (y = new x.constructor(y)).c, i = x.s, j = y.s, k = x.e, l = y.e;
        if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;
        if (i != j) return i;
        isneg = i < 0;
        if (k != l) return k > l ^ isneg ? 1 : -1;
        j = (k = xc.length) < (l = yc.length) ? k : l;
        for (i = -1; ++i < j; ) {
          if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
        }
        return k == l ? 0 : k > l ^ isneg ? 1 : -1;
      };
      P.div = function(y) {
        var x = this, Big2 = x.constructor, a = x.c, b = (y = new Big2(y)).c, k = x.s == y.s ? 1 : -1, dp = Big2.DP;
        if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
          throw Error(INVALID_DP);
        }
        if (!b[0]) {
          throw Error(DIV_BY_ZERO);
        }
        if (!a[0]) {
          y.s = k;
          y.c = [y.e = 0];
          return y;
        }
        var bl, bt, n, cmp, ri, bz = b.slice(), ai = bl = b.length, al = a.length, r = a.slice(0, bl), rl = r.length, q = y, qc = q.c = [], qi = 0, p = dp + (q.e = x.e - y.e) + 1;
        q.s = k;
        k = p < 0 ? 0 : p;
        bz.unshift(0);
        for (; rl++ < bl; ) r.push(0);
        do {
          for (n = 0; n < 10; n++) {
            if (bl != (rl = r.length)) {
              cmp = bl > rl ? 1 : -1;
            } else {
              for (ri = -1, cmp = 0; ++ri < bl; ) {
                if (b[ri] != r[ri]) {
                  cmp = b[ri] > r[ri] ? 1 : -1;
                  break;
                }
              }
            }
            if (cmp < 0) {
              for (bt = rl == bl ? b : bz; rl; ) {
                if (r[--rl] < bt[rl]) {
                  ri = rl;
                  for (; ri && !r[--ri]; ) r[ri] = 9;
                  --r[ri];
                  r[rl] += 10;
                }
                r[rl] -= bt[rl];
              }
              for (; !r[0]; ) r.shift();
            } else {
              break;
            }
          }
          qc[qi++] = cmp ? n : ++n;
          if (r[0] && cmp) r[rl] = a[ai] || 0;
          else r = [a[ai]];
        } while ((ai++ < al || r[0] !== UNDEFINED) && k--);
        if (!qc[0] && qi != 1) {
          qc.shift();
          q.e--;
          p--;
        }
        if (qi > p) round(q, p, Big2.RM, r[0] !== UNDEFINED);
        return q;
      };
      P.eq = function(y) {
        return this.cmp(y) === 0;
      };
      P.gt = function(y) {
        return this.cmp(y) > 0;
      };
      P.gte = function(y) {
        return this.cmp(y) > -1;
      };
      P.lt = function(y) {
        return this.cmp(y) < 0;
      };
      P.lte = function(y) {
        return this.cmp(y) < 1;
      };
      P.minus = P.sub = function(y) {
        var i, j, t, xlty, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
        if (a != b) {
          y.s = -b;
          return x.plus(y);
        }
        var xc = x.c.slice(), xe = x.e, yc = y.c, ye = y.e;
        if (!xc[0] || !yc[0]) {
          if (yc[0]) {
            y.s = -b;
          } else if (xc[0]) {
            y = new Big2(x);
          } else {
            y.s = 1;
          }
          return y;
        }
        if (a = xe - ye) {
          if (xlty = a < 0) {
            a = -a;
            t = xc;
          } else {
            ye = xe;
            t = yc;
          }
          t.reverse();
          for (b = a; b--; ) t.push(0);
          t.reverse();
        } else {
          j = ((xlty = xc.length < yc.length) ? xc : yc).length;
          for (a = b = 0; b < j; b++) {
            if (xc[b] != yc[b]) {
              xlty = xc[b] < yc[b];
              break;
            }
          }
        }
        if (xlty) {
          t = xc;
          xc = yc;
          yc = t;
          y.s = -y.s;
        }
        if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--; ) xc[i++] = 0;
        for (b = i; j > a; ) {
          if (xc[--j] < yc[j]) {
            for (i = j; i && !xc[--i]; ) xc[i] = 9;
            --xc[i];
            xc[j] += 10;
          }
          xc[j] -= yc[j];
        }
        for (; xc[--b] === 0; ) xc.pop();
        for (; xc[0] === 0; ) {
          xc.shift();
          --ye;
        }
        if (!xc[0]) {
          y.s = 1;
          xc = [ye = 0];
        }
        y.c = xc;
        y.e = ye;
        return y;
      };
      P.mod = function(y) {
        var ygtx, x = this, Big2 = x.constructor, a = x.s, b = (y = new Big2(y)).s;
        if (!y.c[0]) {
          throw Error(DIV_BY_ZERO);
        }
        x.s = y.s = 1;
        ygtx = y.cmp(x) == 1;
        x.s = a;
        y.s = b;
        if (ygtx) return new Big2(x);
        a = Big2.DP;
        b = Big2.RM;
        Big2.DP = Big2.RM = 0;
        x = x.div(y);
        Big2.DP = a;
        Big2.RM = b;
        return this.minus(x.times(y));
      };
      P.neg = function() {
        var x = new this.constructor(this);
        x.s = -x.s;
        return x;
      };
      P.plus = P.add = function(y) {
        var e, k, t, x = this, Big2 = x.constructor;
        y = new Big2(y);
        if (x.s != y.s) {
          y.s = -y.s;
          return x.minus(y);
        }
        var xe = x.e, xc = x.c, ye = y.e, yc = y.c;
        if (!xc[0] || !yc[0]) {
          if (!yc[0]) {
            if (xc[0]) {
              y = new Big2(x);
            } else {
              y.s = x.s;
            }
          }
          return y;
        }
        xc = xc.slice();
        if (e = xe - ye) {
          if (e > 0) {
            ye = xe;
            t = yc;
          } else {
            e = -e;
            t = xc;
          }
          t.reverse();
          for (; e--; ) t.push(0);
          t.reverse();
        }
        if (xc.length - yc.length < 0) {
          t = yc;
          yc = xc;
          xc = t;
        }
        e = yc.length;
        for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;
        if (k) {
          xc.unshift(k);
          ++ye;
        }
        for (e = xc.length; xc[--e] === 0; ) xc.pop();
        y.c = xc;
        y.e = ye;
        return y;
      };
      P.pow = function(n) {
        var x = this, one = new x.constructor("1"), y = one, isneg = n < 0;
        if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
          throw Error(INVALID + "exponent");
        }
        if (isneg) n = -n;
        for (; ; ) {
          if (n & 1) y = y.times(x);
          n >>= 1;
          if (!n) break;
          x = x.times(x);
        }
        return isneg ? one.div(y) : y;
      };
      P.prec = function(sd, rm) {
        if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
          throw Error(INVALID + "precision");
        }
        return round(new this.constructor(this), sd, rm);
      };
      P.round = function(dp, rm) {
        if (dp === UNDEFINED) dp = 0;
        else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
          throw Error(INVALID_DP);
        }
        return round(new this.constructor(this), dp + this.e + 1, rm);
      };
      P.sqrt = function() {
        var r, c, t, x = this, Big2 = x.constructor, s = x.s, e = x.e, half = new Big2("0.5");
        if (!x.c[0]) return new Big2(x);
        if (s < 0) {
          throw Error(NAME + "No square root");
        }
        s = Math.sqrt(+stringify(x, true, true));
        if (s === 0 || s === 1 / 0) {
          c = x.c.join("");
          if (!(c.length + e & 1)) c += "0";
          s = Math.sqrt(c);
          e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
          r = new Big2((s == 1 / 0 ? "5e" : (s = s.toExponential()).slice(0, s.indexOf("e") + 1)) + e);
        } else {
          r = new Big2(s + "");
        }
        e = r.e + (Big2.DP += 4);
        do {
          t = r;
          r = half.times(t.plus(x.div(t)));
        } while (t.c.slice(0, e).join("") !== r.c.slice(0, e).join(""));
        return round(r, (Big2.DP -= 4) + r.e + 1, Big2.RM);
      };
      P.times = P.mul = function(y) {
        var c, x = this, Big2 = x.constructor, xc = x.c, yc = (y = new Big2(y)).c, a = xc.length, b = yc.length, i = x.e, j = y.e;
        y.s = x.s == y.s ? 1 : -1;
        if (!xc[0] || !yc[0]) {
          y.c = [y.e = 0];
          return y;
        }
        y.e = i + j;
        if (a < b) {
          c = xc;
          xc = yc;
          yc = c;
          j = a;
          a = b;
          b = j;
        }
        for (c = new Array(j = a + b); j--; ) c[j] = 0;
        for (i = b; i--; ) {
          b = 0;
          for (j = a + i; j > i; ) {
            b = c[j] + yc[i] * xc[j - i - 1] + b;
            c[j--] = b % 10;
            b = b / 10 | 0;
          }
          c[j] = b;
        }
        if (b) ++y.e;
        else c.shift();
        for (i = c.length; !c[--i]; ) c.pop();
        y.c = c;
        return y;
      };
      P.toExponential = function(dp, rm) {
        var x = this, n = x.c[0];
        if (dp !== UNDEFINED) {
          if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throw Error(INVALID_DP);
          }
          x = round(new x.constructor(x), ++dp, rm);
          for (; x.c.length < dp; ) x.c.push(0);
        }
        return stringify(x, true, !!n);
      };
      P.toFixed = function(dp, rm) {
        var x = this, n = x.c[0];
        if (dp !== UNDEFINED) {
          if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throw Error(INVALID_DP);
          }
          x = round(new x.constructor(x), dp + x.e + 1, rm);
          for (dp = dp + x.e + 1; x.c.length < dp; ) x.c.push(0);
        }
        return stringify(x, false, !!n);
      };
      P.toJSON = P.toString = function() {
        var x = this, Big2 = x.constructor;
        return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, !!x.c[0]);
      };
      P.toNumber = function() {
        var n = +stringify(this, true, true);
        if (this.constructor.strict === true && !this.eq(n.toString())) {
          throw Error(NAME + "Imprecise conversion");
        }
        return n;
      };
      P.toPrecision = function(sd, rm) {
        var x = this, Big2 = x.constructor, n = x.c[0];
        if (sd !== UNDEFINED) {
          if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
            throw Error(INVALID + "precision");
          }
          x = round(new Big2(x), sd, rm);
          for (; x.c.length < sd; ) x.c.push(0);
        }
        return stringify(x, sd <= x.e || x.e <= Big2.NE || x.e >= Big2.PE, !!n);
      };
      P.valueOf = function() {
        var x = this, Big2 = x.constructor;
        if (Big2.strict === true) {
          throw Error(NAME + "valueOf disallowed");
        }
        return stringify(x, x.e <= Big2.NE || x.e >= Big2.PE, true);
      };
      Big = _Big_();
      Big["default"] = Big.Big = Big;
      if (typeof define === "function" && define.amd) {
        define(function() {
          return Big;
        });
      } else if (typeof module !== "undefined" && module.exports) {
        module.exports = Big;
      } else {
        GLOBAL.Big = Big;
      }
    })(exports);
  }
});

// node_modules/@google-cloud/bigquery/build/src/rowBatch.js
var require_rowBatch = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/rowBatch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RowBatch = exports.BATCH_LIMITS = void 0;
    exports.BATCH_LIMITS = {
      maxBytes: 9 * 1024 * 1024,
      maxRows: 5e4
    };
    var RowBatch = class {
      constructor(options) {
        __publicField(this, "batchOptions");
        __publicField(this, "rows");
        __publicField(this, "callbacks");
        __publicField(this, "created");
        __publicField(this, "bytes");
        this.batchOptions = options;
        this.rows = [];
        this.callbacks = [];
        this.created = Date.now();
        this.bytes = 0;
      }
      /**
       * Adds a row to the current batch.
       *
       * @param {object} row The row to insert.
       * @param {InsertRowsCallback} callback The callback function.
       */
      add(row, callback) {
        this.rows.push(row);
        this.callbacks.push(callback);
        this.bytes += Buffer.byteLength(JSON.stringify(row));
      }
      /**
       * Indicates if a given row can fit in the batch.
       *
       * @param {object} row The row in question.
       * @returns {boolean}
       */
      canFit(row) {
        const { maxRows, maxBytes } = this.batchOptions;
        return this.rows.length < maxRows && this.bytes + Buffer.byteLength(JSON.stringify(row)) <= maxBytes;
      }
      /**
       * Checks to see if this batch is at the maximum allowed payload size.
       *
       * @returns {boolean}
       */
      isAtMax() {
        const { maxRows, maxBytes } = exports.BATCH_LIMITS;
        return this.rows.length >= maxRows || this.bytes >= maxBytes;
      }
      /**
       * Indicates if the batch is at capacity.
       *
       * @returns {boolean}
       */
      isFull() {
        const { maxRows, maxBytes } = this.batchOptions;
        return this.rows.length >= maxRows || this.bytes >= maxBytes;
      }
    };
    exports.RowBatch = RowBatch;
  }
});

// node_modules/@google-cloud/bigquery/build/src/rowQueue.js
var require_rowQueue = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/rowQueue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RowQueue = exports.defaultOptions = void 0;
    var common = require_src10();
    var extend = require_extend();
    var crypto_1 = require_crypto();
    var _1 = require_src14();
    var rowBatch_1 = require_rowBatch();
    exports.defaultOptions = {
      // The maximum number of rows we'll batch up for insert().
      maxOutstandingRows: 300,
      // The maximum size of the total batched up rows for insert().
      maxOutstandingBytes: 9 * 1024 * 1024,
      // The maximum time we'll wait to send batched rows, in milliseconds.
      maxDelayMillis: 1e4
    };
    var RowQueue = class {
      constructor(table, dup, options) {
        __publicField(this, "table");
        __publicField(this, "stream");
        __publicField(this, "insertRowsOptions", {});
        __publicField(this, "batch");
        __publicField(this, "batchOptions");
        __publicField(this, "inFlight");
        __publicField(this, "pending");
        this.table = table;
        this.stream = dup;
        this.inFlight = false;
        const opts = typeof options === "object" ? options : {};
        if (opts.insertRowsOptions) {
          this.insertRowsOptions = opts.insertRowsOptions;
        } else {
          this.insertRowsOptions = {};
        }
        if (opts.batchOptions) {
          this.setOptions(opts.batchOptions);
        } else {
          this.setOptions();
        }
        this.batch = new rowBatch_1.RowBatch(this.batchOptions);
      }
      /**
       * Adds a row to the queue.
       *
       * @param {RowMetadata} row The row to insert.
       * @param {InsertRowsCallback} callback The insert callback.
       */
      add(row, callback) {
        if (!this.insertRowsOptions.raw) {
          row = {
            json: _1.Table.encodeValue_(row)
          };
          if (this.insertRowsOptions.createInsertId !== false) {
            row.insertId = (0, crypto_1.randomUUID)();
          }
        }
        if (!this.batch.canFit(row)) {
          this.insert();
        }
        this.batch.add(row, callback);
        if (this.batch.isFull()) {
          this.insert();
        } else if (!this.pending) {
          const { maxMilliseconds } = this.batchOptions;
          this.pending = setTimeout(() => {
            this.insert();
          }, maxMilliseconds);
        }
      }
      /**
       * Cancels any pending inserts and calls _insert immediately.
       */
      insert(callback) {
        const { rows, callbacks } = this.batch;
        this.batch = new rowBatch_1.RowBatch(this.batchOptions);
        if (this.pending) {
          clearTimeout(this.pending);
          delete this.pending;
        }
        if (rows.length > 0) {
          this._insert(rows, callbacks, callback);
        }
      }
      /**
       * Accepts a batch of rows and inserts them into table.
       *
       * @param {object[]} rows The rows to insert.
       * @param {InsertCallback[]} callbacks The corresponding callback functions.
       * @param {function} [callback] Callback to be fired when insert is done.
       */
      _insert(rows, callbacks, cb) {
        const json = extend(true, {}, this.insertRowsOptions, { rows });
        delete json.createInsertId;
        delete json.partialRetries;
        delete json.raw;
        this.table.request({
          method: "POST",
          uri: "/insertAll",
          json
        }, (err, resp) => {
          const partialFailures = ((resp == null ? void 0 : resp.insertErrors) || []).map((insertError) => {
            return {
              errors: insertError.errors.map((error) => {
                return {
                  message: error.message,
                  reason: error.reason
                };
              }),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              row: rows[insertError.index]
            };
          });
          if (partialFailures.length > 0) {
            err = new common.util.PartialFailureError({
              errors: partialFailures,
              response: resp
            });
            callbacks.forEach((callback) => callback(err, resp));
            this.stream.emit("error", err);
          } else {
            callbacks.forEach((callback) => callback(err, resp));
            this.stream.emit("response", resp);
            cb == null ? void 0 : cb(err, resp);
          }
          cb == null ? void 0 : cb(err, resp);
        });
      }
      /**
       * Sets the batching options.
       *
       *
       * @param {RowBatchOptions} [options] The batching options.
       */
      setOptions(options = {}) {
        const defaults = this.getOptionDefaults();
        const { maxBytes, maxRows, maxMilliseconds } = extend(true, defaults, options);
        this.batchOptions = {
          maxBytes: Math.min(maxBytes, rowBatch_1.BATCH_LIMITS.maxBytes),
          maxRows: Math.min(maxRows, rowBatch_1.BATCH_LIMITS.maxRows),
          maxMilliseconds
        };
      }
      getOptionDefaults() {
        const defaults = {
          maxBytes: exports.defaultOptions.maxOutstandingBytes,
          maxRows: exports.defaultOptions.maxOutstandingRows,
          maxMilliseconds: exports.defaultOptions.maxDelayMillis
        };
        return defaults;
      }
    };
    exports.RowQueue = RowQueue;
  }
});

// node_modules/@google-cloud/bigquery/build/src/table.js
var require_table = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/table.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Table = void 0;
    var common_1 = require_src10();
    var paginator_1 = require_src11();
    var promisify_1 = require_src12();
    var util_1 = require_util5();
    var Big = require_big();
    var extend = require_extend();
    var events_1 = require_events();
    var fs = require_fs();
    var path = require_path();
    var streamEvents = require_stream_events();
    var crypto_1 = require_crypto();
    var duplexify = require_duplexify();
    var _1 = require_src14();
    var stream_1 = require_stream();
    var rowQueue_1 = require_rowQueue();
    var FORMATS = {
      avro: "AVRO",
      csv: "CSV",
      export_metadata: "DATASTORE_BACKUP",
      json: "NEWLINE_DELIMITED_JSON",
      orc: "ORC",
      parquet: "PARQUET"
    };
    var Table = class _Table extends common_1.ServiceObject {
      constructor(dataset, id, options) {
        const methods = {
          /**
           * @callback CreateTableCallback
           * @param {?Error} err Request error, if any.
           * @param {Table} table The table.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} CreateTableResponse
           * @property {Table} 0 The table.
           * @property {object} 1 The full API response body.
           */
          /**
           * Create a table.
           *
           * @method Table#create
           * @param {object} [options] See {@link Dataset#createTable}.
           * @param {CreateTableCallback} [callback]
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Table} callback.table The new {@link Table}.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<CreateTableResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           *
           * const table = dataset.table('my-table');
           *
           * table.create((err, table, apiResponse) => {
           *   if (!err) {
           *     // The table was created successfully.
           *   }
           * });
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * table.create().then((data) => {
           *   const table = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          create: true,
          /**
           * @callback DeleteTableCallback
           * @param {?Error} err Request error, if any.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} DeleteTableResponse
           * @property {object} 0 The full API response.
           */
          /**
           * Delete a table and all its data.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/v2/tables/delete| Tables: delete API Documentation}
           *
           * @method Table#delete
           * @param {DeleteTableCallback} [callback]
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<DeleteTableResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           *
           * const table = dataset.table('my-table');
           *
           * table.delete((err, apiResponse) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * table.delete().then((data) => {
           *   const apiResponse = data[0];
           * });
           * ```
           */
          delete: true,
          /**
           * @callback TableExistsCallback
           * @param {?Error} err Request error, if any.
           * @param {boolean} exists Indicates if the table exists.
           */
          /**
           * @typedef {array} TableExistsCallback
           * @property {boolean} 0 Indicates if the table exists.
           */
          /**
           * Check if the table exists.
           *
           * @method Table#exists
           * @param {TableExistsCallback} [callback]
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {boolean} callback.exists Whether the table exists or not.
           * @returns {Promise<TableExistsCallback>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           *
           * const table = dataset.table('my-table');
           *
           * table.exists((err, exists) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * table.exists().then((data) => {
           *   const exists = data[0];
           * });
           * ```
           */
          exists: true,
          /**
           * @callback GetTableCallback
           * @param {?Error} err Request error, if any.
           * @param {Table} table The table.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} GetTableResponse
           * @property {Table} 0 The table.
           * @property {object} 1 The full API response body.
           */
          /**
           * Get a table if it exists.
           *
           * You may optionally use this to "get or create" an object by providing
           * an object with `autoCreate` set to `true`. Any extra configuration that
           * is normally required for the `create` method must be contained within
           * this object as well.
           *
           * If you wish to get a selection of metadata instead of the full table metadata
           * (retrieved by both Table#get by default and by Table#getMetadata), use
           * the `options` parameter to set the `view` and/or `selectedFields` query parameters.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/tables/get#TableMetadataView| Tables.get and TableMetadataView }
           *
           * @method Table#get
           * @param {options} [options] Configuration object.
           * @param {boolean} [options.autoCreate=false] Automatically create the
           *     object if it does not exist.
           * @param {function} [callback]
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Table} callback.table The {@link Table}.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetTableResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           *
           * const table = dataset.table('my-table');
           *
           * const options = {
           *   view: "BASIC"
           * }
           *
           * table.get((err, table, apiResponse) => {
           *   // `table.metadata` has been populated.
           * });
           *
           * table.get(options, (err, table, apiResponse) => {
           *   // A selection of `table.metadata` has been populated
           * })
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * table.get().then((data) => {
           *   const table = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          get: true,
          /**
           * @callback GetTableMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The table metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} GetTableMetadataResponse
           * @property {object} 0 The table metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Return the metadata associated with the Table.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/v2/tables/get| Tables: get API Documentation}
           *
           * @method Table#getMetadata
           * @param {GetTableMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.metadata The metadata of the Table.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetTableMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           *
           * const table = dataset.table('my-table');
           *
           * table.getMetadata((err, metadata, apiResponse) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * table.getMetadata().then((data) => {
           *   const metadata = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          getMetadata: true
        };
        super({
          parent: dataset,
          baseUrl: "/tables",
          id,
          createMethod: dataset.createTable.bind(dataset),
          methods
        });
        __publicField(this, "dataset");
        __publicField(this, "bigQuery");
        __publicField(this, "location");
        __publicField(this, "rowQueue");
        if (options && options.location) {
          this.location = options.location;
        }
        this.bigQuery = dataset.bigQuery;
        this.dataset = dataset;
        this.interceptors.push({
          request: (reqOpts) => {
            if (reqOpts.method === "PATCH" && reqOpts.json.etag) {
              reqOpts.headers = reqOpts.headers || {};
              reqOpts.headers["If-Match"] = reqOpts.json.etag;
            }
            return reqOpts;
          }
        });
        this.createReadStream = paginator_1.paginator.streamify("getRows");
      }
      createReadStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      /**
       * Convert a comma-separated name:type string to a table schema object.
       *
       * @static
       * @private
       *
       * @param {string} str Comma-separated schema string.
       * @returns {object} Table schema in the format the API expects.
       */
      static createSchemaFromString_(str) {
        return str.split(",").reduce((acc, pair) => {
          acc.fields.push({
            name: pair.split(":")[0].trim(),
            type: (pair.split(":")[1] || "STRING").toUpperCase().trim()
          });
          return acc;
        }, {
          fields: []
        });
      }
      /**
       * Convert a row entry from native types to their encoded types that the API
       * expects.
       *
       * @static
       * @private
       *
       * @param {*} value The value to be converted.
       * @returns {*} The converted value.
       */
      static encodeValue_(value) {
        var _a;
        if (typeof value === "undefined" || value === null) {
          return null;
        }
        if (value instanceof Buffer) {
          return value.toString("base64");
        }
        if (value instanceof Big) {
          return value.toFixed();
        }
        const customTypeConstructorNames = [
          "BigQueryDate",
          "BigQueryDatetime",
          "BigQueryInt",
          "BigQueryTime",
          "BigQueryTimestamp",
          "BigQueryRange",
          "Geography"
        ];
        const constructorName = (_a = value.constructor) == null ? void 0 : _a.name;
        const isCustomType = customTypeConstructorNames.indexOf(constructorName) > -1;
        if (isCustomType) {
          return value.value;
        }
        if ((0, util_1.isDate)(value)) {
          return value.toJSON();
        }
        if ((0, util_1.isArray)(value)) {
          return value.map(_Table.encodeValue_);
        }
        if (typeof value === "object") {
          return Object.keys(value).reduce((acc, key) => {
            acc[key] = _Table.encodeValue_(value[key]);
            return acc;
          }, {});
        }
        return value;
      }
      /**
       * @private
       */
      static formatMetadata_(options) {
        const body = extend(true, {}, options);
        if (options.name) {
          body.friendlyName = options.name;
          delete body.name;
        }
        if ((0, util_1.isString)(options.schema)) {
          body.schema = _Table.createSchemaFromString_(options.schema);
        }
        if ((0, util_1.isArray)(options.schema)) {
          body.schema = {
            fields: options.schema
          };
        }
        if (body.schema && body.schema.fields) {
          body.schema.fields = body.schema.fields.map((field) => {
            if (field.fields) {
              field.type = "RECORD";
            }
            return field;
          });
        }
        if ((0, util_1.isString)(options.partitioning)) {
          body.timePartitioning = {
            type: options.partitioning.toUpperCase()
          };
          delete body.partitioning;
        }
        if ((0, util_1.isString)(options.view)) {
          body.view = {
            query: options.view,
            useLegacySql: false
          };
        }
        return body;
      }
      copy(destination, metadataOrCallback, cb) {
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        this.createCopyJob(destination, metadata, (err, job, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }
          job.on("error", callback).on("complete", (metadata2) => {
            callback(null, metadata2);
          });
        });
      }
      copyFrom(sourceTables, metadataOrCallback, cb) {
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        this.createCopyFromJob(sourceTables, metadata, (err, job, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }
          job.on("error", callback).on("complete", (metadata2) => {
            callback(null, metadata2);
          });
        });
      }
      createCopyJob(destination, metadataOrCallback, cb) {
        if (!(destination instanceof _Table)) {
          throw new Error("Destination must be a Table object.");
        }
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        const body = {
          configuration: {
            copy: extend(true, metadata, {
              destinationTable: {
                datasetId: destination.dataset.id,
                projectId: destination.dataset.projectId,
                tableId: destination.id
              },
              sourceTable: {
                datasetId: this.dataset.id,
                projectId: this.dataset.projectId,
                tableId: this.id
              }
            })
          }
        };
        if (metadata.jobPrefix) {
          body.jobPrefix = metadata.jobPrefix;
          delete metadata.jobPrefix;
        }
        if (this.location) {
          body.location = this.location;
        }
        if (metadata.jobId) {
          body.jobId = metadata.jobId;
          delete metadata.jobId;
        }
        if (body.configuration && metadata.reservation) {
          body.configuration.reservation = metadata.reservation;
          delete metadata.reservation;
        }
        this.bigQuery.createJob(body, callback);
      }
      createCopyFromJob(source, metadataOrCallback, cb) {
        const sourceTables = (0, util_1.toArray)(source);
        sourceTables.forEach((sourceTable) => {
          if (!(sourceTable instanceof _Table)) {
            throw new Error("Source must be a Table object.");
          }
        });
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        const body = {
          configuration: {
            copy: extend(true, metadata, {
              destinationTable: {
                datasetId: this.dataset.id,
                projectId: this.dataset.projectId,
                tableId: this.id
              },
              sourceTables: sourceTables.map((sourceTable) => {
                return {
                  datasetId: sourceTable.dataset.id,
                  projectId: sourceTable.dataset.projectId,
                  tableId: sourceTable.id
                };
              })
            })
          }
        };
        if (metadata.jobPrefix) {
          body.jobPrefix = metadata.jobPrefix;
          delete metadata.jobPrefix;
        }
        if (this.location) {
          body.location = this.location;
        }
        if (metadata.jobId) {
          body.jobId = metadata.jobId;
          delete metadata.jobId;
        }
        if (body.configuration && metadata.reservation) {
          body.configuration.reservation = metadata.reservation;
          delete metadata.reservation;
        }
        this.bigQuery.createJob(body, callback);
      }
      createExtractJob(destination, optionsOrCallback, cb) {
        let options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        options = extend(true, options, {
          destinationUris: (0, util_1.toArray)(destination).map((dest) => {
            if (!common_1.util.isCustomType(dest, "storage/file")) {
              throw new Error("Destination must be a File object.");
            }
            const format = path.extname(dest.name).substr(1).toLowerCase();
            if (!options.destinationFormat && !options.format && FORMATS[format]) {
              options.destinationFormat = FORMATS[format];
            }
            return "gs://" + dest.bucket.name + "/" + dest.name;
          })
        });
        if (options.format) {
          options.format = options.format.toLowerCase();
          if (FORMATS[options.format]) {
            options.destinationFormat = FORMATS[options.format];
            delete options.format;
          } else {
            throw new Error("Destination format not recognized: " + options.format);
          }
        }
        if (options.gzip) {
          options.compression = "GZIP";
          delete options.gzip;
        }
        const body = {
          configuration: {
            extract: extend(true, options, {
              sourceTable: {
                datasetId: this.dataset.id,
                projectId: this.dataset.projectId,
                tableId: this.id
              }
            })
          }
        };
        if (options.jobPrefix) {
          body.jobPrefix = options.jobPrefix;
          delete options.jobPrefix;
        }
        if (this.location) {
          body.location = this.location;
        }
        if (options.jobId) {
          body.jobId = options.jobId;
          delete options.jobId;
        }
        if (body.configuration && options.reservation) {
          body.configuration.reservation = options.reservation;
          delete options.reservation;
        }
        this.bigQuery.createJob(body, callback);
      }
      createLoadJob(source, metadataOrCallback, cb) {
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        this._createLoadJob(source, metadata).then(([resp]) => callback(null, resp, resp.metadata), (err) => callback(err));
      }
      /**
       * @param {string | File | File[]} source
       * @param {JobLoadMetadata} metadata
       * @returns {Promise<JobResponse>}
       * @private
       */
      async _createLoadJob(source, metadata) {
        var _a;
        if (metadata.format) {
          metadata.sourceFormat = FORMATS[metadata.format.toLowerCase()];
          delete metadata.format;
        }
        if (this.location) {
          metadata.location = this.location;
        }
        if (typeof source === "string") {
          const detectedFormat = FORMATS[path.extname(source).substr(1).toLowerCase()];
          if (!metadata.sourceFormat && detectedFormat) {
            metadata.sourceFormat = detectedFormat;
          }
          const jobWritable = fs.createReadStream(source).pipe(this.createWriteStream_(metadata));
          const [jobResponse] = await (0, events_1.once)(jobWritable, "job");
          return [jobResponse, jobResponse.metadata];
        }
        const body = {
          configuration: {
            load: {
              destinationTable: {
                projectId: this.dataset.projectId,
                datasetId: this.dataset.id,
                tableId: this.id
              }
            }
          }
        };
        if (metadata.jobPrefix) {
          body.jobPrefix = metadata.jobPrefix;
          delete metadata.jobPrefix;
        }
        if (metadata.location) {
          body.location = metadata.location;
          delete metadata.location;
        }
        if (metadata.jobId) {
          body.jobId = metadata.jobId;
          delete metadata.jobId;
        }
        if (body.configuration && metadata.reservation) {
          body.configuration.reservation = metadata.reservation;
          delete metadata.reservation;
        }
        extend(true, (_a = body.configuration) == null ? void 0 : _a.load, metadata, {
          sourceUris: (0, util_1.toArray)(source).map((src) => {
            if (!common_1.util.isCustomType(src, "storage/file")) {
              throw new Error("Source must be a File object.");
            }
            const format = FORMATS[path.extname(src.name).substr(1).toLowerCase()];
            if (!metadata.sourceFormat && format && body.configuration && body.configuration.load) {
              body.configuration.load.sourceFormat = format;
            }
            return "gs://" + src.bucket.name + "/" + src.name;
          })
        });
        return this.bigQuery.createJob(body);
      }
      createQueryJob(options, callback) {
        return this.dataset.createQueryJob(options, callback);
      }
      /**
       * Run a query scoped to your dataset as a readable object stream.
       *
       * See {@link BigQuery#createQueryStream} for full documentation of this
       * method.
       *
       * @param {object} query See {@link BigQuery#createQueryStream} for full
       *     documentation of this method.
       * @returns {stream} See {@link BigQuery#createQueryStream} for full
       *     documentation of this method.
       */
      createQueryStream(query) {
        return this.dataset.createQueryStream(query);
      }
      /**
       * Creates a write stream. Unlike the public version, this will not
       * automatically poll the underlying job.
       *
       * @private
       *
       * @param {string|object} [metadata] Metadata to set with the load operation.
       *     The metadata object should be in the format of the
       *     {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/Job#JobConfigurationLoad| `configuration.load`}
       * property of a Jobs resource. If a string is given, it will be used
       * as the filetype.
       * @param {string} [metadata.jobId] Custom job id.
       * @param {string} [metadata.jobPrefix] Prefix to apply to the job id.
       * @returns {WritableStream}
       */
      createWriteStream_(metadata) {
        metadata = metadata || {};
        if (typeof metadata === "string") {
          metadata = {
            sourceFormat: FORMATS[metadata.toLowerCase()]
          };
        }
        if (typeof metadata.schema === "string") {
          metadata.schema = _Table.createSchemaFromString_(metadata.schema);
        }
        metadata = extend(true, {
          destinationTable: {
            projectId: this.dataset.projectId,
            datasetId: this.dataset.id,
            tableId: this.id
          }
        }, metadata);
        let jobId = metadata.jobId || (0, crypto_1.randomUUID)();
        if (metadata.jobId) {
          delete metadata.jobId;
        }
        if (metadata.jobPrefix) {
          jobId = metadata.jobPrefix + jobId;
          delete metadata.jobPrefix;
        }
        const dup = streamEvents(duplexify());
        const jobMetadata = {
          configuration: {
            load: metadata
          },
          jobReference: {
            jobId,
            projectId: this.dataset.projectId,
            location: this.location
          }
        };
        dup.once("writing", () => {
          common_1.util.makeWritableStream(dup, {
            makeAuthenticatedRequest: this.bigQuery.makeAuthenticatedRequest,
            metadata: jobMetadata,
            request: {
              uri: `${this.bigQuery.apiEndpoint}/upload/bigquery/v2/projects/${this.dataset.projectId}/jobs`
            }
          }, (data) => {
            let job = null;
            const jobRef = data.jobReference;
            if (jobRef && jobRef.jobId) {
              job = this.bigQuery.job(jobRef.jobId, {
                location: jobRef.location,
                projectId: jobRef.projectId
              });
              job.metadata = data;
            }
            dup.emit("job", job);
          });
        });
        return dup;
      }
      /**
       * Load data into your table from a readable stream of AVRO, CSV, JSON, ORC,
       * or PARQUET data.
       *
       * See {@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/insert| Jobs: insert API Documentation}
       *
       * @param {string|object} [metadata] Metadata to set with the load operation.
       *     The metadata object should be in the format of the
       *     {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/Job#JobConfigurationLoad| `configuration.load`}
       * property of a Jobs resource. If a string is given,
       * it will be used as the filetype.
       * @param {string} [metadata.jobId] Custom job id.
       * @param {string} [metadata.jobPrefix] Prefix to apply to the job id.
       * @returns {WritableStream}
       *
       * @throws {Error} If source format isn't recognized.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('my-dataset');
       * const table = dataset.table('my-table');
       *
       * //-
       * // Load data from a CSV file.
       * //-
       * const request = require('request');
       *
       * const csvUrl = 'http://goo.gl/kSE7z6';
       *
       * const metadata = {
       *   allowJaggedRows: true,
       *   skipLeadingRows: 1
       * };
       *
       * request.get(csvUrl)
       *   .pipe(table.createWriteStream(metadata))
       *   .on('job', (job) => {
       *     // `job` is a Job object that can be used to check the status of the
       *     // request.
       *   })
       *   .on('complete', (job) => {
       *     // The job has completed successfully.
       *   });
       *
       * //-
       * // Load data from a JSON file.
       * //-
       * const fs = require('fs');
       *
       * fs.createReadStream('./test/testdata/testfile.json')
       *   .pipe(table.createWriteStream('json'))
       *   .on('job', (job) => {
       *     // `job` is a Job object that can be used to check the status of the
       *     // request.
       *   })
       *   .on('complete', (job) => {
       *     // The job has completed successfully.
       *   });
       * ```
       */
      createWriteStream(metadata) {
        const stream = this.createWriteStream_(metadata);
        stream.on("prefinish", () => {
          stream.cork();
        });
        stream.on("job", (job) => {
          job.on("error", (err) => {
            stream.destroy(err);
          }).on("complete", () => {
            stream.emit("complete", job);
            stream.uncork();
          });
        });
        return stream;
      }
      extract(destination, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        this.createExtractJob(destination, options, (err, job, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }
          job.on("error", callback).on("complete", (metadata) => {
            callback(null, metadata);
          });
        });
      }
      /**
       * Retrieves table data from a specified set of rows. The rows are returned to
       * your callback as an array of objects matching your table's schema.
       *
       * See {@link https://cloud.google.com/bigquery/docs/reference/v2/tabledata/list| Tabledata: list API Documentation}
       *
       * @param {object} [options] The configuration object.
       * @param {boolean} [options.autoPaginate=true] Have pagination handled
       *     automatically.
       * @param {number} [options.maxApiCalls] Maximum number of API calls to make.
       * @param {number} [options.maxResults] Maximum number of results to return.
       * @param {boolean|IntegerTypeCastOptions} [options.wrapIntegers=false] Wrap values
       *     of 'INT64' type in {@link BigQueryInt} objects.
       *     If a `boolean`, this will wrap values in {@link BigQueryInt} objects.
       *     If an `object`, this will return a value returned by
       *     `wrapIntegers.integerTypeCastFunction`.
       * @param {RowsCallback} [callback] The callback function. If `autoPaginate`
       *     is set to false a {@link ManualQueryResultsCallback} should be used.
       * @param {?error} callback.err An error returned while making this request
       * @param {array} callback.rows The table data from specified set of rows.
       * @returns {Promise<RowsResponse>}
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('my-dataset');
       * const table = dataset.table('my-table');
       *
       * table.getRows((err, rows) => {
       *   if (!err) {
       *     // rows is an array of results.
       *   }
       * });
       *
       * //-
       * // To control how many API requests are made and page through the results
       * // manually, set `autoPaginate` to `false`.
       * //-
       * function manualPaginationCallback(err, rows, nextQuery, apiResponse) {
       *   if (nextQuery) {
       *     // More results exist.
       *     table.getRows(nextQuery, manualPaginationCallback);
       *   }
       * }
       *
       * table.getRows({
       *   autoPaginate: false
       * }, manualPaginationCallback);
       *
       * //-
       * // If the callback is omitted, we'll return a Promise.
       * //-
       * table.getRows().then((data) => {
       *   const rows = data[0];
       *   });
       * ```
       */
      getRows(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const wrapIntegers = options.wrapIntegers ? options.wrapIntegers : false;
        delete options.wrapIntegers;
        const parseJSON = options.parseJSON ? options.parseJSON : false;
        delete options.parseJSON;
        const selectedFields = options.selectedFields ? options.selectedFields.split(",") : [];
        const onComplete = (err, rows, nextQuery, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          rows = _1.BigQuery.mergeSchemaWithRows_(this.metadata.schema, rows || [], {
            wrapIntegers,
            selectedFields,
            parseJSON
          });
          callback(null, rows, nextQuery, resp);
        };
        const qs = extend({
          "formatOptions.useInt64Timestamp": true
        }, options);
        this.request({
          uri: "/data",
          qs
        }, (err, resp) => {
          if (err) {
            onComplete(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.pageToken) {
            nextQuery = Object.assign({}, qs, {
              pageToken: resp.pageToken
            });
          }
          if (resp.rows && resp.rows.length > 0 && !this.metadata.schema) {
            void this.getMetadata((err2, metadata, apiResponse) => {
              if (err2) {
                onComplete(err2, null, null, apiResponse);
                return;
              }
              onComplete(null, resp.rows, nextQuery, resp);
            });
            return;
          }
          onComplete(null, resp.rows, nextQuery, resp);
        });
      }
      insert(rows, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const promise = this._insertAndCreateTable(rows, options);
        if (callback) {
          promise.then((resp) => callback(null, resp), (err) => callback(err, null));
        } else {
          return promise.then((r) => [r]);
        }
      }
      /**
       * Insert rows with retries, but will create the table if not exists.
       *
       * @param {RowMetadata | RowMetadata[]} rows
       * @param {InsertRowsOptions} options
       * @returns {Promise<bigquery.ITableDataInsertAllResponse | bigquery.ITable>}
       * @private
       */
      async _insertAndCreateTable(rows, options) {
        const { schema } = options;
        const delay = 6e4;
        try {
          return await this._insertWithRetry(rows, options);
        } catch (err) {
          if (err.code !== 404 || !schema) {
            throw err;
          }
        }
        try {
          await this.create({ schema });
        } catch (err) {
          if (err.code !== 409) {
            throw err;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this._insertAndCreateTable(rows, options);
      }
      /**
       * This method will attempt to insert rows while retrying any partial failures
       * that occur along the way. Because partial insert failures are returned
       * differently, we can't depend on our usual retry strategy.
       *
       * @private
       *
       * @param {RowMetadata|RowMetadata[]} rows The rows to insert.
       * @param {InsertRowsOptions} options Insert options.
       * @returns {Promise<bigquery.ITableDataInsertAllResponse>}
       */
      async _insertWithRetry(rows, options) {
        const { partialRetries = 3 } = options;
        let error;
        const maxAttempts = Math.max(partialRetries, 0) + 1;
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          try {
            return await this._insert(rows, options);
          } catch (e) {
            error = e;
            rows = (e.errors || []).filter((err) => !!err.row).map((err) => err.row);
            if (!rows.length) {
              break;
            }
          }
        }
        throw error;
      }
      /**
       * This method does the bulk of the work for processing options and making the
       * network request.
       *
       * @private
       *
       * @param {RowMetadata|RowMetadata[]} rows The rows to insert.
       * @param {InsertRowsOptions} options Insert options.
       * @returns {Promise<bigquery.ITableDataInsertAllResponse>}
       */
      async _insert(rows, options) {
        rows = (0, util_1.toArray)(rows);
        if (!rows.length) {
          throw new Error("You must provide at least 1 row to be inserted.");
        }
        const json = extend(true, {}, options, { rows });
        if (!options.raw) {
          json.rows = rows.map((row) => {
            const encoded = {
              json: _Table.encodeValue_(row)
            };
            if (options.createInsertId !== false) {
              encoded.insertId = (0, crypto_1.randomUUID)();
            }
            return encoded;
          });
        }
        delete json.createInsertId;
        delete json.partialRetries;
        delete json.raw;
        delete json.schema;
        const [resp] = await this.request({
          method: "POST",
          uri: "/insertAll",
          json
        });
        const partialFailures = (resp.insertErrors || []).map((insertError) => {
          return {
            errors: insertError.errors.map((error) => {
              return {
                message: error.message,
                reason: error.reason
              };
            }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            row: rows[insertError.index]
          };
        });
        if (partialFailures.length > 0) {
          throw new common_1.util.PartialFailureError({
            errors: partialFailures,
            response: resp
          });
        }
        return resp;
      }
      createInsertStream(options) {
        options = typeof options === "object" ? options : {};
        const dup = new stream_1.Duplex({ objectMode: true });
        dup._write = (chunk, encoding, cb) => {
          this.rowQueue.add(chunk, () => {
          });
          cb();
        };
        this.rowQueue = new rowQueue_1.RowQueue(this, dup, options);
        return dup;
      }
      load(source, metadataOrCallback, cb) {
        const metadata = typeof metadataOrCallback === "object" ? metadataOrCallback : {};
        const callback = typeof metadataOrCallback === "function" ? metadataOrCallback : cb;
        this.createLoadJob(source, metadata, (err, job, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }
          job.on("error", callback).on("complete", (metadata2) => {
            callback(null, metadata2);
          });
        });
      }
      query(query, callback) {
        if (typeof query === "string") {
          query = {
            query
          };
        }
        this.dataset.query(query, callback);
      }
      setMetadata(metadata, callback) {
        const body = _Table.formatMetadata_(metadata);
        void super.setMetadata(body, callback);
      }
      getIamPolicy(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        if (typeof options.requestedPolicyVersion === "number" && options.requestedPolicyVersion !== 1) {
          throw new Error("Only IAM policy version 1 is supported.");
        }
        const json = extend(true, {}, { options });
        this.request({
          method: "POST",
          uri: "/:getIamPolicy",
          json
        }, (err, resp) => {
          if (err) {
            callback(err, null);
            return;
          }
          callback(null, resp);
        });
      }
      setIamPolicy(policy, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        if (policy.version && policy.version !== 1) {
          throw new Error("Only IAM policy version 1 is supported.");
        }
        const json = extend(true, {}, options, { policy });
        this.request({
          method: "POST",
          uri: "/:setIamPolicy",
          json
        }, (err, resp) => {
          if (err) {
            callback(err, null);
            return;
          }
          callback(null, resp);
        });
      }
      testIamPermissions(permissions, callback) {
        permissions = (0, util_1.toArray)(permissions);
        const json = extend(true, {}, { permissions });
        this.request({
          method: "POST",
          uri: "/:testIamPermissions",
          json
        }, (err, resp) => {
          if (err) {
            callback(err, null);
            return;
          }
          callback(null, resp);
        });
      }
    };
    exports.Table = Table;
    paginator_1.paginator.extend(Table, ["getRows"]);
    (0, promisify_1.promisifyAll)(Table);
  }
});

// node_modules/@google-cloud/bigquery/build/src/model.js
var require_model = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/model.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = void 0;
    var common_1 = require_src10();
    var promisify_1 = require_src12();
    var util_1 = require_util5();
    var extend = require_extend();
    var FORMATS = ["ML_TF_SAVED_MODEL", "ML_XGBOOST_BOOSTER"];
    var Model = class extends common_1.ServiceObject {
      constructor(dataset, id) {
        const methods = {
          /**
           * @callback DeleteModelCallback
           * @param {?Error} err Request error, if any.
           * @param {object} apiResponse The full API response.
           */
          /**
           * Delete the model.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/models/delete| Models: delete API Documentation}
           *
           * @method Model#delete
           * @param {DeleteModelCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const model = dataset.model('my-model');
           *
           * model.delete((err, apiResponse) => {});
           *
           * ```
           * @example If the callback is omitted we'll return a Promise.
           * ```
           * const [apiResponse] = await model.delete();
           * ```
           * @example If successful, the response body is empty.
           * ```
           * ```
           */
          delete: true,
          /**
           * @callback ModelExistsCallback
           * @param {?Error} err Request error, if any.
           * @param {boolean} exists Indicates if the model exists.
           */
          /**
           * @typedef {array} ModelExistsResponse
           * @property {boolean} 0 Indicates if the model exists.
           */
          /**
           * Check if the model exists.
           *
           * @method Model#exists
           * @param {ModelExistsCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {boolean} callback.exists Whether the model exists or not.
           * @returns {Promise<ModelExistsResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const model = dataset.model('my-model');
           *
           * model.exists((err, exists) => {});
           *
           * ```
           * @example If the callback is omitted we'll return a Promise.
           * ```
           * const [exists] = await model.exists();
           * ```
           */
          exists: true,
          /**
           * @callback GetModelCallback
           * @param {?Error} err Request error, if any.
           * @param {Model} model The model.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} GetModelResponse
           * @property {Model} 0 The model.
           * @property {object} 1 The full API response body.
           */
          /**
           * Get a model if it exists.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/models/get| Models: get API Documentation}
           *
           * @method Model#get:
           * @param {GetModelCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Model} callback.model The {@link Model}.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetModelResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const model = dataset.model('my-model');
           *
           * model.get(err => {
           *   if (!err) {
           *     // `model.metadata` has been populated.
           *   }
           * });
           *
           * ```
           * @example If the callback is omitted we'll return a Promise.
           * ```
           * await model.get();
           * ```
           */
          get: true,
          /**
           * @callback GetModelMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The model metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} GetModelMetadataResponse
           * @property {object} 0 The model metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Return the metadata associated with the model.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/models/get| Models: get API Documentation}
           *
           * @method Model#getMetadata
           * @param {GetModelMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.metadata The metadata of the model.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetModelMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const model = dataset.model('my-model');
           *
           * model.getMetadata((err, metadata, apiResponse) => {});
           *
           * ```
           * @example If the callback is omitted we'll return a Promise.
           * ```
           * const [metadata, apiResponse] = await model.getMetadata();
           * ```
           */
          getMetadata: true,
          /**
           * @callback SetModelMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The model metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} SetModelMetadataResponse
           * @property {object} 0 The model metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/models/patch| Models: patch API Documentation}
           *
           * @method Model#setMetadata
           * @param {object} metadata The metadata key/value object to set.
           * @param {SetModelMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.metadata The updated metadata of the model.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<SetModelMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const model = dataset.model('my-model');
           *
           * const metadata = {
           *   friendlyName: 'TheBestModelEver'
           * };
           *
           * model.setMetadata(metadata, (err, metadata, apiResponse) => {});
           *
           * ```
           * @example If the callback is omitted we'll return a Promise.
           * ```
           * const [metadata, apiResponse] = await model.setMetadata(metadata);
           * ```
           */
          setMetadata: true
        };
        super({
          parent: dataset,
          baseUrl: "/models",
          id,
          methods
        });
        __publicField(this, "dataset");
        __publicField(this, "bigQuery");
        this.dataset = dataset;
        this.bigQuery = dataset.bigQuery;
      }
      createExtractJob(destination, optionsOrCallback, cb) {
        let options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        options = extend(true, options, {
          destinationUris: (0, util_1.toArray)(destination).map((dest) => {
            if (common_1.util.isCustomType(dest, "storage/file")) {
              return "gs://" + dest.bucket.name + "/" + dest.name;
            }
            if (typeof dest === "string") {
              return dest;
            }
            throw new Error("Destination must be a string or a File object.");
          })
        });
        if (options.format) {
          options.format = options.format.toUpperCase();
          if (FORMATS.includes(options.format)) {
            options.destinationFormat = options.format;
            delete options.format;
          } else {
            throw new Error("Destination format not recognized: " + options.format);
          }
        }
        const body = {
          configuration: {
            extract: extend(true, options, {
              sourceModel: {
                datasetId: this.dataset.id,
                projectId: this.dataset.projectId,
                modelId: this.id
              }
            })
          }
        };
        if (options.jobPrefix) {
          body.jobPrefix = options.jobPrefix;
          delete options.jobPrefix;
        }
        if (options.jobId) {
          body.jobId = options.jobId;
          delete options.jobId;
        }
        if (body.configuration && options.reservation) {
          body.configuration.reservation = options.reservation;
          delete options.reservation;
        }
        this.bigQuery.createJob(body, callback);
      }
      extract(destination, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        this.createExtractJob(destination, options, (err, job, resp) => {
          if (err) {
            callback(err, resp);
            return;
          }
          job.on("error", callback).on("complete", (metadata) => {
            callback(null, metadata);
          });
        });
      }
    };
    exports.Model = Model;
    (0, promisify_1.promisifyAll)(Model);
  }
});

// node_modules/@google-cloud/bigquery/build/src/routine.js
var require_routine = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/routine.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Routine = void 0;
    var common_1 = require_src10();
    var promisify_1 = require_src12();
    var extend = require_extend();
    var Routine = class extends common_1.ServiceObject {
      constructor(dataset, id) {
        const methods = {
          /**
           * Create a routine.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines/insert| Routines: insert API Documentation}
           *
           * @method Routine#create
           * @param {object} config A [routine resource]{@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines#Routine}.
           * @param {CreateRoutineCallback} [callback] The callback function.
           * @returns {Promise<CreateRoutineResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * const config = {
           *   arguments: [{
           *     name: 'x',
           *     dataType: {
           *       typeKind: 'INT64'
           *     }
           *   }],
           *   definitionBody: 'x * 3',
           *   routineType: 'SCALAR_FUNCTION',
           *   returnType: {
           *     typeKind: 'INT64'
           *   }
           * };
           *
           * routine.create(config, (err, routine, apiResponse) => {
           *   if (!err) {
           *     // The routine was created successfully.
           *   }
           * });
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [routine, apiResponse] = await routine.create(config);
           * ```
           */
          create: true,
          /**
           * @callback DeleteRoutineCallback
           * @param {?Error} err Request error, if any.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} DeleteRoutineResponse
           * @property {object} 0 The full API response.
           */
          /**
           * Deletes a routine.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines/delete| Routines: delete API Documentation}
           *
           * @method Routine#delete
           * @param {DeleteRoutineCallback} [callback] The callback function.
           * @returns {Promise<DeleteRoutineResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * routine.delete((err, apiResponse) => {
           *   if (!err) {
           *     // The routine was deleted successfully.
           *   }
           * });
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [apiResponse] = await routine.delete();
           * ```
           */
          delete: true,
          /**
           * @callback RoutineExistsCallback
           * @param {?Error} err Request error, if any.
           * @param {boolean} exists Indicates if the routine exists.
           */
          /**
           * @typedef {array} RoutineExistsResponse
           * @property {boolean} 0 Indicates if the routine exists.
           */
          /**
           * Check if the routine exists.
           *
           * @method Routine#exists
           * @param {RoutineExistsCallback} [callback] The callback function.
           * @returns {Promise<RoutineExistsResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * routine.exists((err, exists) => {});
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [exists] = await routine.exists();
           * ```
           */
          exists: true,
          /**
           * @callback GetRoutineCallback
           * @param {?Error} err Request error, if any.
           * @param {Routine} routine The routine.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} GetRoutineResponse
           * @property {Routine} 0 The routine.
           * @property {object} 1 The full API response body.
           */
          /**
           * Get a routine if it exists.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines/get| Routines: get API Documentation}
           *
           * @method Routine#get
           * @param {GetRoutineCallback} [callback] The callback function.
           * @returns {Promise<GetRoutineResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * routine.get((err, routine) => {});
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [routine2] = await routine.get();
           * ```
           */
          get: true,
          /**
           * @callback GetRoutineMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The routine metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} GetRoutineMetadataResponse
           * @property {object} 0 The routine metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Get the metadata associated with a routine.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines/get| Routines: get API Documentation}
           *
           * @method Routine#getMetadata
           * @param {GetRoutineMetadataCallback} [callback] The callback function.
           * @returns {Promise<GetRoutineMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * routine.getMetadata((err, metadata, apiResponse) => {});
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [metadata, apiResponse] = await routine.getMetadata();
           * ```
           */
          getMetadata: true,
          /**
           * @callback SetRoutineMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The routine metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} SetRoutineMetadataResponse
           * @property {object} 0 The routine metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Update a routine.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines/update| Routines: update API Documentation}
           *
           * @method Routine#setMetadata
           * @param {object} metadata A [routine resource object]{@link https://cloud.google.com/bigquery/docs/reference/rest/v2/routines#Routine}.
           * @param {SetRoutineMetadataCallback} [callback] The callback function.
           * @returns {Promise<SetRoutineMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('my-dataset');
           * const routine = dataset.routine('my_routine');
           *
           * const updates = {
           *   description: 'The perfect description!'
           * };
           *
           * routine.setMetadata(updates, (err, metadata, apiResponse) => {});
           *
           * ```
           * @example If the callback is omitted a Promise will be returned
           * ```
           * const [metadata, apiResponse] = await routine.setMetadata(updates);
           * ```
           */
          setMetadata: {
            reqOpts: {
              method: "PUT"
            }
          }
        };
        super({
          parent: dataset,
          baseUrl: "/routines",
          id,
          methods,
          createMethod: dataset.createRoutine.bind(dataset)
        });
      }
      setMetadata(metadata, callback) {
        void this.getMetadata((err, fullMetadata) => {
          if (err) {
            callback(err);
            return;
          }
          const updatedMetadata = extend(true, {}, fullMetadata, metadata);
          void super.setMetadata(updatedMetadata, callback);
        });
      }
    };
    exports.Routine = Routine;
    (0, promisify_1.promisifyAll)(Routine);
  }
});

// node_modules/@google-cloud/bigquery/build/src/dataset.js
var require_dataset = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/dataset.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dataset = void 0;
    var common_1 = require_src10();
    var paginator_1 = require_src11();
    var promisify_1 = require_src12();
    var extend = require_extend();
    var table_1 = require_table();
    var model_1 = require_model();
    var routine_1 = require_routine();
    var Dataset = class extends common_1.ServiceObject {
      constructor(bigQuery, id, options) {
        const methods = {
          /**
           * @callback CreateDatasetCallback
           * @param {?Error} err Request error, if any.
           * @param {Dataset} dataset The newly created dataset.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} CreateDatasetResponse
           * @property {Dataset} 0 The newly created dataset.
           * @property {object} 1 The full API response body.
           */
          /**
           * Create a dataset.
           *
           * @method Dataset#create
           * @param {CreateDatasetCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Dataset} callback.dataset The newly created dataset.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<CreateDatasetResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('institutions');
           * dataset.create((err, dataset, apiResponse) => {
           *   if (!err) {
           *     // The dataset was created successfully.
           *   }
           * });
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * dataset.create().then((data) => {
           *   const dataset = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          create: true,
          /**
           * @callback DatasetExistsCallback
           * @param {?Error} err Request error, if any.
           * @param {boolean} exists Indicates if the dataset exists.
           */
          /**
           * @typedef {array} DatasetExistsResponse
           * @property {boolean} 0 Indicates if the dataset exists.
           */
          /**
           * Check if the dataset exists.
           *
           * @method Dataset#exists
           * @param {DatasetExistsCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {boolean} callback.exists Whether the dataset exists or not.
           * @returns {Promise<DatasetExistsResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('institutions');
           * dataset.exists((err, exists) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * dataset.exists().then((data) => {
           *   const exists = data[0];
           * });
           * ```
           */
          exists: true,
          /**
           * @callback GetDatasetCallback
           * @param {?Error} err Request error, if any.
           * @param {Dataset} dataset The dataset.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} GetDatasetResponse
           * @property {Dataset} 0 The dataset.
           * @property {object} 1 The full API response body.
           */
          /**
           * Get a dataset if it exists.
           *
           * You may optionally use this to "get or create" an object by providing
           * an object with `autoCreate` set to `true`. Any extra configuration that
           * is normally required for the `create` method must be contained within
           * this object as well.
           *
           * @method Dataset#get
           * @param {options} [options] Configuration object.
           * @param {boolean} [options.autoCreate=false] Automatically create the
           *     object if it does not exist.
           * @param {GetDatasetCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Dataset} callback.dataset The dataset.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetDatasetResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('institutions');
           * dataset.get((err, dataset, apiResponse) => {
           *   if (!err) {
           *     // `dataset.metadata` has been populated.
           *   }
           * });
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * dataset.get().then((data) => {
           *   const dataset = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          get: true,
          /**
           * @callback GetDatasetMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The dataset metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} GetDatasetMetadataResponse
           * @property {object} 0 The dataset metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Get the metadata for the Dataset.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/v2/datasets/get| Datasets: get API Documentation}
           *
           * @method Dataset#getMetadata
           * @param {GetDatasetMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.metadata The dataset's metadata.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetDatasetMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('institutions');
           * dataset.getMetadata((err, metadata, apiResponse) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * dataset.getMetadata().then((data) => {
           *   const metadata = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          getMetadata: true,
          /**
           * @callback SetDatasetMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} SetDatasetMetadataResponse
           * @property {object} 0 The full API response.
           */
          /**
           * Sets the metadata of the Dataset object.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/v2/datasets/patch| Datasets: patch API Documentation}
           *
           * @method Dataset#setMetadata
           * @param {object} metadata Metadata to save on the Dataset.
           * @param {SetDatasetMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<SetDatasetMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           * const dataset = bigquery.dataset('institutions');
           *
           * const metadata = {
           *   description: 'Info for every institution in the 2013 IPEDS universe'
           * };
           *
           * dataset.setMetadata(metadata, (err, apiResponse) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * dataset.setMetadata(metadata).then((data) => {
           *   const apiResponse = data[0];
           * });
           * ```
           */
          setMetadata: true
        };
        super({
          parent: bigQuery,
          baseUrl: "/datasets",
          id,
          methods,
          createMethod: (id2, optionsOrCallback, cb) => {
            let options2 = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
            const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
            if (this.location) {
              options2 = extend({}, options2, { location: this.location });
            }
            if (this.projectId) {
              options2 = extend({}, options2, { projectId: this.projectId });
            }
            return bigQuery.createDataset(id2, options2, callback);
          }
        });
        __publicField(this, "bigQuery");
        __publicField(this, "location");
        __publicField(this, "projectId");
        if (options && options.location) {
          this.location = options.location;
        }
        if (options == null ? void 0 : options.projectId) {
          this.projectId = options.projectId;
        } else {
          this.projectId = bigQuery.projectId;
        }
        this.bigQuery = bigQuery;
        this.interceptors.push({
          request: (reqOpts) => {
            if (reqOpts.method === "PATCH" && reqOpts.json.etag) {
              reqOpts.headers = reqOpts.headers || {};
              reqOpts.headers["If-Match"] = reqOpts.json.etag;
            }
            if (this.projectId) {
              reqOpts.uri = reqOpts.uri.replace(`/projects/${this.bigQuery.projectId}/`, `/projects/${this.projectId}/`);
            }
            return reqOpts;
          }
        });
        this.getModelsStream = paginator_1.paginator.streamify("getModels");
        this.getRoutinesStream = paginator_1.paginator.streamify("getRoutines");
        this.getTablesStream = paginator_1.paginator.streamify("getTables");
      }
      getModelsStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      getRoutinesStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      getTablesStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      createQueryJob(options, callback) {
        if (typeof options === "string") {
          options = {
            query: options
          };
        }
        options = extend(true, {}, options, {
          defaultDataset: {
            datasetId: this.id
          },
          location: this.location
        });
        return this.bigQuery.createQueryJob(options, callback);
      }
      /**
       * Run a query scoped to your dataset as a readable object stream.
       *
       * See {@link BigQuery#createQueryStream} for full documentation of this
       * method.
       *
       * @param {object} options See {@link BigQuery#createQueryStream} for full
       *     documentation of this method.
       * @returns {stream}
       */
      createQueryStream(options) {
        if (typeof options === "string") {
          options = {
            query: options
          };
        }
        options = extend(true, {}, options, {
          defaultDataset: {
            datasetId: this.id
          },
          location: this.location
        });
        return this.bigQuery.createQueryStream(options);
      }
      createRoutine(id, config, callback) {
        const json = Object.assign({}, config, {
          routineReference: {
            routineId: id,
            datasetId: this.id,
            projectId: this.projectId
          }
        });
        this.request({
          method: "POST",
          uri: "/routines",
          json
        }, (err, resp) => {
          if (err) {
            callback(err, null, resp);
            return;
          }
          const routine = this.routine(resp.routineReference.routineId);
          routine.metadata = resp;
          callback(null, routine, resp);
        });
      }
      createTable(id, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const body = table_1.Table.formatMetadata_(options);
        body.tableReference = {
          datasetId: this.id,
          projectId: this.projectId,
          tableId: id
        };
        this.request({
          method: "POST",
          uri: "/tables",
          json: body
        }, (err, resp) => {
          if (err) {
            callback(err, null, resp);
            return;
          }
          const table = this.table(resp.tableReference.tableId, {
            location: resp.location
          });
          table.metadata = resp;
          callback(null, table, resp);
        });
      }
      delete(optionsOrCallback, callback) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        callback = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;
        const query = {
          deleteContents: !!options.force
        };
        this.request({
          method: "DELETE",
          uri: "",
          qs: query
        }, callback);
      }
      getModels(optsOrCb, cb) {
        const options = typeof optsOrCb === "object" ? optsOrCb : {};
        const callback = typeof optsOrCb === "function" ? optsOrCb : cb;
        this.request({
          uri: "/models",
          qs: options
        }, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.nextPageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: resp.nextPageToken
            });
          }
          const models = (resp.models || []).map((modelObject) => {
            const model = this.model(modelObject.modelReference.modelId);
            model.metadata = modelObject;
            return model;
          });
          callback(null, models, nextQuery, resp);
        });
      }
      getRoutines(optsOrCb, cb) {
        const options = typeof optsOrCb === "object" ? optsOrCb : {};
        const callback = typeof optsOrCb === "function" ? optsOrCb : cb;
        this.request({
          uri: "/routines",
          qs: options
        }, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.nextPageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: resp.nextPageToken
            });
          }
          const routines = (resp.routines || []).map((metadata) => {
            const routine = this.routine(metadata.routineReference.routineId);
            routine.metadata = metadata;
            return routine;
          });
          callback(null, routines, nextQuery, resp);
        });
      }
      getTables(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        this.request({
          uri: "/tables",
          qs: options
        }, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.nextPageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: resp.nextPageToken
            });
          }
          const tables = (resp.tables || []).map((tableObject) => {
            const table = this.table(tableObject.tableReference.tableId, {
              location: tableObject.location
            });
            table.metadata = tableObject;
            return table;
          });
          callback(null, tables, nextQuery, resp);
        });
      }
      /**
       * Create a {@link Model} object.
       *
       * @throws {TypeError} if model ID is missing.
       *
       * @param {string} id The ID of the model.
       * @return {Model}
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('institutions');
       *
       * const model = dataset.model('my-model');
       * ```
       */
      model(id) {
        if (typeof id !== "string") {
          throw new TypeError("A model ID is required.");
        }
        return new model_1.Model(this, id);
      }
      query(options, callback) {
        if (typeof options === "string") {
          options = {
            query: options
          };
        }
        options = extend(true, {}, options, {
          defaultDataset: {
            datasetId: this.id
          },
          location: this.location
        });
        return this.bigQuery.query(options, callback);
      }
      /**
       * Create a {@link Routine} object.
       *
       * @throws {TypeError} if routine ID is missing.
       *
       * @param {string} id The ID of the routine.
       * @returns {Routine}
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('institutions');
       *
       * const routine = dataset.routine('my_routine');
       * ```
       */
      routine(id) {
        if (typeof id !== "string") {
          throw new TypeError("A routine ID is required.");
        }
        return new routine_1.Routine(this, id);
      }
      /**
       * Create a {@link Table} object.
       *
       * @throws {TypeError} if table ID is missing.
       *
       * @param {string} id The ID of the table.
       * @param {object} [options] Table options.
       * @param {string} [options.location] The geographic location of the table, by
       *      default this value is inherited from the dataset. This can be used to
       *      configure the location of all jobs created through a table instance.
       * It cannot be used to set the actual location of the table. This value will
       *      be superseded by any API responses containing location data for the
       *      table.
       * @return {Table}
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('institutions');
       *
       * const institutions = dataset.table('institution_data');
       * ```
       */
      table(id, options) {
        if (typeof id !== "string") {
          throw new TypeError("A table ID is required.");
        }
        options = extend({
          location: this.location,
          projectId: this.projectId
        }, options);
        return new table_1.Table(this, id, options);
      }
    };
    exports.Dataset = Dataset;
    paginator_1.paginator.extend(Dataset, ["getModels", "getRoutines", "getTables"]);
    (0, promisify_1.promisifyAll)(Dataset, {
      exclude: ["model", "routine", "table"]
    });
  }
});

// node_modules/@google-cloud/bigquery/build/src/logger.js
var require_logger = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/logger.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logger = logger;
    exports.setLogFunction = setLogFunction;
    var util = require_util2();
    var logFunction = null;
    function logger(source, msg, ...otherArgs) {
      if (logFunction) {
        const time = (/* @__PURE__ */ new Date()).toISOString();
        const formattedMsg = util.format(`D ${time} | ${source} | ${msg} |`, ...otherArgs);
        logFunction(formattedMsg);
      }
    }
    function setLogFunction(logger2) {
      logFunction = logger2;
    }
  }
});

// node_modules/@google-cloud/bigquery/build/src/job.js
var require_job = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/job.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Job = void 0;
    var common_1 = require_src10();
    var paginator_1 = require_src11();
    var promisify_1 = require_src12();
    var extend = require_extend();
    var bigquery_1 = require_bigquery();
    var logger_1 = require_logger();
    var Job = class extends common_1.Operation {
      constructor(bigQuery, id, options) {
        let location;
        const methods = {
          /**
           * @callback DeleteJobCallback
           * @param {?Error} err Request error, if any.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} DeleteJobResponse
           * @property {object} 0 The full API response.
           */
          /**
           * Delete the job.
           *
           * @see [Jobs: delete API Documentation]{@link https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/delete}
           *
           * @method Job#delete
           * @param {DeleteJobCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<DeleteJobResponse>}
           *
           * @example
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           *
           * const job = bigquery.job(jobId);
           * job.delete((err, apiResponse) => {
           *   if (!err) {
           *     // The job was deleted successfully.
           *   }
           * });
           *
           * @example If the callback is omitted a Promise will be returned
           * const [apiResponse] = await job.delete();
           */
          delete: {
            reqOpts: {
              method: "DELETE",
              uri: "/delete",
              qs: {
                get location() {
                  return location;
                }
              }
            }
          },
          /**
           * @callback JobExistsCallback
           * @param {?Error} err Request error, if any.
           * @param {boolean} exists Indicates if the job exists.
           */
          /**
           * @typedef {array} JobExistsResponse
           * @property {boolean} 0 Indicates if the job exists.
           */
          /**
           * Check if the job exists.
           *
           * @method Job#exists
           * @param {JobExistsCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {boolean} callback.exists Whether the job exists or not.
           * @returns {Promise<JobExistsResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           *
           * const job = bigquery.job('job-id');
           *
           * job.exists((err, exists) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * job.exists().then((data) => {
           *   const exists = data[0];
           * });
           * ```
           */
          exists: true,
          /**
           * @callback GetJobCallback
           * @param {?Error} err Request error, if any.
           * @param {Model} model The job.
           * @param {object} apiResponse The full API response body.
           */
          /**
           * @typedef {array} GetJobResponse
           * @property {Model} 0 The job.
           * @property {object} 1 The full API response body.
           */
          /**
           * Get a job if it exists.
           *
           * @method Job#get
           * @param {object} [options] Configuration object.
           * @param {string} [options.location] The geographic location of the job.
           *     Required except for US and EU.
           * @param {GetJobCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {Job} callback.job The job.
           * @returns {Promise<GetJobResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           *
           * const job = bigquery.job('job-id');
           *
           * job.get((err, job, apiResponse) => {
           *   if (!err) {
           *     // `job.metadata` has been populated.
           *   }
           * });
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * job.get().then((data) => {
           *   const job = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          get: true,
          /**
           * @callback GetJobMetadataCallback
           * @param {?Error} err Request error, if any.
           * @param {object} metadata The job metadata.
           * @param {object} apiResponse The full API response.
           */
          /**
           * @typedef {array} GetJobMetadataResponse
           * @property {object} 0 The job metadata.
           * @property {object} 1 The full API response.
           */
          /**
           * Get the metadata of the job. This will mostly be useful for checking
           * the status of a previously-run job.
           *
           * See {@link https://cloud.google.com/bigquery/docs/reference/v2/jobs/get| Jobs: get API Documentation}
           *
           * @method Job#getMetadata
           * @param {GetJobMetadataCallback} [callback] The callback function.
           * @param {?error} callback.err An error returned while making this
           *     request.
           * @param {object} callback.metadata The metadata of the job.
           * @param {object} callback.apiResponse The full API response.
           * @returns {Promise<GetJobMetadataResponse>}
           *
           * @example
           * ```
           * const {BigQuery} = require('@google-cloud/bigquery');
           * const bigquery = new BigQuery();
           *
           * const job = bigquery.job('id');
           * job.getMetadata((err, metadata, apiResponse) => {});
           *
           * //-
           * // If the callback is omitted, we'll return a Promise.
           * //-
           * job.getMetadata().then((data) => {
           *   const metadata = data[0];
           *   const apiResponse = data[1];
           * });
           * ```
           */
          getMetadata: {
            reqOpts: {
              qs: {
                get location() {
                  return location;
                }
              }
            }
          }
        };
        super({
          parent: bigQuery,
          baseUrl: "/jobs",
          id,
          methods
        });
        __publicField(this, "bigQuery");
        __publicField(this, "location");
        Object.defineProperty(this, "location", {
          get() {
            return location;
          },
          set(_location) {
            location = _location;
          }
        });
        this.bigQuery = bigQuery;
        if (options && options.location) {
          this.location = options.location;
        }
        if (options == null ? void 0 : options.projectId) {
          this.projectId = options.projectId;
        }
        this.getQueryResultsStream = paginator_1.paginator.streamify("getQueryResultsAsStream_");
      }
      getQueryResultsStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trace_(msg, ...otherArgs) {
        (0, logger_1.logger)(`[job][${this.id}]`, msg, ...otherArgs);
      }
      cancel(callback) {
        let qs;
        if (this.location) {
          qs = { location: this.location };
        }
        this.request({
          method: "POST",
          uri: "/cancel",
          qs
        }, callback);
      }
      getQueryResults(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const qs = extend({
          location: this.location,
          "formatOptions.useInt64Timestamp": true
        }, options);
        this.trace_("[getQueryResults]", this.id, options.pageToken, options.startIndex);
        const wrapIntegers = qs.wrapIntegers ? qs.wrapIntegers : false;
        delete qs.wrapIntegers;
        const parseJSON = qs.parseJSON ? qs.parseJSON : false;
        delete qs.parseJSON;
        delete qs.job;
        const timeoutOverride = typeof qs.timeoutMs === "number" ? qs.timeoutMs : false;
        const cachedRows = options._cachedRows;
        const cachedResponse = options._cachedResponse;
        delete options._cachedRows;
        delete options._cachedResponse;
        if (cachedRows) {
          let nextQuery = null;
          if (options.pageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: options.pageToken
            });
          }
          cachedResponse == null ? true : delete cachedResponse.rows;
          callback(null, cachedRows, nextQuery, cachedResponse);
          return;
        }
        this.bigQuery.request({
          uri: "/queries/" + this.id,
          qs
        }, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let rows = [];
          if (resp.schema && resp.rows) {
            rows = bigquery_1.BigQuery.mergeSchemaWithRows_(resp.schema, resp.rows, {
              wrapIntegers,
              parseJSON
            });
          }
          let nextQuery = null;
          if (resp.jobComplete === false) {
            nextQuery = Object.assign({}, options);
            if (timeoutOverride) {
              const err2 = new Error(`The query did not complete before ${timeoutOverride}ms`);
              callback(err2, null, nextQuery, resp);
              return;
            }
          } else if (resp.pageToken) {
            this.trace_("[getQueryResults] has more pages", resp.pageToken);
            nextQuery = Object.assign({}, options, {
              pageToken: resp.pageToken
            });
            delete nextQuery.startIndex;
          }
          delete resp.rows;
          callback(null, rows, nextQuery, resp);
        });
      }
      /**
       * This method will be called by `getQueryResultsStream()`. It is required to
       * properly set the `autoPaginate` option value.
       *
       * @private
       */
      getQueryResultsAsStream_(options, callback) {
        options = extend({ autoPaginate: false }, options);
        this.getQueryResults(options, callback);
      }
      /**
       * Poll for a status update. Execute the callback:
       *
       *   - callback(err): Job failed
       *   - callback(): Job incomplete
       *   - callback(null, metadata): Job complete
       *
       * @private
       *
       * @param {function} callback
       */
      poll_(callback) {
        void this.getMetadata((err, metadata) => {
          if (!err && metadata.status && metadata.status.errorResult) {
            err = new common_1.util.ApiError(metadata.status);
          }
          if (err) {
            callback(err);
            return;
          }
          if (metadata.status.state !== "DONE") {
            callback(null);
            return;
          }
          callback(null, metadata);
        });
      }
    };
    exports.Job = Job;
    paginator_1.paginator.extend(Job, ["getQueryResults"]);
    (0, promisify_1.promisifyAll)(Job);
  }
});

// node_modules/@google-cloud/bigquery/package.json
var require_package3 = __commonJS({
  "node_modules/@google-cloud/bigquery/package.json"(exports, module) {
    module.exports = {
      name: "@google-cloud/bigquery",
      description: "Google BigQuery Client Library for Node.js",
      version: "8.1.1",
      license: "Apache-2.0",
      author: "Google LLC",
      engines: {
        node: ">=18"
      },
      repository: "googleapis/nodejs-bigquery",
      main: "./build/src/index.js",
      types: "./build/src/index.d.ts",
      files: [
        "build/src",
        "!build/src/**/*.map"
      ],
      keywords: [
        "google apis client",
        "google api client",
        "google apis",
        "google api",
        "google",
        "google cloud platform",
        "google cloud",
        "cloud",
        "google bigquery",
        "bigquery"
      ],
      scripts: {
        prebenchmark: "npm run compile",
        benchmark: "node build/benchmark/bench.js benchmark/queries.json",
        docs: "jsdoc -c .jsdoc.js",
        lint: "gts check",
        "samples-test": "cd samples/ && npm link ../ && npm test && cd ../",
        test: "c8 mocha build/test",
        "system-test": "mocha build/system-test --timeout 600000",
        "presystem-test": "npm run compile",
        clean: "gts clean",
        compile: "tsc -p . && cp src/types.d.ts build/src/",
        fix: "gts fix",
        predocs: "npm run compile",
        prepare: "npm run compile",
        pretest: "npm run compile",
        "docs-test": "linkinator docs",
        "predocs-test": "npm run docs",
        types: "node scripts/gen-types.js",
        prelint: "cd samples; npm link ../; npm install",
        precompile: "gts clean"
      },
      dependencies: {
        "@google-cloud/common": "^6.0.0",
        "@google-cloud/paginator": "^6.0.0",
        "@google-cloud/precise-date": "^5.0.0",
        "@google-cloud/promisify": "^5.0.0",
        "teeny-request": "^10.0.0",
        arrify: "^3.0.0",
        "big.js": "^6.2.2",
        duplexify: "^4.1.3",
        extend: "^3.0.2",
        "stream-events": "^1.0.5"
      },
      overrides: {
        "@google-cloud/common": {
          "google-auth-library": "10.1.0"
        }
      },
      devDependencies: {
        "@google-cloud/storage": "^7.16.0",
        "@types/big.js": "^6.2.2",
        "@types/duplexify": "^3.6.4",
        "@types/extend": "^3.0.4",
        "@types/is": "^0.0.25",
        "@types/mocha": "^10.0.10",
        "@types/node": "^22.14.0",
        "@types/proxyquire": "^1.3.31",
        "@types/sinon": "^17.0.4",
        c8: "^10.1.3",
        codecov: "^3.8.3",
        "discovery-tsd": "^0.3.0",
        "eslint-plugin-prettier": "^5.2.6",
        gts: "^6.0.2",
        jsdoc: "^4.0.4",
        "jsdoc-fresh": "^3.0.0",
        "jsdoc-region-tag": "^3.0.0",
        linkinator: "^6.1.2",
        mocha: "^11.1.0",
        nise: "^6.1.1",
        "pack-n-play": "^3.0.1",
        "path-to-regexp": "^8.2.0",
        prettier: "^3.5.3",
        proxyquire: "^2.1.3",
        sinon: "^20.0.0",
        typescript: "^5.8.2"
      }
    };
  }
});

// node_modules/@google-cloud/bigquery/build/src/bigquery.js
var require_bigquery = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/bigquery.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BigQueryInt = exports.BigQueryTime = exports.BigQueryDatetime = exports.BigQueryTimestamp = exports.Geography = exports.BigQueryDate = exports.BigQueryRange = exports.BigQuery = exports.PROTOCOL_REGEX = exports.common = void 0;
    var common_1 = require_src10();
    var common = require_src10();
    exports.common = common;
    var paginator_1 = require_src11();
    var promisify_1 = require_src12();
    var precise_date_1 = require_src13();
    var util_1 = require_util5();
    var Big = require_big();
    var extend = require_extend();
    var crypto_1 = require_crypto();
    var dataset_1 = require_dataset();
    var job_1 = require_job();
    var table_1 = require_table();
    var logger_1 = require_logger();
    exports.PROTOCOL_REGEX = /^(\w*):\/\//;
    var _BigQuery = class _BigQuery extends common_1.Service {
      constructor(options = {}) {
        let universeDomain = "googleapis.com";
        const servicePath = "bigquery";
        if (options.universeDomain) {
          universeDomain = _BigQuery.sanitizeDomain(options.universeDomain);
        }
        const EMULATOR_HOST = process.env.BIGQUERY_EMULATOR_HOST;
        let apiEndpoint = `https://${servicePath}.${universeDomain}`;
        if (typeof EMULATOR_HOST === "string") {
          apiEndpoint = _BigQuery.sanitizeEndpoint(EMULATOR_HOST);
        }
        if (options.apiEndpoint) {
          apiEndpoint = _BigQuery.sanitizeEndpoint(options.apiEndpoint);
        }
        options = Object.assign({}, options, {
          apiEndpoint
        });
        const baseUrl = EMULATOR_HOST || `${options.apiEndpoint}/bigquery/v2`;
        const config = {
          apiEndpoint: options.apiEndpoint,
          baseUrl,
          scopes: ["https://www.googleapis.com/auth/bigquery"],
          packageJson: require_package3(),
          autoRetry: options.autoRetry,
          maxRetries: options.maxRetries,
          retryOptions: options.retryOptions
        };
        if (options.scopes) {
          config.scopes = config.scopes.concat(options.scopes);
        }
        super(config, options);
        __publicField(this, "location");
        __publicField(this, "_universeDomain");
        __publicField(this, "_defaultJobCreationMode");
        if (options.defaultJobCreationMode) {
          this._defaultJobCreationMode = options.defaultJobCreationMode;
        }
        this._universeDomain = universeDomain;
        this.location = options.location;
        this.createQueryStream = paginator_1.paginator.streamify("queryAsStream_");
        this.getDatasetsStream = paginator_1.paginator.streamify("getDatasets");
        this.getJobsStream = paginator_1.paginator.streamify("getJobs");
        this.interceptors.push({
          request: (reqOpts) => {
            return extend(true, {}, reqOpts, { qs: { prettyPrint: false } });
          }
        });
      }
      createQueryStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      getDatasetsStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      getJobsStream(options) {
        return new paginator_1.ResourceStream({}, () => {
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trace_(msg, ...otherArgs) {
        (0, logger_1.logger)("[bigquery]", msg, ...otherArgs);
      }
      get universeDomain() {
        return this._universeDomain;
      }
      static sanitizeEndpoint(url) {
        if (!exports.PROTOCOL_REGEX.test(url)) {
          url = `https://${url}`;
        }
        return this.sanitizeDomain(url);
      }
      static sanitizeDomain(url) {
        return url.replace(/\/+$/, "");
      }
      /**
       * Merge a rowset returned from the API with a table schema.
       *
       * @private
       *
       * @param {object} schema
       * @param {array} rows
       * @param {object} options
       * @param {boolean|IntegerTypeCastOptions} options.wrapIntegers Wrap values of
       *     'INT64' type in {@link BigQueryInt} objects.
       *     If a `boolean`, this will wrap values in {@link BigQueryInt} objects.
       *     If an `object`, this will return a value returned by
       *     `wrapIntegers.integerTypeCastFunction`.
       *     Please see {@link IntegerTypeCastOptions} for options descriptions.
       * @param {array} options.selectedFields List of fields to return.
       * If unspecified, all fields are returned.
       * @param {array} options.parseJSON parse a 'JSON' field into a JSON object.
       * @returns Fields using their matching names from the table's schema.
       */
      static mergeSchemaWithRows_(schema, rows, options) {
        let schemaFields = extend(true, [], schema == null ? void 0 : schema.fields);
        let selectedFields = extend(true, [], options.selectedFields);
        if (options.selectedFields && options.selectedFields.length > 0) {
          const selectedFieldsArray = options.selectedFields.map((c) => {
            return c.split(".");
          });
          const currentFields = selectedFieldsArray.map((c) => c.shift()).filter((c) => c !== void 0);
          schemaFields = schemaFields.filter((field) => currentFields.map((c) => c.toLowerCase()).indexOf(field.name.toLowerCase()) >= 0);
          selectedFields = selectedFieldsArray.filter((c) => c.length > 0).map((c) => c.join("."));
        }
        return (0, util_1.toArray)(rows).map(mergeSchema).map(flattenRows);
        function mergeSchema(row) {
          return row.f.map((field, index) => {
            const schemaField = schemaFields[index];
            let value = field.v;
            if (schemaField && schemaField.mode === "REPEATED") {
              value = value.map((val) => {
                return convertSchemaFieldValue(schemaField, val.v, {
                  ...options,
                  selectedFields
                });
              });
            } else {
              value = convertSchemaFieldValue(schemaField, value, {
                ...options,
                selectedFields
              });
            }
            const fieldObject = {};
            fieldObject[schemaField.name] = value;
            return fieldObject;
          });
        }
        function flattenRows(rows2) {
          return rows2.reduce((acc, row) => {
            const key = Object.keys(row)[0];
            acc[key] = row[key];
            return acc;
          }, {});
        }
      }
      /**
       * The `DATE` type represents a logical calendar date, independent of time
       * zone. It does not represent a specific 24-hour time period. Rather, a given
       * DATE value represents a different 24-hour period when interpreted in
       * different time zones, and may represent a shorter or longer day during
       * Daylight Savings Time transitions.
       *
       * @param {object|string} value The date. If a string, this should be in the
       *     format the API describes: `YYYY-[M]M-[D]D`.
       *     Otherwise, provide an object.
       * @param {string|number} value.year Four digits.
       * @param {string|number} value.month One or two digits.
       * @param {string|number} value.day One or two digits.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const date = bigquery.date('2017-01-01');
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const date2 = bigquery.date({
       *   year: 2017,
       *   month: 1,
       *   day: 1
       * });
       * ```
       */
      static date(value) {
        return new BigQueryDate(value);
      }
      /**
       * @param {object|string} value The date. If a string, this should be in the
       *     format the API describes: `YYYY-[M]M-[D]D`.
       *     Otherwise, provide an object.
       * @param {string|number} value.year Four digits.
       * @param {string|number} value.month One or two digits.
       * @param {string|number} value.day One or two digits.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const date = BigQuery.date('2017-01-01');
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const date2 = BigQuery.date({
       *   year: 2017,
       *   month: 1,
       *   day: 1
       * });
       * ```
       */
      date(value) {
        return _BigQuery.date(value);
      }
      /**
       * A `DATETIME` data type represents a point in time. Unlike a `TIMESTAMP`,
       * this does not refer to an absolute instance in time. Instead, it is the
       * civil time, or the time that a user would see on a watch or calendar.
       *
       * @method BigQuery.datetime
       * @param {object|string} value The time. If a string, this should be in the
       *     format the API describes: `YYYY-[M]M-[D]D[ [H]H:[M]M:[S]S[.DDDDDD]]`.
       *     Otherwise, provide an object.
       * @param {string|number} value.year Four digits.
       * @param {string|number} value.month One or two digits.
       * @param {string|number} value.day One or two digits.
       * @param {string|number} [value.hours] One or two digits (`00` - `23`).
       * @param {string|number} [value.minutes] One or two digits (`00` - `59`).
       * @param {string|number} [value.seconds] One or two digits (`00` - `59`).
       * @param {string|number} [value.fractional] Up to six digits for microsecond
       *     precision.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const datetime = BigQuery.datetime('2017-01-01 13:00:00');
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const datetime = BigQuery.datetime({
       *   year: 2017,
       *   month: 1,
       *   day: 1,
       *   hours: 14,
       *   minutes: 0,
       *   seconds: 0
       * });
       * ```
       */
      /**
       * A `DATETIME` data type represents a point in time. Unlike a `TIMESTAMP`,
       * this does not refer to an absolute instance in time. Instead, it is the
       * civil time, or the time that a user would see on a watch or calendar.
       *
       * @param {object|string} value The time. If a string, this should be in the
       *     format the API describes: `YYYY-[M]M-[D]D[ [H]H:[M]M:[S]S[.DDDDDD]]`.
       *     Otherwise, provide an object.
       * @param {string|number} value.year Four digits.
       * @param {string|number} value.month One or two digits.
       * @param {string|number} value.day One or two digits.
       * @param {string|number} [value.hours] One or two digits (`00` - `23`).
       * @param {string|number} [value.minutes] One or two digits (`00` - `59`).
       * @param {string|number} [value.seconds] One or two digits (`00` - `59`).
       * @param {string|number} [value.fractional] Up to six digits for microsecond
       *     precision.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const datetime = bigquery.datetime('2017-01-01 13:00:00');
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const datetime = bigquery.datetime({
       *   year: 2017,
       *   month: 1,
       *   day: 1,
       *   hours: 14,
       *   minutes: 0,
       *   seconds: 0
       * });
       * ```
       */
      static datetime(value) {
        return new BigQueryDatetime(value);
      }
      datetime(value) {
        return _BigQuery.datetime(value);
      }
      /**
       * A `TIME` data type represents a time, independent of a specific date.
       *
       * @method BigQuery.time
       * @param {object|string} value The time. If a string, this should be in the
       *     format the API describes: `[H]H:[M]M:[S]S[.DDDDDD]`. Otherwise, provide
       *     an object.
       * @param {string|number} [value.hours] One or two digits (`00` - `23`).
       * @param {string|number} [value.minutes] One or two digits (`00` - `59`).
       * @param {string|number} [value.seconds] One or two digits (`00` - `59`).
       * @param {string|number} [value.fractional] Up to six digits for microsecond
       *     precision.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const time = BigQuery.time('14:00:00'); // 2:00 PM
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const time = BigQuery.time({
       *   hours: 14,
       *   minutes: 0,
       *   seconds: 0
       * });
       * ```
       */
      /**
       * A `TIME` data type represents a time, independent of a specific date.
       *
       * @param {object|string} value The time. If a string, this should be in the
       *     format the API describes: `[H]H:[M]M:[S]S[.DDDDDD]`. Otherwise, provide
       *     an object.
       * @param {string|number} [value.hours] One or two digits (`00` - `23`).
       * @param {string|number} [value.minutes] One or two digits (`00` - `59`).
       * @param {string|number} [value.seconds] One or two digits (`00` - `59`).
       * @param {string|number} [value.fractional] Up to six digits for microsecond
       *     precision.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const time = bigquery.time('14:00:00'); // 2:00 PM
       *
       * //-
       * // Alternatively, provide an object.
       * //-
       * const time = bigquery.time({
       *   hours: 14,
       *   minutes: 0,
       *   seconds: 0
       * });
       * ```
       */
      static time(value) {
        return new BigQueryTime(value);
      }
      time(value) {
        return _BigQuery.time(value);
      }
      /**
       * A timestamp represents an absolute point in time, independent of any time
       * zone or convention such as Daylight Savings Time.
       *
       * The recommended input here is a `Date` or `PreciseDate` class.
       * If passing as a `string`, it should be Timestamp literals: https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#timestamp_literals.
       * When passing a `number` input, it should be epoch seconds in float representation.
       *
       * @method BigQuery.timestamp
       * @param {Date|string} value The time.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const timestamp = BigQuery.timestamp(new Date());
       * ```
       */
      static timestamp(value) {
        return new BigQueryTimestamp(value);
      }
      /**
       * A timestamp represents an absolute point in time, independent of any time
       * zone or convention such as Daylight Savings Time.
       *
       * The recommended input here is a `Date` or `PreciseDate` class.
       * If passing as a `string`, it should be Timestamp literals: https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#timestamp_literals.
       * When passing a `number` input, it should be epoch seconds in float representation.
       *
       * @param {Date|string|string|number} value The time.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const timestamp = bigquery.timestamp(new Date());
       * ```
       */
      timestamp(value) {
        return _BigQuery.timestamp(value);
      }
      /**
       * A range represents contiguous range between two dates, datetimes, or timestamps.
       * The lower and upper bound for the range are optional.
       * The lower bound is inclusive and the upper bound is exclusive.
       *
       * @method BigQuery.range
       * @param {string|BigQueryRangeOptions} value The range API string or start/end with dates/datetimes/timestamp ranges.
       * @param {string} elementType The range element type - DATE|DATETIME|TIMESTAMP
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const timestampRange = BigQuery.range('[2020-10-01 12:00:00+08, 2020-12-31 12:00:00+08)', 'TIMESTAMP');
       * ```
       */
      static range(value, elementType) {
        return new BigQueryRange(value, elementType);
      }
      /**
       * A range represents contiguous range between two dates, datetimes, or timestamps.
       * The lower and upper bound for the range are optional.
       * The lower bound is inclusive and the upper bound is exclusive.
       *
       * @param {string|BigQueryRangeOptions} value The range API string or start/end with dates/datetimes/timestamp ranges.
       * @param {string} elementType The range element type - DATE|DATETIME|TIMESTAMP
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const timestampRange = bigquery.range('[2020-10-01 12:00:00+08, 2020-12-31 12:00:00+08)', 'TIMESTAMP');
       * ```
       */
      range(value, elementType) {
        return _BigQuery.range(value, elementType);
      }
      /**
       * A BigQueryInt wraps 'INT64' values. Can be used to maintain precision.
       *
       * @param {string|number|IntegerTypeCastValue} value The INT64 value to convert.
       * @param {IntegerTypeCastOptions} typeCastOptions Configuration to convert
       *     value. Must provide an `integerTypeCastFunction` to handle conversion.
       * @returns {BigQueryInt}
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       *
       * const largeIntegerValue = Number.MAX_SAFE_INTEGER + 1;
       *
       * const options = {
       *   integerTypeCastFunction: value => value.split(),
       * };
       *
       * const bqInteger = bigquery.int(largeIntegerValue, options);
       *
       * const customValue = bqInteger.valueOf();
       * // customValue is the value returned from your `integerTypeCastFunction`.
       * ```
       */
      static int(value, typeCastOptions) {
        return new BigQueryInt(value, typeCastOptions);
      }
      int(value, typeCastOptions) {
        return _BigQuery.int(value, typeCastOptions);
      }
      /**
       * A geography value represents a surface area on the Earth
       * in Well-known Text (WKT) format.
       *
       * @param {string} value The geospatial data.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const geography = bigquery.geography('POINT(1, 2)');
       * ```
       */
      static geography(value) {
        return new Geography(value);
      }
      geography(value) {
        return _BigQuery.geography(value);
      }
      /**
       * Convert an INT64 value to Number.
       *
       * @private
       * @param {object} value The INT64 value to convert.
       */
      static decodeIntegerValue_(value) {
        const num = Number(value.integerValue);
        if (!Number.isSafeInteger(num)) {
          throw new Error("We attempted to return all of the numeric values, but " + (value.schemaFieldName ? value.schemaFieldName + " " : "") + "value " + value.integerValue + " is out of bounds of 'Number.MAX_SAFE_INTEGER'.\nTo prevent this error, please consider passing 'options.wrapIntegers' as\n{\n  integerTypeCastFunction: provide <your_custom_function>\n  fields: optionally specify field name(s) to be custom casted\n}\n");
        }
        return num;
      }
      /**
       * Return a value's provided type.
       *
       * @private
       *
       * @throws {error} If the type provided is invalid.
       *
       * See {@link https://cloud.google.com/bigquery/data-types| Data Type}
       *
       * @param {*} providedType The type.
       * @returns {string} The valid type provided.
       */
      static getTypeDescriptorFromProvidedType_(providedType) {
        const VALID_TYPES = [
          "DATE",
          "DATETIME",
          "TIME",
          "TIMESTAMP",
          "BYTES",
          "NUMERIC",
          "DECIMAL",
          "BIGNUMERIC",
          "BIGDECIMAL",
          "BOOL",
          "INT64",
          "INT",
          "SMALLINT",
          "INTEGER",
          "BIGINT",
          "TINYINT",
          "BYTEINT",
          "FLOAT64",
          "FLOAT",
          "STRING",
          "GEOGRAPHY",
          "ARRAY",
          "STRUCT",
          "JSON",
          "RANGE"
        ];
        if ((0, util_1.isArray)(providedType)) {
          providedType = providedType;
          return {
            type: "ARRAY",
            arrayType: _BigQuery.getTypeDescriptorFromProvidedType_(providedType[0])
          };
        } else if ((0, util_1.isObject)(providedType)) {
          return {
            type: "STRUCT",
            structTypes: Object.keys(providedType).map((prop) => {
              return {
                name: prop,
                type: _BigQuery.getTypeDescriptorFromProvidedType_(providedType[prop])
              };
            })
          };
        }
        providedType = providedType.toUpperCase();
        if (!VALID_TYPES.includes(providedType)) {
          throw new Error(`Invalid type provided: "${providedType}"`);
        }
        return { type: providedType.toUpperCase() };
      }
      /**
       * Detect a value's type.
       *
       * @private
       *
       * @throws {error} If the type could not be detected.
       *
       * See {@link https://cloud.google.com/bigquery/data-types| Data Type}
       *
       * @param {*} value The value.
       * @returns {string} The type detected from the value.
       */
      static getTypeDescriptorFromValue_(value) {
        let typeName;
        if (value === null) {
          throw new Error("Parameter types must be provided for null values via the 'types' field in query options.");
        }
        if (value instanceof BigQueryDate) {
          typeName = "DATE";
        } else if (value instanceof BigQueryDatetime) {
          typeName = "DATETIME";
        } else if (value instanceof BigQueryTime) {
          typeName = "TIME";
        } else if (value instanceof BigQueryTimestamp) {
          typeName = "TIMESTAMP";
        } else if (value instanceof Buffer) {
          typeName = "BYTES";
        } else if (value instanceof Big) {
          if (value.c.length - value.e >= 10) {
            typeName = "BIGNUMERIC";
          } else {
            typeName = "NUMERIC";
          }
        } else if (value instanceof BigQueryInt) {
          typeName = "INT64";
        } else if (value instanceof Geography) {
          typeName = "GEOGRAPHY";
        } else if (value instanceof BigQueryRange) {
          return {
            type: "RANGE",
            rangeElementType: {
              type: value.elementType
            }
          };
        } else if ((0, util_1.isArray)(value)) {
          if (value.length === 0) {
            throw new Error("Parameter types must be provided for empty arrays via the 'types' field in query options.");
          }
          return {
            type: "ARRAY",
            arrayType: _BigQuery.getTypeDescriptorFromValue_(value[0])
          };
        } else if ((0, util_1.isBoolean)(value)) {
          typeName = "BOOL";
        } else if ((0, util_1.isNumber)(value)) {
          typeName = value % 1 === 0 ? "INT64" : "FLOAT64";
        } else if ((0, util_1.isObject)(value)) {
          return {
            type: "STRUCT",
            structTypes: Object.keys(value).map((prop) => {
              return {
                name: prop,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: _BigQuery.getTypeDescriptorFromValue_(value[prop])
              };
            })
          };
        } else if ((0, util_1.isString)(value)) {
          typeName = "STRING";
        }
        if (!typeName) {
          throw new Error([
            "This value could not be translated to a BigQuery data type.",
            value
          ].join("\n"));
        }
        return {
          type: typeName
        };
      }
      /**
       * Convert a value into a `queryParameter` object.
       *
       * @private
       *
       * See {@link https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query#request-body| Jobs.query API Reference Docs (see `queryParameters`)}
       *
       * @param {*} value The value.
       * @param {string|ProvidedTypeStruct|ProvidedTypeArray} providedType Provided
       *     query parameter type.
       * @returns {object} A properly-formed `queryParameter` object.
       */
      static valueToQueryParameter_(value, providedType) {
        var _a, _b;
        if ((0, util_1.isDate)(value)) {
          value = _BigQuery.timestamp(value);
        }
        let parameterType;
        if (providedType) {
          parameterType = _BigQuery.getTypeDescriptorFromProvidedType_(providedType);
        } else {
          parameterType = _BigQuery.getTypeDescriptorFromValue_(value);
        }
        const queryParameter = { parameterType, parameterValue: {} };
        const typeName = queryParameter.parameterType.type;
        if (typeName === "ARRAY") {
          queryParameter.parameterValue.arrayValues = value.map((itemValue) => {
            const value2 = _BigQuery._getValue(itemValue, parameterType.arrayType);
            if ((0, util_1.isObject)(value2) || (0, util_1.isArray)(value2)) {
              if ((0, util_1.isArray)(providedType)) {
                providedType = providedType;
                return _BigQuery.valueToQueryParameter_(value2, providedType[0]).parameterValue;
              } else {
                return _BigQuery.valueToQueryParameter_(value2).parameterValue;
              }
            }
            return { value: value2 };
          });
        } else if (typeName === "STRUCT") {
          queryParameter.parameterValue.structValues = Object.keys(value).reduce((structValues, prop) => {
            let nestedQueryParameter;
            if (providedType) {
              nestedQueryParameter = _BigQuery.valueToQueryParameter_(value[prop], providedType[prop]);
            } else {
              nestedQueryParameter = _BigQuery.valueToQueryParameter_(value[prop]);
            }
            structValues[prop] = nestedQueryParameter.parameterValue;
            return structValues;
          }, {});
        } else if (typeName === "RANGE") {
          let rangeValue;
          if (value instanceof BigQueryRange) {
            rangeValue = value;
          } else {
            rangeValue = _BigQuery.range(value, (_b = (_a = queryParameter.parameterType) == null ? void 0 : _a.rangeElementType) == null ? void 0 : _b.type);
          }
          queryParameter.parameterValue.rangeValue = {
            start: {
              value: rangeValue.value.start
            },
            end: {
              value: rangeValue.value.end
            }
          };
        } else if (typeName === "JSON" && (0, util_1.isObject)(value)) {
          queryParameter.parameterValue.value = JSON.stringify(value);
        } else {
          queryParameter.parameterValue.value = _BigQuery._getValue(value, parameterType);
        }
        return queryParameter;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static _getValue(value, type) {
        if (value === null) {
          return null;
        }
        if (value.type)
          type = value;
        return _BigQuery._isCustomType(type) ? value.value : value;
      }
      static _isCustomType({ type }) {
        return type.indexOf("TIME") > -1 || type.indexOf("DATE") > -1 || type.indexOf("GEOGRAPHY") > -1 || type.indexOf("RANGE") > -1 || type.indexOf("BigQueryInt") > -1;
      }
      createDataset(id, optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const reqOpts = {
          method: "POST",
          uri: "/datasets",
          json: extend(true, {
            location: this.location
          }, options, {
            datasetReference: {
              datasetId: id
            }
          })
        };
        if (options.projectId) {
          reqOpts.projectId = options.projectId;
        }
        this.request(reqOpts, (err, resp) => {
          if (err) {
            callback(err, null, resp);
            return;
          }
          const dataset = this.dataset(id, options);
          dataset.metadata = resp;
          callback(null, dataset, resp);
        });
      }
      createQueryJob(opts, callback) {
        const options = typeof opts === "object" ? opts : { query: opts };
        this.trace_("[createQueryJob]", options, callback);
        if ((!options || !options.query) && !options.pageToken) {
          throw new Error("A SQL query string is required.");
        }
        const query = extend(true, {
          useLegacySql: false
        }, options);
        this.trace_("[createQueryJob]", query);
        if (options.destination) {
          if (!(options.destination instanceof table_1.Table)) {
            throw new Error("Destination must be a Table object.");
          }
          query.destinationTable = {
            datasetId: options.destination.dataset.id,
            projectId: options.destination.dataset.projectId,
            tableId: options.destination.id
          };
          delete query.destination;
        }
        if (query.params) {
          const { parameterMode, params } = this.buildQueryParams_(query.params, query.types);
          query.parameterMode = parameterMode;
          query.queryParameters = params;
          delete query.params;
        }
        const reqOpts = {};
        reqOpts.configuration = {
          query
        };
        if (typeof query.jobTimeoutMs === "number") {
          reqOpts.configuration.jobTimeoutMs = query.jobTimeoutMs.toString();
          delete query.jobTimeoutMs;
        }
        if (query.dryRun) {
          reqOpts.configuration.dryRun = query.dryRun;
          delete query.dryRun;
        }
        if (query.labels) {
          reqOpts.configuration.labels = query.labels;
          delete query.labels;
        }
        if (query.jobPrefix) {
          reqOpts.jobPrefix = query.jobPrefix;
          delete query.jobPrefix;
        }
        if (query.location) {
          reqOpts.location = query.location;
          delete query.location;
        }
        if (query.jobId) {
          reqOpts.jobId = query.jobId;
          delete query.jobId;
        }
        if (query.reservation) {
          reqOpts.configuration.reservation = query.reservation;
          delete query.reservation;
        }
        this.createJob(reqOpts, callback);
      }
      buildQueryParams_(params, types) {
        if (!params) {
          return {
            parameterMode: void 0,
            params: void 0
          };
        }
        const parameterMode = (0, util_1.isArray)(params) ? "positional" : "named";
        const queryParameters = [];
        if (parameterMode === "named") {
          const namedParams = params;
          for (const namedParameter of Object.getOwnPropertyNames(namedParams)) {
            const value = namedParams[namedParameter];
            let queryParameter;
            if (types) {
              if (!(0, util_1.isObject)(types)) {
                throw new Error("Provided types must match the value type passed to `params`");
              }
              const namedTypes = types;
              if (namedTypes[namedParameter]) {
                queryParameter = _BigQuery.valueToQueryParameter_(value, namedTypes[namedParameter]);
              } else {
                queryParameter = _BigQuery.valueToQueryParameter_(value);
              }
            } else {
              queryParameter = _BigQuery.valueToQueryParameter_(value);
            }
            queryParameter.name = namedParameter;
            queryParameters.push(queryParameter);
          }
        } else {
          if (types) {
            if (!(0, util_1.isArray)(types)) {
              throw new Error("Provided types must match the value type passed to `params`");
            }
            const positionalTypes = types;
            if (params.length !== types.length) {
              throw new Error("Incorrect number of parameter types provided.");
            }
            params.forEach((value, i) => {
              const queryParameter = _BigQuery.valueToQueryParameter_(value, positionalTypes[i]);
              queryParameters.push(queryParameter);
            });
          } else {
            params.forEach((value) => {
              const queryParameter = _BigQuery.valueToQueryParameter_(value);
              queryParameters.push(queryParameter);
            });
          }
        }
        return {
          parameterMode,
          params: queryParameters
        };
      }
      createJob(options, callback) {
        var _a;
        const JOB_ID_PROVIDED = typeof options.jobId !== "undefined";
        const DRY_RUN = ((_a = options.configuration) == null ? void 0 : _a.dryRun) ? options.configuration.dryRun : false;
        const reqOpts = Object.assign({}, options);
        let jobId = JOB_ID_PROVIDED ? reqOpts.jobId : (0, crypto_1.randomUUID)();
        if (reqOpts.jobId) {
          delete reqOpts.jobId;
        }
        if (reqOpts.jobPrefix) {
          jobId = reqOpts.jobPrefix + jobId;
          delete reqOpts.jobPrefix;
        }
        reqOpts.jobReference = {
          projectId: this.projectId,
          jobId,
          location: this.location
        };
        if (reqOpts.location) {
          reqOpts.jobReference.location = reqOpts.location;
          delete reqOpts.location;
        }
        if (reqOpts.configuration && reqOpts.reservation) {
          reqOpts.configuration.reservation = reqOpts.reservation;
          delete reqOpts.reservation;
        }
        const job = this.job(jobId, {
          location: reqOpts.jobReference.location
        });
        this.request({
          method: "POST",
          uri: "/jobs",
          json: reqOpts
        }, async (err, resp) => {
          const ALREADY_EXISTS_CODE = 409;
          if (err) {
            if (err.code === ALREADY_EXISTS_CODE && !JOB_ID_PROVIDED && !DRY_RUN) {
              err = null;
              [resp] = await job.getMetadata();
            } else {
              callback(err, null, resp);
              return;
            }
          }
          if (resp.status.errors) {
            err = new common_1.util.ApiError({
              errors: resp.status.errors,
              response: resp
            });
          }
          job.location = resp.jobReference.location;
          job.metadata = resp;
          callback(err, job, resp);
        });
      }
      /**
       * Create a reference to a dataset.
       *
       * @param {string} id ID of the dataset.
       * @param {object} [options] Dataset options.
       * @param {string} [options.projectId] The GCP project ID.
       * @param {string} [options.location] The geographic location of the dataset.
       *      Required except for US and EU.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       * const dataset = bigquery.dataset('higher_education');
       * ```
       */
      dataset(id, options) {
        if (typeof id !== "string") {
          throw new TypeError("A dataset ID is required.");
        }
        if (this.location) {
          options = extend({ location: this.location }, options);
        }
        return new dataset_1.Dataset(this, id, options);
      }
      getDatasets(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        const reqOpts = {
          uri: "/datasets",
          qs: options
        };
        if (options.projectId) {
          reqOpts.projectId = options.projectId;
        }
        this.request(reqOpts, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.nextPageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: resp.nextPageToken
            });
          }
          const datasets = (resp.datasets || []).map((dataset) => {
            const dsOpts = {
              location: dataset.location
            };
            if (options.projectId) {
              dsOpts.projectId = options.projectId;
            }
            const ds = this.dataset(dataset.datasetReference.datasetId, dsOpts);
            ds.metadata = dataset;
            return ds;
          });
          callback(null, datasets, nextQuery, resp);
        });
      }
      getJobs(optionsOrCallback, cb) {
        const options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        this.request({
          uri: "/jobs",
          qs: options,
          useQuerystring: true
        }, (err, resp) => {
          if (err) {
            callback(err, null, null, resp);
            return;
          }
          let nextQuery = null;
          if (resp.nextPageToken) {
            nextQuery = Object.assign({}, options, {
              pageToken: resp.nextPageToken
            });
          }
          const jobs = (resp.jobs || []).map((jobObject) => {
            const job = this.job(jobObject.jobReference.jobId, {
              location: jobObject.jobReference.location
            });
            job.metadata = jobObject;
            return job;
          });
          callback(null, jobs, nextQuery, resp);
        });
      }
      /**
       * Create a reference to an existing job.
       *
       * @param {string} id ID of the job.
       * @param {object} [options] Configuration object.
       * @param {string} [options.location] The geographic location of the job.
       *      Required except for US and EU.
       *
       * @example
       * ```
       * const {BigQuery} = require('@google-cloud/bigquery');
       * const bigquery = new BigQuery();
       *
       * const myExistingJob = bigquery.job('job-id');
       * ```
       */
      job(id, options) {
        if (this.location) {
          options = extend({ location: this.location }, options);
        }
        return new job_1.Job(this, id, options);
      }
      query(query, optionsOrCallback, cb) {
        let options = typeof optionsOrCallback === "object" ? optionsOrCallback : {};
        const queryOpts = typeof query === "object" ? {
          wrapIntegers: query.wrapIntegers,
          parseJSON: query.parseJSON
        } : {};
        const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : cb;
        this.trace_("[query]", query, options);
        const queryReq = this.buildQueryRequest_(query, options);
        this.trace_("[query] queryReq", queryReq);
        if (!queryReq) {
          this.createQueryJob(query, (err, job, resp) => {
            if (err) {
              callback(err, null, resp);
              return;
            }
            if (typeof query === "object" && query.dryRun) {
              callback(null, [], resp);
              return;
            }
            options = extend({ job }, queryOpts, options);
            job.getQueryResults(options, callback);
          });
          return;
        }
        void this.runJobsQuery(queryReq, (err, job, res) => {
          this.trace_("[runJobsQuery callback]: ", query, err, job, res);
          if (err) {
            callback(err, null, job);
            return;
          }
          options = extend({ job }, queryOpts, options);
          if (res && res.jobComplete) {
            let rows = [];
            if (res.schema && res.rows) {
              rows = _BigQuery.mergeSchemaWithRows_(res.schema, res.rows, {
                wrapIntegers: options.wrapIntegers || false,
                parseJSON: options.parseJSON
              });
              delete res.rows;
            }
            this.trace_("[runJobsQuery] job complete");
            options._cachedRows = rows;
            options._cachedResponse = res;
            if (res.pageToken) {
              this.trace_("[runJobsQuery] has more pages");
              options.pageToken = res.pageToken;
            } else {
              this.trace_("[runJobsQuery] no more pages");
            }
            job.getQueryResults(options, callback);
            return;
          }
          if (queryReq.timeoutMs) {
            const err2 = new Error(`The query did not complete before ${queryReq.timeoutMs}ms`);
            callback(err2, null, job);
            return;
          }
          delete options.timeoutMs;
          this.trace_("[runJobsQuery] job not complete");
          job.getQueryResults(options, callback);
        });
      }
      /**
       * Check if the given Query can run using the `jobs.query` endpoint.
       * Returns a bigquery.IQueryRequest that can be used to call `jobs.query`.
       * Return undefined if is not possible to convert to a bigquery.IQueryRequest.
       *
       * @param query string | Query
       * @param options QueryOptions
       * @returns bigquery.IQueryRequest | undefined
       */
      buildQueryRequest_(query, options) {
        if (process.env.FAST_QUERY_PATH === "DISABLED") {
          return void 0;
        }
        const queryObj = typeof query === "string" ? {
          query
        } : query;
        this.trace_("[buildQueryRequest]", query, options, queryObj);
        if (!!queryObj.destination || !!queryObj.tableDefinitions || !!queryObj.createDisposition || !!queryObj.writeDisposition || !!queryObj.priority && queryObj.priority !== "INTERACTIVE" || queryObj.useLegacySql || !!queryObj.maximumBillingTier || !!queryObj.timePartitioning || !!queryObj.rangePartitioning || !!queryObj.clustering || !!queryObj.destinationEncryptionConfiguration || !!queryObj.schemaUpdateOptions || !!queryObj.jobTimeoutMs || // User has defined the jobID generation behavior
        !!queryObj.jobId) {
          return void 0;
        }
        if (queryObj.dryRun) {
          return void 0;
        }
        if (options.job) {
          return void 0;
        }
        const req = {
          useQueryCache: queryObj.useQueryCache,
          labels: queryObj.labels,
          defaultDataset: queryObj.defaultDataset,
          createSession: queryObj.createSession,
          maximumBytesBilled: queryObj.maximumBytesBilled,
          timeoutMs: options.timeoutMs,
          location: queryObj.location || options.location,
          formatOptions: {
            useInt64Timestamp: true
          },
          maxResults: queryObj.maxResults || options.maxResults,
          query: queryObj.query,
          useLegacySql: false,
          requestId: (0, crypto_1.randomUUID)(),
          jobCreationMode: this._defaultJobCreationMode,
          reservation: queryObj.reservation,
          continuous: queryObj.continuous,
          destinationEncryptionConfiguration: queryObj.destinationEncryptionConfiguration,
          writeIncrementalResults: queryObj.writeIncrementalResults,
          connectionProperties: queryObj.connectionProperties,
          preserveNulls: queryObj.preserveNulls
        };
        if (queryObj.jobCreationMode) {
          req.jobCreationMode = queryObj.jobCreationMode;
        }
        const { parameterMode, params } = this.buildQueryParams_(queryObj.params, queryObj.types);
        if (params) {
          req.queryParameters = params;
        }
        if (parameterMode) {
          req.parameterMode = parameterMode;
        }
        return req;
      }
      runJobsQuery(req, callback) {
        this.trace_("[runJobsQuery]", req, callback);
        this.request({
          method: "POST",
          uri: "/queries",
          json: req
        }, async (err, res) => {
          this.trace_("jobs.query res:", res, err);
          if (err) {
            callback(err, null, res);
            return;
          }
          let job = null;
          if (res.jobReference) {
            const jobRef = res.jobReference;
            job = this.job(jobRef.jobId, {
              location: jobRef.location
            });
          } else if (res.queryId) {
            job = this.job(res.queryId);
          }
          callback(null, job, res);
        });
      }
      /**
       * This method will be called by `createQueryStream()`. It is required to
       * properly set the `autoPaginate` option value.
       *
       * @private
       */
      queryAsStream_(query, callback) {
        if (query.job) {
          query.job.getQueryResults(query, callback);
          return;
        }
        const { location, maxResults, pageToken, wrapIntegers, parseJSON } = query;
        const opts = {
          location,
          maxResults,
          pageToken,
          wrapIntegers,
          parseJSON,
          autoPaginate: false
        };
        delete query.location;
        delete query.maxResults;
        delete query.pageToken;
        delete query.wrapIntegers;
        delete query.parseJSON;
        this.query(query, opts, callback);
      }
    };
    __publicField(_BigQuery, "setLogFunction", logger_1.setLogFunction);
    var BigQuery = _BigQuery;
    exports.BigQuery = BigQuery;
    paginator_1.paginator.extend(BigQuery, ["getDatasets", "getJobs"]);
    (0, promisify_1.promisifyAll)(BigQuery, {
      exclude: [
        "dataset",
        "date",
        "datetime",
        "geography",
        "int",
        "job",
        "time",
        "timestamp",
        "range"
      ]
    });
    function convertSchemaFieldValue(schemaField, value, options) {
      if (value === null) {
        return value;
      }
      switch (schemaField.type) {
        case "BOOLEAN":
        case "BOOL": {
          value = value.toLowerCase() === "true";
          break;
        }
        case "BYTES": {
          value = Buffer.from(value, "base64");
          break;
        }
        case "FLOAT":
        case "FLOAT64": {
          value = Number(value);
          break;
        }
        case "INTEGER":
        case "INT64": {
          const { wrapIntegers } = options;
          value = wrapIntegers ? typeof wrapIntegers === "object" ? BigQuery.int({ integerValue: value, schemaFieldName: schemaField.name }, wrapIntegers).valueOf() : BigQuery.int(value) : Number(value);
          break;
        }
        case "NUMERIC": {
          value = new Big(value);
          break;
        }
        case "BIGNUMERIC": {
          value = new Big(value);
          break;
        }
        case "RECORD": {
          value = BigQuery.mergeSchemaWithRows_(schemaField, value, options).pop();
          break;
        }
        case "DATE": {
          value = BigQuery.date(value);
          break;
        }
        case "DATETIME": {
          value = BigQuery.datetime(value);
          break;
        }
        case "TIME": {
          value = BigQuery.time(value);
          break;
        }
        case "TIMESTAMP": {
          const pd = new precise_date_1.PreciseDate();
          pd.setFullTime(precise_date_1.PreciseDate.parseFull(BigInt(value) * BigInt(1e3)));
          value = BigQuery.timestamp(pd);
          break;
        }
        case "GEOGRAPHY": {
          value = BigQuery.geography(value);
          break;
        }
        case "JSON": {
          const { parseJSON } = options;
          value = parseJSON ? JSON.parse(value) : value;
          break;
        }
        case "RANGE": {
          value = BigQueryRange.fromSchemaValue_(value, schemaField.rangeElementType.type);
          break;
        }
        default:
          break;
      }
      return value;
    }
    var BigQueryRange = class _BigQueryRange {
      constructor(value, elementType) {
        __publicField(this, "elementType");
        __publicField(this, "start");
        __publicField(this, "end");
        if (typeof value === "string") {
          if (!elementType) {
            throw new Error("invalid RANGE. Element type required when using RANGE API string.");
          }
          const [start, end] = _BigQueryRange.fromStringValue_(value);
          this.start = this.convertElement_(start, elementType);
          this.end = this.convertElement_(end, elementType);
          this.elementType = elementType;
        } else {
          const { start, end } = value;
          if (start && end) {
            if (typeof start !== typeof end) {
              throw Error("upper and lower bound on a RANGE should be of the same type.");
            }
          }
          const inferredType = {
            BigQueryDate: "DATE",
            BigQueryDatetime: "DATETIME",
            BigQueryTimestamp: "TIMESTAMP"
          }[(start || end || Object).constructor.name] || elementType;
          this.start = this.convertElement_(start, inferredType);
          this.end = this.convertElement_(end, inferredType);
          this.elementType = inferredType;
        }
      }
      /*
       * Get Range string representation used by the BigQuery API.
       */
      get apiValue() {
        return `[${this.start ? this.start.value : "UNBOUNDED"}, ${this.end ? this.end.value : "UNBOUNDED"})`;
      }
      /*
       * Get Range literal representation accordingly to
       * https://cloud.google.com/bigquery/docs/reference/standard-sql/lexical#range_literals
       */
      get literalValue() {
        return `RANGE<${this.elementType}> ${this.apiValue}`;
      }
      get value() {
        return {
          start: this.start ? this.start.value : "UNBOUNDED",
          end: this.end ? this.end.value : "UNBOUNDED"
        };
      }
      static fromStringValue_(value) {
        let cleanedValue = value;
        if (cleanedValue.startsWith("[") || cleanedValue.startsWith("(")) {
          cleanedValue = cleanedValue.substring(1);
        }
        if (cleanedValue.endsWith(")") || cleanedValue.endsWith("]")) {
          cleanedValue = cleanedValue.substring(0, cleanedValue.length - 1);
        }
        const parts = cleanedValue.split(",");
        if (parts.length !== 2) {
          throw new Error("invalid RANGE. See RANGE literal format docs for more information.");
        }
        const [start, end] = parts.map((s) => s.trim());
        return [start, end];
      }
      static fromSchemaValue_(value, elementType) {
        const [start, end] = _BigQueryRange.fromStringValue_(value);
        const convertRangeSchemaValue = (value2) => {
          if (value2 === "UNBOUNDED" || value2 === "NULL") {
            return null;
          }
          return convertSchemaFieldValue({ type: elementType }, value2, {
            wrapIntegers: false
          });
        };
        return BigQuery.range({
          start: convertRangeSchemaValue(start),
          end: convertRangeSchemaValue(end)
        }, elementType);
      }
      convertElement_(value, elementType) {
        if (typeof value === "string") {
          if (value === "UNBOUNDED" || value === "NULL") {
            return void 0;
          }
          switch (elementType) {
            case "DATE":
              return new BigQueryDate(value);
            case "DATETIME":
              return new BigQueryDatetime(value);
            case "TIMESTAMP":
              return new BigQueryTimestamp(value);
          }
          return void 0;
        }
        return value;
      }
    };
    exports.BigQueryRange = BigQueryRange;
    var BigQueryDate = class {
      constructor(value) {
        __publicField(this, "value");
        if (typeof value === "object") {
          value = BigQuery.datetime(value).value;
        }
        this.value = value;
      }
    };
    exports.BigQueryDate = BigQueryDate;
    var Geography = class {
      constructor(value) {
        __publicField(this, "value");
        this.value = value;
      }
    };
    exports.Geography = Geography;
    var BigQueryTimestamp = class {
      constructor(value) {
        __publicField(this, "value");
        let pd;
        if (value instanceof precise_date_1.PreciseDate) {
          pd = value;
        } else if (value instanceof Date) {
          pd = new precise_date_1.PreciseDate(value);
        } else if (typeof value === "string") {
          if (/^\d{4}-\d{1,2}-\d{1,2}/.test(value)) {
            pd = new precise_date_1.PreciseDate(value);
          } else {
            const floatValue = Number.parseFloat(value);
            if (!Number.isNaN(floatValue)) {
              pd = this.fromFloatValue_(floatValue);
            } else {
              pd = new precise_date_1.PreciseDate(value);
            }
          }
        } else {
          pd = this.fromFloatValue_(value);
        }
        if (pd.getMicroseconds() > 0) {
          this.value = pd.toISOString();
        } else {
          this.value = new Date(pd.getTime()).toJSON();
        }
      }
      fromFloatValue_(value) {
        const secs = Math.trunc(value);
        const micros = Math.trunc((value - secs) * 1e6 + 0.5);
        const pd = new precise_date_1.PreciseDate([secs, micros * 1e3]);
        return pd;
      }
    };
    exports.BigQueryTimestamp = BigQueryTimestamp;
    var BigQueryDatetime = class {
      constructor(value) {
        __publicField(this, "value");
        if (typeof value === "object") {
          let time;
          if (value.hours) {
            time = BigQuery.time(value).value;
          }
          const y = value.year;
          const m = value.month;
          const d = value.day;
          time = time ? " " + time : "";
          value = `${y}-${m}-${d}${time}`;
        } else {
          value = value.replace(/^(.*)T(.*)Z$/, "$1 $2");
        }
        this.value = value;
      }
    };
    exports.BigQueryDatetime = BigQueryDatetime;
    var BigQueryTime = class {
      constructor(value) {
        __publicField(this, "value");
        if (typeof value === "object") {
          const h = value.hours;
          const m = value.minutes || 0;
          const s = value.seconds || 0;
          const f = value.fractional !== void 0 ? "." + value.fractional : "";
          value = `${h}:${m}:${s}${f}`;
        }
        this.value = value;
      }
    };
    exports.BigQueryTime = BigQueryTime;
    var BigQueryInt = class extends Number {
      constructor(value, typeCastOptions) {
        super(typeof value === "object" ? value.integerValue : value);
        __publicField(this, "type");
        __publicField(this, "value");
        __publicField(this, "typeCastFunction");
        __publicField(this, "_schemaFieldName");
        this._schemaFieldName = typeof value === "object" ? value.schemaFieldName : void 0;
        this.value = typeof value === "object" ? value.integerValue.toString() : value.toString();
        this.type = "BigQueryInt";
        if (typeCastOptions) {
          if (typeof typeCastOptions.integerTypeCastFunction !== "function") {
            throw new Error("integerTypeCastFunction is not a function or was not provided.");
          }
          const typeCastFields = typeCastOptions.fields ? (0, util_1.toArray)(typeCastOptions.fields) : void 0;
          let customCast = true;
          if (typeCastFields) {
            customCast = this._schemaFieldName ? typeCastFields.includes(this._schemaFieldName) ? true : false : false;
          }
          customCast && (this.typeCastFunction = typeCastOptions.integerTypeCastFunction);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valueOf() {
        const shouldCustomCast = this.typeCastFunction ? true : false;
        if (shouldCustomCast) {
          try {
            return this.typeCastFunction(this.value);
          } catch (error) {
            if (error instanceof Error) {
              error.message = `integerTypeCastFunction threw an error:

  - ${error.message}`;
            }
            throw error;
          }
        } else {
          return BigQuery.decodeIntegerValue_({
            integerValue: this.value,
            schemaFieldName: this._schemaFieldName
          });
        }
      }
      toJSON() {
        return { type: this.type, value: this.value };
      }
    };
    exports.BigQueryInt = BigQueryInt;
  }
});

// node_modules/@google-cloud/bigquery/build/src/index.js
var require_src14 = __commonJS({
  "node_modules/@google-cloud/bigquery/build/src/index.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Table = exports.RowQueue = exports.RowBatch = exports.Routine = exports.Model = exports.Job = exports.Dataset = exports.PROTOCOL_REGEX = exports.Geography = exports.common = exports.BigQueryTimestamp = exports.BigQueryTime = exports.BigQueryInt = exports.BigQueryDatetime = exports.BigQueryDate = exports.BigQuery = void 0;
    var bigquery_1 = require_bigquery();
    Object.defineProperty(exports, "BigQuery", { enumerable: true, get: function() {
      return bigquery_1.BigQuery;
    } });
    Object.defineProperty(exports, "BigQueryDate", { enumerable: true, get: function() {
      return bigquery_1.BigQueryDate;
    } });
    Object.defineProperty(exports, "BigQueryDatetime", { enumerable: true, get: function() {
      return bigquery_1.BigQueryDatetime;
    } });
    Object.defineProperty(exports, "BigQueryInt", { enumerable: true, get: function() {
      return bigquery_1.BigQueryInt;
    } });
    Object.defineProperty(exports, "BigQueryTime", { enumerable: true, get: function() {
      return bigquery_1.BigQueryTime;
    } });
    Object.defineProperty(exports, "BigQueryTimestamp", { enumerable: true, get: function() {
      return bigquery_1.BigQueryTimestamp;
    } });
    Object.defineProperty(exports, "common", { enumerable: true, get: function() {
      return bigquery_1.common;
    } });
    Object.defineProperty(exports, "Geography", { enumerable: true, get: function() {
      return bigquery_1.Geography;
    } });
    Object.defineProperty(exports, "PROTOCOL_REGEX", { enumerable: true, get: function() {
      return bigquery_1.PROTOCOL_REGEX;
    } });
    var dataset_1 = require_dataset();
    Object.defineProperty(exports, "Dataset", { enumerable: true, get: function() {
      return dataset_1.Dataset;
    } });
    var job_1 = require_job();
    Object.defineProperty(exports, "Job", { enumerable: true, get: function() {
      return job_1.Job;
    } });
    var model_1 = require_model();
    Object.defineProperty(exports, "Model", { enumerable: true, get: function() {
      return model_1.Model;
    } });
    var routine_1 = require_routine();
    Object.defineProperty(exports, "Routine", { enumerable: true, get: function() {
      return routine_1.Routine;
    } });
    var rowBatch_1 = require_rowBatch();
    Object.defineProperty(exports, "RowBatch", { enumerable: true, get: function() {
      return rowBatch_1.RowBatch;
    } });
    var rowQueue_1 = require_rowQueue();
    Object.defineProperty(exports, "RowQueue", { enumerable: true, get: function() {
      return rowQueue_1.RowQueue;
    } });
    var table_1 = require_table();
    Object.defineProperty(exports, "Table", { enumerable: true, get: function() {
      return table_1.Table;
    } });
  }
});
export default require_src14();
/*! Bundled license information:

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)

gtoken/build/cjs/src/index.cjs:
  (*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE *)

teeny-request/build/src/agents.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

teeny-request/build/src/TeenyStatistics.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

teeny-request/build/src/index.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google-cloud/common/build/src/service.js:
  (*!
   * @module common/service
   *)

@google-cloud/common/build/src/util.js:
  (*!
   * @module common/util
   *)

@google-cloud/common/build/src/service-object.js:
  (*!
   * @module common/service-object
   *)

@google-cloud/common/build/src/operation.js:
  (*!
   * @module common/operation
   *)

@google-cloud/paginator/build/src/resource-stream.js:
  (*!
   * Copyright 2019 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google-cloud/paginator/build/src/index.js:
  (*!
   * Copyright 2015 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*!
   * @module common/paginator
   *)
  (*! Developer Documentation
   *
   * paginator is used to auto-paginate `nextQuery` methods as well as
   * streamifying them.
   *
   * Before:
   *
   *   search.query('done=true', function(err, results, nextQuery) {
   *     search.query(nextQuery, function(err, results, nextQuery) {});
   *   });
   *
   * After:
   *
   *   search.query('done=true', function(err, results) {});
   *
   * Methods to extend should be written to accept callbacks and return a
   * `nextQuery`.
   *)

@google-cloud/precise-date/build/src/index.js:
  (*!
   * Copyright 2019 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google-cloud/bigquery/build/src/rowBatch.js:
  (*!
   * Copyright 2022 Google LLC. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google-cloud/bigquery/build/src/rowQueue.js:
  (*!
   * Copyright 2022 Google LLC. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@google-cloud/bigquery/build/src/table.js:
  (*!
   * Copyright 2014 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*! Developer Documentation
   *
   * These methods can be auto-paginated.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/model.js:
  (*!
   * Copyright 2019 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/routine.js:
  (*!
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/dataset.js:
  (*!
   * Copyright 2014 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*! Developer Documentation
   *
   * These methods can be auto-paginated.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/logger.js:
  (*! The external function used to emit logs. *)

@google-cloud/bigquery/build/src/job.js:
  (*!
   * Copyright 2014 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*!
   * @module bigquery/job
   *)
  (*! Developer Documentation
   *
   * These methods can be auto-paginated.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/bigquery.js:
  (*!
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (*! Developer Documentation
   *
   * These methods can be auto-paginated.
   *)
  (*! Developer Documentation
   *
   * All async methods (except for streams) will return a Promise in the event
   * that a callback is omitted.
   *)

@google-cloud/bigquery/build/src/index.js:
  (*!
   * Copyright 2019 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
//# sourceMappingURL=@google-cloud_bigquery.js.map
