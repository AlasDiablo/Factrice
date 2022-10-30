import { JSDOM } from 'jsdom';

export default class DocumentBuilder {
    private readonly dom: JSDOM;

    // eslint-disable-next-line no-undef
    private readonly document: Document;

    private readonly data: {key: string, value: string}[];

    constructor(html: string, data: {key: string, value: string}[]) {
        this.dom = new JSDOM(html);
        this.document = this.dom.window.document;
        this.data = data;
    }

    build(): string {
        this.data.forEach((data) => {
            // eslint-disable-next-line no-undef
            const element: HTMLElement | null = this.document.querySelector(`[factrice-data="${data.key}"]`);
            if (element === undefined || element === null) {
                throw new Error(`The key '${data.key}' is not defined in side the html document !`);
            }
            element.innerText = data.value;
        });

        return this.dom.serialize();
    }
}
