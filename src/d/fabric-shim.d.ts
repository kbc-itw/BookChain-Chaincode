declare module 'fabric-shim' {

    import 'node';
    import EventEmitter = require('events');
    import {Logger} from 'log4js';
    import * as protobuf from "protobufjs";

    class Shim {

        /**
         * Call this method to start the chaincode process. After constructing a chaincode object,
         * pass the object to this function which will initiate a request to register the chaincode
         * with the target peer. The address of the target peer must be provided via a program
         * argument <code>--peer.address</code>
         * @param chaincode User-provided object that must implement the <code>ChaincodeInterface</code>
         */
        static start(chaincode: Shim.ChaincodeInterface): void;

        /**
         * Returns a standard response object with status code 200 and an optional payload
         * @param  payload Can be any content the chaincode wish to return to the client
         */
        static success(payload?: Buffer | void): Shim.Response;

        /**
         * Returns a standard response object with status code 200 and an optional payload
         * @param msg A message describing the error
         */
        static error(msg: Buffer): Shim.Response;

        /**
         * Returns a log4js logger named after <code>name</code>
         * @param name Logger name used to label log messages produced by the returned logger
         * @returns log4js based logger. See log4js documentation for usage details
         */
        static newLogger(name: string): Logger;

    }

    interface X509Certificate {
        subject: {
            countryName: string,
            postalCode: string,
            stateOrProvinceName: string,
            localityName: string,
            streetAddress: string,
            organizationName: string,
            organizationalUnitName: string,
            commonName: string
        };
        issuer: {
            countryName: string,
            stateOrProvinceName: string,
            localityName: string,
            organizationName: string,
            commonName: string
        };
        notBefore: Date;
        notAfter: Date;
        altNames: string[];
        signatureAlgorithm: string;
        fingerPrint: string;
        publicKey: {
            algorithm: string;
            e: string;
            n: string;
        };
    }

    namespace Shim {

        /**
         * Chaincodes must implement the methods in this interface. The Init() method is called during
         * chaincode <code>instantiation</code> or <code>upgrade</code> to preform any necessary intitialization
         * of the application state. Invoke() is called by <code>invoke transaction</code> or <code>query</code>
         * requests. Both methods are provided with a [stub]{@link ChaincodeStub} object that can be used to
         * discover information on the request (invoking identity, target channel, arguments, etc.) as well as
         * talking with the peer to retrieve or update application state.
         */
        export interface ChaincodeInterface {

            /**
             * Called during chaincode instantiate and upgrade. This method can be used
             * to initialize asset states
             * @async
             * @param stub The chaincode stub is implemented by the <code>fabric-shim</code>
             * library and passed to the ChaincodeInterface calls by the Hyperledger Fabric platform. The stub
             * encapsulates the APIs between the chaincode implementation and the Fabric peer
             */
            Init(stub: ChaincodeStub): Promise<Response>;

            /**
             * called throughout the life time of the chaincode to carry out business
             * transaction logic and effect the asset states
             * @async
             * @param stub The chaincode stub is implemented by the <code>fabric-shim</code>
             * library and passed to the ChaincodeInterface calls by the Hyperledger Fabric platform. The stub
             * encapsulates the APIs between the chaincode implementation and the Fabric peer
             */
            Invoke(stub: ChaincodeStub): Promise<Shim.Response>;

        }

        export namespace Chaincode {
            export interface CustomMethod {
                (stub: ChaincodeStub, args: string[], thisClass?: ChaincodeInterface): Promise<Buffer | undefined>;
            }
        }

        /**
         * ClientIdentity represents information about the identity that submitted the
         * transaction. Chaincodes can use this class to obtain information about the submitting
         * identity including a unique ID, the MSP (Membership Service Provider) ID, and attributes.
         * Such information is useful in enforcing access control by the chaincode.
         *
         * @example
         * <caption>Check if the submitter is an auditor</caption>
         * const ClientIdentity = require('fabric-shim').ClientIdentity;
         *
         * let cid = new ClientIdentity(stub); // "stub" is the ChaincodeStub object passed to Init() and Invoke() methods
         * if (cid.assertAttributeValue('hf.role', 'auditor')) {
         *    // proceed to carry out auditing
         * }
         *
         */
        export class ClientIdentity {

            /**
             * Returns a new instance of ClientIdentity
             * @param stub This is the stub object passed to Init() and Invoke() methods
             */
            constructor(stub: ChaincodeStub);

            /**
             * getID returns the ID associated with the invoking identity.  This ID
             * is guaranteed to be unique within the MSP.
             * @returns A string in the format: "x509::{subject DN}::{issuer DN}"
             */
            getID(): string;

            /**
             * Returns the MSP ID of the invoking identity.
             */
            getMSPID(): string;

            /**
             * getAttributeValue returns the value of the client's attribute named `attrName`.
             * If the invoking identity possesses the attribute, returns the value of the attribute.
             * If the invoking identity does not possess the attribute, returns null.
             * @param attrName Name of the attribute to retrieve the value from the
             *     identity's credentials (such as x.509 certificate for PKI-based MSPs).
             * @returns Value of the attribute or null if the invoking identity
             *     does not possess the attribute.
             */
            getAttributeValue(attrName: string): string | null;

            /**
             * assertAttributeValue verifies that the invoking identity has the attribute named `attrName`
             * with a value of `attrValue`.
             * @param attrName Name of the attribute to retrieve the value from the
             *     identity's credentials (such as x.509 certificate for PKI-based MSPs)
             * @param attrValue Expected value of the attribute
             * @returns True if the invoking identity possesses the attribute and the attribute
             *     value matches the expected value. Otherwise, returns false.
             */
            assertAttributeValue(attrName: string, attrValue: string): boolean;

            /**
             * getX509Certificate returns the X509 certificate associated with the invoking identity,
             * or null if it was not identified by an X509 certificate, for instance if the MSP is
             * implemented with an alternative to PKI such as [Identity Mixer]{@link https://jira.hyperledger.org/browse/FAB-5673}.
             */
            getX509Certificate(): X509Certificate | null;

        }

        /**
         * The ChaincodeStub is implemented by the <code>fabric-shim</code>
         * library and passed to the {@link ChaincodeInterface} calls by the Hyperledger Fabric platform.
         * The stub encapsulates the APIs between the chaincode implementation and the Fabric peer
         */
        class ChaincodeStub {

            constructor(client?: ChaincodeSupportClient, channel_id?: string, txId?: string, chaincodeInput?: ChaincodeInput, signedProposal?: SignedProposal);

            /**
             * Returns the arguments as array of strings from the chaincode invocation request.
             * Equivalent to [getStringArgs()]{@link ChaincodeStub#getStringArgs}
             */
            getArgs(): string[];

            /**
             * Returns the arguments as array of strings from the chaincode invocation request
             */
            getStringArgs(): string[];

            /**
             * Returns an object containing the chaincode function name to invoke, and the array
             * of arguments to pass to the target function
             */
            getFunctionAndParameters(): FunctionAndParameters;

            /**
             * Returns the transaction ID for the current chaincode invocation request. The transaction
             * ID uniquely identifies the transaction within the scope of the channel.
             */
            getTxID(): string;

            /**
             * Returns the identity object of the chaincode invocation's submitter
             */
            getCreator(): ProposalCreator;

            /**
             * Returns the transient map that can be used by the chaincode but not
             * saved in the ledger, such as cryptographic information for encryption and decryption
             */
            getTransient(): Map<string, Buffer>;

            /**  Returns a fully decoded object of the signed transaction proposal */
            getSignedProposal(): SignedProposal;

            /**
             * Returns the timestamp when the transaction was created. This
             * is taken from the transaction {@link ChannelHeader}, therefore it will indicate the
             * client's timestamp, and will have the same value across all endorsers.
             */
            getTxTimeStamp(): protobuf.common.ITimestamp;

            /**
             * Returns a HEX-encoded string of SHA256 hash of the transaction's nonce, creator and epoch concatenated, as a
             * unique representation of the specific transaction. This value can be used to prevent replay attacks in chaincodes
             * that need to authenticate an identity independent of the transaction's submitter. In a chaincode proposal, the
             * submitter will have been authenticated by the peer such that the identity returned by
             * [stub.getCreator()]{@link ChaincodeStub#getCreator} can be trusted. But in some scenarios, the chaincode needs
             * to authenticate an identity independent of the proposal submitter.<br><br>
             *
             * For example, Alice is the administrator who installs and instantiates a chaincode that manages assets. During
             * instantiate Alice assigns the initial owner of the asset to Bob. The chaincode has a function called <code>
             * transfer()</code> that moves the asset to another identity by changing the asset's "owner" property to the
             * identity receiving the asset. Naturally only Bob, the current owner, is supposed to be able to call that function.
             * While the chaincode can rely on stub.getCreator() to check the submitter's identity and compare that with the
             * current owner, sometimes it's not always possible for the asset owner itself to submit the transaction. Let's suppose
             * Bob hires a broker agency to handle his trades. The agency participates in the blockchain network and carry out trades
             * on behalf of Bob. The chaincode must have a way to authenticate the transaction to ensure it has Bob's authorization
             * to do the asset transfer. This can be achieved by asking Bob to sign the message, so that the chaincode can use
             * Bob's certificate, which was obtained during the chaincode instantiate, to verify the signature and thus ensure
             * the trade was authorized by Bob.<br><br>
             *
             * Now, to prevent Bob's signature from being re-used in a malicious attack, we want to ensure the signature is unique.
             * This is where the <code>binding</code> concept comes in. As explained above, the binding string uniquely represents
             * the transaction where the trade proposal and Bob's authorization is submitted in. As long as Bob's signature is over
             * the proposal payload and the binding string concatenated together, namely <code>sigma=Sign(BobSigningKey, tx.Payload||tx.Binding)</code>,
             * it's guaranteed to be unique and can not be re-used in a different transaction for exploitation.<br><br>
             *
             * @returns A HEX-encoded string of SHA256 hash of the transaction's nonce, creator and epoch concatenated
             */
            getBinding(): string;

            /**
             * Retrieves the current value of the state variable <code>key</code>
             * @async
             * @param key State variable key to retrieve from the state store
             * @returns Promise for the current value of the state variable
             */
            getState(key: string): Promise<Buffer>;

            /**
             * Writes the state variable <code>key</code> of value <code>value</code>
             * to the state store. If the variable already exists, the value will be
             * overwritten.
             * @async
             * @param key State variable key to set the value for
             * @param value State variable value
             * @returns Promise will be resolved when the peer has successfully handled the state update request
             * or rejected if any errors
             */
            putState(key: string, value: Buffer): Promise<void>;

            /**
             * Deletes the state variable <code>key</code> from the state store.
             * @async
             * @param key State variable key to delete from the state store
             * @returns Promise will be resolved when the peer has successfully handled the state delete request
             * or rejected if any errors
             */
            deleteState(key: string): Promise<void>;

            /**
             * Returns a range iterator over a set of keys in the
             * ledger. The iterator can be used to iterate over all keys
             * between the startKey (inclusive) and endKey (exclusive).
             * The keys are returned by the iterator in lexical order. Note
             * that startKey and endKey can be empty string, which implies unbounded range
             * query on start or end.<br><br>
             * Call close() on the returned {@link StateQueryIterator} object when done.
             * The query is re-executed during validation phase to ensure result set
             * has not changed since transaction endorsement (phantom reads detected).
             * @async
             * @param startKey State variable key as the start of the key range (inclusive)
             * @param endKey State variable key as the end of the key range (exclusive)
             * @returns Promise for a {@link StateQueryIterator} object
             */
            getStateByRange(startKey: string, endKey: string): Promise<StateQueryIterator>;

            /**
             * Performs a "rich" query against a state database. It is
             * only supported for state databases that support rich query,
             * e.g. CouchDB. The query string is in the native syntax
             * of the underlying state database. An {@link StateQueryIterator} is returned
             * which can be used to iterate (next) over the query result set.<br><br>
             * The query is NOT re-executed during validation phase, phantom reads are
             * not detected. That is, other committed transactions may have added,
             * updated, or removed keys that impact the result set, and this would not
             * be detected at validation/commit time.  Applications susceptible to this
             * should therefore not use GetQueryResult as part of transactions that update
             * ledger, and should limit use to read-only chaincode operations.
             * @async
             * @param query Query string native to the underlying state database
             * @returns Promise for a {@link StateQueryIterator} object
             */
            getQueryResult(query: string): Promise<StateQueryIterator>;

            /**
             * Returns a history of key values across time.
             * For each historic key update, the historic value and associated
             * transaction id and timestamp are returned. The timestamp is the
             * timestamp provided by the client in the proposal header.
             * This method requires peer configuration
             * <code>core.ledger.history.enableHistoryDatabase</code> to be true.<br><br>
             * The query is NOT re-executed during validation phase, phantom reads are
             * not detected. That is, other committed transactions may have updated
             * the key concurrently, impacting the result set, and this would not be
             * detected at validation/commit time. Applications susceptible to this
             * should therefore not use GetHistoryForKey as part of transactions that
             * update ledger, and should limit use to read-only chaincode operations.
             * @async
             * @param key The state variable key
             * @returns Promise for a {@link HistoryQueryIterator} object
             */
            getHistoryForKey(key: string): Promise<HistoryQueryIterator>;

            /**
             * Locally calls the specified chaincode <code>invoke()</code> using the
             * same transaction context; that is, chaincode calling chaincode doesn't
             * create a new transaction message.<br><br>
             * If the called chaincode is on the same channel, it simply adds the called
             * chaincode read set and write set to the calling transaction.<br><br>
             * If the called chaincode is on a different channel,
             * only the Response is returned to the calling chaincode; any PutState calls
             * from the called chaincode will not have any effect on the ledger; that is,
             * the called chaincode on a different channel will not have its read set
             * and write set applied to the transaction. Only the calling chaincode's
             * read set and write set will be applied to the transaction. Effectively
             * the called chaincode on a different channel is a `Query`, which does not
             * participate in state validation checks in subsequent commit phase.<br><br>
             * If `channel` is empty, the caller's channel is assumed.
             * @async
             * @param chaincodeName Name of the chaincode to call
             * @param args List of arguments to pass to the called chaincode
             * @param channel Name of the channel where the target chaincode is active
             * @returns Promise for a {@link Response} object returned by the called chaincode
             */
            invokeChaincode(chaincodeName: string, args: Buffer[], channel: string): Promise<Response>;

            /**
             * Allows the chaincode to propose an event on the transaction proposal. When the transaction
             * is included in a block and the block is successfully committed to the ledger, the block event
             * will be delivered to the current event listeners that have been registered with the peer's
             * event producer. Note that the block event gets delivered to the listeners regardless of the
             * status of the included transactions (can be either valid or invalid), so client applications
             * are responsible for checking the validity code on each transaction. Consult each SDK's documentation
             * for details.
             * @param name Name of the event
             * @param payload A payload can be used to include data about the event
             */
            setEvent(name: string, payload: Buffer): void;

            /**
             * Creates a composite key by combining the objectType string and the given `attributes` to form a composite
             * key. The objectType and attributes are expected to have only valid utf8 strings and should not contain
             * U+0000 (nil byte) and U+10FFFF (biggest and unallocated code point). The resulting composite key can be
             * used as the key in [putState()]{@link ChaincodeStub#putState}.<br><br>
             *
             * Hyperledger Fabric uses a simple key/value model for saving chaincode states. In some use case scenarios,
             * it is necessary to keep track of multiple attributes. Furthermore, it may be necessary to make the various
             * attributes searchable. Composite keys can be used to address these requirements. Similar to using composite
             * keys in a relational database table, here you would treat the searchable attributes as key columns that
             * make up the composite key. Values for the attributes become part of the key, thus they are searchable with
             * functions like [getStateByRange()]{@link ChaincodeStub#getStateByRange} and
             * [getStateByPartialCompositeKey()]{@link ChaincodeStub#getStateByPartialCompositeKey}.<br><br>
             *
             * @param objectType A string used as the prefix of the resulting key
             * @param attributes List of attribute values to concatenate into the key
             * @return A composite key with the <code>objectType</code> and the array of <code>attributes</code>
             * joined together with special delimiters that will not be confused with values of the attributes
             */
            createCompositeKey(objectType: string, attributes: string[]): string;

            /**
             * Splits the specified key into attributes on which the composite key was formed.
             * Composite keys found during range queries or partial composite key queries can
             * therefore be split into their original composite parts, essentially recovering
             * the values of the attributes.
             * @param compositeKey The composite key to split
             * @return An object which has properties of 'objectType' (string) and
             * 'attributes' (string[])
             */
            splitCompositeKey(compositeKey: string): { objectType: string; attributes: string[] };

            /**
             * Queries the state in the ledger based on a given partial composite key. This function returns an iterator
             * which can be used to iterate over all composite keys whose prefix matches the given partial composite key.
             * The `objectType` and attributes are expected to have only valid utf8 strings and should not contain
             * U+0000 (nil byte) and U+10FFFF (biggest and unallocated code point).<br><br>
             *
             * See related functions [splitCompositeKey]{@link ChaincodeStub#splitCompositeKey} and
             * [createCompositeKey]{@link ChaincodeStub#createCompositeKey}.<br><br>
             *
             * Call close() on the returned {@link StateQueryIterator} object when done.<br><br>
             *
             * The query is re-executed during validation phase to ensure result set has not changed since transaction
             * endorsement (phantom reads detected).
             * @async
             * @param objectType A string used as the prefix of the resulting key
             * @param attributes List of attribute values to concatenate into the partial composite key
             * @return A promise that resolves with a {@link StateQueryIterator}, rejects if an error occurs
             */
            getStateByPartialCompositeKey(objectType: string, attributes: string[]): Promise<StateQueryIterator>;

        }

        interface FunctionAndParameters {
            /** The function name, which by chaincode programming convention is the first argument in the array of arguments */
            fcn: string;
            /** The rest of the arguments, as array of strings */
            params: string[];
        }

        /**
         * This object contains the essential identity information of the chaincode invocation's submitter,
         * including its organizational affiliation (mspid) and certificate (id_bytes)
         */
        interface ProposalCreator {
            /**
             * The unique ID of the Membership Service Provider instance that is associated
             * to the identity's organization and is able to perform digital signing and signature verification
             */
            mspid: string;
        }

        /**
         * The SignedProposal object represents the request object sent by the client application
         * to the chaincode.
         */
        interface SignedProposal {

            /**
             * The signature over the proposal. This signature is to be verified against
             * the {@link ProposalCreator} returned by <code>getCreator()</code>. The signature will have already been
             * verified by the peer before the invocation request reaches the chaincode.
             */
            signature: Buffer;

            /** The object containing the chaincode invocation request and metadata about the request */
            proposal: Proposal;

        }

        /** The essential content of the chaincode invocation request */
        interface Proposal {

            /**
             * The header object contains metadata describing key aspects of the invocation
             * request such as target channel, transaction ID, and submitter identity etc.
             */
            header: Header;

            /** The payload object contains actual content of the invocation request */
            payload: ChaincodeProposalPayload;

        }

        interface Header {
            /** Channel header identifies the destination channel of the invocation */
            channel_header: ChannelHeader;
            /** Signature header has replay prevention and message authentication features */
            signature_header: SignatureHeader;
        }

        /**
         * Channel header identifies the destination channel of the invocation
         * request and the type of request etc.
         */
        interface ChannelHeader {

            /**
             * Any of the following:
             * <ul>
             * <li>MESSAGE = 0;                   // Used for messages which are signed but opaque
             * <li>CONFIG = 1;                    // Used for messages which express the channel config
             * <li>CONFIG_UPDATE = 2;             // Used for transactions which update the channel config
             * <li>ENDORSER_TRANSACTION = 3;      // Used by the SDK to submit endorser based transactions
             * <li>ORDERER_TRANSACTION = 4;       // Used internally by the orderer for management
             * <li>DELIVER_SEEK_INFO = 5;         // Used as the type for Envelope messages submitted to instruct the Deliver API to seek
             * <li>CHAINCODE_PACKAGE = 6;         // Used for packaging chaincode artifacts for install
             * </ul>
             */
            type: number;

            /** The local time when the message was created by the submitter */
            timestamp: protobuf.common.ITimestamp;

            /** Identifier of the channel that this message bound for */
            channel_id: string;

            /**
             *  Unique identifier used to track the transaction throughout the proposal endorsement, ordering,
             * validation and committing to the ledger
             */
            tx_id: string;

            epoch: number;

        }

        interface SignatureHeader {

            /** The submitter of the chaincode invocation request */
            creator: ProposalCreator;

            /** Arbitrary number that may only be used once. Can be used to detect replay attacks. */
            nonce: Buffer;

        }

        interface ChaincodeProposalPayload {

            /**
             * Input contains the arguments for this invocation. If this invocation
             * deploys a new chaincode, ESCC/VSCC are part of this field. This is usually a marshaled ChaincodeInvocationSpec
             */
            input: Buffer;

            /**
             * TransientMap contains data (e.g. cryptographic material) that might be used
             * to implement some form of application-level confidentiality. The contents of this field are supposed to always
             * be omitted from the transaction and excluded from the ledger.
             */
            transientMap: Map<string, Buffer>;

        }

        /**
         * A Response object is returned from a chaincode invocation
         */
        export interface Response {
            /** A status code that follows the HTTP status codes */
            status: number;
            /** A message associated with the response code */
            message: string;
            /** A payload that can be used to include metadata with this response */
            payload: Buffer;
        }

        class ChaincodeSupportClient {

        }

        class ChaincodeInput {
        }


        class CommonIterator extends EventEmitter {

            /**
             * close the iterator.
             * @async
             * @return A promise that is resolved with the close payload or rejected
             * if there is a problem
             */
            close(): Promise<void>;

            /**
             * Get the next value and return it through a promise and also emit
             * it if event listeners have been registered.
             * @async
             * @return a promise that is fulfilled with the next value or
             * is rejected otherwise
             */
            next(): Promise<QueryResult>;
        }

        interface QueryResult {
            done: boolean;
            value?: { key: string; value: Buffer; };
        }

        export class StateQueryIterator extends CommonIterator {
        }

        export class HistoryQueryIterator extends CommonIterator {
        }

    }

    export = Shim;

}
