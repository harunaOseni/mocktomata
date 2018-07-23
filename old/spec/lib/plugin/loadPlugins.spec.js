"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var assertron_1 = __importDefault(require("assertron"));
var __1 = require("..");
var store_1 = require("../store");
var test_util_1 = require("../test-util");
beforeEach(function () {
    store_1.resetStore();
});
/**
 * Plugin order is reversed so that most specific plugin are checked first.
 */
test('load plugins in reverse order', function () { return __awaiter(_this, void 0, void 0, function () {
    var io, actual;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/plugin-fixture-dummy', test_util_1.dummyPluginModule);
                io.addPluginModule('@komondor-lab/plugin-fixture-deep-link/pluginA', test_util_1.pluginModuleA);
                return [4 /*yield*/, __1.loadPlugins({ io: io })];
            case 1:
                _a.sent();
                actual = store_1.store.get().plugins;
                assertron_1.default.satisfies(actual.map(function (p) { return p.name; }), ['@komondor-lab/plugin-fixture-deep-link/pluginA/plugin-a', '@komondor-lab/plugin-fixture-dummy']);
                return [2 /*return*/];
        }
    });
}); });
test('Not existing plugin throws PluginNotFound', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('not-exist', undefined);
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.PluginNotFound)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('registering plugin with the same name throws PluginAlreadyLoaded', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/plugin-fixture-dummy', test_util_1.dummyPluginModule);
                return [4 /*yield*/, __1.loadPlugins({ io: io })];
            case 1:
                _a.sent();
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.DuplicatePlugin)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('plugin without activate function throws', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/no-activate', test_util_1.noActivatePluginModule);
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.NoActivate)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('plugin missing support method throws', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/no-support', test_util_1.missSupportPluginModule);
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.PluginNotConforming)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('plugin missing getSpy method throws', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/no-getspy', test_util_1.missGetSpyPluginModule);
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.PluginNotConforming)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
test('plugin missing getStub method throws', function () { return __awaiter(_this, void 0, void 0, function () {
    var io;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                io = test_util_1.createTestIO();
                io.addPluginModule('@komondor-lab/no-getstub', test_util_1.missGetStubPluginModule);
                return [4 /*yield*/, assertron_1.default.throws(function () { return __1.loadPlugins({ io: io }); }, __1.PluginNotConforming)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=loadPlugins.spec.js.map