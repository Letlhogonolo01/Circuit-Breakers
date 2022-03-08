// circuit-breaker/CircuitBreaker.ts

import { BreakerOptions } from "./BreakerOptions";
import { BreakerStates } from "./BreakerStates";
import { AxiosRequestConfig } from "axios";

const axios = require("axios");

export class CircuitBreaker {
    private request:AxiosRequestConfig;
    private state: BreakerStates;
    
    private failureCount:number;
    private successCount:number;

    private nexAttempt:number;

    //Options
    private failureThreshold:number;
    private successThreshold:number;
    private timeout:number;


    constructor(request: AxiosRequestConfig, options?: BreakerOptions) {

        this.request      =request;
        this.state        =BreakerStates.GREEN;

        this.failureCount =0;
        this.successCount =0;
        this.nexAttempt   =Date.now();

        if ( options ) {
            this.failureThreshold   =options.failureThreshold;
            this.successThreshold   =options.sucessThreshold;
            this.timeout            =options.timeut
        } else {
            //Define defaults
            this.failureThreshold  =3;
            this.successThreshold  =2;
            this.timeout           =3500;
        }
    }

    private log(result:string): void {
        console.table({
            Result: result,
            Timestamp: Date.now(),
            Successes: this.successCount,
            Failures: this.failureCount,
            State: this.state
        });
    }

    public async exec(): Promise<void> {
        if ( this.state ===BreakerStates.RED ) {

            if ( this.nexAttempt <= Date.now() ) {
                this.state = BreakerStates.YELLOW;
            } else {
                throw new Error( "Circuit suspended. You shall not pass." );
            }
        }

        try {
            const response = await axios( this.request );

            if ( response.status == 200 ) {
                return this.success( response.data );
            } else {
                return this.failure( response.data );
            }
        }catch( err ) {
            return this.failure( err.message )
        }
    }

    private success(res: any): any {

        this.failureCount = 0;

        if ( this.state === BreakerStates.YELLOW ) {
            this.successCount++;

            if ( this.successCount > this.successThreshold ) {
                this.successCount = 0;
                this.state = BreakerStates.GREEN;
            }
        }

        this.log( "Success" );

        return res;

    }

    private failure(res: any): any {

        this.failureCount++;

        if ( this.failureCount >= this.failureThreshold ) {
            this.state = BreakerStates.RED;

            this.nexAttempt = Date.now() + this.timeout;
        }

        this.log( "Failure" );

        return res;
    }
}
