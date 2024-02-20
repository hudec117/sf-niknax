import { Result } from './Results';

export default class SalesforceToolingService {
    METADATA_ENDPOINT = '/services/Soap/m/60.0';

    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    async readMetadata(type: string, names: Array<string>, progressCallback?: (mdProg: number) => void): Promise<Result<Array<Element>>> {
        let allRecordNodes = new Array<Element>();

        // The Metadata API readMetadata() call only supports reading 10 pieces
        // of metadata at a time so we need to chunk it.
        const batchSize = 10;
        const nameBatches = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const newNameBatch = names.slice(i, i + batchSize);
            nameBatches.push(newNameBatch);
        }

        let metadataRead = 0;

        for (const nameBatch of nameBatches) {
            const message = this._constructReadMetadataMessage(type, nameBatch);

            if (progressCallback) {
                progressCallback(metadataRead);
            }

            const requestUrl = new URL(this.METADATA_ENDPOINT, this.serverBaseUrl);
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'SOAPAction': '\'\''
                },
                body: message
            });

            const responseXmlRaw = await response.text();

            const responseXml = new window.DOMParser().parseFromString(responseXmlRaw, 'text/xml');

            if (!response.ok) {
                return this._constructResultFromSoapFault(responseXml);
            }

            const recordNodes = responseXml.querySelectorAll('Envelope Body readMetadataResponse result records');
            const recordNodesArray = Array.from(recordNodes);

            metadataRead += recordNodesArray.length

            allRecordNodes = allRecordNodes.concat(recordNodesArray);
        }

        return Result.success(allRecordNodes);
    }

    private _constructReadMetadataMessage(type: string, names: Array<string>) {
        let message = `
        <?xml version='1.0' encoding='UTF-8'?>
        <soapenv:Envelope xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'
                          xmlns:xsd='http://www.w3.org/2001/XMLSchema'
                          xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>
            <soapenv:Header xmlns='http://soap.sforce.com/2006/04/metadata'>
                <SessionHeader>
                    <sessionId>${this.sessionId}</sessionId>
                </SessionHeader>
            </soapenv:Header>
            <soapenv:Body xmlns='http://soap.sforce.com/2006/04/metadata'>
                <readMetadata>
                    <type>${type}</type>`;

        for (const name of names) {
            message += `\n<fullNames>${name}</fullNames>`;
        }

        message += `
                </readMetadata>
            </soapenv:Body>
        </soapenv:Envelope>`;

        return message.trim();
    }

    private _constructResultFromSoapFault(responseXml: Document) {
        const faultNodes = responseXml.querySelectorAll('Envelope Body Fault faultcode');

        let faultCode = 'unknown';
        if (faultNodes.length > 0 && faultNodes[0].textContent) {
            faultCode = faultNodes[0].textContent;
        }

        return Result.fail(`SOAP operation failed with fault code: ${faultCode}`);
    }
}