export class ModalSubmitOptionResolver {
	public readonly customID: string;
	private readonly componentValues: { [id: string]: string } = {};

	constructor(data: any) {
		this.customID = data.customID;

		for (const component of data.components
			.map((i: any) => i.components)
			.flat()) {
			this.componentValues[component.customID] = component.value;
		}
	}

	public get(name: string, required: boolean = false) {
		if (!this.componentValues[name]) {
			if (required) throw new TypeError("MODAL_INPUT_NOT_FOUND");

			return null;
		}

		return this.componentValues[name] as string;
	}

	public getString(name: string, required: false): string | null;
	public getString(name: string, required: true): string;
	public getString(name: string, required: boolean) {
		const value = this.get(name, required);
		return value;
	}
}
