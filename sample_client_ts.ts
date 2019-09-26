import {
   OPCUAClient,
   MessageSecurityMode, SecurityPolicy,
   AttributeIds,
   makeBrowsePath,
   ClientSubscription,
   TimestampsToReturn,
   MonitoringParametersOptions,
   ReadValueIdLike,
   ClientMonitoredItem,
   DataValue,
   resolveNodeId,
   UserNameIdentityToken
} from "node-opcua";


const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1
}

const options = {
    applicationName: "MyClient",
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpoint_must_exist: false,
};

const client = OPCUAClient.create(options);
// const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
const endpointUrl = "opc.tcp://127.0.0.1:4840";


// const userNameIdentityToken = new UserNameIdentityToken({
//     policyId: "",
//     userName: "Sania",
//     password: "",//encode("sani1234"), //this is not working
//     encryptionAlgorithm: ""
// });

async function main() {
    try {
        // step 1 : connect to
            await client.connect(endpointUrl);
            console.log("connected !");
    
        // step 2 : createSession
            const session = await client.createSession();
            console.log("session created !");
    
        // step 3 : browse
            const browseResult = await session.browse("RootFolder");
        
            console.log("references of RootFolder :");
            for(const reference of browseResult.references) {
                console.log( "   -> ", reference.browseName.toString());
            }

         // step 4 : read a variable with readVariableValue
            const dataValue2 = await session.readVariableValue("ns=6;s=::AsGlobalPV:PositionZ"); //NS6|String|::LEDControl:PositionX
            console.log(" value = " , dataValue2.toString()); 

        // step 4' : read a variable with read
            const maxAge = 0;
            const nodeToRead = {
            nodeId: "ns=6;s=::AsGlobalPV:PositionZ",
            attributeId: AttributeIds.Value
            };
            const dataValue =  await session.read(nodeToRead, maxAge);
            console.log(" value " , dataValue.value.toString());

         // step 5: install a subscription and install a monitored item for 10 seconds
        const subscription = ClientSubscription.create(session, {
            requestedPublishingInterval: 2000,
            requestedLifetimeCount:      2000,
            requestedMaxKeepAliveCount:   6000,
            maxNotificationsPerPublish:  1000,
            publishingEnabled: true,
            priority: 1
        });

        subscription.on("started", function() {
            console.log("subscription started for 2 seconds - subscriptionId=", subscription.subscriptionId);
        }).on("keepalive", function() {
            console.log("keepalive");
        }).on("terminated", function() {
            console.log("terminated");
        });

        await newFunction();

        console.log("nodeId: " + resolveNodeId("ns=6;s=::AsGlobalPV:PositionZ"));


         // install monitored item
    
        const itemToMonitor: ReadValueIdLike = {
            nodeId: "ns=6;s=::AsGlobalPV:PositionZ",
            attributeId: 13
        };
        const parameters: MonitoringParametersOptions = {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
        };
        
        const monitoredItem  = ClientMonitoredItem.create(
            subscription,
            itemToMonitor,
            parameters,
            TimestampsToReturn.Both
        );
        
        monitoredItem.on("changed", (dataValue: DataValue) => {
        console.log(" value has changed : ", dataValue.value.toString());
        });
        
        console.log("now terminating subscription");
        await subscription.terminate();

        // close session
            await session.close();
    
        // disconnecting
            await client.disconnect();
            console.log("done !");
    } catch(err) {
    console.log("An error has occured : ",err);
    }

    async function newFunction() {
        async function timeout(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await timeout(10000);
    }
}
    main();
