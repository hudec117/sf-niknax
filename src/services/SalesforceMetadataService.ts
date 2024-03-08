import { toBoolean } from '@/helper';
import { Result } from './Results';

export default class SalesforceToolingService {
    METADATA_ENDPOINT = '/services/Soap/m/60.0';

    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    async readPermissionSetFLS(permissionSetName: string, fieldName: string): Promise<Result<readonly [read: boolean, edit: boolean]>> {
        const readMetadataResult = await this.readMetadata('PermissionSet', [permissionSetName]);
        if (!readMetadataResult.success) {
            return Result.fail(readMetadataResult.error);
        }

        for (const element of readMetadataResult.guardedData) {
            if (element.nodeName === 'fieldPermissions') {
                const fieldElements = element.getElementsByTagName('field');
                if (fieldElements.length !== 1) {
                    return Result.fail(`Found ${fieldElements.length} 'field' elements in the 'fieldPermissions' metadata. Expected only one.`);
                }

                // Check if it's the field we're looking for
                const foundFieldName = fieldElements[0].textContent;
                if (foundFieldName === fieldName) {

                    const readElements = element.getElementsByTagName('readable');
                    if (readElements.length !== 1) {
                        return Result.fail(`Found ${readElements.length} 'read' elements in the 'fieldPermissions' metadata. Expected only one.`);
                    }
                    const foundReadValue = toBoolean(readElements[0].textContent);

                    const editElements = element.getElementsByTagName('editable');
                    if (editElements.length !== 1) {
                        return Result.fail(`Found ${editElements.length} 'read' elements in the 'fieldPermissions' metadata. Expected only one.`);
                    }
                    const foundEditValue = toBoolean(editElements[0].textContent);

                    return Result.success([foundReadValue, foundEditValue]);
                }
            }
        }

        // Default to false for read/edit since in this scenario it hasn't been found in the Permission Set
        // and therefore it hasn't been set.
        return Result.success([false, false]);
    }

    async readMetadata(type: string, names: Array<string>): Promise<Result<Array<Element>>> {
        let allChildNodes = new Array<Element>();

        // The Metadata API readMetadata() call only supports reading 10 pieces
        // of metadata at a time so we need to chunk it.
        const batchSize = 10;
        const nameBatches = [];

        for (let i = 0; i < names.length; i += batchSize) {
            const newNameBatch = names.slice(i, i + batchSize);
            nameBatches.push(newNameBatch);
        }

        for (const nameBatch of nameBatches) {
            const message = this._constructReadMetadataMessage(type, nameBatch);

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

            const recordsNodes = responseXml.querySelectorAll('Envelope Body readMetadataResponse result records');
            const childNodesArray = Array.from(recordsNodes[0].children);

            allChildNodes = allChildNodes.concat(childNodesArray);
        }

        return Result.success(allChildNodes);
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