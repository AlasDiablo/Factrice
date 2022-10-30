import { JSDOM } from 'jsdom';
import _ from 'lodash';

export default class DocumentBuilder {
    private readonly dom: JSDOM;

    // eslint-disable-next-line no-undef
    private readonly document: Document;

    private readonly data: any;

    constructor(html: string, data: any) {
        this.dom = new JSDOM(html);
        this.document = this.dom.window.document;
        this.data = data;
    }

    build(): string {
        _.keys(this.data).forEach((key) => {
            // eslint-disable-next-line no-undef
            const element: HTMLElement | null = this.document.querySelector(`[factrice-data="${key}"]`);
            if (element === undefined || element === null) {
                throw new Error(`The key '${key}' is not defined in side the html document !`);
            }
            element.innerHTML = _.get(this.data, key);
        });

        return this.dom.serialize();
    }
}
