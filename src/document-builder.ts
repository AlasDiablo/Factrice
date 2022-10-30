import { JSDOM } from 'jsdom';
import _ from 'lodash';

/**
 * Document builder
 */
export default class DocumentBuilder {
    private readonly dom: JSDOM;

    private readonly document: Document;

    private readonly dataType: Array<{ key: string, attribute: string }>;

    private readonly data: any;

    /**
     *
     * @param html Email template html
     * @param dataType Email template data
     * @param data Request data
     */
    constructor(html: string, dataType: Array<{ key: string, attribute: string }>, data: any) {
        this.dom = new JSDOM(html);
        this.document = this.dom.window.document;
        this.dataType = dataType;
        this.data = data;
    }

    /**
     * Build the html and serialize it
     */
    build(): string {
        this.dataType.forEach((type) => {
            const element: HTMLElement | null = this.document.querySelector(`[factrice-data="${type.key}"]`);
            if (element === undefined || element === null) {
                throw new Error(`The key '${type.key}' is not defined in side the html document !`);
            }
            const data = _.get(this.data, type.key);
            if (data === undefined) {
                throw new Error(`Missing data '${type.key}'`);
            }
            _.set(element, type.attribute, data);
        });

        return this.dom.serialize();
    }
}
