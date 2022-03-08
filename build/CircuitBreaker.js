"use strict";
// circuit-breaker/CircuitBreaker.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
const BreakerStates_1 = require("./BreakerStates");
const axios = require("axios");
class CircuitBreaker {
    constructor(request, options) {
        this.request = request;
        this.state = BreakerStates_1.BreakerStates.GREEN;
        this.failureCount = 0;
        this.successCount = 0;
        this.nexAttempt = Date.now();
        if (options) {
            this.failureThreshold = options.failureThreshold;
            this.successThreshold = options.sucessThreshold;
            this.timeout = options.timeut;
        }
        else {
            //Define defaults
            this.failureThreshold = 3;
            this.successThreshold = 2;
            this.timeout = 3500;
        }
    }
    log(result) {
        console.table({
            Result: result,
            Timestamp: Date.now(),
            Successes: this.successCount,
            Failures: this.failureCount,
            State: this.state
        });
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state === BreakerStates_1.BreakerStates.RED) {
                if (this.nexAttempt <= Date.now()) {
                    this.state = BreakerStates_1.BreakerStates.YELLOW;
                }
                else {
                    throw new Error("Circuit suspended. You shall not pass.");
                }
            }
            try {
                const response = yield axios(this.request);
                if (response.status == 200) {
                    return this.success(response.data);
                }
                else {
                    return this.failure(response.data);
                }
            }
            catch (err) {
                return this.failure(err.message);
            }
        });
    }
    success(res) {
        this.failureCount = 0;
        if (this.state === BreakerStates_1.BreakerStates.YELLOW) {
            this.successCount++;
            if (this.successCount > this.successThreshold) {
                this.successCount = 0;
                this.state = BreakerStates_1.BreakerStates.GREEN;
            }
        }
        this.log("Success");
        return res;
    }
    failure(res) {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = BreakerStates_1.BreakerStates.RED;
            this.nexAttempt = Date.now() + this.timeout;
        }
        this.log("Failure");
        return res;
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map