import {Container} from 'inversify';
import {HttpClient} from './core/http-service/implementation/http-client-adapters/http-client';
import {HttpClientCordovaAdapter} from './core/http-service/implementation/http-client-adapters/http-client-cordova-adapter';
import {HttpClientBrowserAdapter} from './core/http-service/implementation/http-client-adapters/http-client-browser-adapter';
import {CsHttpService} from './core/http-service/interface/cs-http-service';
import {HttpServiceImpl} from './core/http-service/implementation/http-service-impl';
import {ClassRoomServiceImpl} from './services/class-room/implementation/class-room-service-impl';
import {ScClassRoomService} from './services/class-room/interface';

export const CsInjectionTokens = {
    CONTAINER: Symbol.for('CONTAINER'),
    core: {
        HTTP_ADAPTER: Symbol.for('HTTP_ADAPTER'),
        global: {
            headers: {
                CHANNEL_ID: Symbol.for('CHANNEL_ID'),
                PRODUCER_ID: Symbol.for('PRODUCER_ID'),
                DEVICE_ID: Symbol.for('DEVICE_ID'),
            }
        },
        api: {
            HOST: Symbol.for('HOST'),
            authentication: {
                USER_TOKEN: Symbol.for('USER_TOKEN'),
                BEARER_TOKEN: Symbol.for('BEARER_TOKEN'),
            }
        },
        HTTP_SERVICE: Symbol.for('HTTP_SERVICE'),
    },
    services: {
        CLASS_ROOM_SERVICE: Symbol.for('CLASS_ROOM_SERVICE')
    }
};

export interface CsConfig {
    core: {
        httpAdapter: 'HttpClientBrowserAdapter' | 'HttpClientCordovaAdapter';
        api: {
            host: string;
            authentication: {
                userToken: string;
                bearerToken: string;
            };
        };
    };
}

class CsModule {
    private static _instance?: CsModule;

    public static get instance(): CsModule {
        if (!CsModule._instance) {
            CsModule._instance = new CsModule();
        }

        return CsModule._instance;
    }

    private _container: Container;

    private _isInitialised = false;

    get isInitialised(): boolean {
        return this._isInitialised;
    }

    get classRoomService(): ScClassRoomService {
        return this._container.get<ScClassRoomService>(CsInjectionTokens.services.CLASS_ROOM_SERVICE);
    }

    public async init(config: CsConfig) {
        this._container.bind<Container>(CsInjectionTokens.CONTAINER).toConstantValue(this._container = new Container());

        if (config.core.httpAdapter === 'HttpClientCordovaAdapter') {
            this._container.bind<HttpClient>(CsInjectionTokens.core.api.authentication.BEARER_TOKEN)
                .to(HttpClientCordovaAdapter).inRequestScope();
        } else {
            this._container.bind<HttpClient>(CsInjectionTokens.core.api.authentication.BEARER_TOKEN)
                .to(HttpClientBrowserAdapter).inRequestScope();
        }

        console.assert(!!config.core.api.authentication.bearerToken);
        this._container.bind<string>(CsInjectionTokens.core.api.authentication.BEARER_TOKEN)
            .toConstantValue(config.core.api.authentication.bearerToken);
        console.assert(!!config.core.api.authentication.userToken);
        this._container.bind<string>(CsInjectionTokens.core.api.authentication.USER_TOKEN)
            .toConstantValue(config.core.api.authentication.userToken);

        this._container.bind<CsHttpService>(CsInjectionTokens.core.HTTP_SERVICE)
            .to(HttpServiceImpl).inRequestScope();

        this._container.bind<ScClassRoomService>(CsInjectionTokens.services.CLASS_ROOM_SERVICE)
            .to(ClassRoomServiceImpl).inRequestScope();

        this._isInitialised = true;
    }
}
